import React from 'react';

/**
 * Displays the distance array as a table with visual highlighting.
 */
const DistanceTable = ({ 
  distanceArray, 
  nodes, 
  visitedNodes, 
  recentlyUpdatedDistances 
}) => {
  // Function to determine distance cell background color
  const getDistanceColor = (distance, nodeId) => {
    if (recentlyUpdatedDistances?.includes(Number(nodeId))) {
      return 'bg-amber-100 animate-pulse';
    }
    if (distance === Infinity) return 'bg-zinc-50';
    if (distance === 0) return 'bg-emerald-100';
    if (visitedNodes?.has(Number(nodeId))) {
      const recentlyVisited = Array.from(visitedNodes).pop() === Number(nodeId);
      if (recentlyVisited) return 'bg-indigo-100 animate-pulse';
      return 'bg-indigo-50';
    }
    return 'bg-zinc-50';
  };

  const hasData = Object.keys(distanceArray).length > 0;

  return (
    <div className="bg-white/95 shadow-lg rounded-lg p-3 backdrop-blur-sm border border-indigo-200/50">
      <h3 className="text-sm font-bold mb-1 text-indigo-800">Distances from Source</h3>
      <div className="border border-zinc-200 rounded bg-white overflow-hidden">
        {hasData ? (
          <table className="w-full border-collapse text-sm">
            <thead className="bg-zinc-50">
              <tr>
                <th className="p-1 text-left border-b text-zinc-600 font-medium">Node</th>
                <th className="p-1 text-left border-b text-zinc-600 font-medium">Distance</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(distanceArray).sort().map((nodeId) => {
                const isVisited = visitedNodes?.has(Number(nodeId));
                const isRecentlyUpdated = recentlyUpdatedDistances?.includes(Number(nodeId));
                
                return (
                  <tr 
                    key={nodeId} 
                    className={`${isVisited ? 'font-medium' : ''} ${isRecentlyUpdated ? 'bg-amber-50' : ''}`}
                  >
                    <td className={`p-1 border-b ${isVisited ? 'text-indigo-800' : ''}`}>
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full mr-1.5 inline-flex items-center justify-center text-xs font-medium
                          ${isVisited 
                            ? 'bg-indigo-500 text-white' 
                            : 'bg-zinc-200 text-zinc-600'}`}
                        >
                          {nodes[nodeId]?.label}
                        </div>
                      </div>
                    </td>
                    <td className={`p-1 border-b transition-colors duration-300 ${getDistanceColor(distanceArray[nodeId], nodeId)}`}>
                      {distanceArray[nodeId] === Infinity ? (
                        <span className="text-zinc-400">∞</span>
                      ) : (
                        <span className={isRecentlyUpdated ? 'animate-bounce' : ''}>
                          {distanceArray[nodeId]}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-zinc-400 text-center py-3 px-2 text-sm">No data yet</div>
        )}
      </div>
    </div>
  );
};

export default DistanceTable;

