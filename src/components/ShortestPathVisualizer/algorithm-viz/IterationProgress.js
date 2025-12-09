import React from 'react';

/**
 * Displays iteration progress for Bellman-Ford algorithm with negative cycle detection.
 */
const IterationProgress = ({ iterationCount, totalNodes, negativeCycleDetected }) => {
  const progress = (iterationCount / Math.max(totalNodes, 1)) * 100;

  return (
    <div className="bg-white/95 shadow-lg rounded-lg p-3 backdrop-blur-sm border border-indigo-200/50">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-sm font-bold text-indigo-800">Current Iteration</h3>
        {negativeCycleDetected && (
          <span className="px-2 py-1 bg-rose-100 text-rose-800 text-xs font-medium rounded-full animate-pulse border border-rose-200">
            Negative Cycle!
          </span>
        )}
      </div>
      <div className="border border-zinc-200 p-2 rounded bg-white">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700 tabular-nums">
            {iterationCount} of {totalNodes}
          </span>
          <div className="w-24 bg-zinc-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-indigo-500 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default IterationProgress;

