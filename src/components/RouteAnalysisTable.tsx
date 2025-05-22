"use client"

import type React from "react"

import { useState } from "react"
import type { HistoricalRoute } from "../types/analysisTypes"
import type { Node } from "../types/networkTypes"

interface RouteAnalysisTableProps {
  routes: HistoricalRoute[]
  nodes: Node[]
  selectedRouteIds: string[]
  onSelectRoute: (routeId: string) => void
}

const RouteAnalysisTable: React.FC<RouteAnalysisTableProps> = ({ routes, nodes, selectedRouteIds, onSelectRoute }) => {
  const [sortField, setSortField] = useState<keyof HistoricalRoute>("timestamp")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const routesPerPage = 10

  // Sort routes
  const sortedRoutes = [...routes].sort((a, b) => {
    if (sortField === "timestamp") {
      return sortDirection === "asc" ? a.timestamp - b.timestamp : b.timestamp - a.timestamp
    } else if (sortField === "latency") {
      return sortDirection === "asc" ? a.latency - b.latency : b.latency - a.latency
    } else if (sortField === "hops") {
      return sortDirection === "asc" ? a.hops - b.hops : b.hops - a.hops
    } else if (sortField === "congestion") {
      return sortDirection === "asc" ? a.congestion - b.congestion : b.congestion - a.congestion
    }
    return 0
  })

  // Paginate routes
  const indexOfLastRoute = currentPage * routesPerPage
  const indexOfFirstRoute = indexOfLastRoute - routesPerPage
  const currentRoutes = sortedRoutes.slice(indexOfFirstRoute, indexOfLastRoute)
  const totalPages = Math.ceil(routes.length / routesPerPage)

  // Handle sort
  const handleSort = (field: keyof HistoricalRoute) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Format timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  // Get node label by id
  const getNodeLabel = (id: number) => {
    const node = nodes.find((n) => n.id === id)
    return node ? node.label : `Node ${id}`
  }

  // Format path
  const formatPath = (path: number[]) => {
    return path.map((id) => getNodeLabel(id)).join(" → ")
  }

  // Handle row click
  const handleRowClick = (routeId: string) => {
    onSelectRoute(routeId)
  }

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs uppercase bg-gray-700">
            <tr>
              <th className="px-4 py-2">
                <button className="flex items-center" onClick={() => handleSort("timestamp")}>
                  Timestamp
                  {sortField === "timestamp" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                </button>
              </th>
              <th className="px-4 py-2">Source</th>
              <th className="px-4 py-2">Target</th>
              <th className="px-4 py-2">
                <button className="flex items-center" onClick={() => handleSort("hops")}>
                  Hops
                  {sortField === "hops" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                </button>
              </th>
              <th className="px-4 py-2">
                <button className="flex items-center" onClick={() => handleSort("latency")}>
                  Latency
                  {sortField === "latency" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                </button>
              </th>
              <th className="px-4 py-2">
                <button className="flex items-center" onClick={() => handleSort("congestion")}>
                  Congestion
                  {sortField === "congestion" && <span className="ml-1">{sortDirection === "asc" ? "↑" : "↓"}</span>}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {currentRoutes.map((route) => (
              <tr
                key={route.id}
                className={`border-t border-gray-700 hover:bg-gray-700 cursor-pointer ${
                  selectedRouteIds.includes(route.id) ? "bg-yellow-900 hover:bg-yellow-800" : ""
                }`}
                onClick={() => handleRowClick(route.id)}
              >
                <td className="px-4 py-2">{formatDate(route.timestamp)}</td>
                <td className="px-4 py-2">{getNodeLabel(route.sourceId)}</td>
                <td className="px-4 py-2">{getNodeLabel(route.targetId)}</td>
                <td className="px-4 py-2">{route.hops}</td>
                <td className="px-4 py-2">{route.latency.toFixed(2)} ms</td>
                <td className="px-4 py-2">{(route.congestion * 100).toFixed(1)}%</td>
              </tr>
            ))}
            {currentRoutes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-gray-400">
                  No routes found matching the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-700">
          <div className="text-sm text-gray-400">
            Showing {indexOfFirstRoute + 1}-{Math.min(indexOfLastRoute, routes.length)} of {routes.length} routes
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gray-600 hover:bg-gray-500 text-white"
              }`}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gray-600 hover:bg-gray-500 text-white"
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Route details */}
      {selectedRouteIds.length > 0 && (
        <div className="p-4 bg-gray-700 border-t border-gray-600">
          <h3 className="text-sm font-medium text-white mb-2">Selected Route Details</h3>
          {selectedRouteIds.map((id) => {
            const route = routes.find((r) => r.id === id)
            if (!route) return null

            return (
              <div key={id} className="mb-2 last:mb-0">
                <div className="text-xs text-gray-300 mb-1">
                  <span className="font-medium">From:</span> {getNodeLabel(route.sourceId)}
                  <span className="mx-2">→</span>
                  <span className="font-medium">To:</span> {getNodeLabel(route.targetId)}
                </div>
                <div className="text-xs bg-gray-800 p-2 rounded overflow-x-auto whitespace-nowrap">
                  <span className="font-medium">Path:</span> {formatPath(route.path)}
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                  <div className="bg-gray-800 p-2 rounded">
                    <span className="font-medium">Latency:</span> {route.latency.toFixed(2)} ms
                  </div>
                  <div className="bg-gray-800 p-2 rounded">
                    <span className="font-medium">Hops:</span> {route.hops}
                  </div>
                  <div className="bg-gray-800 p-2 rounded">
                    <span className="font-medium">Congestion:</span> {(route.congestion * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RouteAnalysisTable
