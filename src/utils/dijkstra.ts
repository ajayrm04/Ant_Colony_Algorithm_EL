import { Node, Edge } from '../types/networkTypes';

interface DijkstraNode {
  id: number;
  distance: number;
  previous: number | null;
}

export function calculateDijkstraPath(nodes: Node[], edges: Edge[], start: number, end: number): number[] {
  // Initialize distances
  const distances = new Map<number, DijkstraNode>();
  nodes.forEach(node => {
    distances.set(node.id, {
      id: node.id,
      distance: node.id === start ? 0 : Infinity,
      previous: null
    });
  });

  // Create adjacency list for faster lookup
  const adjacencyList = new Map<number, number[]>();
  edges.forEach(edge => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    if (!adjacencyList.has(edge.target)) {
      adjacencyList.set(edge.target, []);
    }
    adjacencyList.get(edge.source)!.push(edge.target);
    adjacencyList.get(edge.target)!.push(edge.source);
  });

  // Priority queue for unvisited nodes
  const unvisited = new Set(nodes.map(node => node.id));

  while (unvisited.size > 0) {
    // Find node with minimum distance
    let current = -1;
    let minDistance = Infinity;
    unvisited.forEach(nodeId => {
      const node = distances.get(nodeId)!;
      if (node.distance < minDistance) {
        current = nodeId;
        minDistance = node.distance;
      }
    });

    if (current === -1 || current === end) break;

    unvisited.delete(current);

    // Update distances to neighbors
    const neighbors = adjacencyList.get(current) || [];
    neighbors.forEach(neighborId => {
      if (!unvisited.has(neighborId)) return;

      const edge = edges.find(e => 
        (e.source === current && e.target === neighborId) || 
        (e.source === neighborId && e.target === current)
      );
      
      if (!edge) return;

      const newDistance = distances.get(current)!.distance + edge.weight;
      const neighbor = distances.get(neighborId)!;
      
      if (newDistance < neighbor.distance) {
        distances.set(neighborId, {
          ...neighbor,
          distance: newDistance,
          previous: current
        });
      }
    });
  }

  // Reconstruct path
  const path: number[] = [];
  let current = end;
  
  while (current !== null && current !== undefined) {
    path.unshift(current);
    const node = distances.get(current);
    if (!node) break;
    current = node.previous!;
  }

  return path;
} 