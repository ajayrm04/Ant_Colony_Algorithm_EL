import React from 'react';
import { useNetworkStore } from '../store/networkStore';
import { Play, Pause, RefreshCw, Trash2, Settings, Router, Laptop } from 'lucide-react';
import SettingsDialog from './SettingsDialog';

const ControlPanel: React.FC = () => {
  const { 
    simulationRunning, 
    startSimulation, 
    stopSimulation,
    resetSimulation,
    clearNetwork,
    addNode,
    selectedSourceNode,
    selectedTargetNode,
    nodes
  } = useNetworkStore();

  const [showSettings, setShowSettings] = React.useState(false);

  const handleAddDevice = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    addNode({
      id: Date.now(),
      x: Math.random() * (canvas.width - 100) + 50,
      y: Math.random() * (canvas.height - 100) + 50,
      label: `D${nodes.length + 1}`,
      type: 'device'
    });
  };

  const handleAddRouter = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    addNode({
      id: Date.now(),
      x: Math.random() * (canvas.width - 100) + 50,
      y: Math.random() * (canvas.height - 100) + 50,
      label: `R${nodes.length + 1}`,
      type: 'router'
    });
  };

  return (
    <div className="p-4 border-b border-gray-700">
      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={simulationRunning ? stopSimulation : startSimulation}
          disabled={selectedSourceNode === null || selectedTargetNode === null}
          className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            selectedSourceNode === null || selectedTargetNode === null
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : simulationRunning
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {simulationRunning ? (
            <>
              <Pause className="w-4 h-4 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Start
            </>
          )}
        </button>

        <button
          onClick={resetSimulation}
          className="flex items-center px-4 py-2 rounded-lg font-medium text-sm bg-yellow-500 hover:bg-yellow-600 text-white transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </button>

        <button
          onClick={clearNetwork}
          className="flex items-center px-4 py-2 rounded-lg font-medium text-sm bg-gray-600 hover:bg-gray-700 text-white transition-colors"
          disabled={simulationRunning}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <button
          onClick={handleAddDevice}
          className="flex items-center px-4 py-2 rounded-lg font-medium text-sm bg-purple-500 hover:bg-purple-600 text-white transition-colors"
          disabled={simulationRunning}
        >
          <Laptop className="w-4 h-4 mr-2" />
          Add Device
        </button>

        <button
          onClick={handleAddRouter}
          className="flex items-center px-4 py-2 rounded-lg font-medium text-sm bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          disabled={simulationRunning}
        >
          <Router className="w-4 h-4 mr-2" />
          Add Router
        </button>

        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center px-4 py-2 rounded-lg font-medium text-sm bg-gray-600 hover:bg-gray-700 text-white transition-colors ml-auto"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </button>
      </div>

      <SettingsDialog open={showSettings} onOpenChange={setShowSettings} />
    </div>
  );
};

export default ControlPanel;
