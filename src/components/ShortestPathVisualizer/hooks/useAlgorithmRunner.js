import { useState, useEffect, useRef, useCallback } from 'react';
import { generateDijkstraSteps } from '../DijkstraSteps';
import { generateBellmanFordSteps } from '../BellmanFordSteps';

/**
 * Custom hook for managing algorithm execution state and controls.
 * Extracts the algorithm runner logic from ShortestPathVisualizer for better separation of concerns.
 * 
 * @param {Object} params - Hook parameters
 * @param {string} params.algorithm - 'dijkstra' or 'bellmanford'
 * @param {Array} params.nodes - Array of node objects
 * @param {Array} params.edges - Array of edge objects
 * @param {number|null} params.selectedSourceNode - Index of the source node
 * @param {Object} params.graphParams - Graph configuration parameters
 * @param {string} params.visualizationMode - 'explore' or 'view'
 * @param {number} params.animationSpeed - Animation delay in milliseconds
 * @param {Function} params.onStepApply - Callback to apply a step's changes to the visualization
 * @param {Function} params.setShortestPathResult - Setter for shortest path results
 * @param {Function} params.setExplanation - Setter for explanation text
 * 
 * @returns {Object} Algorithm runner state and controls
 */
export function useAlgorithmRunner({
  algorithm,
  nodes,
  edges,
  selectedSourceNode,
  graphParams,
  visualizationMode,
  animationSpeed,
  onStepApply,
  setShortestPathResult,
  setExplanation,
}) {
  // =========================
  //   RUNNER STATE
  // =========================
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);

  // Ref for animation timeout
  const animationFrameId = useRef(null);

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
  }, [algorithm, nodes, edges, selectedSourceNode, graphParams, setShortestPathResult]);

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
      onStepApply(currentStep, currentSteps);
      setCurrentStep(currentStep + 1);
    }
  }, [visualizationMode, steps, currentStep, generateSteps, onStepApply, setExplanation]);

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
      onStepApply(newStep, steps, { isBackward: true, previousStep: currentStep });
      setCurrentStep(newStep);
    }
  }, [visualizationMode, currentStep, steps, onStepApply, setExplanation]);

  // =========================
  //   FORWARD TO SIGNIFICANT EVENT
  // =========================
  const forwardStep = useCallback((visitedNodes) => {
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

      // Apply all steps up to the significant one
      for (let i = currentStep; i <= nextStep; i++) {
        if (i < currentSteps.length) {
          onStepApply(i, currentSteps, { isBatch: true });
        }
      }

      setCurrentStep(Math.min(nextStep + 1, currentSteps.length));

      if (nextStep >= currentSteps.length) {
        setExplanation('Reached the end of the algorithm execution.');
      }
    }
  }, [visualizationMode, steps, currentStep, generateSteps, onStepApply, setExplanation]);

  // =========================
  //   RESET
  // =========================
  const reset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    setSteps([]);
    
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
          onStepApply(currentStep, steps);
          setCurrentStep((prev) => prev + 1);
          animationFrameId.current = setTimeout(animate, animationSpeed);
        } else {
          setIsRunning(false);
        }
      };
      animationFrameId.current = setTimeout(animate, animationSpeed);
    }

    return () => {
      if (animationFrameId.current) {
        clearTimeout(animationFrameId.current);
      }
    };
  }, [isRunning, isPaused, currentStep, steps, animationSpeed, visualizationMode, onStepApply]);

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
    // State
    isRunning,
    isPaused,
    currentStep,
    steps,
    
    // Actions
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
  };
}

export default useAlgorithmRunner;

