import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useNetworkStore } from '../store/networkStore';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClose: () => void
}

const SettingsDialog: React.FC<SettingsDialogProps> = ({ open, onOpenChange }) => {
  const {
    
    evaporationRate,
    setEvaporationRate,
    pheromoneDeposit,
    setPheromoneDeposit,
    numAnts,
    setNumAnts,
    antSpeed,
    setAntSpeed,
    simulationRunning
  } = useNetworkStore();

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-800 text-white rounded-xl p-6 w-[90vw] max-w-lg max-h-[85vh] overflow-auto shadow-xl">
          <Dialog.Title className="text-xl font-bold mb-6">
            Simulation Settings
          </Dialog.Title>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Evaporation Rate: {evaporationRate.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.01"
                max="0.5"
                step="0.01"
                value={evaporationRate}
                onChange={(e) => setEvaporationRate(parseFloat(e.target.value))}
                disabled={simulationRunning}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="mt-1 text-xs text-gray-400">
                Controls how quickly pheromone trails fade
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Pheromone Deposit: {pheromoneDeposit.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={pheromoneDeposit}
                onChange={(e) => setPheromoneDeposit(parseFloat(e.target.value))}
                disabled={simulationRunning}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="mt-1 text-xs text-gray-400">
                Amount of pheromone deposited by ants
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Number of Ants: {numAnts}
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={numAnts}
                onChange={(e) => setNumAnts(parseInt(e.target.value))}
                disabled={simulationRunning}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="mt-1 text-xs text-gray-400">
                More ants = faster convergence but higher CPU usage
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Simulation Speed: {antSpeed}x
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={antSpeed}
                onChange={(e) => setAntSpeed(parseInt(e.target.value))}
                disabled={simulationRunning}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="mt-1 text-xs text-gray-400">
                Controls how fast the simulation runs
              </p>
            </div>
          </div>

          <Dialog.Close className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-700 transition-colors">
            <X className="w-4 h-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SettingsDialog;