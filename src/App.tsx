import SimulationCanvas from './components/SimulationCanvas';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import InfoPanel from './components/InfoPanel';
import { useNetworkStore } from './store/networkStore';
import TrafficPanel from './components/trafficPanel';
import { useState, useEffect, useCallback } from 'react';
import NetworkAnalysisPage from './components/NetworkAnalysisPage';
import CompareNetworks from './components/CompareNetworks';
import ChatbotModal from "./components/ChatbotModal";
import ChatbotPage from './components/ChatbotPage';
import { motion, AnimatePresence } from 'framer-motion';
import TrafficSpread from './components/TrafficSpread';
import FloatingCard from './components/FloatingCard';
import { analyzeNetworkData } from './services/networkAnalysisService';
import { NetworkMetrics } from './types/networkMetrics';
import { NodeType } from './types/networkTypes';

interface HistoricalRoute {
  timestamp: number;
  sourceId: number;
  targetId: number;
  path: number[];
  latency: number;
  hops: number;
  congestion: number;
}

function App() {
  const { simulationRunning, nodes, edges, bestPath, bestPathNodes, trafficPatterns } = useNetworkStore();
  const [currentPage, setCurrentPage] = useState<'simulation' | 'analysis' | 'compare' | 'chatbot'>('simulation');
  const [showSpreadTraffic, setShowSpreadTraffic] = useState(false);
  const [spreadTrafficPattern, setSpreadTrafficPattern] = useState<Record<string, number> | null>(null);
  const [networkMetrics, setNetworkMetrics] = useState<NetworkMetrics | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [historicalRoutes, setHistoricalRoutes] = useState<HistoricalRoute[]>([]);

  // Function to create a name matrix from nodes
  const createNameMatrix = useCallback(() => {
    const matrix = nodes.map(node => ({
      id: node.id,
      name: node.name || `${node.type === NodeType.ROUTER ? 'R' : 'D'}${node.id}`,
      type: node.type
    }));
    console.log('Created name matrix:', matrix);
    return matrix;
  }, [nodes]);

  // Function to calculate network metrics directly
  const calculateLocalMetrics = useCallback(() => {
    const routerCount = nodes.filter(n => n.type === NodeType.ROUTER).length;
    const deviceCount = nodes.filter(n => n.type === NodeType.DEVICE).length;
    const avgCongestion = 0
    
    return {
      totalRouters: routerCount,
      totalDevices: deviceCount,
      averageLatency: bestPath.length || 0,
      networkEfficiency: edges.length > 0 ? 1 - avgCongestion : 0,
      averageCongestion: 0,
      numberOfHops: bestPathNodes.length - 1 || 0,
      topologyUsed: 'mesh', // default topology
      packetDropRate: 0,
      acoScore: bestPath.length > 0 ? 100 - (bestPath.length * 10) : 0
    };
  }, [nodes, edges, bestPath, bestPathNodes]);

  // Function to add a new historical route
  const addHistoricalRoute = useCallback(() => {
    if (bestPathNodes.length > 0) {
      const newRoute: HistoricalRoute = {
        timestamp: Date.now(),
        sourceId: bestPathNodes[0],
        targetId: bestPathNodes[bestPathNodes.length - 1],
        path: bestPathNodes,
        latency: bestPath.length,
        hops: bestPathNodes.length - 1,
        congestion: 0
      };
      console.log('Adding new historical route:', newRoute);
      setHistoricalRoutes(prev => [...prev, newRoute]);
    }
  }, [bestPathNodes, bestPath, edges]);

  // Update historical routes when best path changes
  useEffect(() => {
    if (bestPathNodes.length > 0) {
      addHistoricalRoute();
    }
  }, [bestPathNodes, addHistoricalRoute]);

  // Function to update network metrics
  const updateNetworkMetrics = useCallback(async () => {
    try {
      if (nodes.length === 0) {
        console.log('No nodes available, using default metrics');
        setNetworkMetrics({
          totalRouters: 0,
          totalDevices: 0,
          averageLatency: 0,
          networkEfficiency: 0,
          averageCongestion: 0,
          numberOfHops: 0,
          topologyUsed: 'none',
          packetDropRate: 0,
          acoScore: 0
        });
        return;
      }

      setIsLoading(true);
      const nameMatrix = createNameMatrix();
      
      // Use local metrics if no historical routes
      if (historicalRoutes.length === 0) {
        console.log('No historical routes, using local metrics');
        const localMetrics = calculateLocalMetrics();
        setNetworkMetrics(localMetrics);
        setIsLoading(false);
        return;
      }

      console.log('Sending data to backend:', {
        historicalRoutes,
        nameMatrix,
        nodeCount: nodes.length,
        edgeCount: edges.length
      });

      const metrics = await analyzeNetworkData(historicalRoutes, nameMatrix);
      console.log('Received metrics from backend:', metrics);
      setNetworkMetrics(metrics);
    } catch (error) {
      console.error('Error updating network metrics:', error);
      // Fallback to local metrics on error
      const localMetrics = calculateLocalMetrics();
      setNetworkMetrics(localMetrics);
    } finally {
      setIsLoading(false);
    }
  }, [nodes, edges, historicalRoutes, createNameMatrix, calculateLocalMetrics]);

  // Update metrics when network state changes
  useEffect(() => {
    console.log('Network state changed:', {
      nodesCount: nodes.length,
      edgesCount: edges.length,
      historicalRoutesCount: historicalRoutes.length,
      simulationRunning
    });
    updateNetworkMetrics();
  }, [nodes.length, edges.length, historicalRoutes.length, simulationRunning, updateNetworkMetrics]);

  const renderContent = () => {
    switch (currentPage) {
      case 'analysis':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <NetworkAnalysisPage />
          </motion.div>
        );
      case 'compare':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <CompareNetworks />
          </motion.div>
        );
      case 'chatbot':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1"
          >
            <ChatbotPage />
          </motion.div>
        );
      default:
        return (
          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col md:flex-row gap-6 p-6"
          >
            <div className="flex-1 p4 relative">
              
              <SimulationCanvas 
                onSpreadTraffic={(pattern) => {
                  setSpreadTrafficPattern(pattern);
                  setShowSpreadTraffic(true);
                }}
              />
            </div>
            <div className="w-full md:w-80 lg:w-96 space-y-6">
              <ControlPanel />
              <InfoPanel />
              <TrafficPanel />
            </div>
          </motion.main>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100 flex flex-col">
      <Header onPageChange={setCurrentPage} currentPage={currentPage} />
      <AnimatePresence mode="wait">
        {renderContent()}
      </AnimatePresence>

      {/* FloatingCard Component */}
      <AnimatePresence>
        <FloatingCard 
          data={networkMetrics} 
          isLoading={isLoading}
          show={currentPage === 'simulation'} 
        />
      </AnimatePresence>

      {/* TrafficSpread Modal */}
      <AnimatePresence>
        {showSpreadTraffic && spreadTrafficPattern && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-4xl mx-4"
            >
              <TrafficSpread
                nodes={nodes}
                edges={edges}
                trafficPattern={spreadTrafficPattern}
                onClose={() => setShowSpreadTraffic(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;