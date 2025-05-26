"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import { useNetworkStore } from "../store/networkStore"
import { NodeType } from "../types/networkTypes"
import { drawEdgeWithPheromone, drawNodeRipple, drawNode } from "../utils/animationUtils"
import { motion } from "framer-motion"
import { Activity } from "lucide-react"

// --- Dijkstra's algorithm ---
function dijkstra(nodes: any[], edges: any[], sourceId: number, targetId: number) {
  const dist: Record<number, number> = {}
  const prev: Record<number, number | null> = {}
  const unvisited = new Set(nodes.map(n => n.id))

  nodes.forEach(n => { dist[n.id] = Infinity; prev[n.id] = null })
  dist[sourceId] = 0

  while (unvisited.size > 0) {
    let u = Array.from(unvisited).reduce((min, id) => dist[id] < dist[min] ? id : min, Array.from(unvisited)[0])
    unvisited.delete(u)
    if (u === targetId) break

    edges.filter(e => e.source === u || e.target === u).forEach(e => {
      const v = e.source === u ? e.target : e.source
      if (!unvisited.has(v)) return
      const alt = dist[u] + (e.weight || 1)
      if (alt < dist[v]) {
        dist[v] = alt
        prev[v] = u
      }
    })
  }

  // Reconstruct path
  const path: number[] = []
  let u: number | null = targetId
  while (u !== null && prev[u] !== null) {
    path.unshift(u)
    u = prev[u]
  }
  if (u === sourceId) path.unshift(sourceId)
  return path.length > 1 ? path : []
}

interface DijkstraCanvasProps {
  adjacencyList?: Record<string, any>;
  trafficPattern?: Record<string, number>;
}

