import React, { useState, useRef, useEffect } from "react";

const ChatbotPanel = () => {
  const [messages, setMessages] = useState<{ from: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: "user", text: input }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });
      const data = await res.json();
      if (data.error) {
        setMessages(msgs => [...msgs, { from: "bot", text: `Error: ${data.error}` }]);
      } else {
        setMessages(msgs => [...msgs, { from: "bot", text: data.response }]);
      }
    } catch (e) {
      setMessages(msgs => [...msgs, { from: "bot", text: "Error connecting to server." }]);
    }
    setLoading(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-black shadow-xl w-96 max-w-full border-l border-gray-700">
      <div className="font-semibold text-xl text-white p-4 border-b border-gray-700 bg-gradient-to-r from-indigo-700 to-indigo-900">
        🤖 Network Chatbot
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg shadow-md ${
                msg.from === "user"
                  ? "bg-indigo-600 text-white rounded-br-none"
                  : "bg-gray-700 text-white rounded-bl-none"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="text-gray-400 text-sm animate-pulse">Bot is typing...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex p-2 border-t border-gray-700 bg-gray-900">
        <input
          className="flex-1 border-none bg-gray-800 text-white rounded-l-full px-4 py-2 placeholder-gray-400 focus:outline-none"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2 rounded-r-full transition-all duration-200 disabled:opacity-50"
          onClick={sendMessage}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatbotPanel;
