"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"
import { useNetworkStore } from "../store/networkStore"
import { NodeType } from "../types/networkTypes"
import { drawEdgeWithPheromone, drawAnt, drawNodeRipple, drawNode } from "../utils/animationUtils"

const SimulationCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [draggedNode, setDraggedNode] = useState<number | null>(null)

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

    // Draw edges
    edges.forEach((edge) => {
      const source = nodes.find((n) => n.id === edge.source)
      const target = nodes.find((n) => n.id === edge.target)
      if (!source || !target) return

      const key = `${edge.source}-${edge.target}`
      const pheromone = pheromones[key] || 0
      const isInBestPath = bestPath.includes(key) || bestPath.includes(`${edge.target}-${edge.source}`)
      const isActive = activeEdges.has(key) || activeEdges.has(`${edge.target}-${edge.source}`)

      drawEdgeWithPheromone(ctx, source, target, pheromone, isInBestPath, edge, isActive, showTraffic)
    })

    // Draw nodes
    nodes.forEach((node) => {
      drawNode(ctx, node, node.id === selectedSourceNode, node.id === selectedTargetNode, showCongestion)
    })

    // Draw ants and their effects
    antPositions.forEach((ant) => {
      drawAnt(ctx, ant.x, ant.y, ant.progress)

      // Add ripple effect when ant reaches target
      if (ant.progress > 0.9) {
        const toNode = nodes.find((n) => n.id === ant.to)
        if (toNode) {
          drawNodeRipple(ctx, toNode.x, toNode.y, (ant.progress - 0.9) * 10)
        }
      }
    })

    // Draw simulation status
    if (simulationRunning || simulationPhase === "complete") {
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(10, 10, 180, 50)

      ctx.fillStyle = "white"
      ctx.font = "14px Arial"
      ctx.textAlign = "left"
      ctx.fillText(`Iteration: ${iterations}/100`, 20, 30)

      ctx.fillStyle =
        simulationPhase === "exploration" ? "#FFD700" : simulationPhase === "convergence" ? "#00FFFF" : "#00FF00"
      ctx.fillText(`Phase: ${simulationPhase}`, 20, 50)
    }
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
      const newNode = {
        id: newId,
        x,
        y,
        label:
          type === NodeType.ROUTER
            ? `R${nodes.filter((n) => n.type === NodeType.ROUTER).length + 1}`
            : `D${nodes.filter((n) => n.type === NodeType.DEVICE).length + 1}`,
        type,
        congestion: 0,
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

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full border border-gray-700 bg-gray-950 rounded-lg overflow-hidden"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className="w-full h-full cursor-crosshair"
      />
      <div className="absolute bottom-2 left-2 bg-gray-800 bg-opacity-80 text-xs p-2 rounded text-gray-300 pointer-events-none select-none">
        <p>Double-click: Add device | Shift + Double-click: Add router</p>
        <p>Drag: Move nodes | Ctrl + Click: Set target | Click: Set source</p>
      </div>
    </div>
  )
}

export default SimulationCanvas
