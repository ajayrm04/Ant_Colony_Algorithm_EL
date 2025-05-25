import SimulationCanvas from './components/SimulationCanvas';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import InfoPanel from './components/InfoPanel';
import { useNetworkStore } from './store/networkStore';
import TrafficPanel from './components/trafficPanel';
import { useState } from 'react';
import NetworkAnalysisPage from './components/NetworkAnalysisPage';
import CompareNetworks from './components/CompareNetworks';
import ChatbotModal from "./components/ChatbotModal";
import ChatbotPage from './components/ChatbotPage';
import { motion, AnimatePresence } from 'framer-motion';
import TrafficSpread from './components/TrafficSpread';

function App() {
  const { simulationRunning, nodes, edges } = useNetworkStore();
  const [currentPage, setCurrentPage] = useState<'simulation' | 'analysis' | 'compare' | 'chatbot'>('simulation');
  const [showSpreadTraffic, setShowSpreadTraffic] = useState(false);
  const [spreadTrafficPattern, setSpreadTrafficPattern] = useState<Record<string, number> | null>(null);

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
            <div className="flex-1 relative card overflow-hidden">
              <SimulationCanvas 
                onSpreadTraffic={(pattern) => {
                  setSpreadTrafficPattern(pattern);
                  setShowSpreadTraffic(true);
                }}
              />
              {simulationRunning && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute top-5 right-5 badge badge-primary flex items-center space-x-2"
                >
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
                  <span>Simulation Running</span>
                </motion.div>
              )}
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