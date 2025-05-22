import type {
  HistoricalRoute,
  RouterPlacementSuggestion,
  TrafficHotspot,
  PerformanceMetrics,
} from "../types/analysisTypes"
import type { Node, Edge } from "../types/networkTypes"
import { NodeType } from "../types/networkTypes"

/**
 * Generate sample historical routing data for demonstration
 */
export function generateSampleHistoricalData(nodes: Node[], edges: Edge[], count = 100): HistoricalRoute[] {
  if (nodes.length < 2) return []

  const routes: HistoricalRoute[] = []
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000

  // Get device nodes for source/target
  const deviceNodes = nodes.filter((node) => node.type === NodeType.DEVICE)
  if (deviceNodes.length < 2) return []

  for (let i = 0; i < count; i++) {
    // Select random source and target devices
    const sourceIndex = Math.floor(Math.random() * deviceNodes.length)
    let targetIndex
    do {
      targetIndex = Math.floor(Math.random() * deviceNodes.length)
    } while (targetIndex === sourceIndex)

    const sourceId = deviceNodes[sourceIndex].id
    const targetId = deviceNodes[targetIndex].id

    // Generate a random path between source and target
    const path = generateRandomPath(sourceId, targetId, nodes, edges)

    // Calculate metrics
    const hops = path.length - 1
    const latency = 10 + hops * 5 + Math.random() * 20 // Base latency + hop latency + random variation
    const congestion = Math.random() * 0.7 // Random congestion value

    routes.push({
      id: `route-${i}`,
      timestamp: now - Math.floor(Math.random() * 7 * oneDay), // Random time in the last week
      sourceId,
      targetId,
      path,
      latency,
      hops,
      congestion,
    })
  }

  return routes
}

/**
 * Generate a random path between source and target nodes
 */
function generateRandomPath(sourceId: number, targetId: number, nodes: Node[], edges: Edge[]): number[] {
  const path = [sourceId]
  let currentId = sourceId
  const maxHops = 5
  let hops = 0

  // Create a map of node connections for quick lookup
  const connections: Record<number, number[]> = {}
  edges.forEach((edge) => {
    if (!connections[edge.source]) connections[edge.source] = []
    if (!connections[edge.target]) connections[edge.target] = []

    connections[edge.source].push(edge.target)
    connections[edge.target].push(edge.source)
  })

  // Try to find a path to the target
  while (currentId !== targetId && hops < maxHops) {
    const possibleNextNodes = connections[currentId] || []

    // Filter out nodes already in the path to avoid loops
    const filteredNodes = possibleNextNodes.filter((id) => !path.includes(id))

    if (filteredNodes.length === 0) break // No valid next hop

    // Prefer the target if it's directly connected
    if (filteredNodes.includes(targetId)) {
      currentId = targetId
    } else {
      // Otherwise pick a random next hop
      currentId = filteredNodes[Math.floor(Math.random() * filteredNodes.length)]
    }

    path.push(currentId)
    hops++
  }

  // If we couldn't reach the target, force it as the last hop
  if (currentId !== targetId) {
    path.push(targetId)
  }

  return path
}

/**
 * Find optimal router placement based on historical routes
 */
export function findOptimalRouterPlacement(
  historicalRoutes: HistoricalRoute[],
  nodes: Node[],
  edges: Edge[],
  filters: { sourceId: number | null; targetId: number | null },
): RouterPlacementSuggestion {
  // Filter routes based on source/target if specified
  let filteredRoutes = historicalRoutes
  if (filters.sourceId !== null) {
    filteredRoutes = filteredRoutes.filter((route) => route.sourceId === filters.sourceId)
  }
  if (filters.targetId !== null) {
    filteredRoutes = filteredRoutes.filter((route) => route.targetId === filters.targetId)
  }

  // Find traffic hotspots
  const hotspots = findTrafficHotspots(filteredRoutes, nodes)

  // Find the most intense hotspot
  const mostIntenseHotspot = hotspots.reduce((max, spot) => (spot.intensity > max.intensity ? spot : max), {
    x: 0,
    y: 0,
    intensity: 0,
    radius: 0,
  })

  // Calculate improvement metrics if a router was placed at this hotspot
  const improvementMetrics = calculateImprovementMetrics(mostIntenseHotspot, filteredRoutes, nodes, edges)

  return {
    x: mostIntenseHotspot.x,
    y: mostIntenseHotspot.y,
    improvementMetrics,
  }
}

/**
 * Find traffic hotspots based on historical routes
 */
export function findTrafficHotspots(routes: HistoricalRoute[], nodes: Node[]): TrafficHotspot[] {
  // Create a grid to track traffic intensity
  const gridSize = 20 // Grid cell size in pixels
  const grid: Record<string, { count: number; x: number; y: number }> = {}

  // For each route, increment the grid cells that the path passes through
  routes.forEach((route) => {
    // Convert path to coordinates
    const pathCoords: { x: number; y: number }[] = route.path
      .map((nodeId: number) => {
        const node = nodes.find((n) => n.id === nodeId)
        return node ? { x: node.x, y: node.y } : { x: 0, y: 0 }
      })
      .filter((coord: { x: number; y: number }) => coord.x !== 0 || coord.y !== 0)

    // For each segment in the path
    for (let i = 0; i < pathCoords.length - 1; i++) {
      const start = pathCoords[i]
      const end = pathCoords[i + 1]

      // Interpolate points along the segment
      const distance = Math.hypot(end.x - start.x, end.y - start.y)
      const steps = Math.max(1, Math.ceil(distance / gridSize))

      for (let step = 0; step <= steps; step++) {
        const t = step / steps
        const x = start.x + (end.x - start.x) * t
        const y = start.y + (end.y - start.y) * t

        // Map to grid cell
        const cellX = Math.floor(x / gridSize)
        const cellY = Math.floor(y / gridSize)
        const cellKey = `${cellX},${cellY}`

        if (!grid[cellKey]) {
          grid[cellKey] = { count: 0, x: cellX * gridSize + gridSize / 2, y: cellY * gridSize + gridSize / 2 }
        }

        grid[cellKey].count++
      }
    }
  })

  // Convert grid to hotspots
  const maxCount = Object.values(grid).reduce((max, cell) => Math.max(max, cell.count), 0)
  const hotspots: TrafficHotspot[] = Object.values(grid)
    .filter((cell) => cell.count > maxCount * 0.2) // Filter out low-traffic cells
    .map((cell) => ({
      x: cell.x,
      y: cell.y,
      intensity: cell.count / maxCount,
      radius: 10 + (cell.count / maxCount) * 30, // Scale radius based on intensity
    }))

  return hotspots
}

