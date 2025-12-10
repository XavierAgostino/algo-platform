// AlgorithmVisualizer.js
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import {
  CurrentStepCard,
  DistanceTable,
  MinHeapVisualization,
  IterationProgress,
  PseudocodeHighlighter,
  EdgeRelaxationCard,
} from './algorithm-viz';

/**
 * AlgorithmVisualizer - Main container for algorithm state visualization.
 * 
 * This component renders a side panel showing:
 * - Current step progress
 * - Distance array
 * - Priority queue (Dijkstra) or iteration count (Bellman-Ford)
 * - Edge relaxation visualization
 * - Algorithm pseudocode with highlighting
 * 
 * @param {Object} props
 * @param {'dijkstra'|'bellmanford'} props.algorithm - Current algorithm
 * @param {Array} props.nodes - Graph nodes
 * @param {Array} props.edges - Graph edges
 * @param {Object} props.distanceArray - Current distances from source
 * @param {Array} props.minHeap - Priority queue items (Dijkstra only)
 * @param {number} props.iterationCount - Current iteration (Bellman-Ford only)
 * @param {boolean} props.negativeCycleDetected - Whether negative cycle found
 * @param {number} props.currentStep - Current step index
 * @param {Array} props.steps - All algorithm steps
 * @param {Set} props.visitedNodes - Set of visited node IDs
 * @param {string} props.currentAlgorithmStep - Current step action name
 * @param {string} props.currentEdge - ID of edge being relaxed
 * @param {Array} props.recentlyUpdatedDistances - Node IDs with updated distances
 */
const AlgorithmVisualizer = ({ 
  algorithm, 
  nodes, 
  edges,
  distanceArray, 
  minHeap, 
  iterationCount, 
  negativeCycleDetected,
  currentStep, 
  steps, 
  visitedNodes, 
  currentAlgorithmStep,
  currentEdge,
  recentlyUpdatedDistances,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [showPulse, setShowPulse] = useState(false);
  
  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Persist visibility preference
  useEffect(() => {
    const savedVisibility = localStorage.getItem('algorithmPanelVisible');
    if (savedVisibility !== null) {
      setIsVisible(savedVisibility === 'true');
    } else {
      // First time visitor - show pulse animation
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 3000);
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('algorithmPanelVisible', isVisible);
  }, [isVisible]);
  
  // Don't render on mobile - there's already a mobile visualization
  if (isMobile) {
    return null;
  }

  return (
    <>
      {/* Toggle button */}
      <div className="absolute top-3 left-3 z-30 group">
        <button 
          onClick={() => setIsVisible(!isVisible)}
          className={`bg-indigo-500 hover:bg-indigo-600 text-white rounded-full shadow-lg transition-all ${
            isVisible ? 'p-2' : 'p-3'
          } ${showPulse ? 'animate-pulse' : ''}`}
          aria-label={isVisible ? "Hide algorithm steps" : "Show algorithm steps"}
        >
          {isVisible ? (
            <Eye className="h-5 w-5" />
          ) : (
            <EyeOff className="h-6 w-6" />
          )}
        </button>
        
        {/* Tooltip */}
        <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-gray-900 text-white text-sm rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {isVisible ? "Hide" : "Show"} Algorithm Steps
        </div>
      </div>
      
      {/* Main panel */}
      {isVisible && (
        <div className="absolute top-0 left-0 z-20 w-72 max-h-full overflow-y-auto bg-black/5 h-full">
          <div className="p-3 space-y-2">
            {/* Current Step */}
            <CurrentStepCard
              currentStep={currentStep}
              totalSteps={steps?.length}
              currentAlgorithmStep={currentAlgorithmStep}
            />
            
            {/* Edge Relaxation (when relaxing) */}
            {currentAlgorithmStep === 'Relax' && (
              <EdgeRelaxationCard
                currentEdge={currentEdge}
                edges={edges}
                nodes={nodes}
                distanceArray={distanceArray}
              />
            )}

            {/* Algorithm-specific visualizations */}
            {algorithm === 'dijkstra' ? (
              <>
                <DistanceTable
                  distanceArray={distanceArray}
                  nodes={nodes}
                  visitedNodes={visitedNodes}
                  recentlyUpdatedDistances={recentlyUpdatedDistances}
                />
                <MinHeapVisualization
                  minHeap={minHeap}
                  nodes={nodes}
                />
              </>
            ) : (
              <>
                <DistanceTable
                  distanceArray={distanceArray}
                  nodes={nodes}
                  visitedNodes={visitedNodes}
                  recentlyUpdatedDistances={recentlyUpdatedDistances}
                />
                <IterationProgress
                  iterationCount={iterationCount}
                  totalNodes={nodes.length}
                  negativeCycleDetected={negativeCycleDetected}
                />
              </>
            )}
            
            {/* Pseudocode */}
            <PseudocodeHighlighter
              algorithm={algorithm}
              currentAlgorithmStep={currentAlgorithmStep}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default AlgorithmVisualizer;
