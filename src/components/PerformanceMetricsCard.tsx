"use client"

import type React from "react"

import type { PerformanceMetrics } from "../types/analysisTypes"
import { ArrowDownRight } from "lucide-react"

interface PerformanceMetricsCardProps {
  metrics: PerformanceMetrics
}

const PerformanceMetricsCard: React.FC<PerformanceMetricsCardProps> = ({ metrics }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Performance Impact</h3>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-base w-full">
        {/* Latency Metrics */}
        <div className="bg-gray-700 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Latency</h4>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-400">Current</p>
              <p className="text-xl font-bold">{metrics.currentAvgLatency.toFixed(1)} ms</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Projected</p>
              <p className="text-xl font-bold text-green-400">{metrics.projectedAvgLatency.toFixed(1)} ms</p>
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <ArrowDownRight className="w-4 h-4 text-green-400 mr-1" />
            <span className="text-sm text-green-400">
              {(metrics.currentAvgLatency - metrics.projectedAvgLatency).toFixed(1)} ms reduction
            </span>
          </div>
        </div>

        {/* Hops Metrics */}
        <div className="bg-gray-700 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Average Hops</h4>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-400">Current</p>
              <p className="text-xl font-bold">{metrics.currentAvgHops.toFixed(1)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Projected</p>
              <p className="text-xl font-bold text-green-400">{metrics.projectedAvgHops.toFixed(1)}</p>
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <ArrowDownRight className="w-4 h-4 text-green-400 mr-1" />
            <span className="text-sm text-green-400">
              {(metrics.currentAvgHops - metrics.projectedAvgHops).toFixed(1)} fewer hops
            </span>
          </div>
        </div>

        {/* Congestion Metrics */}
        <div className="bg-gray-700 p-3 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Network Congestion</h4>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-400">Current</p>
              <p className="text-xl font-bold">{(metrics.currentAvgCongestion * 100).toFixed(1)}%</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Projected</p>
              <p className="text-xl font-bold text-green-400">{(metrics.projectedAvgCongestion * 100).toFixed(1)}%</p>
            </div>
          </div>
          <div className="mt-2 flex items-center">
            <ArrowDownRight className="w-4 h-4 text-green-400 mr-1" />
            <span className="text-sm text-green-400">
              {((metrics.currentAvgCongestion - metrics.projectedAvgCongestion) * 100).toFixed(1)}% reduction
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-green-900 p-3 rounded-lg">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-green-100">Overall Improvement</h4>
          <p className="text-xl font-bold text-green-300">{metrics.improvementPercentage.toFixed(1)}%</p>
        </div>
        <p className="text-xs text-green-200 mt-1">
          Adding the suggested router would improve overall network performance by{" "}
          {metrics.improvementPercentage.toFixed(1)}%
        </p>
      </div>
    </div>
  )
}

export default PerformanceMetricsCard
