import React from 'react';
import { BarChart3, Link, Network, GitCompare, MessageSquare } from 'lucide-react';

interface HeaderProps {
  currentPage: 'simulation' | 'analysis' | 'compare' | 'chatbot';
  onPageChange: (page: 'simulation' | 'analysis' | 'compare' | 'chatbot') => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onPageChange }) => {
  const handlePageChange = (page: 'simulation' | 'analysis' | 'compare' | 'chatbot') => {
    onPageChange(page);
  };

  return (
    <header className="bg-gray-800 text-white p-4 border-b border-gray-700 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Network className="h-8 w-8 text-green-400" />
        <div>
          <h1 className="font-bold text-xl">Ant Colony Routing Simulation</h1>
          <p className="text-sm text-gray-400">Interactive network path optimization</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          onClick={() => handlePageChange('simulation')}
          className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm ${
            currentPage === 'simulation'
              ? 'bg-blue-500 hover:bg-blue-600'
              : 'bg-gray-600 hover:bg-gray-700'
          } text-white transition-colors`}
        >
          <Network className="w-4 h-4 mr-2" />
          Simulation
        </button>
        <button
          onClick={() => handlePageChange('analysis')}
          className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm ${
            currentPage === 'analysis'
              ? 'bg-blue-500 hover:bg-blue-600'
              : 'bg-gray-600 hover:bg-gray-700'
          } text-white transition-colors`}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          Analysis
        </button>
        <button
          onClick={() => handlePageChange('compare')}
          className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm ${
            currentPage === 'compare'
              ? 'bg-blue-500 hover:bg-blue-600'
              : 'bg-gray-600 hover:bg-gray-700'
          } text-white transition-colors`}
        >
          <GitCompare className="w-4 h-4 mr-2" />
          Compare Networks
        </button>
        <button
          onClick={() => handlePageChange('chatbot')}
          className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm ${
            currentPage === 'chatbot'
              ? 'bg-blue-500 hover:bg-blue-600'
              : 'bg-gray-600 hover:bg-gray-700'
          } text-white transition-colors`}
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Chatbot
        </button>
        <a 
          href="https://github.com/YOUR_REPO" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-white text-sm flex items-center"
        >
          <span>GitHub</span>
        </a>
      </div>
    </header>
  );
};

export default Header;