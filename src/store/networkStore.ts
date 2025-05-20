// networkStore.ts
import { create } from 'zustand';
import { AntPosition, Edge, Node } from '../types/networkTypes';

interface NetworkState {
  nodes: Node[];
  edges: Edge[];
  selectedSourceNode: number | null;
  selectedTargetNode: number | null;
  simulationRunning: boolean;
  simulationInterval: number | null;
  pheromones: Record<string, number>;
  bestPath: string[];
  bestPathDistance: number;
  bestPathNodes: number[];
  antPositions: AntPosition[];
  iterations: number;
  evaporationRate: number;
  pheromoneDeposit: number;
  numAnts: number;
  antSpeed: number;

  addEdge: (edge: Edge) => void;
  addNode: (node: Node) => void;
  updateNodePosition: (index: number, x: number, y: number) => void;
  setSelectedSourceNode: (nodeId: number | null) => void;
  setSelectedTargetNode: (nodeId: number | null) => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  setEvaporationRate: (rate: number) => void;
  setPheromoneDeposit: (amount: number) => void;
  setNumAnts: (num: number) => void;
  setAntSpeed: (speed: number) => void;
  resetSimulation: () => void;
  updateAntPositions: (positions: AntPosition[]) => void;
  clearNetwork: () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedSourceNode: null,
  selectedTargetNode: null,
  simulationRunning: false,
  simulationInterval: null,
  pheromones: {},
  bestPath: [],
  bestPathDistance: Infinity,
  bestPathNodes: [],
  antPositions: [],
  iterations: 0,
  evaporationRate: 0.1,
  pheromoneDeposit: 1.0,
  numAnts: 10,
  antSpeed: 5,

  addNode: (node: Node) => {
    set(state => ({
      nodes: [...state.nodes, node]
    }));
  },

  addEdge: (edge: Edge) => {
    console.log('edge added')
    set(state => ({
      edges: [...state.edges, edge]
    }));
  },

  updateNodePosition: (index: number, x: number, y: number) => {
    set(state => ({
      nodes: state.nodes.map((node, i) =>
        i === index ? { ...node, x, y } : node
      )
    }));
  },

  setSelectedSourceNode: (nodeId: number | null) => {
    set({ selectedSourceNode: nodeId });
  },

  setSelectedTargetNode: (nodeId: number | null) => {
    set({ selectedTargetNode: nodeId });
  },

