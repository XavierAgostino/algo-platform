import React from 'react';

/**
 * Displays the priority queue / min heap visualization for Dijkstra's algorithm.
 */
const MinHeapVisualization = ({ minHeap, nodes }) => {
  const hasData = minHeap && minHeap.length > 0;

  return (
    <div className="bg-white/90 dark:bg-zinc-900/90 shadow-lg rounded-lg p-3 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800">
      <h3 className="text-sm font-bold mb-1 text-indigo-700 dark:text-indigo-400">Priority Queue (Min Heap)</h3>
      <div className="border border-zinc-200 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 overflow-hidden">
        {hasData ? (
          <table className="w-full border-collapse text-sm">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="p-1 text-left border-b border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-medium">Node</th>
                <th className="p-1 text-left border-b border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-medium">Distance</th>
              </tr>
            </thead>
            <tbody>
              {minHeap.map((item, i) => (
                <tr key={i} className={i === 0 ? 'bg-amber-50 dark:bg-amber-900/20 font-medium' : ''}>
                  <td className="p-1 border-b border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full mr-1.5 inline-flex items-center justify-center text-xs font-medium
                        ${i === 0 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-zinc-200 dark:bg-zinc-600 text-zinc-600 dark:text-zinc-200'}`}
                      >
                        {nodes[item.id]?.label}
                      </div>
                    </div>
                  </td>
                  <td className="p-1 border-b border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300">
                    <span className={i === 0 ? 'font-medium text-amber-700 dark:text-amber-400' : ''}>{item.dist}</span>
                    {i === 0 && <span className="ml-1 text-xs text-amber-600 dark:text-amber-400">← next</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-zinc-400 dark:text-zinc-500 text-center py-3 px-2 text-sm">Empty</div>
        )}
      </div>
    </div>
  );
};

export default MinHeapVisualization;

