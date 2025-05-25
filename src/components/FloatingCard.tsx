import React from 'react';
import { NetworkMetrics } from '../types/networkMetrics';
import { motion } from 'framer-motion';

interface FloatingCardProps {
  data?: NetworkMetrics;
  isLoading?: boolean;
  show?: boolean;
}

const MetricRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 px-4 rounded-lg hover:bg-gray-700/20 transition-colors">
    <span className="text-sm font-medium text-gray-300">{label}</span>
    <span className="font-semibold text-primary-400">{value}</span>
  </div>
);

const FloatingCard: React.FC<FloatingCardProps> = ({ data, isLoading = false, show = true }) => {
  if (!show) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 left-6 z-50"
    >
      <div className="bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-xl p-4 min-w-[300px] border border-gray-700">
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-primary-300 mb-4 px-4">
              Network Metrics
            </h3>
            <div className="space-y-1">
              {data ? (
                <>
                  <MetricRow label="Routers" value={data.totalRouters} />
                  <MetricRow label="Devices" value={data.totalDevices} />
                  <MetricRow label="Latency" value={`${data.averageLatency.toFixed(2)}ms`} />
                  <MetricRow label="Efficiency" value={`${(data.networkEfficiency * 100).toFixed(1)}%`} />
                  <MetricRow label="Hops" value={data.numberOfHops} />
                  <MetricRow label="Topology" value={data.topologyUsed} />
                  <MetricRow 
                    label="ACO Score" 
                    value={`${data.acoScore.toFixed(1)}`} 
                  />
                </>
              ) : (
                <p className="text-sm text-gray-400 py-2 px-4">No data available</p>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default FloatingCard; 