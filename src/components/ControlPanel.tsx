"use client"

import React from "react"
import { useNetworkStore } from "../store/networkStore"
import { Play, Pause, RefreshCw, Trash2, Settings, Router, Laptop, BarChart } from "lucide-react"
import SettingsDialog from "./SettingsDialog"
import { NodeType, type Node } from "../types/networkTypes"

const ControlPanel: React.FC = () => {
  const {
    simulationRunning,
    startSimulation,
    stopSimulation,
    resetSimulation,
    clearNetwork,
    addNode,
    addEdge,
    selectedSourceNode,
    selectedTargetNode,
    nodes,
    simulationMode,
    showTraffic,
    setShowTraffic,
    showCongestion,
    setShowCongestion,
  } = useNetworkStore()

  const [showSettings, setShowSettings] = React.useState(false)

  const handleAddDevice = () => {
    const canvas = document.querySelector("canvas")
    if (!canvas) return
    const x_n = Math.random() * (canvas.width - 100) + 50
    const y_n = Math.random() * (canvas.height - 100) + 50
    const newId = Date.now()
    const type = NodeType.DEVICE
    addNode({
      id: Date.now(),
      x: x_n,
      y: y_n,
      label: `D${nodes.filter((n) => n.type === NodeType.DEVICE).length + 1}`,
      type: type,
      congestion: 0,
    })

    nodes.forEach((otherNode) => {
      const dist = Math.hypot(otherNode.x - x_n, otherNode.y - y_n)
      if (dist < 200) {
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

  const handleAddRouter = () => {
    const canvas = document.querySelector("canvas")
    if (!canvas) return

    // Add the new router node
    const newRouterId = Date.now()
    const newRouter: Node = {
      id: newRouterId,
      x: Math.random() * (canvas.width - 100) + 50,
      y: Math.random() * (canvas.height - 100) + 50,
      label: `R${nodes.filter((n) => n.type === NodeType.ROUTER).length + 1}`,
      type: NodeType.ROUTER,
      congestion: 0,
    }
    addNode(newRouter)

    // Add edges from the new router to all existing routers and devices
    nodes.forEach((node) => {
      const dist = Math.hypot(node.x - newRouter.x, node.y - newRouter.y)
      if (dist <= 500) {
        if (node.type === "router" || node.type === "device") {
          addEdge({
            source: newRouterId,
            target: node.id,
            weight: Math.floor(dist),
            sourcetype: newRouter.type,
            targettype: node.type,
            traffic: 0,
            bandwidth: 100,
            utilization: 0,
          })
        }
      }
    })
  }

  return (
    <div className="p-4 border-b border-gray-700">
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={simulationRunning ? stopSimulation : startSimulation}
          disabled={selectedSourceNode === null || selectedTargetNode === null}
          className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            selectedSourceNode === null || selectedTargetNode === null
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : simulationRunning
                ? "bg-red-500 hover:bg-red-600 text-white"
                : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          {simulationRunning ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start
            </>
          )}
        </button>

        <button
          onClick={resetSimulation}
          className="flex items-center px-4 py-2 rounded-lg font-medium text-sm bg-yellow-500 hover:bg-yellow-600 text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </button>

        <button
          onClick={clearNetwork}
          className="flex items-center px-4 py-2 rounded-lg font-medium text-sm bg-gray-600 hover:bg-gray-700 text-white transition-colors"
          disabled={simulationRunning}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear
        </button>

        <div className="flex items-center ml-auto">
          <button
            onClick={() => setShowTraffic(!showTraffic)}
            className={`flex items-center px-3 py-2 rounded-lg font-medium text-sm mr-2 transition-colors ${
              showTraffic ? "bg-yellow-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <BarChart className="w-4 h-4 mr-1" />
            Traffic
          </button>

          <button
            onClick={() => setShowCongestion(!showCongestion)}
            className={`flex items-center px-3 py-2 rounded-lg font-medium text-sm mr-2 transition-colors ${
              showCongestion ? "bg-purple-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
          >
            <BarChart className="w-4 h-4 mr-1" />
            Congestion
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={handleAddDevice}
          className="flex items-center px-4 py-2 rounded-lg font-medium text-sm bg-purple-500 hover:bg-purple-600 text-white transition-colors"
          disabled={simulationRunning}
        >
          <Laptop className="w-4 h-4 mr-2" />
          Add Device
        </button>

        <button
          onClick={handleAddRouter}
          className="flex items-center px-4 py-2 rounded-lg font-medium text-sm bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          disabled={simulationRunning}
        >
          <Router className="w-4 h-4 mr-2" />
          Add Router
        </button>

        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center px-4 py-2 rounded-lg font-medium text-sm bg-gray-600 hover:bg-gray-700 text-white transition-colors ml-auto"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </button>
      </div>

      <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded">
        <span className="font-medium">Mode:</span>{" "}
        {simulationMode === "standard" ? "Standard (Shortest Path)" : "Congestion Aware"}
      </div>

      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </div>
  )
}

export default ControlPanel
