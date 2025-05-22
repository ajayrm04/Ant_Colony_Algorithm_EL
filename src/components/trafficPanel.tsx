"use client"

import type React from "react"
import { useState } from "react"
import { useNetworkStore } from "../store/networkStore"
import { Activity, Plus, Route, Trash2, Volume } from "lucide-react"

const TrafficPanel: React.FC = () => {
  const { 
    edges,nodes, trafficPatterns, addTrafficPattern, updateTrafficPattern, removeTrafficPattern, simulationRunning,adjacencyList
 } =
    useNetworkStore()

  const [newSource, setNewSource] = useState<number | "">("")
  const [newTarget, setNewTarget] = useState<number | "">("")
  const [newVolume, setNewVolume] = useState<number>(5)
  const [newPriority, setNewPriority] = useState<number>(5)

  const handleAddPattern = () => {
    // console.log("yes")
    if (newSource === "" || newTarget === "" || newSource === newTarget) return

    addTrafficPattern({
      id: Date.now(),
      source: Number(newSource),
      target: Number(newTarget),
      volume: newVolume / 10, // Scale to 0-1
      priority: newPriority,
      active: true,
      routersInPath:{}
    })
    
    const getShortestPathRouters = (sourceId: number, targetId: number) => {
        // Build adjacency list from nodes
        const adjacency: Record<number, { id: number; weight: number }[]> = {};
        // Use adjacencyList from the store
        Object.keys(adjacencyList).forEach((nodeId) => {
            adjacency[Number(nodeId)] = adjacencyList[Number(nodeId)].map((neighborId: number) => ({
                id: neighborId,
                weight: 1,
            }));
        });
        
        console.log("hello\n")
        console.log(adjacency)
        // Dijkstra's algorithm
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

        // Reconstruct path
        const path: number[] = [];
        let curr: number | null = targetId;
        while (curr !== null) {
            path.unshift(curr);
            curr = prev[curr];
        }
        if (path[0] !== sourceId) return []; // No path found
        // Exclude source and target, return routers in between
        return path.slice(1, -1).map((id) => nodes.find((n) => n.id === id));
    };

    const routersInPath = getShortestPathRouters(Number(newSource), Number(newTarget));
    updateTrafficPattern(Date.now(), { routersInPath: routersInPath });
    console.log("Routers in shortest path:", routersInPath);
    if (Array.isArray(routersInPath) && routersInPath.length > 0) {
        // Assuming you have access to `edges` from the store or props
        // If not, you may need to import/use it accordingly
        if(!routersInPath[0]) console.log(routersInPath[0])
        console.log(edges)
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

    console.log(newVolume)
    // Reset form
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
    console.log(pattern?.volume)
  if (!pattern) {
    removeTrafficPattern(id)
    return
  }
  const routersInPath = pattern.routersInPath
  if (Array.isArray(routersInPath) && routersInPath.length > 0) {
        // Assuming you have access to `edges` from the store or props
        // If not, you may need to import/use it accordingly
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

  return (
    <div className="p-4 border-t border-gray-700">
      <div className="flex items-center mb-4">
        <Activity className="w-5 h-5 text-yellow-400 mr-2" />
        <h2 className="text-lg font-semibold">Traffic Patterns</h2>
      </div>

      <div className="space-y-4">
        {/* Add new traffic pattern */}
        <div className="bg-gray-800 p-3 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-3">Add New Traffic Pattern</h3>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Source</label>
              <select
                value={newSource}
                onChange={(e) => setNewSource(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-gray-700 text-white rounded p-1 text-sm"
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
                className="w-full bg-gray-700 text-white rounded p-1 text-sm"
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
                onChange={(e) => setNewVolume(Number.parseInt(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
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
                onChange={(e) => setNewPriority(Number.parseInt(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                disabled={simulationRunning}
              />
            </div>
          </div>

          <button
            onClick={handleAddPattern}
            disabled={newSource === "" || newTarget === "" || newSource === newTarget || simulationRunning}
            className={`flex items-center px-3 py-1 rounded text-sm ${
              newSource === "" || newTarget === "" || newSource === newTarget || simulationRunning
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-yellow-600 hover:bg-yellow-700 text-white"
            }`}
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Traffic
          </button>
        </div>

        {/* Traffic patterns list */}
        {trafficPatterns.length > 0 ? (
          <div className="bg-gray-800 p-3 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Active Patterns</h3>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {trafficPatterns.map((pattern) => {
                const sourceNode = nodes.find((n) => n.id === pattern.source)
                const targetNode = nodes.find((n) => n.id === pattern.target)

                return (
                  <div key={pattern.id} className="flex items-center justify-between bg-gray-700 p-2 rounded text-sm">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={pattern.active}
                        onChange={(e) => handleTogglePattern(pattern.id, e.target.checked)}
                        className="mr-2"
                        disabled={simulationRunning}
                      />
                      <span>
                        {sourceNode?.label || "Unknown"} → {targetNode?.label || "Unknown"}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-xs px-2 py-0.5 bg-yellow-900 rounded text-yellow-300">
                        Vol: {Math.round(pattern.volume * 10)}
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-purple-900 rounded text-purple-300">
                        Pri: {pattern.priority}
                      </span>
                      <button
                        onClick={() => handleRemovePattern(pattern.id)}
                        disabled={simulationRunning}
                        className="text-gray-400 hover:text-red-400 disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-400 text-center py-2">No traffic patterns defined</div>
        )}
      </div>
    </div>
  )
}

export default TrafficPanel
