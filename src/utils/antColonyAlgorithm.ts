import { Node, Edge, SimulationMode } from '../types/networkTypes';

/**
 * Finds the shortest path between source and target nodes using Ant Colony Optimization
 * 
 * @param nodes List of all nodes in the network
 * @param edges List of all edges connecting nodes
 * @param sourceId ID of the source node
 * @param targetId ID of the target node
 * @param iterations Number of iterations to run
 * @param numAnts Number of ants per iteration
 * @param evaporationRate Rate at which pheromones evaporate (0-1)
 * @param initialPheromone Initial pheromone value for all edges
 * @param alpha Importance of pheromone (usually 1)
 * @param beta Importance of heuristic information (usually 2-5)
 */
export const findShortestPath = (
nodes: Node[], edges: Edge[], sourceId: number, targetId: number, iterations: number = 50, numAnts: number = 10, evaporationRate: number = 0.1, initialPheromone: number = 0.1, alpha: number = 1, beta: number = 3, simulationMode: SimulationMode, trafficWeight: number): { path: number[], distance: number } => {
  // Create adjacency list representation of the graph
  const graph = new Map<number, Map<number, { weight: number, pheromone: number }>>();
  
  // Initialize graph
  nodes.forEach(node => {
    graph.set(node.id, new Map());
  });
  
  // Add edges to graph
  edges.forEach(edge => {
    graph.get(edge.source)?.set(edge.target, { 
      weight: edge.weight, 
      pheromone: initialPheromone 
    });
    graph.get(edge.target)?.set(edge.source, { 
      weight: edge.weight, 
      pheromone: initialPheromone 
    });
  });
  
  let bestPath: number[] = [];
  let bestDistance = Infinity;
  
  // Run for specified number of iterations
  for (let i = 0; i < iterations; i++) {
    const antPaths: { path: number[], distance: number }[] = [];
    
    // For each ant
    for (let ant = 0; ant < numAnts; ant++) {
      const path = constructPath(graph, sourceId, targetId, alpha, beta);
      if (path.path.length > 0) {
        antPaths.push(path);
        
        if (path.distance < bestDistance) {
          bestDistance = path.distance;
          bestPath = [...path.path];
        }
      }
    }
    
    // Update pheromones
    updatePheromones(graph, antPaths, evaporationRate);
  }
  
  return { path: bestPath, distance: bestDistance };
};

/**
 * Constructs a path from source to target using pheromone levels
 */
const constructPath = (
  graph: Map<number, Map<number, { weight: number, pheromone: number }>>,
  sourceId: number,
  targetId: number,
  alpha: number,
  beta: number
): { path: number[], distance: number } => {
  const visited = new Set<number>([sourceId]);
  const path: number[] = [sourceId];
  let currentNode = sourceId;
  let totalDistance = 0;
  
  while (currentNode !== targetId) {
    const neighbors = graph.get(currentNode);
    if (!neighbors) break;
    
    const unvisitedNeighbors: { id: number, prob: number }[] = [];
    let totalProb = 0;
    
    // Calculate probabilities for each unvisited neighbor
    for (const [neighborId, { weight, pheromone }] of neighbors.entries()) {
      if (!visited.has(neighborId)) {
        const probability = Math.pow(pheromone, alpha) * Math.pow(1.0 / weight, beta);
        unvisitedNeighbors.push({ id: neighborId, prob: probability });
        totalProb += probability;
      }
    }
    
    if (unvisitedNeighbors.length === 0) {
      // No unvisited neighbors, path is stuck
      return { path: [], distance: Infinity };
    }
    
    // Select next node based on probabilities
    const r = Math.random() * totalProb;
    let cumulativeProb = 0;
    let nextNode = unvisitedNeighbors[0].id; // Default to first if something goes wrong
    
    for (const { id, prob } of unvisitedNeighbors) {
      cumulativeProb += prob;
      if (r <= cumulativeProb) {
        nextNode = id;
        break;
      }
    }
    
    // Add selected node to path
    const edgeInfo = neighbors.get(nextNode);
    if (!edgeInfo) break;
    
    totalDistance += edgeInfo.weight;
    visited.add(nextNode);
    path.push(nextNode);
    currentNode = nextNode;
  }
  
  return { path, distance: totalDistance };
};

/**
 * Updates pheromone levels based on ant paths
 */
const updatePheromones = (
  graph: Map<number, Map<number, { weight: number, pheromone: number }>>,
  antPaths: { path: number[], distance: number }[],
  evaporationRate: number
): void => {
  // Evaporate pheromones
  for (const [nodeId, neighbors] of graph.entries()) {
    for (const [neighborId, edge] of neighbors.entries()) {
      const newPheromone = edge.pheromone * (1 - evaporationRate);
      neighbors.set(neighborId, { ...edge, pheromone: newPheromone });
    }
  }
  
  // Add new pheromones based on ant paths
  for (const { path, distance } of antPaths) {
    const pheromoneDelta = 1.0 / distance;
    
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];
      
      const fromNeighbors = graph.get(from);
      const toNeighbors = graph.get(to);
      
      if (fromNeighbors && toNeighbors) {
        const edgeFrom = fromNeighbors.get(to);
        const edgeTo = toNeighbors.get(from);
        
        if (edgeFrom) {
          fromNeighbors.set(to, { 
            ...edgeFrom, 
            pheromone: edgeFrom.pheromone + pheromoneDelta 
          });
        }
        
        if (edgeTo) {
          toNeighbors.set(from, { 
            ...edgeTo, 
            pheromone: edgeTo.pheromone + pheromoneDelta 
          });
        }
      }
    }
  }
};