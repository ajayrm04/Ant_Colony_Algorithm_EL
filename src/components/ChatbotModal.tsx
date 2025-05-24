import React, { useState } from "react";
import { HistoricalRoute } from "../types/analysisTypes";


interface ChatbotModalProps {
  onClose: () => void;
  historicalRoutes: HistoricalRoute[];
}

const ChatbotModal = ({ onClose, historicalRoutes }: ChatbotModalProps) => {
  const [messages, setMessages] = useState<{ from: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: "user", text: input }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt: input,
          historicalRoutes: historicalRoutes 
        }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages(msgs => [...msgs, { from: "bot", text: `Error: ${data.error}` }]);
      } else {
        setMessages(msgs => [...msgs, { from: "bot", text: data.response }]);
      }
    } catch (e) {
      setMessages(msgs => [...msgs, { from: "bot", text: "Error connecting to server at http://localhost:5000." }]);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-96 max-w-full p-4 relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-500 hover:text-red-500">✕</button>
        <div className="h-64 overflow-y-auto mb-2 border p-2 bg-gray-100 rounded">
          {messages.map((msg, i) => (
            <div key={i} className={`mb-1 text-sm ${msg.from === "user" ? "text-right" : "text-left"}`}>
              <span className={msg.from === "user" ? "bg-blue-200 px-2 py-1 rounded" : "bg-gray-300 px-2 py-1 rounded"}>
                {msg.text}
              </span>
            </div>
          ))}
          {loading && <div className="text-xs text-gray-500">Bot is typing...</div>}
        </div>
        <div className="flex">
          <input
            className="flex-1 border rounded-l px-2 py-1"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
            disabled={loading}
          />
          <button className="bg-blue-600 text-white px-4 py-1 rounded-r" onClick={sendMessage} disabled={loading}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default ChatbotModal; 