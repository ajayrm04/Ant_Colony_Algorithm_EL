import React from 'react';
import { useNetworkStore } from '../store/networkStore';

const InfoPanel: React.FC = () => {
  const { 
    nodes, 
    edges, 
    selectedSourceNode, 
    selectedTargetNode,
    simulationRunning,
    bestPathDistance,
    bestPathNodes,
    iterations
  } = useNetworkStore();

  const sourceNode = nodes.find(n => n.id === selectedSourceNode);
  const targetNode = nodes.find(n => n.id === selectedTargetNode);

  return (
    <div className="p-4 flex-1 overflow-auto">
      <h2 className="text-lg font-semibold mb-4">Simulation Info</h2>
      
      <div className="space-y-4">
        <div className="bg-gray-700 p-3 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Network Stats</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-400">Devices/Routers:</div>
            <div className="text-right">{nodes.length}</div>
            <div className="text-gray-400">Connections:</div>
            <div className="text-right">{edges.length}</div>
          </div>
        </div>
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Selected Nodes</h3>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Source:</span>
              <span className="px-2 py-0.5 bg-green-900 rounded text-green-300">
                {sourceNode ? sourceNode.label : 'None'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Target:</span>
              <span className="px-2 py-0.5 bg-red-900 rounded text-red-300">
                {targetNode ? targetNode.label : 'None'}
              </span>
            </div>
          </div>
        </div>
        
        {simulationRunning && (
          <div className="bg-gray-700 p-3 rounded-lg animate-pulse">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Simulation Running</h3>
            <div className="text-sm text-gray-300">
              Iterations: {iterations}
            </div>
          </div>
        )}
        
        {bestPathDistance !== Infinity && bestPathNodes.length > 0 && (
          <div className="bg-gray-700 p-3 rounded-lg">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Best Path</h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Distance:</span>
                <span>{bestPathDistance.toFixed(2)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 mb-1">Route:</span>
                <div className="text-xs bg-gray-800 p-2 rounded overflow-x-auto">
                  {bestPathNodes.map((nodeId, index) => {
                    const node = nodes.find(n => n.id === nodeId);
                    return (
                      <span key={nodeId}>
                        {node?.label || nodeId}
                        {index < bestPathNodes.length - 1 && (
                          <span className="text-green-400 mx-1">→</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-gray-700 p-3 rounded-lg">
          <h3 className="text-sm font-medium text-gray-300 mb-2">Instructions</h3>
          <div className="text-xs text-gray-300 space-y-1">
            <p>• Double-click on the canvas to add a device</p>
            <p>• Shift + Double-click to add a router</p>
            <p>• Click on a node to set it as source</p>
            <p>• Ctrl/Cmd + Click to set as target</p>
            <p>• Drag nodes to reposition them</p>
            <p>• Use the Control Panel to manage simulation</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;