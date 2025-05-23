// networkStore.ts
import { create } from "zustand"
import {
  type AntPosition,
  type Edge,
  type Node,
  NodeType,
  SimulationMode,
  type TrafficPattern,
} from "../types/networkTypes"
import { updateAntPositions as updateAntPositionsUtil } from "../utils/animationUtils"
import { findShortestPath } from "../utils/antColonyAlgorithm"
import { calculateEdgeTraffic } from "../utils/trafficUtils"

interface NetworkState {
  nodes: Node[]
  edges: Edge[]
  selectedSourceNode: number | null
  selectedTargetNode: number | null
  simulationRunning: boolean
  simulationInterval: number | null
  pheromones: Record<string, number>
  bestPath: string[]
  bestPathDistance: number
  bestPathNodes: number[]
  antPositions: AntPosition[]
  iterations: number
  evaporationRate: number
  pheromoneDeposit: number
  numAnts: number
  antSpeed: number
  simulationPhase: "exploration" | "convergence" | "complete" | "idle"
  activeEdges: Set<string>
  trafficPatterns: TrafficPattern[]
  simulationMode: SimulationMode
  showTraffic: boolean
  showCongestion: boolean
  trafficWeight: number

  addEdge: (edge: Edge) => void
  addNode: (node: Node) => void
  updateNodePosition: (index: number, x: number, y: number) => void
  setSelectedSourceNode: (nodeId: number | null) => void
  setSelectedTargetNode: (nodeId: number | null) => void
  startSimulation: () => void
  stopSimulation: () => void
  setEvaporationRate: (rate: number) => void
  setPheromoneDeposit: (amount: number) => void
  setNumAnts: (num: number) => void
  setAntSpeed: (speed: number) => void
  resetSimulation: () => void
  getAdjacencyListWithType:()=>{}
  updateAntPositions: (positions: AntPosition[]) => void
  clearNetwork: () => void
  addTrafficPattern: (pattern: TrafficPattern) => void
  updateTrafficPattern: (id: number, updates: Partial<TrafficPattern>) => void
  removeTrafficPattern: (id: number) => void
  setSimulationMode: (mode: SimulationMode) => void
  setShowTraffic: (show: boolean) => void
  setShowCongestion: (show: boolean) => void
  setTrafficWeight: (weight: number) => void
}

