export interface NetworkMetrics {
  totalRouters: number;
  totalDevices: number;
  averageLatency: number;
  networkEfficiency: number;
  averageCongestion: number;
  numberOfHops: number;
  topologyUsed: string;
  packetDropRate: number;
  acoScore: number;
} 