"use client"

import type React from "react"
import { useState } from "react"
import { useNetworkStore } from "../store/networkStore"
import { Activity, Plus, Route, Trash2, Volume, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const TrafficPanel: React.FC = () => {
  const { 
    edges,
    nodes, 
    trafficPatterns, 
    addTrafficPattern, 
    updateTrafficPattern, 
    removeTrafficPattern, 
    simulationRunning,
    adjacencyList
  } = useNetworkStore()

  const [newSource, setNewSource] = useState<number | "">("")
  const [newTarget, setNewTarget] = useState<number | "">("")
  const [newVolume, setNewVolume] = useState<number>(5)
  const [newPriority, setNewPriority] = useState<number>(5)

  const handleAddPattern = () => {
    if (newSource === "" || newTarget === "" || newSource === newTarget) return

    addTrafficPattern({
      id: Date.now(),
      source: Number(newSource),
      target: Number(newTarget),
      volume: newVolume / 10,
      priority: newPriority,
      active: true,
      routersInPath: {}
    })
    
    const getShortestPathRouters = (sourceId: number, targetId: number) => {
      const adjacency: Record<number, { id: number; weight: number }[]> = {};
      Object.keys(adjacencyList).forEach((nodeId) => {
        adjacency[Number(nodeId)] = adjacencyList[Number(nodeId)].map((neighborId: number) => ({
          id: neighborId,
          weight: 1,
        }));
      });
      
      const distances: Record<number, number> = {};
      const prev: Record<number, number | null> = {};
      const visited: Set<number> = new Set();
      nodes.forEach((node) => {
        distances[node.id] = Infinity;
        prev[node.id] = null;
      });
      distances[sourceId] = 0;

      while (visited.size < nodes.length) {
        let u: number | null = null;
        let minDist = Infinity;
        for (const nodeId in distances) {
          if (!visited.has(Number(nodeId)) && distances[nodeId] < minDist) {
            minDist = distances[nodeId];
            u = Number(nodeId);
          }
        }
        if (u === null || distances[u] === Infinity) break;
        visited.add(u);

        adjacency[u]?.forEach(({ id: v, weight }) => {
          if (!visited.has(v)) {
            const alt = distances[u] + weight;
            if (alt < distances[v]) {
              distances[v] = alt;
              prev[v] = u;
            }
          }
        });
      }

      const path: number[] = [];
      let curr: number | null = targetId;
      while (curr !== null) {
        path.unshift(curr);
        curr = prev[curr];
      }
      if (path[0] !== sourceId) return [];
      return path.slice(1, -1).map((id) => nodes.find((n) => n.id === id));
    };

    const routersInPath = getShortestPathRouters(Number(newSource), Number(newTarget));
    updateTrafficPattern(Date.now(), { routersInPath: routersInPath });

    if (Array.isArray(routersInPath) && routersInPath.length > 0) {
      const routerIds = routersInPath.map(r => r?.id).filter(Boolean);
      edges.forEach(edge => {
        if (routerIds.includes(edge.source)) {
          edge.weight = (edge.weight || 0) + newVolume * 50;
        }
        if (routerIds.includes(edge.target)) {
          edge.weight = (edge.weight || 0) + newVolume * 50;
        }
      });
    }

    setNewSource("")
    setNewTarget("")
    setNewVolume(5)
    setNewPriority(5)
  }

  const handleTogglePattern = (id: number, active: boolean) => {
    updateTrafficPattern(id, { active })
  }

  const handleRemovePattern = (id: number) => {
    const pattern = trafficPatterns.find(tp => tp.id === id);
    if (!pattern) {
      removeTrafficPattern(id)
      return
    }
    const routersInPath = pattern.routersInPath
    if (Array.isArray(routersInPath) && routersInPath.length > 0) {
      const routerIds = routersInPath.map(r => r?.id).filter(Boolean);
      edges.forEach(edge => {
        if (routerIds.includes(edge.source)) {
          edge.weight = (edge.weight || 0) - pattern.volume * 500;
        }
        if (routerIds.includes(edge.target)) {
          edge.weight = (edge.weight || 0) - pattern.volume * 500;
        }
      });
    }
    removeTrafficPattern(id)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="card p-4"
    >
      <motion.div 
        variants={itemVariants}
        className="flex items-center mb-4"
      >
        <Activity className="w-5 h-5 text-primary-400 mr-2" />
        <h2 className="text-2xl font-semibold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight font-sans">
          Traffic Patterns
        </h2>
      </motion.div>

      <div className="space-y-4">
        <motion.div variants={itemVariants} className="card p-4">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Add New Traffic Pattern</h3>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Source</label>
              <select
                value={newSource}
                onChange={(e) => setNewSource(e.target.value ? Number(e.target.value) : "")}
                className="input w-full text-sm"
                disabled={simulationRunning}
              >
                <option value="">Select source</option>
                {nodes.map((node) => (
                  <option key={`source-${node.id}`} value={node.id}>
                    {node.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Target</label>
              <select
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value ? Number(e.target.value) : "")}
                className="input w-full text-sm"
                disabled={simulationRunning}
              >
                <option value="">Select target</option>
                {nodes.map((node) => (
                  <option key={`target-${node.id}`} value={node.id}>
                    {node.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Volume: {newVolume}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={newVolume}
                onChange={(e) => setNewVolume(Number(e.target.value))}
                className="w-full accent-primary-500"
                disabled={simulationRunning}
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">Priority: {newPriority}</label>
              <input
                type="range"
                min="1"
                max="10"
                value={newPriority}
                onChange={(e) => setNewPriority(Number(e.target.value))}
                className="w-full accent-primary-500"
                disabled={simulationRunning}
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAddPattern}
            disabled={simulationRunning}
            className="btn-primary w-full flex items-center justify-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Pattern
          </motion.button>
        </motion.div>

        <AnimatePresence>
          {trafficPatterns.map((pattern) => (
            <motion.div
              key={pattern.id}
              variants={itemVariants}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="card p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Route className="w-4 h-4 text-primary-400" />
                  <span className="text-sm font-medium">
                    {nodes.find(n => n.id === pattern.source)?.label} 
                    <ArrowRight className="w-3 h-3 mx-1 inline text-primary-400" />
                    {nodes.find(n => n.id === pattern.target)?.label}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleTogglePattern(pattern.id, !pattern.active)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      pattern.active ? "bg-green-500" : "bg-gray-600"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full bg-white ${pattern.active ? "opacity-100" : "opacity-50"}`} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleRemovePattern(pattern.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-xs text-gray-400">
                <div className="flex items-center">
                  <Volume className="w-3 h-3 mr-1" />
                  {pattern.volume * 10}
                </div>
                <div className="flex items-center">
                  <Activity className="w-3 h-3 mr-1" />
                  {pattern.priority}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default TrafficPanel
