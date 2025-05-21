import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNetworkStore } from '../store/networkStore';
import { NodeType } from '../types/networkTypes';
import { drawEdgeWithPheromone, drawAnt } from '../utils/animationUtils';

const SimulationCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<number | null>(null);

  // Destructure all needed data and actions from your store
  const {
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
  } = useNetworkStore();

  // Resize and scale canvas for device pixel ratio
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawNetwork();
  }, [nodes, edges, pheromones, bestPath, selectedSourceNode, selectedTargetNode, antPositions]);

  // Attach resize listener and run once on mount
  useEffect(() => {
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  // Main animation loop to update canvas continuously
  useEffect(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const animate = () => {
      drawNetwork();

      if (simulationRunning && antPositions.length > 0) {
        updateAntPositions(antPositions);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    nodes, 
    edges, 
    pheromones, 
    bestPath, 
    selectedSourceNode, 
    selectedTargetNode, 
    antPositions, 
    simulationRunning,
  ]);

  // Draw nodes, edges, ants and UI elements on canvas
  const drawNetwork = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear entire canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw edges with pheromone effects and best path highlights
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (!source || !target) return;

      const key = `${edge.source}-${edge.target}`;
      const pheromone = pheromones[key] || 0;
      const isInBestPath = bestPath.includes(key) || bestPath.includes(`${edge.target}-${edge.source}`);
      
      drawEdgeWithPheromone(ctx, source, target, pheromone, isInBestPath, edge.weight);
    });

    // Draw nodes with highlights for selected and type-specific colors
    nodes.forEach(node => {
      ctx.beginPath();

      // Set shadow color based on node type and selection state
      ctx.shadowColor =
        node.id === selectedSourceNode ? '#4ade80' : // green highlight for source
        node.id === selectedTargetNode ? '#f87171' : // red highlight for target
        node.type === NodeType.ROUTER ? '#60a5fa' :  // blue for routers
        '#a78bfa';                                   // purple for devices

      ctx.shadowBlur = 15;
      ctx.arc(node.x, node.y, 15, 0, 2 * Math.PI);

      // Set fill color based on node type and selection state
      ctx.fillStyle =
        node.id === selectedSourceNode ? '#4ade80' :
        node.id === selectedTargetNode ? '#f87171' :
        node.type === NodeType.ROUTER ? '#60a5fa' :
        '#a78bfa';

      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Reset shadow for text
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Draw node label centered
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);
    });

    // Draw ants as small glowing circles with animation effects
    antPositions.forEach(ant => {
      drawAnt(ctx, ant.x, ant.y, ant.progress);
    });

    // Draw simulation status and info
    if (simulationRunning) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(10, 10, 180, 50);
      
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`Iteration: ${iterations}/100`, 20, 30);
    
    }
  };

  // Handle adding nodes or selecting source/target on double click
  const handleDoubleClick = (e: React.MouseEvent) => {
    if (simulationRunning) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked near existing node
    const clickedNodeIndex = nodes.findIndex(node =>
      Math.hypot(node.x - x, node.y - y) < 15
    );

    if (clickedNodeIndex !== -1) {
      // Select target if ctrl/meta key held, else select source node
      if (e.ctrlKey || e.metaKey) {
        setSelectedTargetNode(nodes[clickedNodeIndex].id);
      } else {
        setSelectedSourceNode(nodes[clickedNodeIndex].id);
      }
    } else {
      // Add new node
      const newId = Date.now();
      const type = e.shiftKey ? NodeType.ROUTER : NodeType.DEVICE;
      const newNode = {
        id: newId,
        x,
        y,
        label: type === NodeType.ROUTER ? `R${nodes.filter(n => n.type === NodeType.ROUTER).length + 1}` : 
                                        `D${nodes.filter(n => n.type === NodeType.DEVICE).length + 1}`,
        type,
      };

      addNode(newNode);

      // Auto-connect new node to nearby nodes
      nodes.forEach(otherNode => {
        const dist = Math.hypot(otherNode.x - x, otherNode.y - y);
        
        if (type === NodeType.ROUTER && dist <= 500) {
          addEdge({ 
            source: newId, 
            target: otherNode.id, 
            weight: Math.floor(dist),
            sourcetype: type,
            targettype: otherNode.type
          });
        }
        else if (dist < 200) {
          if (otherNode.type === NodeType.ROUTER) {
            addEdge({ 
              source: newId, 
              target: otherNode.id, 
              weight: Math.floor(dist), 
              sourcetype: type,
              targettype: otherNode.type
            });
          }
        }
      });
    }
  };

  // Start dragging a node if clicked on
  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedIndex = nodes.findIndex(
      node => Math.hypot(node.x - x, node.y - y) < 15
    );

    if (clickedIndex !== -1) {
      setIsDragging(true);
      setDraggedNode(clickedIndex);
    }
  };

  // Move dragged node along with mouse
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || draggedNode === null) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    updateNodePosition(draggedNode, x, y);
  };

  // Stop dragging on mouse up or leave
  const handleMouseUp = () => {
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
  );
};

export default SimulationCanvas;