import { NetworkMetrics } from '../types/networkMetrics';

export async function analyzeNetworkData(
  historicalRoutes: any[],
  nameMatrix: any[]
): Promise<NetworkMetrics> {
  try {
    const response = await fetch('http://localhost:5000/analyze_network', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        history_data: historicalRoutes,
        name_matrix: nameMatrix
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'success') {
      throw new Error(data.error || 'Failed to analyze network');
    }

    const metrics = data.metrics;
    
    // Convert the metrics to our NetworkMetrics format
    return {
      totalRouters: parseInt(metrics.total_routers) || 0,
      totalDevices: parseInt(metrics.total_devices) || 0,
      averageLatency: parseFloat(metrics.average_latency) || 0,
      networkEfficiency: parseFloat(metrics.network_efficiency) || 0,
      averageCongestion: parseFloat(metrics.average_congestion) || 0,
      numberOfHops: parseInt(metrics.number_of_hops) || 0,
      topologyUsed: metrics.topology_used || 'unknown',
      packetDropRate: parseFloat(metrics.packet_drop_rate) || 0,
      acoScore: parseFloat(metrics.aco_score) || 0
    };
  } catch (error) {
    console.error('Error analyzing network data:', error);
    throw error;
  }
} 