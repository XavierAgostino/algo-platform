import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * Visualizes the current edge relaxation step with source/target nodes and calculation.
 */
const EdgeRelaxationCard = ({ currentEdge, edges, nodes, distanceArray }) => {
  if (!currentEdge) return null;
  
  const edge = edges.find(e => e.id === currentEdge);
  if (!edge) return null;
  
  const sourceNode = nodes[edge.source];
  const targetNode = nodes[edge.target];
  if (!sourceNode || !targetNode) return null;
  
  const sourceDistance = distanceArray[edge.source] ?? Infinity;
  const targetDistance = distanceArray[edge.target] ?? Infinity;
  const newDistance = sourceDistance === Infinity ? Infinity : sourceDistance + edge.weight;
  const isImprovement = newDistance < targetDistance;

  return (
    <div className="bg-white/95 shadow-lg rounded-lg p-3 backdrop-blur-sm border border-indigo-200/50">
      <h3 className="text-sm font-bold mb-2 text-indigo-800">Edge Relaxation</h3>
      
      {/* Visual representation */}
      <div className="flex items-center justify-center gap-2 mb-3 p-2 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg">
        {/* Source Node */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
            {sourceNode.label}
          </div>
          <span className="text-[10px] text-indigo-600 font-medium mt-1">
            d={sourceDistance === Infinity ? '∞' : sourceDistance}
          </span>
        </div>
        
        {/* Arrow with weight */}
        <div className="flex flex-col items-center px-2">
          <div className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-bold border border-amber-200">
            +{edge.weight}
          </div>
          <ArrowRight className="w-6 h-6 text-zinc-400 mt-0.5" />
        </div>
        
        {/* Target Node */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 bg-violet-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
            {targetNode.label}
          </div>
          <span className="text-[10px] text-violet-600 font-medium mt-1">
            d={targetDistance === Infinity ? '∞' : targetDistance}
          </span>
        </div>
      </div>
      
      {/* Calculation breakdown */}
      <div className="text-xs bg-zinc-50 p-2 rounded border border-zinc-200 space-y-1">
        <div className="flex justify-between text-zinc-600">
          <span>Current dist to {targetNode.label}:</span>
          <span className="font-mono">{targetDistance === Infinity ? '∞' : targetDistance}</span>
        </div>
        <div className="flex justify-between text-zinc-600">
          <span>New potential dist:</span>
          <span className="font-mono">
            {sourceDistance === Infinity ? '∞' : `${sourceDistance} + ${edge.weight} = ${newDistance}`}
          </span>
        </div>
        
        {/* Result */}
        <div className={`mt-2 p-1.5 rounded text-center font-medium ${
          isImprovement 
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
            : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
        }`}>
          {isImprovement ? (
            <span>✓ Update! {targetDistance === Infinity ? '∞' : targetDistance} → {newDistance}</span>
          ) : (
            <span>— No improvement needed</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EdgeRelaxationCard;

