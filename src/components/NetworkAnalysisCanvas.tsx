"use client"

import type React from "react"

import { useRef, useEffect, useState } from "react"
import type { Node, Edge } from "../types/networkTypes"
import { NodeType } from "../types/networkTypes"
import type { HistoricalRoute, TrafficHotspot, RouterPlacementSuggestion } from "../types/analysisTypes"
import { findTrafficHotspots, getRouteFrequencyData } from "../utils/analysisUtils"

interface NetworkAnalysisCanvasProps {
  nodes: Node[]
  edges: Edge[]
  historicalRoutes: HistoricalRoute[]
  filteredRoutes: HistoricalRoute[]
  suggestedRouter: RouterPlacementSuggestion | null
  showHotspots: boolean
  showHistoricalRoutes: boolean
  selectedRouteIds: string[]
  onSelectRoute: (routeId: string) => void
}

const NetworkAnalysisCanvas: React.FC<NetworkAnalysisCanvasProps> = ({
  nodes,
  edges,
  historicalRoutes,
  filteredRoutes,
  suggestedRouter,
  showHotspots,
  showHistoricalRoutes,
  selectedRouteIds,
  onSelectRoute,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [hotspots, setHotspots] = useState<TrafficHotspot[]>([])
  const [edgeFrequency, setEdgeFrequency] = useState<Record<string, number>>({})
  const [hoveredRoute, setHoveredRoute] = useState<string | null>(null)

  // Resize canvas when component mounts or window resizes
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const dpr = window.devicePixelRatio || 1
      const width = container.clientWidth
      const height = container.clientHeight

      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      const ctx = canvas.getContext("2d")
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      setCanvasSize({ width, height })
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => window.removeEventListener("resize", handleResize)
  }, [])

  // Calculate hotspots and edge frequency when routes change
  useEffect(() => {
    if (filteredRoutes.length > 0) {
      const spots = findTrafficHotspots(filteredRoutes, nodes)
      setHotspots(spots)

      const frequency = getRouteFrequencyData(filteredRoutes)
      setEdgeFrequency(frequency)
    }
  }, [filteredRoutes, nodes])

  // Draw the network visualization
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw hotspots if enabled
    if (showHotspots && hotspots.length > 0) {
      hotspots.forEach((hotspot) => {
        const gradient = ctx.createRadialGradient(hotspot.x, hotspot.y, 0, hotspot.x, hotspot.y, hotspot.radius)

        gradient.addColorStop(0, `rgba(255, 0, 0, ${0.2 + hotspot.intensity * 0.5})`)
        gradient.addColorStop(1, "rgba(255, 0, 0, 0)")

        ctx.beginPath()
        ctx.fillStyle = gradient
        ctx.arc(hotspot.x, hotspot.y, hotspot.radius, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Find max frequency for edge coloring
    const maxFrequency = Object.values(edgeFrequency).reduce((max, freq) => Math.max(max, freq), 1)

    // Draw edges with frequency-based coloring
    edges.forEach((edge) => {
      const source = nodes.find((n) => n.id === edge.source)
      const target = nodes.find((n) => n.id === edge.target)
      if (!source || !target) return

      const edgeKey = edge.source < edge.target ? `${edge.source}-${edge.target}` : `${edge.target}-${edge.source}`

      const frequency = edgeFrequency[edgeKey] || 0
      const normalizedFrequency = frequency / maxFrequency

      // Draw the edge with thickness and color based on frequency
      ctx.beginPath()
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)

      if (showHistoricalRoutes && frequency > 0) {
        // Color based on frequency (blue to red)
        const r = Math.floor(normalizedFrequency * 255)
        const g = Math.floor(100 - normalizedFrequency * 100)
        const b = Math.floor(255 - normalizedFrequency * 255)

        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`
        ctx.lineWidth = 1 + normalizedFrequency * 5
      } else {
        // Default edge style
        ctx.strokeStyle = "rgba(100, 100, 100, 0.6)"
        ctx.lineWidth = 1
      }

      ctx.stroke()

      // Add edge weight label
      if (showHistoricalRoutes && frequency > 0) {
        const midX = (source.x + target.x) / 2
        const midY = (source.y + target.y) / 2

        ctx.fillStyle = "white"
        ctx.font = "10px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        // Add a background for better readability
        const text = frequency.toString()
        const textWidth = ctx.measureText(text).width
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
        ctx.fillRect(midX - textWidth / 2 - 2, midY - 7, textWidth + 4, 14)

        ctx.fillStyle = "white"
        ctx.fillText(text, midX, midY)
      }
    })

    // Draw selected routes with highlight
    selectedRouteIds.forEach((routeId) => {
      const route = historicalRoutes.find((r) => r.id === routeId)
      if (!route) return

      for (let i = 0; i < route.path.length - 1; i++) {
        const sourceNode = nodes.find((n) => n.id === route.path[i])
        const targetNode = nodes.find((n) => n.id === route.path[i + 1])

        if (!sourceNode || !targetNode) continue

        // Draw highlighted path
        ctx.beginPath()
        ctx.moveTo(sourceNode.x, sourceNode.y)
        ctx.lineTo(targetNode.x, targetNode.y)
        ctx.strokeStyle = "rgba(255, 215, 0, 0.8)" // Gold
        ctx.lineWidth = 3
        ctx.stroke()

        // Draw direction arrow
        const dx = targetNode.x - sourceNode.x
        const dy = targetNode.y - sourceNode.y
        const angle = Math.atan2(dy, dx)

        const midX = (sourceNode.x + targetNode.x) / 2
        const midY = (sourceNode.y + targetNode.y) / 2

        ctx.beginPath()
        ctx.moveTo(midX, midY)
        ctx.lineTo(midX - 10 * Math.cos(angle - Math.PI / 6), midY - 10 * Math.sin(angle - Math.PI / 6))
        ctx.lineTo(midX - 10 * Math.cos(angle + Math.PI / 6), midY - 10 * Math.sin(angle + Math.PI / 6))
        ctx.closePath()
        ctx.fillStyle = "rgba(255, 215, 0, 0.8)"
        ctx.fill()
      }
    })

    // Draw nodes
    nodes.forEach((node) => {
      // Base color based on node type
      const baseColor = node.type === NodeType.ROUTER ? "#60a5fa" : "#a78bfa"

      // Draw node circle
      ctx.beginPath()
      ctx.arc(node.x, node.y, 15, 0, Math.PI * 2)
      ctx.fillStyle = baseColor
      ctx.fill()
      ctx.strokeStyle = "white"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw node label
      ctx.fillStyle = "white"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(node.label, node.x, node.y)
    })

    // Draw suggested router if available
    if (suggestedRouter) {
      // Draw suggested router with glow effect
      ctx.beginPath()
      ctx.arc(suggestedRouter.x, suggestedRouter.y, 18, 0, Math.PI * 2)

      // Create glow effect
      const gradient = ctx.createRadialGradient(
        suggestedRouter.x,
        suggestedRouter.y,
        15,
        suggestedRouter.x,
        suggestedRouter.y,
        30,
      )
      gradient.addColorStop(0, "rgba(0, 255, 0, 0.8)")
      gradient.addColorStop(1, "rgba(0, 255, 0, 0)")

      ctx.fillStyle = gradient
      ctx.fill()

      // Draw router icon
      ctx.beginPath()
      ctx.arc(suggestedRouter.x, suggestedRouter.y, 15, 0, Math.PI * 2)
      ctx.fillStyle = "#22c55e" // Green
      ctx.fill()
      ctx.strokeStyle = "white"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw label
      ctx.fillStyle = "white"
      ctx.font = "12px Arial"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("New", suggestedRouter.x, suggestedRouter.y)

      // Draw connection lines to nearby nodes
      nodes.forEach((node) => {
        const distance = Math.hypot(node.x - suggestedRouter.x, node.y - suggestedRouter.y)
        if (distance < 150) {
          // Only connect to nearby nodes
          ctx.beginPath()
          ctx.moveTo(suggestedRouter.x, suggestedRouter.y)
          ctx.lineTo(node.x, node.y)
          ctx.strokeStyle = "rgba(0, 255, 0, 0.4)"
          ctx.lineWidth = 1
          ctx.setLineDash([5, 3])
          ctx.stroke()
          ctx.setLineDash([])
        }
      })
    }

    // Draw legend
    if (showHistoricalRoutes) {
      const legendX = 20
      const legendY = 20
      const legendWidth = 150
      const legendHeight = 100

      // Background
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(legendX, legendY, legendWidth, legendHeight)

      // Title
      ctx.fillStyle = "white"
      ctx.font = "12px Arial"
      ctx.textAlign = "left"
      ctx.fillText("Traffic Frequency", legendX + 10, legendY + 20)

      // Gradient bar
      const gradientX = legendX + 10
      const gradientY = legendY + 40
      const gradientWidth = 130
      const gradientHeight = 15

      const gradient = ctx.createLinearGradient(gradientX, gradientY, gradientX + gradientWidth, gradientY)
      gradient.addColorStop(0, "blue")
      gradient.addColorStop(0.5, "purple")
      gradient.addColorStop(1, "red")

      ctx.fillStyle = gradient
      ctx.fillRect(gradientX, gradientY, gradientWidth, gradientHeight)

      // Labels
      ctx.fillStyle = "white"
      ctx.font = "10px Arial"
      ctx.textAlign = "left"
      ctx.fillText("Low", gradientX, gradientY + 30)
      ctx.textAlign = "right"
      ctx.fillText("High", gradientX + gradientWidth, gradientY + 30)

      // Selected route indicator
      if (selectedRouteIds.length > 0) {
        ctx.fillStyle = "rgba(255, 215, 0, 0.8)"
        ctx.fillRect(gradientX, gradientY + 40, 15, 15)
        ctx.fillStyle = "white"
        ctx.textAlign = "left"
        ctx.fillText("Selected Route", gradientX + 20, gradientY + 52)
      }
    }
  }, [
    nodes,
    edges,
    hotspots,
    edgeFrequency,
    showHotspots,
    showHistoricalRoutes,
    suggestedRouter,
    selectedRouteIds,
    historicalRoutes,
    canvasSize,
  ])

  // Handle mouse click to select routes
  const handleCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if click is near any route segment
    for (const route of filteredRoutes) {
      for (let i = 0; i < route.path.length - 1; i++) {
        const sourceNode = nodes.find((n) => n.id === route.path[i])
        const targetNode = nodes.find((n) => n.id === route.path[i + 1])

        if (!sourceNode || !targetNode) continue

        // Calculate distance from click to this segment
        const distance = distanceToLineSegment(x, y, sourceNode.x, sourceNode.y, targetNode.x, targetNode.y)

        if (distance < 10) {
          // Click is near this segment
          onSelectRoute(route.id)
          return
        }
      }
    }
  }

  // Helper function to calculate distance from point to line segment
  const distanceToLineSegment = (px: number, py: number, x1: number, y1: number, x2: number, y2: number): number => {
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

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full border border-gray-700 bg-gray-950 rounded-lg overflow-hidden"
    >
      <canvas ref={canvasRef} onClick={handleCanvasClick} className="w-full h-full cursor-crosshair" />
      <div className="absolute bottom-2 left-2 bg-gray-800 bg-opacity-80 text-xs p-2 rounded text-gray-300 pointer-events-none">
        <p>Click on a route to select it | Toggle visualization options in the control panel</p>
      </div>
    </div>
  )
}

export default NetworkAnalysisCanvas
