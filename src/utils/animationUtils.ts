import type { AntPosition, Edge, Node } from "../types/networkTypes"
import { getTrafficColor } from "./trafficUtils"

/**
 * Updates the positions of ants along their paths with smooth transitions
 */
export function updateAntPositions(
  antPositions: AntPosition[],
  nodes: Node[],
  edges: Edge[],
  speed: number,
): AntPosition[] {
  const progressIncrement = 0.002 * speed // Reduced from 0.005 to 0.002 for slower movement

  return antPositions.map((ant) => {
    const fromNode = nodes.find((n) => n.id === ant.from)
    const toNode = nodes.find((n) => n.id === ant.to)

    if (!fromNode || !toNode) return ant

    const newProgress = Math.min(1, ant.progress + progressIncrement)

    // Use cubic easing for smoother acceleration and deceleration
    const easedProgress = easeInOutCubic(newProgress)

    // Calculate new position with proper interpolation along the edge
    const newX = fromNode.x + (toNode.x - fromNode.x) * easedProgress
    const newY = fromNode.y + (toNode.y - fromNode.y) * easedProgress

    // If ant has reached its destination, find the next edge in the path
    if (newProgress >= 1) {
      // Find the edge that connects to the next node
      const nextEdge = edges.find(
        (edge) =>
          (edge.source === ant.to || edge.target === ant.to) &&
          (edge.source !== ant.from && edge.target !== ant.from)
      )

      if (nextEdge) {
        // Determine the next node (the one that's not the current 'to' node)
        const nextNodeId = nextEdge.source === ant.to ? nextEdge.target : nextEdge.source
        const nextNode = nodes.find((n) => n.id === nextNodeId)

        if (nextNode) {
          return {
            ...ant,
            from: ant.to,
            to: nextNodeId,
            progress: 0,
            x: toNode.x, // Start from current node
            y: toNode.y,
          }
        }
      }
    }

    return {
      ...ant,
      progress: newProgress,
      x: newX,
      y: newY,
    }
  })
}

/**
 * Enhanced cubic easing function for smoother ant movement
 */
function easeInOutCubic(x: number): number {
  return x < 0.5
    ? 4 * x * x * x
    : 1 - Math.pow(-2 * x + 2, 3) / 2
}

/**
 * Calculates pheromone trail color with glow effect
 */
export function getPheromoneColor(pheromone: number, isActive = false): string {
  const intensity = Math.min(1, pheromone * 2)
  const alpha = 0.2 + intensity * 0.8

  if (isActive) {
    // Bright cyan for active paths
    return `rgba(0, 255, 255, ${alpha})`
  }

  // Blue-purple for regular pheromone trails
  const r = Math.floor(100 + intensity * 155)
  const g = Math.floor(149 + intensity * 106)
  const b = 237

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Draws an edge with dynamic pheromone visualization and traffic
 */
export function drawEdgeWithPheromone(
  ctx: CanvasRenderingContext2D,
  source: Node,
  target: Node,
  pheromone: number,
  isInBestPath: boolean,
  edge: Edge,
  isActive = false,
  showTraffic = false,
): void {
  const lineWidth = 1 + Math.min(5, pheromone * 3)

  // Draw traffic layer if enabled
  if (showTraffic && edge.traffic > 0) {
    ctx.beginPath()
    ctx.moveTo(source.x, source.y)
    ctx.lineTo(target.x, target.y)

    ctx.strokeStyle = getTrafficColor(edge.utilization)
    ctx.lineWidth = 8 // Wider than the pheromone trail
    ctx.stroke()
  }

  // Draw pheromone glow
  if (pheromone > 0.3 || isInBestPath) {
    ctx.beginPath()
    ctx.moveTo(source.x, source.y)
    ctx.lineTo(target.x, target.y)

    const glowColor = isInBestPath
      ? "rgba(0, 255, 0, 0.3)"
      : isActive
        ? "rgba(0, 255, 255, 0.3)"
        : `rgba(100, 149, 237, ${0.1 + Math.min(0.3, pheromone * 0.5)})`

    ctx.strokeStyle = glowColor
    ctx.lineWidth = lineWidth + 6
    ctx.filter = "blur(4px)"
    ctx.stroke()
    ctx.filter = "none"
  }

  // Draw main edge
  ctx.beginPath()
  ctx.moveTo(source.x, source.y)
  ctx.lineTo(target.x, target.y)

  if (isInBestPath) {
    ctx.strokeStyle = "rgba(0, 255, 0, 0.8)"
    ctx.lineWidth = 3
  } else {
    ctx.strokeStyle = getPheromoneColor(pheromone, isActive)
    ctx.lineWidth = lineWidth
  }

  ctx.stroke()

  // Draw weight and traffic labels
  const midX = (source.x + target.x) / 2
  const midY = (source.y + target.y) / 2

  // Background for better readability
  if (showTraffic && edge.traffic > 0) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.fillRect(midX - 25, midY - 20, 50, 30)
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.9)"
  ctx.font = "10px Arial"
  ctx.textAlign = "center"
  ctx.fillText(`W: ${edge.weight}`, midX, midY)

  if (showTraffic && edge.traffic > 0) {
    ctx.fillStyle = edge.utilization > 0.7 ? "rgba(255, 100, 100, 0.9)" : "rgba(255, 255, 255, 0.9)"
    ctx.fillText(`T: ${Math.round(edge.utilization * 100)}%`, midX, midY + 12)
  }
}