/**
 * Calculate improvement metrics if a router was placed at the given hotspot
 */
function calculateImprovementMetrics(
  hotspot: TrafficHotspot,
  routes: HistoricalRoute[],
  nodes: Node[],
  edges: Edge[],
): {
  latencyReduction: number
  hopReduction: number
  congestionReduction: number
  affectedRoutes: number
} {
  // This is a simplified simulation of improvement
  // In a real implementation, we would re-run the routing algorithm with the new router

  // Assume the new router would reduce latency by 10-30% for routes passing near the hotspot
  const affectedRoutes = routes.filter((route) => {
    // Check if any segment of the route passes near the hotspot
    const pathNodes = route.path.map((id: number) => nodes.find((n) => n.id === id))

    for (let i = 0; i < pathNodes.length - 1; i++) {
      const start = pathNodes[i]
      const end = pathNodes[i + 1]

      if (!start || !end) continue

      // Calculate distance from hotspot to this segment
      const distance = distanceToLineSegment(hotspot.x, hotspot.y, start.x, start.y, end.x, end.y)

      if (distance < 100) return true // Route passes near hotspot
    }

    return false
  })

  const affectedCount = affectedRoutes.length
  if (affectedCount === 0) {
    return {
      latencyReduction: 0,
      hopReduction: 0,
      congestionReduction: 0,
      affectedRoutes: 0,
    }
  }

  // Calculate average improvements
  const latencyReduction = 15 + Math.random() * 15 // 15-30% reduction
  const hopReduction = 0.5 + Math.random() * 1.5 // 0.5-2 hops reduction
  const congestionReduction = 10 + Math.random() * 20 // 10-30% reduction

  return {
    latencyReduction,
    hopReduction,
    congestionReduction,
    affectedRoutes: affectedCount,
  }
}

/**
 * Calculate distance from a point to a line segment
 */
function distanceToLineSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
  const A = px - x1
  const B = py - y1
  const C = x2 - x1
  const D = y2 - y1

  const dot = A * C + B * D
  const lenSq = C * C + D * D
  let param = -1

  if (lenSq !== 0) {
    param = dot / lenSq
  }

  let xx, yy

  if (param < 0) {
    xx = x1
    yy = y1
  } else if (param > 1) {
    xx = x2
    yy = y2
  } else {
    xx = x1 + param * C
    yy = y1 + param * D
  }

  const dx = px - xx
  const dy = py - yy
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate performance metrics for current network vs. with new router
 */
export function calculatePerformanceMetrics(
  routes: HistoricalRoute[],
  suggestion: RouterPlacementSuggestion,
): PerformanceMetrics {
  const currentAvgLatency = routes.reduce((sum, route) => sum + route.latency, 0) / routes.length
  const currentAvgHops = routes.reduce((sum, route) => sum + route.hops, 0) / routes.length
  const currentAvgCongestion = routes.reduce((sum, route) => sum + route.congestion, 0) / routes.length

  // Calculate projected metrics with the new router
  const latencyReductionFactor = 1 - suggestion.improvementMetrics.latencyReduction / 100
  const projectedAvgLatency = currentAvgLatency * latencyReductionFactor

  const hopReduction = suggestion.improvementMetrics.hopReduction
  const projectedAvgHops = Math.max(
    1,
    currentAvgHops - (hopReduction * suggestion.improvementMetrics.affectedRoutes) / routes.length,
  )

  const congestionReductionFactor = 1 - suggestion.improvementMetrics.congestionReduction / 100
  const projectedAvgCongestion = currentAvgCongestion * congestionReductionFactor

  const improvementPercentage = (1 - projectedAvgLatency / currentAvgLatency) * 100

  return {
    currentAvgLatency,
    projectedAvgLatency,
    currentAvgHops,
    projectedAvgHops,
    currentAvgCongestion,
    projectedAvgCongestion,
    improvementPercentage,
  }
}

/**
 * Get route frequency data for visualization
 */
export function getRouteFrequencyData(routes: HistoricalRoute[]): Record<string, number> {
  const edgeFrequency: Record<string, number> = {}

  routes.forEach((route) => {
    for (let i = 0; i < route.path.length - 1; i++) {
      const source = route.path[i]
      const target = route.path[i + 1]

      // Create a unique key for this edge (order doesn't matter)
      const edgeKey = source < target ? `${source}-${target}` : `${target}-${source}`

      if (!edgeFrequency[edgeKey]) {
        edgeFrequency[edgeKey] = 0
      }

      edgeFrequency[edgeKey]++
    }
  })

  return edgeFrequency
}
