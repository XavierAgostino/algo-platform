import React from 'react';

/**
 * Displays the priority queue / min heap visualization for Dijkstra's algorithm.
 */
const MinHeapVisualization = ({ minHeap, nodes }) => {
  const hasData = minHeap && minHeap.length > 0;

  return (
    <div className="bg-white/95 shadow-lg rounded-lg p-3 backdrop-blur-sm border border-indigo-200/50">
      <h3 className="text-sm font-bold mb-1 text-indigo-800">Priority Queue (Min Heap)</h3>
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
              {minHeap.map((item, i) => (
                <tr key={i} className={i === 0 ? 'bg-amber-50 font-medium' : ''}>
                  <td className="p-1 border-b">
                    <div className="flex items-center">
                      <div className={`w-5 h-5 rounded-full mr-1.5 inline-flex items-center justify-center text-xs font-medium
                        ${i === 0 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-zinc-200 text-zinc-600'}`}
                      >
                        {nodes[item.id]?.label}
                      </div>
                    </div>
                  </td>
                  <td className="p-1 border-b">
                    <span className={i === 0 ? 'font-medium text-amber-700' : ''}>{item.dist}</span>
                    {i === 0 && <span className="ml-1 text-xs text-amber-600">← next</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-zinc-400 text-center py-3 px-2 text-sm">Empty</div>
        )}
      </div>
    </div>
  );
};

export default MinHeapVisualization;

