"use client"

import { useState, useEffect } from "react"
import { useNetworkStore } from "../../src/store/networkStore"
import NetworkAnalysisCanvas from "../../src/components/NetworkAnalysisCanvas"
import RouteAnalysisTable from "../../src/components/RouteAnalysisTable"
import PerformanceMetricsCard from "../../src/components/PerformanceMetricsCard"
import {
  generateSampleHistoricalData,
  findOptimalRouterPlacement,
  calculatePerformanceMetrics,
} from "../../src/utils/analysisUtils"
import type { HistoricalRoute, RouterPlacementSuggestion, PerformanceMetrics } from "../../src/types/analysisTypes"
import { ArrowLeft, BarChart3, Router, Filter } from "lucide-react"
import Link from "next/link"
import { NodeType } from "../../src/types/networkTypes" // Import NodeType

export default function NetworkAnalysisPage() {
  const { nodes, edges } = useNetworkStore()

  const [historicalRoutes, setHistoricalRoutes] = useState<HistoricalRoute[]>([])
  const [filteredRoutes, setFilteredRoutes] = useState<HistoricalRoute[]>([])
  const [selectedRouteIds, setSelectedRouteIds] = useState<string[]>([])
  const [suggestedRouter, setSuggestedRouter] = useState<RouterPlacementSuggestion | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)

  // Visualization options
  const [showHotspots, setShowHotspots] = useState(true)
  const [showHistoricalRoutes, setShowHistoricalRoutes] = useState(true)

  // Filter options
  const [sourceFilter, setSourceFilter] = useState<number | null>(null)
  const [targetFilter, setTargetFilter] = useState<number | null>(null)

  // Generate sample data when component mounts
  useEffect(() => {
    if (nodes.length > 0 && edges.length > 0) {
      const sampleData = generateSampleHistoricalData(nodes, edges, 100)
      setHistoricalRoutes(sampleData)
      setFilteredRoutes(sampleData)
    }
  }, [nodes, edges])

  // Update router suggestion when filters change
  useEffect(() => {
    if (filteredRoutes.length > 0) {
      const suggestion = findOptimalRouterPlacement(filteredRoutes, nodes, edges, {
        sourceId: sourceFilter,
        targetId: targetFilter,
      })

      setSuggestedRouter(suggestion)

      const metrics = calculatePerformanceMetrics(filteredRoutes, suggestion)
      setPerformanceMetrics(metrics)
    }
  }, [filteredRoutes, nodes, edges, sourceFilter, targetFilter])

  // Apply filters
  const applyFilters = () => {
    let filtered = [...historicalRoutes]

    if (sourceFilter !== null) {
      filtered = filtered.filter((route) => route.sourceId === sourceFilter)
    }

    if (targetFilter !== null) {
      filtered = filtered.filter((route) => route.targetId === targetFilter)
    }

    setFilteredRoutes(filtered)
  }

  // Reset filters
  const resetFilters = () => {
    setSourceFilter(null)
    setTargetFilter(null)
    setFilteredRoutes(historicalRoutes)
  }

  // Handle route selection
  const handleSelectRoute = (routeId: string) => {
    setSelectedRouteIds((prev) => {
      if (prev.includes(routeId)) {
        return prev.filter((id) => id !== routeId)
      } else {
        return [...prev, routeId]
      }
    })
  }

  // Clear selected routes
  const clearSelectedRoutes = () => {
    setSelectedRouteIds([])
  }

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 text-white p-4 border-b border-gray-700 flex items-center">
        <Link href="/" className="flex items-center text-gray-400 hover:text-white mr-4">
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </Link>
        <div>
          <h1 className="font-bold text-xl">Network Analysis & Router Placement</h1>
          <p className="text-sm text-gray-400">Analyze historical routing data and optimize network topology</p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Visualization Options */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="show-hotspots"
                checked={showHotspots}
                onChange={(e) => setShowHotspots(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="show-hotspots" className="text-sm">
                Show Traffic Hotspots
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="show-routes"
                checked={showHistoricalRoutes}
                onChange={(e) => setShowHistoricalRoutes(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="show-routes" className="text-sm">
                Show Route Frequency
              </label>
            </div>
          </div>

          <div className="ml-auto flex items-center space-x-2">
            <button
              onClick={clearSelectedRoutes}
              disabled={selectedRouteIds.length === 0}
              className={`flex items-center px-3 py-1 rounded text-sm ${
                selectedRouteIds.length === 0
                  ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                  : "bg-gray-600 hover:bg-gray-700 text-white"
              }`}
            >
              Clear Selection
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center mb-3">
            <Filter className="w-4 h-4 mr-2 text-gray-400" />
            <h3 className="text-sm font-medium">Filter Routes</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Source Node</label>
              <select
                value={sourceFilter || ""}
                onChange={(e) => setSourceFilter(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-gray-700 text-white rounded p-1 text-sm"
              >
                <option value="">Any Source</option>
                {nodes
                  .filter((node) => node.type === NodeType.DEVICE)
                  .map((node) => (
                    <option key={`source-${node.id}`} value={node.id}>
                      {node.label}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Target Node</label>
              <select
                value={targetFilter || ""}
                onChange={(e) => setTargetFilter(e.target.value ? Number(e.target.value) : null)}
                className="w-full bg-gray-700 text-white rounded p-1 text-sm"
              >
                <option value="">Any Target</option>
                {nodes
                  .filter((node) => node.type === NodeType.DEVICE)
                  .map((node) => (
                    <option key={`target-${node.id}`} value={node.id}>
                      {node.label}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-end space-x-2">
              <button
                onClick={applyFilters}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm"
              >
                Apply Filters
              </button>

              <button
                onClick={resetFilters}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-1 rounded text-sm"
              >
                Reset
              </button>
            </div>

            <div className="flex items-end justify-end">
              <div className="text-sm text-gray-300">
                Showing <span className="font-medium">{filteredRoutes.length}</span> of{" "}
                <span className="font-medium">{historicalRoutes.length}</span> routes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Network Visualization */}
        <div className="flex-1 p-4">
          <div className="h-full flex flex-col">
            <h2 className="text-lg font-semibold mb-2 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
              Network Topology & Traffic Analysis
            </h2>

            <div className="flex-1">
              <NetworkAnalysisCanvas
                nodes={nodes}
                edges={edges}
                historicalRoutes={historicalRoutes}
                filteredRoutes={filteredRoutes}
                suggestedRouter={suggestedRouter}
                showHotspots={showHotspots}
                showHistoricalRoutes={showHistoricalRoutes}
                selectedRouteIds={selectedRouteIds}
                onSelectRoute={handleSelectRoute}
              />
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-96 border-l border-gray-700 flex flex-col">
          {/* Suggested Router */}
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Router className="w-5 h-5 mr-2 text-green-400" />
              Suggested Router Placement
            </h2>

            {suggestedRouter ? (
              <div className="space-y-4">
                <div className="bg-gray-800 p-3 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Improvement Metrics</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-700 p-2 rounded">
                      <span className="block text-xs text-gray-400">Latency Reduction</span>
                      <span className="text-green-400 font-medium">
                        {suggestedRouter.improvementMetrics.latencyReduction.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-gray-700 p-2 rounded">
                      <span className="block text-xs text-gray-400">Hop Reduction</span>
                      <span className="text-green-400 font-medium">
                        {suggestedRouter.improvementMetrics.hopReduction.toFixed(1)} hops
                      </span>
                    </div>
                    <div className="bg-gray-700 p-2 rounded">
                      <span className="block text-xs text-gray-400">Congestion Reduction</span>
                      <span className="text-green-400 font-medium">
                        {suggestedRouter.improvementMetrics.congestionReduction.toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-gray-700 p-2 rounded">
                      <span className="block text-xs text-gray-400">Affected Routes</span>
                      <span className="text-green-400 font-medium">
                        {suggestedRouter.improvementMetrics.affectedRoutes} routes
                      </span>
                    </div>
                  </div>
                </div>

                {performanceMetrics && <PerformanceMetricsCard metrics={performanceMetrics} />}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Router className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Not enough data to suggest router placement.</p>
                <p className="text-sm mt-2">Add more nodes or routes to the network.</p>
              </div>
            )}
          </div>

          {/* Route Analysis */}
          <div className="flex-1 p-4 overflow-auto">
            <h2 className="text-lg font-semibold mb-4">Historical Routes</h2>

            <RouteAnalysisTable
              routes={filteredRoutes}
              nodes={nodes}
              selectedRouteIds={selectedRouteIds}
              onSelectRoute={handleSelectRoute}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
