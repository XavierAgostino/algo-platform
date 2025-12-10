import { useState, useEffect, useRef, useCallback } from 'react';
import { generateDijkstraSteps } from '../DijkstraSteps';
import { generateBellmanFordSteps } from '../BellmanFordSteps';

/**
 * Custom hook for managing algorithm execution state and controls.
 * Manages all algorithm-related state internally for better separation of concerns.
 * 
 * @param {Object} params - Hook parameters
 * @param {Array} params.nodes - Array of node objects
 * @param {Array} params.edges - Array of edge objects (managed by component, hook returns updates)
 * @param {number|null} params.selectedSourceNode - Index of the source node
 * @param {Object} params.graphParams - Graph configuration parameters
 * @param {number} params.animationSpeed - Animation delay in milliseconds
 * 
 * @returns {Object} Algorithm runner state and controls
 */
export function useAlgorithmRunner({
  nodes,
  edges,
  selectedSourceNode,
  graphParams,
  animationSpeed,
}) {
  // =========================
  //   ALGORITHM CONFIGURATION
  // =========================
  const [algorithm, setAlgorithmInternal] = useState("dijkstra");
  const [visualizationMode, setVisualizationMode] = useState("explore");
  
  // =========================
  //   RUNNER STATE
  // =========================
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  
  // =========================
  //   ALGORITHM DATA STRUCTURES
  // =========================
  const [distanceArray, setDistanceArray] = useState({});
  const [visitedNodes, setVisitedNodes] = useState(new Set());
  const [minHeap, setMinHeap] = useState([]);
  const [iterationCount, setIterationCount] = useState(0);
  const [negativeCycleDetected, setNegativeCycleDetected] = useState(false);
  const [currentAlgorithmStep, setCurrentAlgorithmStep] = useState("");
  const [shortestPathResult, setShortestPathResult] = useState({
    distances: {},
    paths: {},
  });
  const [explanation, setExplanation] = useState("");
  
  // =========================
  //   EDGE TRACKING STATE
  // =========================
  const [currentRelaxingEdge, setCurrentRelaxingEdge] = useState(null);
  const [recentlyUpdatedDistances, setRecentlyUpdatedDistances] = useState([]);
  const [confirmedPathEdges, setConfirmedPathEdges] = useState(new Set());
  
  // =========================
  //   EDGE UPDATES (for component to apply)
  // =========================
  const [edgeUpdates, setEdgeUpdates] = useState(null);

  // Ref for animation timeout
  const animationFrameId = useRef(null);

  // =========================
  //   APPLY STEP - Core step application logic
  // =========================
  const applyStep = useCallback((stepIndex, currentEdges) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return currentEdges;
    const step = steps[stepIndex];
  
    // Start with edges that have unvisited status, but preserve confirmed path edges
    const resetEdges = currentEdges.map((e) => {
      // If this edge is part of a confirmed path, keep its status
      if (confirmedPathEdges.has(e.id)) {
        return { ...e, status: "included" };
      }
      return { ...e, status: "unvisited" };
    });
  
    // Apply step changes
    const newEdges = [...resetEdges];
    step.edgeUpdates.forEach((update) => {
      const idx = newEdges.findIndex((e) => e.id === update.id);
      if (idx !== -1) {
        newEdges[idx] = { ...newEdges[idx], status: update.status };
      }
    });
  
    // Track edge being relaxed
    setCurrentRelaxingEdge(step.currentEdgeBeingRelaxed || null);
    
    // Track distance updates
    setRecentlyUpdatedDistances(step.updatedDistances || []);
  
    // Update confirmed path edges if this step adds to the path
    if (step.pathEdgeUpdates && step.pathEdgeUpdates.length > 0) {
      const newConfirmedEdges = new Set(confirmedPathEdges);
      step.pathEdgeUpdates.forEach((edgeId) => {
        newConfirmedEdges.add(edgeId);
  
        // Also update the edge status to 'included'
        const idx = newEdges.findIndex((e) => e.id === edgeId);
        if (idx !== -1) {
          newEdges[idx] = { ...newEdges[idx], status: "included" };
        }
      });
      setConfirmedPathEdges(newConfirmedEdges);
    }
  
    // Update all algorithm states
    setExplanation(step.explanation);
    setCurrentAlgorithmStep(step.algorithmStep || "");
    setVisitedNodes(new Set(step.visitedNodes || []));
    setMinHeap([...(step.minHeap || [])]);
    setDistanceArray({ ...(step.distanceArray || {}) });
    setIterationCount(step.iterationCount || 0);
    setNegativeCycleDetected(step.negativeCycleDetected || false);
    
    // Return updated edges for component to apply
    return newEdges;
  }, [steps, confirmedPathEdges]);

  // =========================
  //   STEP GENERATION
  // =========================
  const generateSteps = useCallback(() => {
    const stepList =
      algorithm === 'dijkstra'
        ? generateDijkstraSteps({
            nodes,
            edges,
            selectedSourceNode,
            graphParams,
            setShortestPathResult,
          })
        : generateBellmanFordSteps({
            nodes,
            edges,
            selectedSourceNode,
            graphParams,
            setShortestPathResult,
          });
    setSteps(stepList);
    return stepList;
  }, [algorithm, nodes, edges, selectedSourceNode, graphParams]);

  // =========================
  //   PLAY / PAUSE
  // =========================
  const play = useCallback(() => {
    if (isRunning) {
      // Toggle pause
      setIsPaused(!isPaused);
    } else {
      // Start running
      setIsRunning(true);
      setIsPaused(false);
      if (steps.length === 0) {
        generateSteps();
      }
    }
  }, [isRunning, isPaused, steps.length, generateSteps]);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  // =========================
  //   STEP FORWARD
  // =========================
  const step = useCallback(() => {
    if (visualizationMode === 'view') {
      setExplanation('In View mode. Switch to Explore mode to step through the algorithm.');
      return;
    }

    let currentSteps = steps;
    if (currentSteps.length === 0) {
      currentSteps = generateSteps();
    }

    if (currentStep < currentSteps.length) {
      const updatedEdges = applyStep(currentStep, edges);
      setEdgeUpdates(updatedEdges);
      setCurrentStep(currentStep + 1);
    }
  }, [visualizationMode, steps, currentStep, edges, generateSteps, applyStep]);

  // =========================
  //   STEP BACKWARD
  // =========================
  const backStep = useCallback(() => {
    if (visualizationMode === 'view') {
      setExplanation('In View mode. Switch to Explore mode to step through the algorithm.');
      return;
    }

    if (currentStep > 0) {
      const newStep = currentStep - 1;
      
      // Recompute confirmed path edges from previous steps
      const newConfirmedEdges = new Set();
      for (let i = 0; i <= newStep; i++) {
        if (steps[i]?.pathEdgeUpdates) {
          steps[i].pathEdgeUpdates.forEach((edgeId) => {
            newConfirmedEdges.add(edgeId);
          });
        }
      }
      setConfirmedPathEdges(newConfirmedEdges);
      
      const updatedEdges = applyStep(newStep, edges);
      setEdgeUpdates(updatedEdges);
      setCurrentStep(newStep);
    }
  }, [visualizationMode, currentStep, steps, edges, applyStep]);

  // =========================
  //   FORWARD TO SIGNIFICANT EVENT
  // =========================
  const forwardStep = useCallback(() => {
    if (visualizationMode === 'view') {
      setExplanation('In View mode. Switch to Explore mode to step through the algorithm.');
      return;
    }

    let currentSteps = steps;
    if (currentSteps.length === 0) {
      currentSteps = generateSteps();
    }

    // Skip ahead to the next significant event
    if (currentStep < currentSteps.length) {
      let significantStepFound = false;
      let nextStep = currentStep;

      while (nextStep < currentSteps.length && !significantStepFound) {
        const stepData = currentSteps[nextStep];

        // Check if this step contains a significant event
        if (
          (stepData.pathEdgeUpdates && stepData.pathEdgeUpdates.length > 0) ||
          (stepData.visitedNodes && stepData.visitedNodes.size > (visitedNodes?.size || 0)) ||
          stepData.negativeCycleDetected
        ) {
          significantStepFound = true;
        } else {
          nextStep++;
        }
      }

      // Apply the final significant step
      if (nextStep < currentSteps.length) {
        const updatedEdges = applyStep(nextStep, edges);
        setEdgeUpdates(updatedEdges);
      }

      setCurrentStep(Math.min(nextStep + 1, currentSteps.length));

      if (nextStep >= currentSteps.length) {
        setExplanation('Reached the end of the algorithm execution.');
      }
    }
  }, [visualizationMode, steps, currentStep, edges, visitedNodes, generateSteps, applyStep]);

  // =========================
  //   ALGORITHM CHANGE
  // =========================
  const setAlgorithm = useCallback((newAlgorithm) => {
    setAlgorithmInternal(newAlgorithm);
    // Reset execution state when algorithm changes
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    setSteps([]);
    setConfirmedPathEdges(new Set());
    setDistanceArray({});
    setVisitedNodes(new Set());
    setMinHeap([]);
    setIterationCount(0);
    setNegativeCycleDetected(false);
    setCurrentAlgorithmStep("");
    setShortestPathResult({ distances: {}, paths: {} });
    setExplanation("");
    setCurrentRelaxingEdge(null);
    setRecentlyUpdatedDistances([]);
    setShowAnswer(false);
    
    if (animationFrameId.current) {
      clearTimeout(animationFrameId.current);
      animationFrameId.current = null;
    }
  }, []);

  // =========================
  //   RESET
  // =========================
  const reset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    setSteps([]);
    setConfirmedPathEdges(new Set());
    setDistanceArray({});
    setVisitedNodes(new Set());
    setMinHeap([]);
    setIterationCount(0);
    setNegativeCycleDetected(false);
    setCurrentAlgorithmStep("");
    setShortestPathResult({ distances: {}, paths: {} });
    setExplanation("");
    setCurrentRelaxingEdge(null);
    setRecentlyUpdatedDistances([]);
    setShowAnswer(false);
    
    // Clear animation timeout
    if (animationFrameId.current) {
      clearTimeout(animationFrameId.current);
      animationFrameId.current = null;
    }
  }, []);

  // =========================
  //   ANIMATION LOOP
  // =========================
  useEffect(() => {
    if (isRunning && !isPaused && visualizationMode === 'explore') {
      const animate = () => {
        if (currentStep < steps.length) {
          const updatedEdges = applyStep(currentStep, edges);
          setEdgeUpdates(updatedEdges);
          setCurrentStep((prev) => prev + 1);
          animationFrameId.current = setTimeout(animate, animationSpeed);
        } else {
          // Algorithm completed - clear animation states to stop blinking
          setIsRunning(false);
          setCurrentRelaxingEdge(null);
          setRecentlyUpdatedDistances([]);
        }
      };
      animationFrameId.current = setTimeout(animate, animationSpeed);
    }

    return () => {
      if (animationFrameId.current) {
        clearTimeout(animationFrameId.current);
      }
    };
  }, [isRunning, isPaused, currentStep, steps, edges, animationSpeed, visualizationMode, applyStep]);

  // =========================
  //   CLEANUP ON UNMOUNT
  // =========================
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        clearTimeout(animationFrameId.current);
      }
    };
  }, []);

  return {
    // Execution State
    algorithm,
    isRunning,
    isPaused,
    currentStep,
    steps,
    showAnswer,
    explanation,
    visualizationMode,
    
    // Algorithm Data Structures
    distanceArray,
    visitedNodes,
    minHeap,
    iterationCount,
    negativeCycleDetected,
    currentAlgorithmStep,
    shortestPathResult,
    
    // Edge Tracking
    currentRelaxingEdge,
    recentlyUpdatedDistances,
    confirmedPathEdges,
    
    // Edge Updates (for component to apply)
    edgeUpdates,
    
    // Controls
    setAlgorithm,
    setShowAnswer,
    setVisualizationMode,
    play,
    pause,
    resume,
    step,
    backStep,
    forwardStep,
    reset,
    generateSteps,
    
    // Setters for external control
    setSteps,
    setCurrentStep,
    setIsRunning,
    setIsPaused,
    setExplanation,
  };
}

export default useAlgorithmRunner;

