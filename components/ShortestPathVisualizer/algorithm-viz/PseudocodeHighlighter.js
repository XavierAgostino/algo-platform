import React from 'react';

/**
 * Displays algorithm pseudocode with line highlighting based on current step.
 */
const PseudocodeHighlighter = ({ algorithm, currentAlgorithmStep }) => {
  // Map algorithm steps to pseudocode line numbers
  const getHighlightedLine = (step) => {
    if (!step) return null;
    
    const stepToLineMap = {
      'Initialize': 1,
      'Push source': 2,
      'Extract Min': algorithm === 'dijkstra' ? 4 : null,
      'Relax': algorithm === 'dijkstra' ? 6 : 4,
      'Check Negative Cycles': algorithm === 'dijkstra' ? null : 6,
      'Early Exit': algorithm === 'dijkstra' ? null : 3,
      'Done': algorithm === 'dijkstra' ? 7 : 6,
    };
    
    return stepToLineMap[step];
  };

  const highlightedLine = getHighlightedLine(currentAlgorithmStep);

  const dijkstraCode = [
    "1. Initialize distance to source as 0",
    "2. Priority queue ← all nodes",
    "3. while queue not empty:",
    "4.   u ← node with min distance",
    "5.   for each neighbor v of u:",
    "6.     if dist[v] > dist[u] + w(u,v):",
    "7.       update dist[v]"
  ];
  
  const bellmanFordCode = [
    "1. Initialize distance to source as 0",
    "2. for i from 1 to |V|-1:",
    "3.   for each edge (u, v):",
    "4.     if dist[v] > dist[u] + w(u,v):",
    "5.       update dist[v]",
    "6. Check for negative cycles"
  ];
  
  const code = algorithm === 'dijkstra' ? dijkstraCode : bellmanFordCode;

  return (
    <div className="bg-white/90 dark:bg-zinc-900/90 shadow-lg rounded-lg p-3 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-sm font-bold mb-2 text-indigo-700 dark:text-indigo-400">Algorithm Pseudocode</h3>
      <div className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg overflow-x-auto border border-zinc-200 dark:border-zinc-700">
        <div className="font-mono text-xs space-y-0.5">
          {code.map((line, index) => {
            const isHighlighted = highlightedLine === index + 1;
            return (
              <div 
                key={index} 
                className={`p-1 rounded transition-colors ${
                  isHighlighted 
                    ? 'bg-amber-400 dark:bg-amber-500/30 border-l-2 border-amber-500 pl-2 text-black dark:text-amber-200 font-medium' 
                    : 'text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                {line}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PseudocodeHighlighter;

