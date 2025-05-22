export enum NodeType {
  ROUTER = "router",
  DEVICE = "device",
}

export interface Node {
  id: number
  x: number
  y: number
  label: string
  type: NodeType
  congestion?: number // 0-1 value representing congestion level
}

export interface Edge {
  source: number
  target: number
  weight: number
  sourcetype: NodeType
  targettype: NodeType
  traffic: number // 0-1 value representing traffic level
  bandwidth: number // Maximum capacity
  utilization: number // Current utilization
}

export interface AntPosition {
  from: number
  to: number
  progress: number
  x: number
  y: number
}

export interface TrafficPattern {
  id: number
  source: number
  target: number
  volume: number // Traffic volume
  priority: number // 1-10, higher is more important
  active: boolean
  routersInPath:{}
}

export enum SimulationMode {
  STANDARD = "standard",
  CONGESTION_AWARE = "congestion_aware",
}
