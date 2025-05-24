import React from "react";
import SimulationCanvas from "./SimulationCanvas";
import ChatbotPanel from "./ChatbotPanel";

const ChatbotPage: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-900">
      <div className="flex-1 p-4 overflow-auto">
        <SimulationCanvas />
      </div>
      <div className="w-96 border-l border-gray-800 bg-white h-full">
        <ChatbotPanel />
      </div>
    </div>
  );
};

export default ChatbotPage; 