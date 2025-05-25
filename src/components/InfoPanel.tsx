import React from 'react';
import { useNetworkStore } from '../store/networkStore';
import { motion } from 'framer-motion';
import { Network, Link, ArrowRight, Info } from 'lucide-react';

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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="p-4 flex-1 overflow-auto"
    >
      <motion.h2 
        variants={itemVariants}
        className="text-2xl font-semibold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent tracking-tight font-sans"
      >
        Simulation Info
      </motion.h2>
      
      <div className="space-y-4">
        <motion.div variants={itemVariants} className="card p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Network className="w-4 h-4 text-primary-400" />
            <h3 className="text-sm font-medium text-gray-300">Network Stats</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-gray-400">Devices/Routers:</div>
            <div className="text-right text-primary-400 font-medium">{nodes.length}</div>
            <div className="text-gray-400">Connections:</div>
            <div className="text-right text-primary-400 font-medium">{edges.length}</div>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="card p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Link className="w-4 h-4 text-primary-400" />
            <h3 className="text-sm font-medium text-gray-300">Selected Nodes</h3>
          </div>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Source:</span>
              <span className="px-3 py-1 bg-green-900/50 rounded-full text-green-300 text-xs font-medium">
                {sourceNode ? sourceNode.label : 'None'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Target:</span>
              <span className="px-3 py-1 bg-red-900/50 rounded-full text-red-300 text-xs font-medium">
                {targetNode ? targetNode.label : 'None'}
              </span>
            </div>
          </div>
        </motion.div>
        
        {simulationRunning && (
          <motion.div 
            variants={itemVariants}
            className="card p-4 bg-primary-900/20 border-primary-500/20"
            animate={{ 
              boxShadow: [
                "0 0 0 0 rgba(59, 130, 246, 0)",
                "0 0 0 10px rgba(59, 130, 246, 0.1)",
                "0 0 0 0 rgba(59, 130, 246, 0)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="flex items-center space-x-2 mb-3">
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
              <h3 className="text-sm font-medium text-primary-400">Simulation Running</h3>
            </div>
            <div className="text-sm text-gray-300">
              Iterations: <span className="text-primary-400 font-medium">{iterations}</span>
            </div>
          </motion.div>
        )}
        
        {bestPathDistance !== Infinity && bestPathNodes.length > 0 && (
          <motion.div variants={itemVariants} className="card p-4">
            <div className="flex items-center space-x-2 mb-3">
              <ArrowRight className="w-4 h-4 text-primary-400" />
              <h3 className="text-sm font-medium text-gray-300">Best Path</h3>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Distance:</span>
                <span className="text-primary-400 font-medium">{bestPathDistance.toFixed(2)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-400 mb-1">Route:</span>
                <div className="text-xs bg-gray-800/50 p-3 rounded-lg backdrop-blur-sm overflow-x-auto">
                  {bestPathNodes.map((nodeId, index) => {
                    const node = nodes.find(n => n.id === nodeId);
                    return (
                      <span key={nodeId} className="inline-flex items-center">
                        <span className="px-2 py-0.5 bg-gray-700 rounded-full">
                          {node?.label || nodeId}
                        </span>
                        {index < bestPathNodes.length - 1 && (
                          <span className="text-primary-400 mx-2">→</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
        
  
      </div>
    </motion.div>
  );
};

export default InfoPanel;