  startSimulation: () => {
    const { selectedSourceNode, selectedTargetNode, edges, antSpeed } = get();

    if (selectedSourceNode === null || selectedTargetNode === null || selectedSourceNode === selectedTargetNode) {
      return;
    }

    const initialPheromones: Record<string, number> = {};
    edges.forEach(edge => {
      initialPheromones[`${edge.source}-${edge.target}`] = 0.1;
      initialPheromones[`${edge.target}-${edge.source}`] = 0.1;
    });

    set({
      simulationRunning: true,
      pheromones: initialPheromones,
      bestPath: [],
      bestPathDistance: Infinity,
      bestPathNodes: [],
      antPositions: [],
      iterations: 0
    });

    // Clear any existing interval first
    if (get().simulationInterval) {
      clearInterval(get().simulationInterval!);
    }

    // Exploration phase
    const exploreInterval = setInterval(() => {
      const state = get();
      if (state.iterations >= 20) {
        clearInterval(exploreInterval);
        startConvergencePhase();
        return;
      }
      runAntIteration(0.5, 2);
      set(s => ({ iterations: s.iterations + 1 }));
    }, 1000 / antSpeed);

    // Store interval ID
    set({ simulationInterval: exploreInterval as unknown as number });

    function startConvergencePhase() {
      const convergeInterval = setInterval(() => {
        const state = get();
        if (state.iterations >= 100) {
          clearInterval(convergeInterval);
          set({ simulationRunning: false, simulationInterval: null });
          return;
        }
        runAntIteration(1.5, 1);
        set(s => ({ iterations: s.iterations + 1 }));
      }, 1000 / antSpeed);

      set({ simulationInterval: convergeInterval as unknown as number });
    }

    function runAntIteration(alpha: number, beta: number) {
      const {
        selectedSourceNode,
        selectedTargetNode,
        edges,
        nodes,
        evaporationRate,
        pheromoneDeposit,
        numAnts,
        pheromones,
        bestPathDistance
      } = get();

      const updatedPheromones = { ...pheromones };
      const antPaths: { path: number[]; distance: number }[] = [];
      const newAntPositions: AntPosition[] = [];

      // Evaporate pheromones
      Object.keys(updatedPheromones).forEach(key => {
        updatedPheromones[key] *= (1 - evaporationRate);
      });

      for (let i = 0; i < numAnts; i++) {
        const pathData = constructAntPath(
          selectedSourceNode!,
          selectedTargetNode!,
          alpha,
          beta,
          updatedPheromones
        );

        if (pathData) {
          antPaths.push(pathData);
          // Place ant at start of path with progress 0 (start moving)
          if (pathData.path.length > 1) {
            newAntPositions.push({
              from: pathData.path[0],
              to: pathData.path[1],
              progress: 0,
              x: nodes.find(n => n.id === pathData.path[0])?.x || 0,
              y: nodes.find(n => n.id === pathData.path[0])?.y || 0,
            });
          }
        }
      }

      antPaths.forEach(({ path, distance }) => {
        const depositAmount = pheromoneDeposit / distance;
        for (let i = 0; i < path.length - 1; i++) {
          const edgeKey = `${path[i]}-${path[i + 1]}`;
          const reverseEdgeKey = `${path[i + 1]}-${path[i]}`;
          updatedPheromones[edgeKey] = (updatedPheromones[edgeKey] || 0) + depositAmount;
          updatedPheromones[reverseEdgeKey] = (updatedPheromones[reverseEdgeKey] || 0) + depositAmount;
        }

        if (distance < bestPathDistance) {
          const pathEdges = path.slice(0, -1).map((id, i) => `${id}-${path[i + 1]}`);
          set({
            bestPath: pathEdges,
            bestPathDistance: distance,
            bestPathNodes: path
          });
        }
      });

      set({
        pheromones: updatedPheromones,
        antPositions: newAntPositions
      });
    }

    function constructAntPath(
      start: number,
      end: number,
      alpha: number,
      beta: number,
      pheromones: Record<string, number>
    ): { path: number[]; distance: number } | null {
      const { edges } = get();
      let currentNode = start;
      const visited = new Set<number>([currentNode]);
      const path = [currentNode];
      let totalDistance = 0;

      while (currentNode !== end) {
        const neighbors = edges
          .filter(edge => (edge.source === currentNode || edge.target === currentNode) &&
            !visited.has(edge.source === currentNode ? edge.target : edge.source))
          .map(edge => {
            const neighbor = edge.source === currentNode ? edge.target : edge.source;
            const pheromone = pheromones[`${currentNode}-${neighbor}`] || 0.1;
            return { nodeId: neighbor, weight: edge.weight, pheromone };
          });

        if (neighbors.length === 0) return null;

        const total = neighbors.reduce(
          (sum, n) => sum + Math.pow(n.pheromone, alpha) * Math.pow(1 / n.weight, beta),
          0
        );

        const probabilities = neighbors.map(n => ({
          nodeId: n.nodeId,
          weight: n.weight,
          probability: Math.pow(n.pheromone, alpha) * Math.pow(1 / n.weight, beta) / total
        }));

        const rand = Math.random();
        let sum = 0;
        let selected = probabilities[0];

        for (const n of probabilities) {
          sum += n.probability;
          if (rand <= sum) {
            selected = n;
            break;
          }
        }

        currentNode = selected.nodeId;
        visited.add(currentNode);
        path.push(currentNode);
        totalDistance += selected.weight;
      }

      return { path, distance: totalDistance };
    }
  },

  stopSimulation: () => {
    const { simulationInterval } = get();
    if (simulationInterval) {
      clearInterval(simulationInterval);
    }
    set({
      simulationRunning: false,
      simulationInterval: null,
      antPositions: []
    });
  },

  setEvaporationRate: (rate: number) => {
    set({ evaporationRate: rate });
  },

  setPheromoneDeposit: (amount: number) => {
    set({ pheromoneDeposit: amount });
  },

  setNumAnts: (num: number) => {
    set({ numAnts: num });
  },

  setAntSpeed: (speed: number) => {
    set({ antSpeed: speed });
  },

  updateAntPositions: (positions: AntPosition[]) => {
    set({ antPositions: positions });
  },

  resetSimulation: () => {
    set((state) => ({
      nodes: state.nodes.map((node) => ({
        ...node,
        // example logic: clear temporary highlights or reset state
        visited: false,
        path: [],
      })),
      simulationRunning: false
    }));
  },

  clearNetwork: () => {
    set({
      nodes: [],
      simulationRunning: false,
      // clear links, paths, etc.
    });
  },
}));