const DijkstraCanvas: React.FC<DijkstraCanvasProps> = ({
  adjacencyList,
  trafficPattern,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [modifiedNodes, setModifiedNodes] = useState<any[]>([])
  const [modifiedEdges, setModifiedEdges] = useState<any[]>([])

  const {
    nodes,
    edges,
    addNode,
    addEdge,
    updateNodePosition,
    selectedSourceNode,
    selectedTargetNode,
    setSelectedSourceNode,
    setSelectedTargetNode,
  } = useNetworkStore()

  // Layout and adjacency parsing (same as your code)
  useEffect(() => {
    if (adjacencyList) {
      const container = containerRef.current;
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.35;

      const newNodes = Object.entries(adjacencyList).map(([id, nodeData]: [string, any], index) => {
        const angle = (index * 2 * Math.PI) / Object.keys(adjacencyList).length;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        return {
          id: parseInt(id),
          x,
          y,
          label: `N${index + 1}`,
          type: nodeData.type === 'router' ? NodeType.ROUTER : NodeType.DEVICE,
          congestion: 0
        };
      });

      const newEdges: any[] = [];
      const addedEdges = new Set<string>();
      Object.entries(adjacencyList).forEach(([sourceId, nodeData]: [string, any]) => {
        if (!Array.isArray(nodeData.neighbors)) return;
        nodeData.neighbors.forEach((neighbor: any) => {
          const neighborId = neighbor.id?.toString?.() ?? neighbor.toString();
          const edgeKey = [sourceId, neighborId].sort().join("-");
          if (!addedEdges.has(edgeKey)) {
            const sourceNode = newNodes.find(n => n.id === parseInt(sourceId));
            const targetNode = newNodes.find(n => n.id === parseInt(neighborId));
            if (sourceNode && targetNode) {
              const weight = typeof neighbor.weight === "number"
                ? neighbor.weight
                : Math.floor(Math.hypot(sourceNode.x - targetNode.x, sourceNode.y - targetNode.y));
              newEdges.push({
                source: parseInt(sourceId),
                target: parseInt(neighborId),
                weight,
                sourcetype: sourceNode.type,
                targettype: targetNode.type,
              });
              addedEdges.add(edgeKey);
            }
          }
        });
      });

      setModifiedNodes(newNodes);
      setModifiedEdges(newEdges);
    }
  }, [adjacencyList]);

  // --- Drawing ---
  const drawNetwork = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const currentNodes = adjacencyList ? modifiedNodes : nodes;
    const currentEdges = adjacencyList ? modifiedEdges : edges;

    // Find shortest path
    let shortestPath: number[] = []
    if (selectedSourceNode && selectedTargetNode) {
      shortestPath = dijkstra(currentNodes, currentEdges, selectedSourceNode, selectedTargetNode)
    }
    // Convert path to edge keys for highlighting
    const pathEdges = new Set<string>()
    for (let i = 0; i < shortestPath.length - 1; i++) {
      pathEdges.add(`${shortestPath[i]}-${shortestPath[i + 1]}`)
      pathEdges.add(`${shortestPath[i + 1]}-${shortestPath[i]}`)
    }

    // Draw edges
    currentEdges.forEach((edge) => {
      const source = currentNodes.find((n) => n.id === edge.source)
      const target = currentNodes.find((n) => n.id === edge.target)
      if (!source || !target) return
      const key = `${edge.source}-${edge.target}`
      ctx.beginPath()
      ctx.moveTo(source.x, source.y)
      ctx.lineTo(target.x, target.y)
      ctx.lineWidth = pathEdges.has(key) ? 5 : 2
      ctx.strokeStyle = pathEdges.has(key) ? "rgba(34,197,94,0.9)" : "#64748b"
      ctx.stroke()
    })

    // Draw nodes
    currentNodes.forEach((node) => {
      drawNode(ctx, node, node.id === selectedSourceNode, node.id === selectedTargetNode, false)
    })
  }, [
    nodes,
    edges,
    modifiedNodes,
    modifiedEdges,
    adjacencyList,
    selectedSourceNode,
    selectedTargetNode,
  ])

  // Resize and redraw
  const resizeCanvas = useCallback(() => {
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
    drawNetwork()
  }, [drawNetwork])

  useEffect(() => {
    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()
    return () => window.removeEventListener("resize", resizeCanvas)
  }, [resizeCanvas])

  useEffect(() => {
    drawNetwork()
  }, [drawNetwork])

  // Node selection logic (same as your code)
  const handleDoubleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const currentNodes = adjacencyList ? modifiedNodes : nodes
    const clickedNodeIndex = currentNodes.findIndex((node) => Math.hypot(node.x - x, node.y - y) < 15)
    if (clickedNodeIndex !== -1) {
      if (e.ctrlKey || e.metaKey) {
        setSelectedTargetNode(currentNodes[clickedNodeIndex].id)
      } else {
        setSelectedSourceNode(currentNodes[clickedNodeIndex].id)
      }
    }
  }

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-full h-full card overflow-hidden"
    >
      {/* Simulation Status - Top left */}
      {(selectedSourceNode && selectedTargetNode) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-4 left-4 card p-3 bg-gray-800/90 backdrop-blur-sm border border-gray-700 shadow-xl"
          style={{ zIndex: 3 }}
        >
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-sm font-medium text-gray-200">Dijkstra Shortest Path</div>
              <div className="text-sm font-medium text-green-400">
                Source: {selectedSourceNode} | Target: {selectedTargetNode}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Instructions - Bottom right */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="absolute bottom-4 right-4 card p-3 text-xs text-gray-300 bg-gray-800/90 backdrop-blur-sm border border-gray-700 shadow-xl"
        style={{ zIndex: 3 }}
      >
        <div className="space-y-1">
          <p className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 bg-primary-400 rounded-full" />
            <span>Ctrl + Double-click: Set target | Double-click: Set source</span>
          </p>
        </div>
      </motion.div>

      {/* Grid lines overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      >
        {Array.from({ length: 21 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={`${i * 5}%`}
            y1="0"
            x2={`${i * 5}%`}
            y2="100%"
            stroke="rgba(148, 163, 184, 0.1)"
            strokeWidth={1.2}
            shapeRendering="crispEdges"
          />
        ))}
        {Array.from({ length: 21 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1="0"
            y1={`${i * 5}%`}
            x2="100%"
            y2={`${i * 5}%`}
            stroke="rgba(148, 163, 184, 0.1)"
            strokeWidth={1.2}
            shapeRendering="crispEdges"
          />
        ))}
      </svg>

      <canvas
        ref={canvasRef}
        onDoubleClick={handleDoubleClick}
        className="w-full h-full cursor-crosshair"
        style={{ position: "relative", zIndex: 2 }}
      />
    </motion.div>
  )
}

export default DijkstraCanvas
