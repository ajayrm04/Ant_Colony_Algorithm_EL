import React, { useState, useEffect } from "react";
import SimulationCanvas from "./SimulationCanvas";
import ChatbotPanel from "./ChatbotPanel";
import { useNetworkStore } from "../store/networkStore";
import { generateSampleHistoricalData } from "../utils/analysisUtils";
import type { HistoricalRoute } from "../types/analysisTypes";

const ChatbotPage: React.FC = () => {
  const { nodes, edges } = useNetworkStore();
  const [historicalRoutes, setHistoricalRoutes] = useState<HistoricalRoute[]>([]);

  useEffect(() => {
    if (nodes.length > 0 && edges.length > 0) {
      const sampleData = generateSampleHistoricalData(nodes, edges, 100);
      setHistoricalRoutes(sampleData);
    }
  }, [nodes, edges]);

  return (
    <div className="flex h-screen bg-gray-900">
      <div className="flex-1 p-4 overflow-auto">
        <SimulationCanvas />
      </div>
      <div className="w-96 border-l border-gray-800 bg-white h-full">
        <ChatbotPanel historicalRoutes={historicalRoutes} />
      </div>
    </div>
  );
};

export default ChatbotPage; 