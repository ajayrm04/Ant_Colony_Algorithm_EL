import React, { useState, useMemo } from 'react';
import { useNetworkStore } from '../store/networkStore';
import SimulationCanvas from './SimulationCanvas';


// Dummy TrafficHeatmap component for illustration
const TrafficHeatmap: React.FC<{ trafficPattern: Record<string, number> }> = ({ trafficPattern }) => (
  <div className="mt-2">
    <h4 className="font-semibold mb-1">Traffic Heatmap</h4>
    <div className="text-xs bg-gray-700 p-2 rounded max-h-32 overflow-auto">
      {Object.entries(trafficPattern).length === 0
        ? <span className="text-gray-400">No traffic data</span>
        : Object.entries(trafficPattern).map(([key, value]) => (
            <div key={key}>{key}: <span className="text-yellow-400">{value}</span></div>
          ))
      }
    </div>
  </div>
);

const CongestionDisplay: React.FC<{ trafficPattern: Record<string, number> }> = ({ trafficPattern }) => {
  // Dummy congestion calculation: max traffic value
  const congestion = Object.values(trafficPattern).length
    ? Math.max(...Object.values(trafficPattern))
    : 0;
  return (
    <div className="mt-2 text-sm">
      <span className="font-semibold">Congestion: </span>
      <span className="text-red-400">{congestion}</span>
    </div>
  );
};

interface NetworkConfig {
  adjacencyList: Record<string, any>;
  trafficPattern: any[];
}

const CompareNetworks: React.FC = () => {
  const networkStore = useNetworkStore();
  const [modifiedNetwork, setModifiedNetwork] = useState<NetworkConfig>({
    adjacencyList: {},
    trafficPattern: []
  });

  // Transform the adjacency list format to match what SimulationCanvas expects
  const transformedAdjacencyList = useMemo(() => {
    if (!modifiedNetwork.adjacencyList) return {};
    const transformed: Record<string, string[]> = {};
    Object.entries(modifiedNetwork.adjacencyList).forEach(([nodeId, nodeData]: [string, any]) => {
      if (nodeData.neighbors) {
        transformed[nodeId] = nodeData.neighbors.map((n: any) => n.id.toString());
      }
    });
    return transformed;
  }, [modifiedNetwork.adjacencyList]);

  // Transform traffic pattern to match expected format
  const transformedTrafficPattern = useMemo(() => {
    if (!modifiedNetwork.trafficPattern) return {};
    const pattern: Record<string, number> = {};
    modifiedNetwork.trafficPattern.forEach((flow: any) => {
      const key = `${flow.source}-${flow.target}`;
      pattern[key] = flow.volume;
    });
    return pattern;
  }, [modifiedNetwork.trafficPattern]);

  // Transform original traffic pattern from store
  const originalTrafficPattern = useMemo(() => {
    if (!networkStore.trafficPatterns) return {};
    const pattern: Record<string, number> = {};
    networkStore.trafficPatterns.forEach((flow: any) => {
      const key = `${flow.source}-${flow.target}`;
      pattern[key] = flow.volume;
    });
    return pattern;
  }, [networkStore.trafficPatterns]);

  // Function to handle adjacency list input
  const handleAdjacencyListChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const newAdjacencyList = JSON.parse(e.target.value);
      setModifiedNetwork(prev => ({
        ...prev,
        adjacencyList: newAdjacencyList
      }));
    } catch (error) {
      console.error('Invalid JSON format for adjacency list');
    }
  };

  // Function to handle traffic pattern input
  const handleTrafficPatternChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    try {
      const newTrafficPattern = JSON.parse(e.target.value);
      setModifiedNetwork(prev => ({
        ...prev,
        trafficPattern: newTrafficPattern
      }));
    } catch (error) {
      console.error('Invalid JSON format for traffic pattern');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-2 gap-4 p-4">
        {/* Original Network */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">Original Network</h2>
          <div className="h-[500px] relative">
            <SimulationCanvas 
              trafficPattern={originalTrafficPattern}
            />
          </div>
          <TrafficHeatmap trafficPattern={originalTrafficPattern} />
          <CongestionDisplay trafficPattern={originalTrafficPattern} />
        </div>

        {/* Modified Network */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">Modified Network</h2>
          <div className="h-[500px] relative">
            <SimulationCanvas 
              adjacencyList={modifiedNetwork.adjacencyList}
              trafficPattern={transformedTrafficPattern}
            />
          </div>
          <TrafficHeatmap trafficPattern={transformedTrafficPattern} />
          <CongestionDisplay trafficPattern={transformedTrafficPattern} />
        </div>
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-2 gap-4 p-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Modified Adjacency List</h3>
          <textarea
            className="w-full h-32 bg-gray-700 text-white p-2 rounded"
            placeholder="Enter modified adjacency list in JSON format"
            onChange={handleAdjacencyListChange}
          />
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2">Modified Traffic Pattern</h3>
          <textarea
            className="w-full h-32 bg-gray-700 text-white p-2 rounded"
            placeholder="Enter modified traffic pattern in JSON format"
            onChange={handleTrafficPatternChange}
          />
        </div>
      </div>
    </div>
  );
};

export default CompareNetworks;