import React from 'react';
import { Network } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="bg-gray-800 text-white p-4 border-b border-gray-700 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Network className="h-8 w-8 text-green-400" />
        <div>
          <h1 className="font-bold text-xl">Ant Colony Routing Simulation</h1>
          <p className="text-sm text-gray-400">Interactive network path optimization</p>
        </div>
      </div>
      <div>
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