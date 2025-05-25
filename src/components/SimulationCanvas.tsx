"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import { useNetworkStore } from "../store/networkStore"
import { NodeType } from "../types/networkTypes"
import { drawEdgeWithPheromone, drawAnt, drawNodeRipple, drawNode } from "../utils/animationUtils"
import { spreadTrafficAmongRouters } from "../utils/analysisUtils"
import TrafficSpread from "./TrafficSpread"
import { motion } from "framer-motion"
import { Activity, BarChart2 } from "lucide-react"


interface SimulationCanvasProps {
  adjacencyList?: Record<string, string[]>;
  trafficPattern?: Record<string, number>;
  historicalRoutes?: any[];
  onSpreadTraffic?: (pattern: Record<string, number>) => void;
  isAntColony?: boolean;
}

const SimulationCanvas: React.FC<SimulationCanvasProps> = ({
  adjacencyList,
  trafficPattern,
  historicalRoutes,
  onSpreadTraffic,
  isAntColony = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [draggedNode, setDraggedNode] = useState<number | null>(null)
  const [modifiedNodes, setModifiedNodes] = useState<any[]>([])
  const [modifiedEdges, setModifiedEdges] = useState<any[]>([])
  const [spreadTrafficPattern, setSpreadTrafficPattern] = useState<Record<string, number> | null>(null)
  const [showSpreadTraffic, setShowSpreadTraffic] = useState(false)

  const {
    startSimulation,
    nodes,
    edges,
    addNode,
    addEdge,
    updateNodePosition,
    simulationRunning,
    selectedSourceNode,
    selectedTargetNode,
    setSelectedSourceNode,
    setSelectedTargetNode,
    pheromones,
    bestPath,
    antPositions,
    updateAntPositions,
    iterations,
    simulationPhase,
    activeEdges,
    showTraffic,
    showCongestion,
  } = useNetworkStore()

  // Update modified network when props change
  useEffect(() => {
    if (adjacencyList) {
      const container = containerRef.current;
      if (!container) return;

      const width = container.clientWidth;
      const height = container.clientHeight;
      
      // Calculate center and radius based on container size
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.35; // Use 35% of the smaller dimension

      // Create nodes from adjacency list
      const newNodes = Object.entries(adjacencyList).map(([id, nodeData]: [string, any], index) => {
        // Calculate position in a circular layout
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


      // Transform adjacencyList to a simple Record<string, string[]> if needed
      const transformedAdjacencyList = (() => {
        if (!adjacencyList) return {};
        const transformed: Record<string, string[]> = {};
        Object.entries(adjacencyList).forEach(([nodeId, nodeData]: [string, any]) => {
          // If nodeData has a 'neighbors' property, use it; otherwise, assume it's already an array
          if (nodeData && Array.isArray(nodeData.neighbors)) {
        transformed[nodeId] = nodeData.neighbors.map((n: any) => n.id?.toString?.() ?? n.toString());
          } else if (Array.isArray(nodeData)) {
        transformed[nodeId] = nodeData.map((n: any) => n.id?.toString?.() ?? n.toString());
          }
        });
        return transformed;
      })();


      // Create edges from adjacency list (assuming adjacencyList: Record<string, string[]>)
      const newEdges: any[] = [];
      const addedEdges = new Set<string>();

      Object.entries(adjacencyList).forEach(([sourceId, nodeData]: [string, any]) => {
        if (!Array.isArray(nodeData.neighbors)) return;
        nodeData.neighbors.forEach((neighbor: any) => {
          const neighborId = neighbor.id?.toString?.() ?? neighbor.toString();
          // Create a unique key to avoid duplicate edges (undirected)
          const edgeKey = [sourceId, neighborId].sort().join("-");
          if (!addedEdges.has(edgeKey)) {
        const sourceNode = newNodes.find(n => n.id === parseInt(sourceId));
        const targetNode = newNodes.find(n => n.id === parseInt(neighborId));
        if (sourceNode && targetNode) {
          // Use the weight from the neighbor object if present, else calculate
          const weight = typeof neighbor.weight === "number"
            ? neighbor.weight
            : Math.floor(Math.hypot(sourceNode.x - targetNode.x, sourceNode.y - targetNode.y));
          const edge = {
            source: parseInt(sourceId),
            target: parseInt(neighborId),
            weight,
            sourcetype: sourceNode.type,
            targettype: targetNode.type,
            traffic: trafficPattern?.[`${sourceId}-${neighborId}`] || 0,
            bandwidth: 100,
            utilization: 0
          };
          newEdges.push(edge);
          addedEdges.add(edgeKey);
        }
          }
        });
      });

      setModifiedNodes(newNodes);
      setModifiedEdges(newEdges);
    }
  }, [adjacencyList, trafficPattern]);

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
  }, [
    nodes,
    edges,
    modifiedNodes,
    modifiedEdges,
    pheromones,
    bestPath,
    selectedSourceNode,
    selectedTargetNode,
    antPositions,
    showTraffic,
    showCongestion,
  ])

  useEffect(() => {
    window.addEventListener("resize", resizeCanvas)
    resizeCanvas()
    return () => window.removeEventListener("resize", resizeCanvas)
  }, [resizeCanvas])

  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    const animate = () => {
      drawNetwork()

      if (simulationRunning && antPositions.length > 0) {
        updateAntPositions(antPositions)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [
    nodes,
    edges,
    modifiedNodes,
    modifiedEdges,
    pheromones,
    bestPath,
    selectedSourceNode,
    selectedTargetNode,
    antPositions,
    simulationRunning,
    simulationPhase,
    showTraffic,
    showCongestion,
  ])

  const drawNetwork = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Use modified or original network data based on props
    const currentNodes = adjacencyList ? modifiedNodes : nodes;
    const currentEdges = adjacencyList ? modifiedEdges : edges;

    // Draw edges
    currentEdges.forEach((edge) => {
      const source = currentNodes.find((n) => n.id === edge.source)
      const target = currentNodes.find((n) => n.id === edge.target)
      if (!source || !target) return

      const key = `${edge.source}-${edge.target}`
      const pheromone = pheromones[key] || 0
      const isInBestPath = bestPath.includes(key) || bestPath.includes(`${edge.target}-${edge.source}`)
      const isActive = activeEdges.has(key) || activeEdges.has(`${edge.target}-${edge.source}`)

      drawEdgeWithPheromone(ctx, source, target, pheromone, isInBestPath, edge, isActive, showTraffic)
    })

    // Draw nodes
    currentNodes.forEach((node) => {
      drawNode(ctx, node, node.id === selectedSourceNode, node.id === selectedTargetNode, showCongestion)
    })

    // Draw ants and their effects
    antPositions.forEach((ant) => {
      drawAnt(ctx, ant.x, ant.y, ant.progress)

      // Add ripple effect when ant reaches target
      if (ant.progress > 0.9) {
        const toNode = currentNodes.find((n) => n.id === ant.to)
        if (toNode) {
          drawNodeRipple(ctx, toNode.x, toNode.y, (ant.progress - 0.9) * 10)
        }
      }
    })

    // Draw traffic patterns
    Object.entries(trafficPattern || {}).forEach(([key, value]) => {
      const [sourceId, targetId] = key.split('-').map(Number);
      const sourceNode = currentNodes.find(n => n.id === sourceId);
      const targetNode = currentNodes.find(n => n.id === targetId);

      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);
        ctx.strokeStyle = `rgba(${isAntColony ? '34, 197, 94' : '59, 130, 246'}, ${Math.min(value / 10, 0.8)})`;
        ctx.lineWidth = Math.min(value, 5);
        ctx.stroke();
      }
    });
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const clickedNodeIndex = nodes.findIndex((node) => Math.hypot(node.x - x, node.y - y) < 15)

    if (clickedNodeIndex !== -1) {
      if (e.ctrlKey || e.metaKey) {
        setSelectedTargetNode(nodes[clickedNodeIndex].id)
      } else {
        setSelectedSourceNode(nodes[clickedNodeIndex].id)
      }
    } else {
      const newId = Date.now()
      const type = e.shiftKey ? NodeType.ROUTER : NodeType.DEVICE
      const label =
        type === NodeType.ROUTER
          ? `R${nodes.filter((n) => n.type === NodeType.ROUTER).length + 1}`
          : `D${nodes.filter((n) => n.type === NodeType.DEVICE).length + 1}`;
      const name =
        type === NodeType.ROUTER
          ? `r${nodes.filter((n) => n.type === NodeType.ROUTER).length + 1}`
          : `d${nodes.filter((n) => n.type === NodeType.DEVICE).length + 1}`;
      const newNode = {
        id: newId,
        x,
        y,
        label,
        type,
        congestion: 0,
        name,
      }

      addNode(newNode)

      nodes.forEach((otherNode) => {
        const dist = Math.hypot(otherNode.x - x, otherNode.y - y)

        if (type === NodeType.ROUTER && dist <= 500) {
          addEdge({
            source: newId,
            target: otherNode.id,
            weight: Math.floor(dist),
            sourcetype: type,
            targettype: otherNode.type,
            traffic: 0,
            bandwidth: 100,
            utilization: 0,
          })
        } else if (dist < 200) {
          if (otherNode.type === NodeType.ROUTER) {
            addEdge({
              source: newId,
              target: otherNode.id,
              weight: Math.floor(dist),
              sourcetype: type,
              targettype: otherNode.type,
              traffic: 0,
              bandwidth: 100,
              utilization: 0,
            })
          }
        }
      })
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {

    console.log("NODES\n")
    console.log(JSON.stringify(nodes, null, 2))


    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const clickedIndex = nodes.findIndex((node) => Math.hypot(node.x - x, node.y - y) < 15)

    if (clickedIndex !== -1) {
      setIsDragging(true)
      setDraggedNode(clickedIndex)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    
      if (!isDragging || draggedNode === null) return
  
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
  
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
  
      updateNodePosition(draggedNode, x, y)
  
      // Update edge weights immediately after node position changes
      const movedNode = nodes[draggedNode]
      if (movedNode) {
        edges.forEach(edge => {
          if (edge.source === movedNode.id || edge.target === movedNode.id) {
            const sourceNode = nodes.find(n => n.id === edge.source)
            const targetNode = nodes.find(n => n.id === edge.target)
            if (sourceNode && targetNode) {
              edge.weight = Math.floor(
                Math.hypot(sourceNode.x - targetNode.x, sourceNode.y - targetNode.y)
              )
            }
          }
        })
      }
    }

  const handleMouseUp = () => {
    if (draggedNode !== null) {
      const movedNode = nodes[draggedNode];

      
      // Only update edge weights if the node's position has changed
      const prevNode = nodes.find((_n, idx) => idx === draggedNode);
      if (prevNode && (prevNode.x !== movedNode.x || prevNode.y !== movedNode.y)) {
        // Recalculate and update weights of all connected edges
        edges.forEach(edge => {
          if (edge.source === movedNode.id || edge.target === movedNode.id) {
            const sourceNode = nodes.find(n => n.id === edge.source);
            const targetNode = nodes.find(n => n.id === edge.target);
            
            if (sourceNode && targetNode) {
              const newWeight = Math.floor(
                Math.hypot(sourceNode.x - targetNode.x, sourceNode.y - targetNode.y)
              );
              edge.weight = newWeight;
            }
          }
        });
      }

      // Find and connect to nearby nodes based on type and distance
      nodes.forEach(otherNode => {
        if (otherNode.id === movedNode.id) return;

        const dist = Math.hypot(movedNode.x - otherNode.x, movedNode.y - otherNode.y);

        if (movedNode.type === NodeType.ROUTER && dist <= 500) {
          // Check if edge already exists
          const exists = edges.some(
            edge =>
              (edge.source === movedNode.id && edge.target === otherNode.id) ||
              (edge.source === otherNode.id && edge.target === movedNode.id)
          );
          if (!exists) {
            addEdge({
              source: movedNode.id,
              target: otherNode.id,
              weight: Math.floor(dist),
              sourcetype: movedNode.type,
              targettype: otherNode.type,
              traffic: 0,
              bandwidth: 100,
              utilization: 0,
            });
          }
        } else if (movedNode.type === NodeType.DEVICE && dist < 200 && otherNode.type === NodeType.ROUTER) {
          // Check if edge already exists
          const exists = edges.some(
            edge =>
              (edge.source === movedNode.id && edge.target === otherNode.id) ||
              (edge.source === otherNode.id && edge.target === movedNode.id)
          );
          if (!exists) {
            addEdge({
              source: movedNode.id,
              target: otherNode.id,
              weight: Math.floor(dist),
              sourcetype: movedNode.type,
              targettype: otherNode.type,
              traffic: 0,
              bandwidth: 100,
              utilization: 0,
            });
          }
        }
      });
    }

    setIsDragging(false);
    setDraggedNode(null);
  };

  const handleSpreadTraffic = () => {
    // Use either modified or original network data
    const currentNodes = adjacencyList ? modifiedNodes : nodes;
    const currentEdges = adjacencyList ? modifiedEdges : edges;
    const currentTrafficPattern = adjacencyList && trafficPattern ? trafficPattern : Object.fromEntries(currentEdges.map(e => [`${e.source}-${e.target}`, e.traffic]));
    const newPattern = spreadTrafficAmongRouters(currentNodes, currentEdges, currentTrafficPattern);
    if (onSpreadTraffic) {
      onSpreadTraffic(newPattern);
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
      {/* Spread Traffic Button - Top middle */}
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={handleSpreadTraffic}
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 btn-primary flex items-center space-x-2 shadow-lg"
      >
        <BarChart2 className="w-4 h-4" />
        <span>Spread Traffic</span>
      </motion.button>

      {/* Simulation Status - Top left, without instructions */}
      {simulationRunning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-4 left-4 card p-3 bg-gray-800/90 backdrop-blur-sm border border-gray-700 shadow-xl"
          style={{ zIndex: 3 }}
        >
          <div className="flex items-center space-x-3">
            <Activity className={`w-5 h-5 ${
              simulationPhase === "exploration" 
                ? "text-yellow-400" 
                : simulationPhase === "convergence" 
                ? "text-cyan-400" 
                : "text-green-400"
            }`} />
            <div>
              <div className="text-sm font-medium text-gray-200">Iteration: {iterations}/100</div>
              <div className={`text-sm font-medium ${
                simulationPhase === "exploration" 
                  ? "text-yellow-400" 
                  : simulationPhase === "convergence" 
                  ? "text-cyan-400" 
                  : "text-green-400"
              }`}>
                Status: {simulationPhase}
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
            <span>Double-click: Add device | Shift + Double-click: Add router</span>
          </p>
          <p className="flex items-center space-x-2">
            <span className="w-1.5 h-1.5 bg-primary-400 rounded-full" />
            <span>Drag: Move nodes | Ctrl + Click: Set target | Click: Set source</span>
          </p>
        </div>
      </motion.div>

      {/* Grid lines overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      >
        {/* Vertical grid lines */}
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
        {/* Horizontal grid lines */}
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
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className="w-full h-full cursor-crosshair"
        style={{ position: "relative", zIndex: 2 }}
      />

      {/* Show TrafficSpread visualization if triggered */}
      {showSpreadTraffic && spreadTrafficPattern && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-4xl mx-4"
          >
            <TrafficSpread
              nodes={adjacencyList ? modifiedNodes : nodes}
              edges={adjacencyList ? modifiedEdges : edges}
              trafficPattern={spreadTrafficPattern}
              onClose={() => setShowSpreadTraffic(false)}
            />
          </motion.div>
        </div>
      )}
    </motion.div>
  )
}

export default SimulationCanvas
