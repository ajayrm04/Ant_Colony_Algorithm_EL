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

function App() {
  const { simulationRunning } = useNetworkStore();
  const [currentPage, setCurrentPage] = useState<'simulation' | 'analysis' | 'compare'>('simulation');
  const [showChatbot, setShowChatbot] = useState(false);

  const renderContent = () => {
    switch (currentPage) {
      case 'analysis':
        return <NetworkAnalysisPage />;
      case 'compare':
        return <CompareNetworks />;
      default:
        return (
          <main className="flex-1 flex flex-col md:flex-row">
            <div className="flex-1 p-4 relative">
              <SimulationCanvas />
              {simulationRunning && (
                <div className="absolute top-5 right-5 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                  Simulation Running
                </div>
              )}
            </div>
            <div className="w-full md:w-80 lg:w-96 border-l border-gray-700 bg-gray-800 flex flex-col">
              <ControlPanel />
              <InfoPanel />
              <TrafficPanel/>
            </div>
          </main>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Header onPageChange={setCurrentPage} currentPage={currentPage} />
      {renderContent()}
      {/* Floating Chatbot Button */}
      <button
        onClick={() => setShowChatbot(true)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          background: '#2563eb',
          color: 'white',
          borderRadius: '50%',
          width: 56,
          height: 56,
          fontSize: 28,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
        }}
        title="Open Chatbot"
      >
        💬
      </button>
      {showChatbot && <ChatbotModal onClose={() => setShowChatbot(false)} />}
    </div>
  );
}

export default App;