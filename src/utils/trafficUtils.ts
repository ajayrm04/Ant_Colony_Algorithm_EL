import type { Edge, Node, TrafficPattern } from "../types/networkTypes"

/**
 * Calculate edge traffic based on traffic patterns
 */
export function calculateEdgeTraffic(edges: Edge[], nodes: Node[], trafficPatterns: TrafficPattern[]): Edge[] {
  // Reset traffic on all edges
  const updatedEdges = edges.map((edge) => ({
    ...edge,
    traffic: 0,
    utilization: 0,
  }))

  // Only process active traffic patterns
  const activePatterns = trafficPatterns.filter((pattern) => pattern.active)

  // For each traffic pattern, find the shortest path and add traffic to those edges
  activePatterns.forEach((pattern) => {
    const path = findShortestPathForTraffic(nodes, updatedEdges, pattern.source, pattern.target)

    // Add traffic to each edge in the path
    for (let i = 0; i < path.length - 1; i++) {
      const fromNode = path[i]
      const toNode = path[i + 1]

      // Find the edge and update its traffic
      const edgeIndex = updatedEdges.findIndex(
        (e) => (e.source === fromNode && e.target === toNode) || (e.source === toNode && e.target === fromNode),
      )

      if (edgeIndex !== -1) {
        updatedEdges[edgeIndex].traffic += pattern.volume
        updatedEdges[edgeIndex].utilization = Math.min(
          1,
          updatedEdges[edgeIndex].traffic / updatedEdges[edgeIndex].bandwidth,
        )
      }
    }
  })

  // Calculate node congestion based on connected edge traffic
  const nodeCongestion: Record<number, number> = {}

  updatedEdges.forEach((edge) => {
    // Add traffic to source node congestion
    nodeCongestion[edge.source] = (nodeCongestion[edge.source] || 0) + edge.utilization

    // Add traffic to target node congestion
    nodeCongestion[edge.target] = (nodeCongestion[edge.target] || 0) + edge.utilization
  })

  return updatedEdges
}

/**
 * Simple Dijkstra's algorithm to find shortest path for traffic routing
 */
function findShortestPathForTraffic(nodes: Node[], edges: Edge[], sourceId: number, targetId: number): number[] {
  const distances: Record<number, number> = {}
  const previous: Record<number, number | null> = {}
  const unvisited = new Set<number>()

  // Initialize distances
  nodes.forEach((node) => {
    distances[node.id] = node.id === sourceId ? 0 : Number.POSITIVE_INFINITY
    previous[node.id] = null
    unvisited.add(node.id)
  })

  while (unvisited.size > 0) {
    // Find node with minimum distance
    let current: number | null = null
    let minDistance = Number.POSITIVE_INFINITY

    unvisited.forEach((nodeId) => {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId]
        current = nodeId
      }
    })

    if (current === null || current === targetId || minDistance === Number.POSITIVE_INFINITY) {
      break
    }

    unvisited.delete(current)

    // Update distances to neighbors
    edges.forEach((edge) => {
      if (edge.source === current || edge.target === current) {
        const neighbor = edge.source === current ? edge.target : edge.source

        if (unvisited.has(neighbor)) {
          const alt = distances[current] + edge.weight

          if (alt < distances[neighbor]) {
            distances[neighbor] = alt
            previous[neighbor] = current
          }
        }
      }
    })
  }

  // Reconstruct path
  const path: number[] = []
  let current: number | null = targetId

  while (current !== null) {
    path.unshift(current)
    current = previous[current] ?? null
  }

  return path
}

/**
 * Get color for traffic visualization
 */
export function getTrafficColor(utilization: number): string {
  if (utilization < 0.3) {
    return `rgba(0, 255, 0, ${0.3 + utilization * 0.7})` // Green for low traffic
  } else if (utilization < 0.7) {
    return `rgba(255, 255, 0, ${0.3 + utilization * 0.7})` // Yellow for medium traffic
  } else {
    return `rgba(255, 0, 0, ${0.3 + utilization * 0.7})` // Red for high traffic
  }
}

/**
 * Get color for node congestion
 */
export function getCongestionColor(congestion: number): string {
  if (congestion < 0.3) {
    return "rgba(0, 255, 0, 0.7)" // Green for low congestion
  } else if (congestion < 0.7) {
    return "rgba(255, 255, 0, 0.7)" // Yellow for medium congestion
  } else {
    return "rgba(255, 0, 0, 0.7)" // Red for high congestion
  }
}
