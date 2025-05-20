import SimulationCanvas from './components/SimulationCanvas';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import InfoPanel from './components/InfoPanel';
import { useNetworkStore } from './store/networkStore';

function App() {
  const { simulationRunning } = useNetworkStore();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      <Header />
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
        </div>
      </main>
    </div>
  );
}

export default App;