import React from 'react';
import { BarChart3, Link, Network } from 'lucide-react';

interface HeaderProps {
  currentPage: 'simulation' | 'analysis';
  onPageChange: (page: 'simulation' | 'analysis') => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onPageChange }) => {
  const handlePageChange = () => {
    onPageChange(currentPage === 'simulation' ? 'analysis' : 'simulation');
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
          onClick={handlePageChange}
          className={`flex items-center px-4 py-2 rounded-lg font-medium text-sm ${
            currentPage === 'analysis'
              ? 'bg-gray-600 hover:bg-gray-700'
              : 'bg-blue-500 hover:bg-blue-600'
          } text-white transition-colors`}
        >
          <BarChart3 className="w-4 h-4 mr-2" />
          {currentPage === 'simulation' ? 'Analysis' : 'Simulation'}
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