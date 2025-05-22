export interface HistoricalRoute {
  id: string
  timestamp: number
  sourceId: number
  targetId: number
  path: number[] // Array of node IDs representing the full path
  latency: number // Simulated latency in ms
  hops: number // Number of hops in the path
  congestion: number // Average congestion along the path (0-1)
}

export interface RouterPlacementSuggestion {
  x: number
  y: number
  improvementMetrics: {
    latencyReduction: number // Percentage reduction in average latency
    hopReduction: number // Average reduction in number of hops
    congestionReduction: number // Percentage reduction in congestion
    affectedRoutes: number // Number of routes that would benefit
  }
}

export interface AnalysisFilters {
  sourceId: number | null
  targetId: number | null
  timeRange: {
    start: number | null
    end: number | null
  }
  minFrequency: number
}

export interface TrafficHotspot {
  x: number
  y: number
  intensity: number // 0-1 value representing traffic intensity
  radius: number // Visual radius for rendering
}

export interface PerformanceMetrics {
  currentAvgLatency: number
  projectedAvgLatency: number
  currentAvgHops: number
  projectedAvgHops: number
  currentAvgCongestion: number
  projectedAvgCongestion: number
  improvementPercentage: number
}