export const useNetworkStore = create<NetworkState & { adjacencyList: Record<number, number[]> }>((set, get) => ({
  nodes: [],
  edges: [],
  selectedSourceNode: null,
  selectedTargetNode: null,
  simulationRunning: false,
  simulationInterval: null,
  pheromones: {},
  bestPath: [],
  bestPathDistance: Number.POSITIVE_INFINITY,
  bestPathNodes: [],
  antPositions: [],
  iterations: 0,
  evaporationRate: 0.1,
  pheromoneDeposit: 1.0,
  numAnts: 10,
  antSpeed: 5,
  simulationPhase: "idle",
  activeEdges: new Set<string>(),
  trafficPatterns: [],
  simulationMode: SimulationMode.STANDARD,
  showTraffic: false,
  showCongestion: false,
  trafficWeight: 2.0,
  adjacencyList: {},

  // Build adjacency list with node type info (router/device) and edge weights
  getAdjacencyListWithType: () => {
    const { adjacencyList, nodes, edges } = get()
    const nodeTypeMap = Object.fromEntries(nodes.map((n) => [n.id, n.type]))
    // Build a map for quick edge weight lookup
    const edgeWeightMap: Record<string, number> = {}
    edges.forEach((edge) => {
      edgeWeightMap[`${edge.source}-${edge.target}`] = edge.weight
      edgeWeightMap[`${edge.target}-${edge.source}`] = edge.weight // undirected
    })
    const result: Record<number, { neighbors: { id: number; weight: number }[]; type: NodeType }> = {}
    Object.entries(adjacencyList).forEach(([id, neighbors]) => {
      result[Number(id)] = {
        neighbors: (neighbors as number[]).map((neighborId) => ({
          id: neighborId,
          weight: edgeWeightMap[`${id}-${neighborId}`] ?? 1,
        })),
        type: nodeTypeMap[Number(id)],
      }
    })
    return result
  },

  addNode: (node: Node) => {
    
    // Call getAdjacencyListWithType and print the result
    const adjWithType = get().getAdjacencyListWithType();
    
    set((state) => {
      const newAdjacencyList = { ...state.adjacencyList, [node.id]: [] }
      return {
        nodes: [...state.nodes, node],
        adjacencyList: newAdjacencyList,
      }
    })

    // Print adjacency list with type after adding the new node
    setTimeout(() => {
      const adjWithTypeAfter = get().getAdjacencyListWithType();
      console.log("Adjacency List With Type (after addNode):", JSON.stringify(adjWithTypeAfter, null, 2));
      // Print all routers in the path (type === NodeType.ROUTER)
      Object.entries(adjWithTypeAfter).forEach(([id, info]) => {
        
          console.log(`Router Node: ${id}`, info);
        
      });

    }, 0);

  },

  addEdge: (edge: Edge) => {
    set((state) => {
      // Update adjacency list for both source and target
      const adj = { ...state.adjacencyList }
      if (!adj[edge.source]) adj[edge.source] = []
      if (!adj[edge.target]) adj[edge.target] = []
      if (!adj[edge.source].includes(edge.target)) adj[edge.source].push(edge.target)
      if (!adj[edge.target].includes(edge.source)) adj[edge.target].push(edge.source)
      return {
        edges: [...state.edges, edge],
        adjacencyList: adj,
      }
    })
  },

  updateNodePosition: (index: number, x: number, y: number) => {
    set((state) => ({
      nodes: state.nodes.map((node, i) => (i === index ? { ...node, x, y } : node)),
    }))
  },

  setSelectedSourceNode: (nodeId: number | null) => {
    set({ selectedSourceNode: nodeId })
  },

  setSelectedTargetNode: (nodeId: number | null) => {
    set({ selectedTargetNode: nodeId })
  },

  startSimulation: () => {
    const { selectedSourceNode, selectedTargetNode, edges, antSpeed, trafficPatterns, simulationMode, trafficWeight } =
      get()

    if (selectedSourceNode === null || selectedTargetNode === null || selectedSourceNode === selectedTargetNode) {
      return
    }

    // Process traffic patterns and update edge traffic
    let updatedEdges = [...edges]
    if (trafficPatterns.length > 0) {
      updatedEdges = calculateEdgeTraffic(edges, get().nodes, trafficPatterns)

      // Update node congestion based on connected edge traffic
      const nodeCongestion: Record<number, number> = {}

      updatedEdges.forEach((edge) => {
        // Add traffic to source node congestion
        nodeCongestion[edge.source] = (nodeCongestion[edge.source] || 0) + edge.utilization

        // Add traffic to target node congestion
        nodeCongestion[edge.target] = (nodeCongestion[edge.target] || 0) + edge.utilization
      })

      // Normalize congestion values
      const updatedNodes = get().nodes.map((node) => {
        const connectedEdgesCount = updatedEdges.filter((e) => e.source === node.id || e.target === node.id).length

        // Calculate average congestion for this node
        const rawCongestion = nodeCongestion[node.id] || 0
        const normalizedCongestion = connectedEdgesCount > 0 ? Math.min(1, rawCongestion / connectedEdgesCount) : 0

        return {
          ...node,
          congestion: normalizedCongestion,
        }
      })

      set({ nodes: updatedNodes, edges: updatedEdges })
    }

    const initialPheromones: Record<string, number> = {}
    updatedEdges.forEach((edge) => {
      if (edge.targettype === NodeType.ROUTER) {
        initialPheromones[`${edge.source}-${edge.target}`] = 0.1
        initialPheromones[`${edge.target}-${edge.source}`] = 0.1
      }
    })

    set({
      simulationRunning: true,
      pheromones: initialPheromones,
      bestPath: [],
      bestPathDistance: Number.POSITIVE_INFINITY,
      bestPathNodes: [],
      antPositions: [],
      iterations: 0,
      simulationPhase: "exploration",
      activeEdges: new Set<string>(),
    })

    if (get().simulationInterval) {
      clearInterval(get().simulationInterval!)
    }

    const exploreInterval = setInterval(() => {
      const state = get()
      if (state.iterations >= 20) {
        clearInterval(exploreInterval)
        set({ simulationPhase: "convergence" })
        startConvergencePhase()
        return
      }
      runAntIteration(0.5, 2)
      set((s) => ({ iterations: s.iterations + 1 }))
    }, 1000 / antSpeed)

    set({ simulationInterval: exploreInterval as unknown as number })

    function startConvergencePhase() {
      const convergeInterval = setInterval(() => {
        const state = get()
        if (state.iterations >= 100) {
          clearInterval(convergeInterval)
          set({
            simulationRunning: false,
            simulationInterval: null,
            simulationPhase: "complete",
          })
          return
        }
        runAntIteration(1.5, 1)
        set((s) => ({ iterations: s.iterations + 1 }))
      }, 1000 / antSpeed)

      set({ simulationInterval: convergeInterval as unknown as number })
    }

    function runAntIteration(alpha: number, beta: number) {
      const {
        selectedSourceNode,
        selectedTargetNode,
        nodes,
        edges,
        evaporationRate,
        pheromoneDeposit,
        numAnts,
        pheromones,
        bestPathDistance,
        simulationMode,
        trafficWeight,
      } = get()

      const updatedPheromones = { ...pheromones }
      const antPaths: { path: number[]; distance: number }[] = []
      const newAntPositions: AntPosition[] = []
      const activeEdges = new Set<string>()

      Object.keys(updatedPheromones).forEach((key) => {
        updatedPheromones[key] *= 1 - evaporationRate
      })

      // Use the ant colony algorithm to find paths
      const result = findShortestPath(
        nodes,
        edges,
        selectedSourceNode!,
        selectedTargetNode!,
        1, // Just one iteration
        numAnts,
        evaporationRate,
        0.1, // Initial pheromone
        alpha,
        beta,
        simulationMode,
        trafficWeight,
      )

      if (result.path.length > 0 && result.distance < bestPathDistance) {
        const pathEdges = result.path.slice(0, -1).map((id, i) => `${id}-${result.path[i + 1]}`)
        set({
          bestPath: pathEdges,
          bestPathDistance: result.distance,
          bestPathNodes: result.path,
        })
      }

      // Create ant positions for visualization
      if (result.path.length > 1) {
        for (let i = 0; i < Math.min(numAnts, 5); i++) {
          // Limit visual ants
          const randomStartIndex = Math.floor(Math.random() * (result.path.length - 1))
          const fromNode = nodes.find((n) => n.id === result.path[randomStartIndex])
          const toNode = nodes.find((n) => n.id === result.path[randomStartIndex + 1])

          if (fromNode && toNode) {
            newAntPositions.push({
              from: result.path[randomStartIndex],
              to: result.path[randomStartIndex + 1],
              progress: 0,
              x: fromNode.x,
              y: fromNode.y,
            })

            // Mark edge as active
            activeEdges.add(`${result.path[randomStartIndex]}-${result.path[randomStartIndex + 1]}`)
            activeEdges.add(`${result.path[randomStartIndex + 1]}-${result.path[randomStartIndex]}`)
          }
        }
      }

      set({
        pheromones: updatedPheromones,
        antPositions: newAntPositions,
        activeEdges,
      })
    }
  },

  stopSimulation: () => {
    const { simulationInterval } = get()
    if (simulationInterval) {
      clearInterval(simulationInterval)
    }
    set({
      simulationRunning: false,
      simulationInterval: null,
      antPositions: [],
      simulationPhase: "idle",
      activeEdges: new Set<string>(),
    })
  },

  setEvaporationRate: (rate: number) => {
    set({ evaporationRate: rate })
  },

  setPheromoneDeposit: (amount: number) => {
    set({ pheromoneDeposit: amount })
  },

  setNumAnts: (num: number) => {
    set({ numAnts: num })
  },

  setAntSpeed: (speed: number) => {
    set({ antSpeed: speed })
  },

  updateAntPositions: (positions: AntPosition[]) => {
    const { nodes, edges, antSpeed } = get()
    const updatedPositions = updateAntPositionsUtil(positions, nodes, edges, antSpeed)

    const allFinished = updatedPositions.every((ant) => ant.progress >= 1)

    if (allFinished) {
      set({ antPositions: [] })
    } else {
      set({ antPositions: updatedPositions })
    }
  },

  resetSimulation: () => {
    set({
      pheromones: {},
      bestPath: [],
      bestPathDistance: Number.POSITIVE_INFINITY,
      bestPathNodes: [],
      antPositions: [],
      iterations: 0,
      simulationRunning: false,
      simulationPhase: "idle",
      activeEdges: new Set<string>(),
    })
  },

  clearNetwork: () => {
    set({
      nodes: [],
      edges: [],
      selectedSourceNode: null,
      selectedTargetNode: null,
      simulationRunning: false,
      simulationInterval: null,
      pheromones: {},
      bestPath: [],
      bestPathDistance: Number.POSITIVE_INFINITY,
      bestPathNodes: [],
      antPositions: [],
      iterations: 0,
      simulationPhase: "idle",
      activeEdges: new Set<string>(),
      trafficPatterns: [],
      adjacencyList: {},
    })
  },

  addTrafficPattern: (pattern: TrafficPattern) => {
    set((state) => ({
      trafficPatterns: [...state.trafficPatterns, pattern],
    }))
  },

  updateTrafficPattern: (id: number, updates: Partial<TrafficPattern>) => {
    set((state) => ({
      trafficPatterns: state.trafficPatterns.map((pattern) =>
        pattern.id === id ? { ...pattern, ...updates } : pattern,
      ),
    }))
  },

  removeTrafficPattern: (id: number) => {
    set((state) => ({
      trafficPatterns: state.trafficPatterns.filter((pattern) => pattern.id !== id),
    }))
  },

  setSimulationMode: (mode: SimulationMode) => {
    set({ simulationMode: mode })
  },

  setShowTraffic: (show: boolean) => {
    set({ showTraffic: show })
  },

  setShowCongestion: (show: boolean) => {
    set({ showCongestion: show })
  },

  setTrafficWeight: (weight: number) => {
    set({ trafficWeight: weight })
  },
}))
function getAdjacencyListWithType(): any {
  throw new Error("Function not implemented.")
}

