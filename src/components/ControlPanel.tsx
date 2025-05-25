"use client"

import React from "react"
import { useNetworkStore } from "../store/networkStore"
import { Play, Pause, RefreshCw, Trash2, Settings, Router, Laptop, BarChart } from "lucide-react"
import SettingsDialog from "./SettingsDialog"
import { NodeType, type Node } from "../types/networkTypes"
import TrafficPanel from "./trafficPanel"
import { motion } from "framer-motion"

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
      id: newId,
      x: x_n,
      y: y_n,
      label: `D${nodes.filter((n) => n.type === NodeType.DEVICE).length + 1}`,
      type: type,
      congestion: 0,
      name: `d${nodes.filter((n) => n.type === NodeType.DEVICE).length + 1}`,
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

    const newRouterId = Date.now()
    const newRouter: Node = {
      id: newRouterId,
      x: Math.random() * (canvas.width - 100) + 50,
      y: Math.random() * (canvas.height - 100) + 50,
      label: `R${nodes.filter((n) => n.type === NodeType.ROUTER).length + 1}`,
      type: NodeType.ROUTER,
      congestion: 0,
      name: `r${nodes.filter((n) => n.type === NodeType.ROUTER).length + 1}`,
    }
    addNode(newRouter)

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

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 },
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="card p-4"
    >
      <div className="flex flex-wrap gap-3 mb-4">
      <motion.button
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onClick={simulationRunning ? stopSimulation : startSimulation}
        disabled={selectedSourceNode === null || selectedTargetNode === null}
        className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
        selectedSourceNode === null || selectedTargetNode === null
          ? "bg-gray-700/50 text-gray-400 cursor-not-allowed"
          : simulationRunning
          ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
          : "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20"
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
      </motion.button>

      <motion.button
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onClick={resetSimulation}
        className="flex items-center px-4 py-2 rounded-lg font-medium text-sm bg-yellow-500 hover:bg-yellow-600 text-white transition-all duration-200 shadow-lg shadow-yellow-500/20"
      >
        <RefreshCw className="w-4 h-4 mr-2" />
        Reset
      </motion.button>

      <motion.button
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onClick={clearNetwork}
        className="flex items-center px-4 py-2 rounded-lg font-medium text-sm bg-gray-600 hover:bg-gray-700 text-white transition-all duration-200 shadow-lg shadow-gray-600/20"
        disabled={simulationRunning}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Clear
      </motion.button>

      <div className="flex items-center ml-auto space-x-2">
        <motion.button
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onClick={() => setShowTraffic(!showTraffic)}
        className={`flex items-center px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
          showTraffic 
          ? "bg-yellow-600 text-white shadow-lg shadow-yellow-600/20" 
          : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"
        }`}
        >
        <BarChart className="w-4 h-4 mr-1" />
        Traffic
        </motion.button>

        <motion.button
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onClick={() => setShowCongestion(!showCongestion)}
        className={`flex items-center px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
          showCongestion 
          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
          : "bg-gray-700/50 text-gray-300 hover:bg-gray-700"
        }`}
        >
        <BarChart className="w-4 h-4 mr-1" />
        Congestion
        </motion.button>
      </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
      <motion.button
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onClick={handleAddDevice}
        className="flex items-center px-4 py-2 rounded-lg font-medium text-sm bg-purple-500 hover:bg-purple-600 text-white transition-all duration-200 shadow-lg shadow-purple-500/20"
        disabled={simulationRunning}
      >
        <Laptop className="w-4 h-4 mr-2" />
        Add Device
      </motion.button>

      <motion.button
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onClick={handleAddRouter}
        className="flex items-center px-4 py-2 rounded-lg font-medium text-sm bg-blue-500 hover:bg-blue-600 text-white transition-all duration-200 shadow-lg shadow-blue-500/20"
        disabled={simulationRunning}
      >
        <Router className="w-4 h-4 mr-2" />
        Add Router
      </motion.button>

      <motion.button
        variants={buttonVariants}
        initial="initial"
        whileHover="hover"
        whileTap="tap"
        onClick={() => setShowSettings(true)}
        className="flex items-center px-4 py-2 rounded-lg font-medium text-sm bg-gray-600 hover:bg-gray-700 text-white transition-all duration-200 shadow-lg shadow-gray-600/20 ml-auto"
      >
        <Settings className="w-4 h-4 mr-2" />
        Settings
      </motion.button>
      </div>

      <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="text-xs text-gray-400 bg-gray-800/50 p-3 rounded-lg backdrop-blur-sm"
      >
      <span className="font-medium">Mode:</span>{" "}
      <span className="text-primary-400">{simulationMode}</span>
      </motion.div>

      {showSettings && (
      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        onClose={() => setShowSettings(false)}
      />
      )}
    </motion.div>
  )
}

export default ControlPanel
