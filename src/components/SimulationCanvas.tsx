import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNetworkStore } from '../store/networkStore';
import { NodeType } from '../types/networkTypes';

const SimulationCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    let animationId: number;

    const animate = () => {
      drawNetwork();

      if (simulationRunning) {
        updateAntPositions(antPositions);
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationId);
  }, [nodes, edges, pheromones, bestPath, selectedSourceNode, selectedTargetNode, antPositions, simulationRunning]);

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
      const lineWidth = 1 + Math.min(5, pheromone * 3);

      // Glow effect for high pheromone edges
      if (pheromone > 0.3) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = `rgba(100, 149, 237, ${0.1 + Math.min(0.3, pheromone * 0.5)})`;
        ctx.lineWidth = lineWidth + 4;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);

      // Highlight edges that are part of the best path
      if (
        bestPath.includes(key) ||
        bestPath.includes(`${edge.target}-${edge.source}`)
      ) {
        ctx.shadowColor = 'rgba(0, 255, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
        ctx.lineWidth = 3;
      } else {
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(100, 149, 237, ${0.2 + Math.min(0.8, pheromone)})`;
        ctx.lineWidth = lineWidth;
      }

      ctx.stroke();

      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Draw weight label near the middle of the edge
      const midX = (source.x + target.x) / 2;
      const midY = (source.y + target.y) / 2;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '10px Arial';
      ctx.fillText(edge.weight.toString(), midX, midY);
    });

    // Draw nodes with highlights for selected and type-specific colors
    nodes.forEach(node => {
      ctx.beginPath();

      ctx.shadowColor =
        node.id === selectedSourceNode ? '#4ade80' : // green highlight for source
        node.id === selectedTargetNode ? '#f87171' : // red highlight for target
        node.type === NodeType.ROUTER ? '#60a5fa' :  // blue for routers
        '#a78bfa';                                   // purple for devices

      ctx.shadowBlur = 15;
      ctx.arc(node.x, node.y, 15, 0, 2 * Math.PI);

      ctx.fillStyle =
        node.id === selectedSourceNode ? '#4ade80' :
        node.id === selectedTargetNode ? '#f87171' :
        node.type === NodeType.ROUTER ? '#60a5fa' :
        '#a78bfa';

      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Draw node label centered
      ctx.fillStyle = 'white';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);
    });

    // Draw ants as small glowing circles
    antPositions.forEach(ant => {
      ctx.beginPath();
      ctx.arc(ant.x, ant.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(255, 215, 0, 0.8)'; // gold color
      ctx.shadowColor = 'rgba(255, 215, 0, 0.5)';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    });
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
        label: `N${nodes.length + 1}`,
        type,
      };

      addNode(newNode);

      // Auto-connect new node to nearby opposite type nodes within 200px
      nodes.forEach(otherNode => {
        const dist = Math.hypot(otherNode.x - x, otherNode.y - y);
        if(type===NodeType.ROUTER){
          addEdge({ source: newId, target: otherNode.id, weight: Math.floor(dist) });
        }
        else{
          if(dist<200){
            if(otherNode.type===NodeType.ROUTER){
              addEdge({ source: newId, target: otherNode.id, weight: Math.floor(dist) });
            }
          }
        }
        // if (dist < 200) {
        //   if (type === NodeType.ROUTER && otherNode.type === NodeType.DEVICE) {
        //     addEdge({ source: newId, target: otherNode.id, weight: Math.floor(dist) });
        //   } else if (type === NodeType.DEVICE && otherNode.type === NodeType.ROUTER) {
        //     addEdge({ source: otherNode.id, target: newId, weight: Math.floor(dist) });
        //   }
        // }
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