/**
 * Draws an ant with dynamic effects
 */
export function drawAnt(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number): void {
  // Enhanced pulsing effect with smoother transitions
  const pulseScale = 1 + Math.sin(progress * Math.PI * 4) * 0.15
  const size = 5 * pulseScale // Slightly larger ant

  // Improved glowing trail with gradient
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 4)
  gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)')
  gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.1)')
  gradient.addColorStop(1, 'rgba(255, 215, 0, 0)')

  ctx.beginPath()
  ctx.arc(x, y, size * 4, 0, 2 * Math.PI)
  ctx.fillStyle = gradient
  ctx.filter = 'blur(4px)'
  ctx.fill()
  ctx.filter = 'none'

  // Main ant body with enhanced glow
  ctx.beginPath()
  ctx.arc(x, y, size, 0, 2 * Math.PI)
  ctx.fillStyle = 'rgba(255, 215, 0, 1)' // More solid color
  ctx.shadowColor = 'rgba(255, 215, 0, 0.8)'
  ctx.shadowBlur = 15
  ctx.fill()

  // Reset shadow
  ctx.shadowBlur = 0

  // Enhanced movement trail with gradient
  const trailLength = 6 // Longer trail
  for (let i = 1; i <= trailLength; i++) {
    const trailOpacity = 0.5 * (1 - i / trailLength)
    const trailSize = size * (1 - (i / trailLength) * 0.7)

    const trailGradient = ctx.createRadialGradient(x, y, 0, x, y, trailSize * 2)
    trailGradient.addColorStop(0, `rgba(255, 215, 0, ${trailOpacity})`)
    trailGradient.addColorStop(0.5, `rgba(255, 215, 0, ${trailOpacity * 0.5})`)
    trailGradient.addColorStop(1, `rgba(255, 215, 0, 0)`)

    ctx.beginPath()
    ctx.arc(x, y, trailSize, 0, 2 * Math.PI)
    ctx.fillStyle = trailGradient
    ctx.fill()
  }
}

/**
 * Creates a ripple effect when an ant reaches a node
 */
export function drawNodeRipple(ctx: CanvasRenderingContext2D, x: number, y: number, progress: number): void {
  const maxRadius = 30
  const radius = maxRadius * progress
  const opacity = 1 - progress

  ctx.beginPath()
  ctx.arc(x, y, radius, 0, 2 * Math.PI)
  ctx.strokeStyle = `rgba(255, 215, 0, ${opacity})`
  ctx.lineWidth = 2
  ctx.stroke()
}

/**
 * Draw node with congestion visualization
 */
export function drawNode(
  ctx: CanvasRenderingContext2D,
  node: Node,
  isSource: boolean,
  isTarget: boolean,
  showCongestion: boolean,
): void {
  ctx.beginPath()

  // Base color based on node type and selection
  const baseColor = isSource ? "#4ade80" : isTarget ? "#f87171" : node.type === "router" ? "#60a5fa" : "#a78bfa"

  // Add congestion indicator if enabled
  if (showCongestion && node.congestion !== undefined && node.congestion > 0) {
    // Draw congestion ring
    ctx.beginPath()
    ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI)

    // Color based on congestion level
    if (node.congestion < 0.3) {
      ctx.strokeStyle = "rgba(0, 255, 0, 0.7)" // Green for low congestion
    } else if (node.congestion < 0.7) {
      ctx.strokeStyle = "rgba(255, 255, 0, 0.7)" // Yellow for medium congestion
    } else {
      ctx.strokeStyle = "rgba(255, 0, 0, 0.7)" // Red for high congestion
    }

    ctx.lineWidth = 3
    ctx.stroke()

    // Add pulsing effect for high congestion
    if (node.congestion > 0.7) {
      const pulseSize = 25 + Math.sin(Date.now() / 200) * 5
      ctx.beginPath()
      ctx.arc(node.x, node.y, pulseSize, 0, 2 * Math.PI)
      ctx.strokeStyle = "rgba(255, 0, 0, 0.3)"
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  // Draw the main node circle
  ctx.beginPath()
  ctx.shadowColor = baseColor
  ctx.shadowBlur = 15
  ctx.arc(node.x, node.y, 15, 0, 2 * Math.PI)
  ctx.fillStyle = baseColor
  ctx.fill()
  ctx.strokeStyle = "white"
  ctx.lineWidth = 2
  ctx.stroke()

  // Reset shadow for text
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0

  // Draw node label
  ctx.fillStyle = "white"
  ctx.font = "12px Arial"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(node.label, node.x, node.y)

  // Draw congestion percentage if applicable
  if (showCongestion && node.congestion !== undefined && node.congestion > 0) {
    ctx.font = "10px Arial"
    ctx.fillStyle = "white"
    ctx.fillText(`${Math.round(node.congestion * 100)}%`, node.x, node.y + 25)
  }
}
