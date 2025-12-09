import React, { useState, useEffect, useRef, useCallback } from "react";
// eslint-disable-next-line no-unused-vars
import _ from "lodash";

import GraphRenderer from "./GraphRenderer";
import { generateRandomGraph } from "./GraphGeneration";
import { generateDijkstraSteps } from "./DijkstraSteps";
import { generateBellmanFordSteps } from "./BellmanFordSteps";
import AlgorithmVisualizer from "./AlgorithmVisualizer";
// Custom hook available for algorithm runner logic (useAlgorithmRunner)
// Can be used to further separate concerns in future refactoring
// import { useAlgorithmRunner } from "./hooks/useAlgorithmRunner";

// Import mobile components
import MobileControls from "./MobileControls";
import MobileMetrics from "./MobileMetrics";
import ManualModeToolbar from "./ManualModeToolbar";
import WeightInputPopover from "./WeightInputPopover";

// Import shadcn/ui components
import { FloatingNav, FloatingNavItem, FloatingNavDivider } from "@/components/ui/floating-nav";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Import lucide-react icons
import { Play, Pause, SkipForward, RotateCcw, Eye, EyeOff, Settings, RefreshCw, HelpCircle, Route, LayoutGrid } from "lucide-react";

// Import Next.js Link
import Link from "next/link";

const ShortestPathVisualizer = () => {
  // =========================
  //       STATE
  // =========================
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const [algorithm, setAlgorithm] = useState("dijkstra");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [steps, setSteps] = useState([]);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentRelaxingEdge, setCurrentRelaxingEdge] = useState(null);
  const [recentlyUpdatedDistances, setRecentlyUpdatedDistances] = useState([]);

  // Track confirmed shortest path edges
  const [confirmedPathEdges, setConfirmedPathEdges] = useState(new Set());

  const [graphParams, setGraphParams] = useState({
    nodeCount: 6,
    density: 0.5,
    minWeight: 1,
    maxWeight: 20,
    allowNegativeEdges: false,
    sourceNode: 0,
    hasNegativeCycle: false,
  });

  const [mode, setMode] = useState("auto"); // 'auto' or 'manual'
  const [explanation, setExplanation] = useState("");
  const [shortestPathResult, setShortestPathResult] = useState({
    distances: {},
    paths: {},
  });
  const [animationSpeed, setAnimationSpeed] = useState(1000);
  const [showLegend, setShowLegend] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Algorithm-specific data structures
  const [distanceArray, setDistanceArray] = useState({});
  const [visitedNodes, setVisitedNodes] = useState(new Set());
  const [minHeap, setMinHeap] = useState([]);
  const [iterationCount, setIterationCount] = useState(0);
  const [negativeCycleDetected, setNegativeCycleDetected] = useState(false);
  const [currentAlgorithmStep, setCurrentAlgorithmStep] = useState("");

  // Manual mode enhancements
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [isAddingEdge, setIsAddingEdge] = useState(false);
  const [isDeletingNode, setIsDeletingNode] = useState(false);
  const [isDeletingEdge, setIsDeletingEdge] = useState(false);
  const [tempNode, setTempNode] = useState(null);
  const [selectedSourceNode, setSelectedSourceNode] = useState(null);
  const [selectedDestNode, setSelectedDestNode] = useState(null);
  const [isSelectingSource, setIsSelectingSource] = useState(false);
  const [isSelectingDest, setIsSelectingDest] = useState(false);

  // Visualization mode
  const [visualizationMode, setVisualizationMode] = useState("explore"); // 'explore' or 'view'

  // Mobile-specific states
  const [isMobile, setIsMobile] = useState(false);
  const [graphTransform, setGraphTransform] = useState({
    scale: 1,
    x: 0,
    y: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartInfo, setTouchStartInfo] = useState(null);

  // Weight input popover state
  const [weightPopover, setWeightPopover] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    pendingEdge: null, // { source, target }
  });

  // Refs
  const svgRef = useRef(null);
  const animationFrameId = useRef(null);

  // =========================
  //   MOBILE DETECTION
  // =========================
  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
    };

    // Check on mount
    checkMobile();

    // Add resize listener
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // =========================
  //   TOUCH HANDLING FOR GRAPH
  // =========================
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setTouchStartInfo({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        transform: { ...graphTransform },
      });
    } else if (e.touches.length === 2) {
      // Handle pinch zoom start
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setTouchStartInfo({
        dist,
        transform: { ...graphTransform },
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!touchStartInfo) return;

    if (isDragging && e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - touchStartInfo.x;
      const deltaY = e.touches[0].clientY - touchStartInfo.y;

      setGraphTransform({
        ...graphTransform,
        x: touchStartInfo.transform.x + deltaX / graphTransform.scale,
        y: touchStartInfo.transform.y + deltaY / graphTransform.scale,
      });
    } else if (e.touches.length === 2) {
      // Handle pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      const newScale =
        touchStartInfo.transform.scale * (dist / touchStartInfo.dist);
      // Limit scale between 0.5 and 3
      const clampedScale = Math.max(0.5, Math.min(newScale, 3));

      setGraphTransform({
        ...graphTransform,
        scale: clampedScale,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchStartInfo(null);
  };

  const resetGraphTransform = () => {
    setGraphTransform({ scale: 1, x: 0, y: 0 });
  };

  // =========================
  //   TOGGLE LEGEND & SIDEBAR
  // =========================
  const toggleLegend = () => setShowLegend(!showLegend);

  // =========================
  //   TOGGLE VISUALIZATION MODE
  // =========================
  const toggleVisualizationMode = () => {
    if (visualizationMode === "explore") {
      // Switch to View mode - show the final answer immediately
      setVisualizationMode("view");
      // Stop any running animation
      setIsRunning(false);
      setIsPaused(false);
      setExplanation(
        "View Mode: See the shortest paths instantly. Click the toggle to switch back to Explore mode."
      );
      // Show the answer
      handleShowAnswer();
    } else {
      // Switch back to Explore mode
      setVisualizationMode("explore");
      // Reset the graph state so user can step through again
      setShowAnswer(false);
      setConfirmedPathEdges(new Set());
      const resetEdges = edges.map((edge) => ({ ...edge, status: "unvisited" }));
      setEdges(resetEdges);
      setCurrentStep(0);
      setSteps([]);
      setExplanation(
        'Explore Mode: Step through the algorithm to see how it works. Press "Start" to begin.'
      );
    }
  };

  // =========================
  //   CLEAR GRAPH
  // =========================
  const clearGraph = () => {
    setNodes([]);
    setEdges([]);
    setVisitedNodes(new Set());
    setMinHeap([]);
    setDistanceArray({});
    setIterationCount(0);
    setNegativeCycleDetected(false);
    setCurrentAlgorithmStep("");
    setExplanation(
      "Graph cleared. You can now build a new graph from scratch."
    );
    setSelectedSourceNode(null);
    setSelectedDestNode(null);
    setConfirmedPathEdges(new Set());

    // Reset all algorithm-related states
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    setSteps([]);
    setShowAnswer(false);
    setVisualizationMode("explore");

    // Reset graph transform for mobile
    resetGraphTransform();
  };

  // =========================
  //   HANDLE SPEED CHANGE
  // =========================
  const handleSpeedChange = (e) => {
    const value = parseInt(e.target.value);
    // Convert slider value (1-5) to ms (2000ms to 200ms)
    const speed = 2200 - value * 400;
    setAnimationSpeed(speed);
  };

  // =========================
  //   GENERATE RANDOM GRAPH
  // =========================
  const handleGenerateRandomGraph = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    setSteps([]);
    setShowAnswer(false);
    setVisitedNodes(new Set());
    setMinHeap([]);
    setDistanceArray({});
    setIterationCount(0);
    setNegativeCycleDetected(false);
    setCurrentAlgorithmStep("");
    setConfirmedPathEdges(new Set());
    setExplanation(
      'Random graph generated. Select an algorithm and press "Start" to begin.'
    );
    setVisualizationMode("explore");

    // Reset graph transform for mobile
    resetGraphTransform();

    if (!svgRef.current) return; // If the ref is not ready

    // For mobile, reduce node count to avoid overcrowding
    let adjustedParams = { ...graphParams };
    if (isMobile && graphParams.nodeCount > 6) {
      adjustedParams.nodeCount = 6;
    }

    const { newNodes, newEdges, newParams } = generateRandomGraph({
      svgRef,
      graphParams: adjustedParams,
      algorithm,
    });

    // Store results
    setGraphParams(newParams);
    setNodes(newNodes);
    setEdges(newEdges);

    // Also update selected source/dest
    setSelectedSourceNode(newParams.sourceNode);
    setSelectedDestNode(null);

  };

  // =========================
  //   ALGORITHM CHANGE
  // =========================
  const handleAlgorithmChange = (e) => {
    const newAlg = typeof e === "string" ? e : e.target.value;
    setAlgorithm(newAlg);

    // If switching to Dijkstra with negative edges, disable them
    if (newAlg === "dijkstra" && graphParams.allowNegativeEdges) {
      setGraphParams({ ...graphParams, allowNegativeEdges: false });
      setExplanation(
        "Switched to Dijkstra. Negative edges disabled as Dijkstra's doesn't support them."
      );
    }

    // Reset
    setVisitedNodes(new Set());
    setMinHeap([]);
    setDistanceArray({});
    setIterationCount(0);
    setNegativeCycleDetected(false);
    setConfirmedPathEdges(new Set());
    resetGraph();
  };

  // =========================
  //   RESET GRAPH
  // =========================
  const resetGraph = () => {
    setIsRunning(false);
    setIsPaused(false);
    setCurrentStep(0);
    setSteps([]);
    setShowAnswer(false);
    setConfirmedPathEdges(new Set());
    setVisualizationMode("explore");

    const resetEdges = edges.map((edge) => ({ ...edge, status: "unvisited" }));
    setEdges(resetEdges);

    // Reset algorithm data
    setVisitedNodes(new Set());
    setMinHeap([]);
    setDistanceArray({});
    setIterationCount(0);
    setNegativeCycleDetected(false);
    setCurrentAlgorithmStep("");

    setExplanation(
      'Graph reset. Select an algorithm and press "Start" to begin.'
    );
  };

  // =========================
  //   PLAY / PAUSE
  // =========================
  const handlePlayPause = () => {
    if (isRunning) {
      setIsPaused(!isPaused);
    } else {
      setIsRunning(true);
      setIsPaused(false);
      if (steps.length === 0) {
        // Generate steps
        const stepList =
          algorithm === "dijkstra"
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
      }
    }
  };

  // =========================
  //   STEP-BY-STEP
  // =========================
  const handleStep = () => {
    if (visualizationMode === "view") {
      setExplanation(
        "In View mode. Switch to Explore mode to step through the algorithm."
      );
      return;
    }

    if (steps.length === 0) {
      const stepList =
        algorithm === "dijkstra"
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
    }
    if (currentStep < steps.length) {
      applyStep(currentStep);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBackStep = () => {
    if (visualizationMode === "view") {
      setExplanation(
        "In View mode. Switch to Explore mode to step through the algorithm."
      );
      return;
    }

    if (currentStep > 0) {
      const newStep = currentStep - 1;

      // Need to reset confirmed path edges when stepping back
      if (newStep === 0) {
        setConfirmedPathEdges(new Set());
      } else {
        // Recompute confirmed path edges based on all previous steps
        const updatedConfirmedEdges = new Set();
        for (let i = 0; i < newStep; i++) {
          const step = steps[i];
          if (step.pathEdgeUpdates) {
            step.pathEdgeUpdates.forEach((edgeId) => {
              updatedConfirmedEdges.add(edgeId);
            });
          }
        }
        setConfirmedPathEdges(updatedConfirmedEdges);
      }

      applyStep(newStep);
      setCurrentStep(newStep);
    }
  };

  // Forward actually advances to the next significant event
  const handleForwardStep = () => {
    if (visualizationMode === "view") {
      setExplanation(
        "In View mode. Switch to Explore mode to step through the algorithm."
      );
      return;
    }

    if (steps.length === 0) {
      const stepList =
        algorithm === "dijkstra"
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
    }

    // Skip ahead to the next significant event (path update, node visit, etc.)
    if (currentStep < steps.length) {
      let significantStepFound = false;
      let nextStep = currentStep;

      while (nextStep < steps.length && !significantStepFound) {
        const step = steps[nextStep];

        // Check if this step contains a significant event
        if (
          (step.pathEdgeUpdates && step.pathEdgeUpdates.length > 0) || // New edge in path
          (step.visitedNodes && step.visitedNodes.size > visitedNodes.size) || // New node visited
          step.negativeCycleDetected // Negative cycle found
        ) {
          significantStepFound = true;
        } else {
          nextStep++;
        }
      }

      // Apply all steps up to the significant one
      for (let i = currentStep; i <= nextStep; i++) {
        if (i < steps.length) {
          applyStep(i);
        }
      }

      setCurrentStep(Math.min(nextStep + 1, steps.length));

      if (nextStep >= steps.length) {
        setExplanation("Reached the end of the algorithm execution.");
      }
    }
  };

  // =========================
  //   APPLY STEP (memoized for performance)
  // =========================
  const applyStep = useCallback((stepIndex) => {
    if (stepIndex < 0 || stepIndex >= steps.length) return;
    const step = steps[stepIndex];
  
    // Start with edges that have unvisited status, but preserve confirmed path edges
    const resetEdges = edges.map((e) => {
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
  
    // Update all states
    setEdges(newEdges);
    setExplanation(step.explanation);
    setCurrentAlgorithmStep(step.algorithmStep || "");
    setVisitedNodes(new Set(step.visitedNodes || []));
    setMinHeap([...(step.minHeap || [])]);
    setDistanceArray({ ...(step.distanceArray || {}) });
    setIterationCount(step.iterationCount || 0);
    setNegativeCycleDetected(step.negativeCycleDetected || false);
  }, [steps, edges, confirmedPathEdges]);

  // =========================
  //   SHOW FINAL SHORTEST PATHS
  // =========================
  const handleShowAnswer = () => {
    // If no steps yet, generate them
    if (steps.length === 0) {
      const stepList =
        algorithm === "dijkstra"
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
    }

    // Mark edges
    const newEdges = edges.map((e) => ({ ...e, status: "unvisited" }));

    if (!negativeCycleDetected) {
      // Mark shortest path edges
      const { paths } = shortestPathResult;
      const pathEdgeIds = new Set();

      // If a destination is selected, only highlight that path
      if (selectedDestNode !== null && paths[selectedDestNode]) {
        const path = paths[selectedDestNode];
        for (let i = 0; i < path.length - 1; i++) {
          pathEdgeIds.add(`${path[i]}-${path[i + 1]}`);
        }
      } else {
        // Otherwise, highlight all paths
        Object.values(paths).forEach((path) => {
          for (let i = 0; i < path.length - 1; i++) {
            pathEdgeIds.add(`${path[i]}-${path[i + 1]}`);
          }
        });
      }

      // Update statuses
      newEdges.forEach((edge, index) => {
        if (pathEdgeIds.has(edge.id)) {
          newEdges[index].status = "included";
        }
      });

      // Save these path edges as confirmed
      setConfirmedPathEdges(pathEdgeIds);
    } else {
      // Negative cycle detected
      const { distances } = shortestPathResult;
      const cycleCandidates = edges.filter((edge) => {
        const { source, target, weight } = edge;
        if (distances[source] === undefined || distances[source] === Infinity)
          return false;
        return distances[source] + weight < distances[target];
      });
      cycleCandidates.forEach((edge) => {
        const idx = newEdges.findIndex((e) => e.id === edge.id);
        if (idx !== -1) {
          newEdges[idx].status = "negativecycle";
        }
      });
    }

    setEdges(newEdges);
    setShowAnswer(true);
    setIsRunning(false);
    setIsPaused(false);
    setVisualizationMode("view");

    if (negativeCycleDetected) {
      setExplanation(
        `${
          algorithm === "dijkstra" ? "Dijkstra's" : "Bellman-Ford"
        } detected a negative cycle. No shortest paths exist.`
      );
    } else {
      setExplanation(
        `${
          algorithm === "dijkstra" ? "Dijkstra's" : "Bellman-Ford"
        } complete. Shortest distances from ${
          nodes[selectedSourceNode]?.label
        } shown.`
      );
    }
  };

  // =========================
  //   HANDLE PARAM CHANGES
  // =========================
  const handleParamChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : parseFloat(value);

    // If toggling negative edges in Dijkstra
    if (name === "allowNegativeEdges" && newValue && algorithm === "dijkstra") {
      setExplanation(
        "Warning: Dijkstra doesn't support negative edges. Switch to Bellman-Ford."
      );
    }

    setGraphParams({ ...graphParams, [name]: newValue });
  };

  // =========================
  //   SWITCH AUTO / MANUAL
  // =========================
  const handleModeChange = (e) => {
    const newMode = typeof e === "string" ? e : e.target.value;
    setMode(newMode);
    resetGraph();
  };

  // =========================
  //   NODE & EDGE EVENTS
  // =========================
  const handleAddNodeMode = () => {
    setIsAddingNode(!isAddingNode);
    setIsAddingEdge(false);
    setIsDeletingNode(false);
    setIsDeletingEdge(false);
    setIsSelectingSource(false);
    setIsSelectingDest(false);
    setTempNode(null);
  };
  const handleAddEdgeMode = () => {
    setIsAddingEdge(!isAddingEdge);
    setIsAddingNode(false);
    setIsDeletingNode(false);
    setIsDeletingEdge(false);
    setIsSelectingSource(false);
    setIsSelectingDest(false);
    setTempNode(null);
  };
  const handleDeleteNodeMode = () => {
    setIsDeletingNode(!isDeletingNode);
    setIsAddingNode(false);
    setIsAddingEdge(false);
    setIsDeletingEdge(false);
    setIsSelectingSource(false);
    setIsSelectingDest(false);
    setTempNode(null);
  };
  const handleDeleteEdgeMode = () => {
    setIsDeletingEdge(!isDeletingEdge);
    setIsAddingNode(false);
    setIsAddingEdge(false);
    setIsDeletingNode(false);
    setIsSelectingSource(false);
    setIsSelectingDest(false);
    setTempNode(null);
  };
  const handleSelectSourceMode = () => {
    setIsSelectingSource(!isSelectingSource);
    setIsAddingNode(false);
    setIsAddingEdge(false);
    setIsDeletingNode(false);
    setIsDeletingEdge(false);
    setIsSelectingDest(false);
    setTempNode(null);
  };
  const handleSelectDestMode = () => {
    setIsSelectingDest(!isSelectingDest);
    setIsAddingNode(false);
    setIsAddingEdge(false);
    setIsDeletingNode(false);
    setIsDeletingEdge(false);
    setIsSelectingSource(false);
    setTempNode(null);
  };

  // Cancel any active manual mode operation
  const handleCancelOperation = useCallback(() => {
    setIsAddingNode(false);
    setIsAddingEdge(false);
    setIsDeletingNode(false);
    setIsDeletingEdge(false);
    setIsSelectingSource(false);
    setIsSelectingDest(false);
    setTempNode(null);
  }, []);

  // When clicking on the SVG in "Add Node" mode
  const handleSvgClick = (e) => {
    if (!isAddingNode) return;

    // Get the SVG coordinates, accounting for scale and pan
    const svgRect = svgRef.current.getBoundingClientRect();
    const x =
      (e.clientX - svgRect.left - graphTransform.x * graphTransform.scale) /
      graphTransform.scale;
    const y =
      (e.clientY - svgRect.top - graphTransform.y * graphTransform.scale) /
      graphTransform.scale;

    const newId = nodes.length;
    const newNode = {
      id: newId,
      x,
      y,
      label: String.fromCharCode(65 + newId),
    };
    setNodes([...nodes, newNode]);
    setIsAddingNode(false);
  };

  // When a node is clicked
  const handleNodeClick = (nodeId) => {
    if (mode !== "manual") return;

    // Selecting source
    if (isSelectingSource) {
      setSelectedSourceNode(nodeId);
      setIsSelectingSource(false);
      setExplanation(`Set node ${nodes[nodeId]?.label} as the source node.`);
      // When changing source, reset the visualization
      setShowAnswer(false);
      setVisualizationMode("explore");
      setConfirmedPathEdges(new Set());
      return;
    }

    // Selecting dest
    if (isSelectingDest) {
      setSelectedDestNode(nodeId);
      setIsSelectingDest(false);
      setExplanation(
        `Set node ${nodes[nodeId]?.label} as the destination node.`
      );

      // If we're in view mode, update the path highlighting
      if (visualizationMode === "view") {
        handleShowAnswer();
      }
      return;
    }

    // Deleting node
    if (isDeletingNode) {
      const filteredEdges = edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId
      );
      const filteredNodes = nodes.filter((n) => n.id !== nodeId);
      if (selectedSourceNode === nodeId) setSelectedSourceNode(null);
      if (selectedDestNode === nodeId) setSelectedDestNode(null);

      setNodes(filteredNodes);
      setEdges(filteredEdges);
      setIsDeletingNode(false);
      return;
    }
    // Adding edge
    if (isAddingEdge) {
      if (tempNode === null) {
        setTempNode(nodeId);
      } else {
        if (tempNode !== nodeId) {
          // Get position for the popover (between the two nodes)
          const sourceNode = nodes.find(n => n.id === tempNode);
          const targetNode = nodes.find(n => n.id === nodeId);
          
          // Safety check - ensure both nodes exist
          if (!sourceNode || !targetNode) {
            console.error("Could not find source or target node for edge creation");
            setTempNode(null);
            setIsAddingEdge(false);
            return;
          }
          
          const midX = (sourceNode.x + targetNode.x) / 2;
          const midY = (sourceNode.y + targetNode.y) / 2;
          
          // Convert SVG coordinates to screen coordinates
          const svgRect = svgRef.current?.getBoundingClientRect();
          const screenX = svgRect ? svgRect.left + midX : midX;
          const screenY = svgRect ? svgRect.top + midY : midY;
          
          // Open the weight input popover
          setWeightPopover({
            isOpen: true,
            position: { x: screenX, y: screenY },
            pendingEdge: { source: tempNode, target: nodeId },
          });
        } else {
          // Clicked same node, cancel edge creation
          setTempNode(null);
          setIsAddingEdge(false);
        }
      }
    }
  };

  // Handle weight confirmation from popover
  const handleWeightConfirm = (weight) => {
    const { source, target } = weightPopover.pendingEdge || {};
    
    if (source !== undefined && target !== undefined) {
      let validWeight = true;
      let errorMsg = "";

      if (algorithm === "dijkstra" && weight < 0) {
        validWeight = false;
        errorMsg = "Dijkstra doesn't support negative edges.";
      }

      if (validWeight) {
        const edgeId = `${source}-${target}`;
        if (!edges.some((e) => e.id === edgeId)) {
          setEdges([
            ...edges,
            {
              id: edgeId,
              source,
              target,
              weight,
              status: "unvisited",
            },
          ]);
        }
      } else {
        setExplanation(errorMsg);
      }
    }

    // Reset states
    setWeightPopover({ isOpen: false, position: { x: 0, y: 0 }, pendingEdge: null });
    setTempNode(null);
    setIsAddingEdge(false);
  };

  // Handle weight cancel from popover
  const handleWeightCancel = () => {
    setWeightPopover({ isOpen: false, position: { x: 0, y: 0 }, pendingEdge: null });
    setTempNode(null);
    setIsAddingEdge(false);
  };

  // When an edge is clicked
  const handleEdgeClick = (edgeId) => {
    if (!isDeletingEdge) return;
    const filtered = edges.filter((e) => e.id !== edgeId);
    setEdges(filtered);
    setIsDeletingEdge(false);
  };

  // =========================
  //   ANIMATION LOOP
  // =========================
  useEffect(() => {
    if (isRunning && !isPaused && visualizationMode === "explore") {
      const animate = () => {
        if (currentStep < steps.length) {
          applyStep(currentStep);
          setCurrentStep((prev) => prev + 1);
          animationFrameId.current = setTimeout(animate, animationSpeed);
        } else {
          setIsRunning(false);
        }
      };
      animationFrameId.current = setTimeout(animate, animationSpeed);
    }
    return () => {
      if (animationFrameId.current) clearTimeout(animationFrameId.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isRunning,
    isPaused,
    currentStep,
    steps,
    animationSpeed,
    visualizationMode,
  ]);

  // =========================
  //   INIT & RESIZE
  // =========================
  useEffect(() => {
    // Generate a random graph on first load
    handleGenerateRandomGraph();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Re-generate on window resize if in auto mode
    const handleResize = () => {
      if (mode === "auto") handleGenerateRandomGraph();
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // =========================
  //   KEYBOARD SHORTCUTS
  // =========================
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC key cancels any active manual mode operation
      if (e.key === "Escape" && mode === "manual") {
        handleCancelOperation();
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, handleCancelOperation]);

  // =========================
  //   RENDER
  // =========================

  return (
    <div className="flex flex-col min-h-screen bg-zinc-100 dark:bg-zinc-950">
      {/* FLOATING NAVBAR */}
      <div className="fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1rem)] sm:w-auto max-w-[calc(100vw-2rem)]">
        <FloatingNav>
          {/* Home Button */}
          <Link href="/" className="flex items-center justify-center rounded-full p-1.5 sm:p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-all duration-200 flex-shrink-0" title="Back to Dashboard">
            <LayoutGrid className="w-4 h-4" />
          </Link>

          <FloatingNavDivider />

          {/* Logo */}
          <div className="flex items-center gap-1 sm:gap-2 px-1 sm:px-3 flex-shrink-0">
            <Route className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline text-sm font-semibold tracking-tight text-zinc-800 dark:text-zinc-200">
              Pathfinder
            </span>
          </div>

          <FloatingNavDivider />

          {/* Algorithm Tabs */}
          <Tabs value={algorithm} onValueChange={handleAlgorithmChange} className="flex-shrink-0">
            <TabsList className="h-8 sm:h-9 bg-zinc-100 dark:bg-zinc-800 rounded-full">
              <TabsTrigger 
                value="dijkstra" 
                className="text-[10px] sm:text-xs px-2 sm:px-3 rounded-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                Dijkstra
              </TabsTrigger>
              <TabsTrigger 
                value="bellmanford" 
                className="text-[10px] sm:text-xs px-2 sm:px-3 rounded-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                Bellman-Ford
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <FloatingNavDivider />

          {/* Legend Toggle */}
          <FloatingNavItem onClick={toggleLegend} active={showLegend} tooltip={showLegend ? "Hide Legend" : "Show Legend"} className="flex-shrink-0">
            {showLegend ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </FloatingNavItem>

          {/* Help/Tutorial */}
          <FloatingNavItem onClick={() => setShowTutorial(true)} tooltip="How It Works" className="flex-shrink-0">
            <HelpCircle className="w-4 h-4" />
          </FloatingNavItem>

          {/* Settings */}
          <FloatingNavItem onClick={() => setIsDrawerOpen(true)} tooltip="Settings" className="flex-shrink-0">
            <Settings className="w-4 h-4" />
          </FloatingNavItem>

          {/* Theme Toggle */}
          <div className="flex-shrink-0">
            <ThemeToggle />
          </div>
        </FloatingNav>
      </div>

      {/* LEGEND (Collapsible) */}
      {showLegend && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-lg border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 overflow-x-auto">
          <div className="flex flex-wrap gap-3 items-center justify-center">
            <div className="flex items-center px-2">
              <div className="w-4 h-4 bg-zinc-400 mr-2 rounded" />
              <span className="text-xs text-zinc-700 dark:text-zinc-300">Unvisited</span>
            </div>
            <div className="flex items-center px-2">
              <div className="w-4 h-4 bg-amber-400 mr-2 rounded" />
              <span className="text-xs text-zinc-700 dark:text-zinc-300">Candidate</span>
            </div>
            <div className="flex items-center px-2">
              <div className="w-4 h-4 bg-emerald-500 mr-2 rounded" />
              <span className="text-xs text-zinc-700 dark:text-zinc-300">Shortest Path</span>
            </div>
            <div className="flex items-center px-2">
              <div className="w-4 h-4 bg-rose-500 mr-2 rounded" />
              <span className="text-xs text-zinc-700 dark:text-zinc-300">Excluded</span>
            </div>
            <div className="flex items-center px-2">
              <div className="w-4 h-4 bg-purple-500 mr-2 rounded" />
              <span className="text-xs text-zinc-700 dark:text-zinc-300">Negative Cycle</span>
            </div>
            <div className="flex items-center px-2">
              <div className="w-5 h-5 bg-emerald-500 mr-2 rounded-full flex items-center justify-center text-white text-xs font-bold">
                A
              </div>
              <span className="text-xs text-zinc-700 dark:text-zinc-300">Source</span>
            </div>
            <div className="flex items-center px-2">
              <div className="w-5 h-5 bg-rose-500 mr-2 rounded-full flex items-center justify-center text-white text-xs font-bold">
                B
              </div>
              <span className="text-xs text-zinc-700 dark:text-zinc-300">Target</span>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex flex-1 min-h-0 pt-20 p-2 sm:p-4">
        {/* GRAPH AREA */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="bg-white dark:bg-zinc-900 shadow-md rounded-lg overflow-hidden flex-1 flex flex-col border border-zinc-200 dark:border-zinc-800">
            {/* SVG AREA */}
            <div
              className="flex-1 relative min-h-[300px]"
              ref={svgRef}
              onClick={handleSvgClick}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <svg width="100%" height="100%" className="bg-zinc-50 dark:bg-zinc-950">
                {/* Add this group with transform for mobile pinch-zoom/pan */}
                <g
                  transform={`translate(${graphTransform.x}, ${graphTransform.y}) scale(${graphTransform.scale})`}
                >
                  <GraphRenderer
                    nodes={nodes}
                    edges={edges}
                    distanceArray={distanceArray}
                    visitedNodes={visitedNodes}
                    selectedSourceNode={selectedSourceNode}
                    selectedDestNode={selectedDestNode}
                    onNodeClick={handleNodeClick}
                    onEdgeClick={handleEdgeClick}
                  />
                </g>
              </svg>

              {/* Mobile pinch/zoom indicator */}
              {isMobile && (
                <div className="absolute top-3 right-3 z-10 bg-white/70 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-gray-700 shadow-sm">
                  {Math.round(graphTransform.scale * 100)}%
                </div>
              )}


              {/* Tutorial Dialog */}
              <Dialog open={showTutorial} onOpenChange={setShowTutorial}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
                  <DialogHeader>
                    <DialogTitle className="text-xl text-zinc-900 dark:text-zinc-100">
                      How to Use This Visualizer
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500 dark:text-zinc-400">
                      Learn how to explore shortest path algorithms interactively
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-700">
                      <h3 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs">1</span>
                        Getting Started
                      </h3>
                      <ol className="list-decimal ml-5 space-y-2 text-zinc-600 dark:text-zinc-300 text-sm">
                        <li>
                          Select either{" "}
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">Dijkstra's</span> or{" "}
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">Bellman-Ford</span>{" "}
                          algorithm from the navbar
                        </li>
                        <li>
                          A random graph is auto-generated when you load the page
                        </li>
                        <li>
                          The{" "}
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">green node</span>{" "}
                          is where the algorithm starts
                        </li>
                        <li>
                          You can set a{" "}
                          <span className="text-rose-600 dark:text-rose-400 font-medium">target node</span>{" "}
                          to focus on a specific path
                        </li>
                      </ol>
                    </div>

                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-700">
                      <h3 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs">2</span>
                        Understanding the Controls
                      </h3>
                      <ul className="space-y-2 text-zinc-600 dark:text-zinc-300 text-sm">
                        <li><strong className="text-emerald-600 dark:text-emerald-400">Start:</strong> Run the algorithm automatically</li>
                        <li><strong className="text-indigo-600 dark:text-indigo-400">Step:</strong> Execute a single algorithm operation</li>
                        <li><strong className="text-zinc-600 dark:text-zinc-400">Reset:</strong> Clear all algorithm progress</li>
                      </ul>
                    </div>

                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-700">
                      <h3 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs">3</span>
                        Mobile Features
                      </h3>
                      <ul className="space-y-2 text-zinc-600 dark:text-zinc-300 text-sm">
                        <li><strong className="text-zinc-900 dark:text-zinc-100">Pinch to Zoom:</strong> Use two fingers to zoom in/out</li>
                        <li><strong className="text-zinc-900 dark:text-zinc-100">Pan:</strong> Drag with one finger to move around</li>
                        <li><strong className="text-zinc-900 dark:text-zinc-100">Settings:</strong> Access from the navbar to configure graph</li>
                      </ul>
                    </div>

                    <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-200 dark:border-zinc-700">
                      <h3 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs">4</span>
                        Educational Features
                      </h3>
                      <ul className="space-y-2 text-zinc-600 dark:text-zinc-300 text-sm">
                        <li>Watch how the algorithm <strong className="text-zinc-900 dark:text-zinc-100">builds paths incrementally</strong></li>
                        <li>Observe the <strong className="text-zinc-900 dark:text-zinc-100">data structures</strong> (distances, priority queue)</li>
                        <li><strong className="text-zinc-900 dark:text-zinc-100">Compare algorithms</strong> to understand their strengths</li>
                      </ul>
                    </div>
                  </div>

                  <DialogFooter>
                    <button
                      onClick={() => setShowTutorial(false)}
                      className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                    >
                      Got it!
                    </button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Algorithm Visualization Overlay */}
              <AlgorithmVisualizer
                algorithm={algorithm}
                nodes={nodes}
                distanceArray={distanceArray}
                minHeap={minHeap}
                iterationCount={iterationCount}
                negativeCycleDetected={negativeCycleDetected}
                currentStep={currentStep}
                steps={steps}
                visitedNodes={visitedNodes}
                currentAlgorithmStep={currentAlgorithmStep}
              />

              {/* Visualization Mode Toggle Button */}
              <div className="absolute bottom-3 right-3 z-10">
                <button
                  onClick={toggleVisualizationMode}
                  className={`group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm backdrop-blur-sm transition-all hover:shadow-md cursor-pointer ${
                    visualizationMode === "explore"
                      ? "bg-indigo-100/90 text-indigo-700 border border-indigo-200 hover:bg-indigo-200/90"
                      : "bg-amber-100/90 text-amber-700 border border-amber-200 hover:bg-amber-200/90"
                  }`}
                  title={visualizationMode === "explore" 
                    ? "Click to switch to View Mode (see final answer)" 
                    : "Click to switch to Explore Mode (step through algorithm)"}
                >
                  {visualizationMode === "explore" ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Explore Mode</span>
                      <span className="text-[10px] opacity-60 group-hover:opacity-100">→ View</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>View Mode</span>
                      <span className="text-[10px] opacity-60 group-hover:opacity-100">→ Explore</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* MANUAL MODE TOOLBAR - Desktop only, when in manual mode */}
            {mode === "manual" && !isMobile && (
              <ManualModeToolbar
                isAddingNode={isAddingNode}
                isAddingEdge={isAddingEdge}
                isDeletingNode={isDeletingNode}
                isDeletingEdge={isDeletingEdge}
                isSelectingSource={isSelectingSource}
                isSelectingDest={isSelectingDest}
                tempNode={tempNode}
                onAddNodeMode={handleAddNodeMode}
                onAddEdgeMode={handleAddEdgeMode}
                onDeleteNodeMode={handleDeleteNodeMode}
                onDeleteEdgeMode={handleDeleteEdgeMode}
                onSelectSourceMode={handleSelectSourceMode}
                onSelectDestMode={handleSelectDestMode}
                onClearGraph={clearGraph}
                onCancelOperation={handleCancelOperation}
                nodes={nodes}
                selectedSourceNode={selectedSourceNode}
                selectedDestNode={selectedDestNode}
              />
            )}

            {/* FLOATING CONTROL BAR - Desktop only, hidden in manual mode */}
            <div className={`${isMobile || mode === "manual" ? "hidden" : "fixed bottom-5 left-1/2 -translate-x-1/2 z-40"}`}>
              <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-full px-6 py-4 shadow-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
                {/* Step Progress Indicator - Compact */}
                {steps.length > 0 && (
                  <div className="flex items-center gap-2 pr-4 border-r border-zinc-200 dark:border-zinc-700">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400 font-medium tabular-nums whitespace-nowrap">
                      {currentStep}/{steps.length}
                    </span>
                    <div className="h-2 w-20 bg-zinc-200 dark:bg-zinc-700 rounded-full">
                      <div
                        className="h-2 bg-indigo-500 rounded-full transition-all duration-300"
                        style={{
                          width: `${(currentStep / steps.length) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Main Control Buttons - Floating pill style */}
                <div className="flex items-center gap-3">
                  {/* Start/Resume/Pause Button - Primary action */}
                  <button
                    onClick={handlePlayPause}
                    className="h-11 px-6 rounded-full flex items-center justify-center font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md hover:shadow-lg active:scale-95"
                  >
                    {isRunning ? (
                      isPaused ? (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      )
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Start
                      </>
                    )}
                  </button>

                  {/* Step Button - Outline variant */}
                  <button
                    onClick={handleStep}
                    className="h-11 px-6 rounded-full flex items-center justify-center font-semibold text-sm bg-white dark:bg-zinc-800 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all active:scale-95"
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Step
                  </button>

                  {/* Reset Button - Ghost variant */}
                  <button
                    onClick={resetGraph}
                    className="h-11 px-6 rounded-full flex items-center justify-center font-semibold text-sm bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-all active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* DESKTOP INFO PANEL - Below graph, above floating bar */}
            <div className={`${isMobile ? "hidden" : "block"}`}>
              <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 px-4 pt-4 pb-24">

                {/* MOBILE ALGORITHM STATE DISPLAY */}
                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  {algorithm === "dijkstra" ? (
                    <>
                      <div className="bg-white shadow-sm rounded-lg p-2 border border-blue-200">
                        <h3 className="text-xs font-bold mb-1 text-blue-800">
                          Distances
                        </h3>
                        <div className="max-h-24 overflow-y-auto border border-slate-100 rounded">
                          {Object.keys(distanceArray).length > 0 ? (
                            <table className="w-full border-collapse text-xs">
                              <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                  <th className="p-1 text-left border-b">
                                    Node
                                  </th>
                                  <th className="p-1 text-left border-b">
                                    Dist
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.keys(distanceArray)
                                  .sort()
                                  .slice(0, 5)
                                  .map((nodeId) => (
                                    <tr key={nodeId}>
                                      <td className="p-1 border-b">
                                        {nodes[nodeId]?.label}
                                      </td>
                                      <td className="p-1 border-b">
                                        {distanceArray[nodeId] === Infinity
                                          ? "∞"
                                          : distanceArray[nodeId]}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-slate-500 text-center py-2 px-2 text-xs">
                              No data
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-white shadow-sm rounded-lg p-2 border border-blue-200">
                        <h3 className="text-xs font-bold mb-1 text-blue-800">
                          Priority Queue
                        </h3>
                        <div className="max-h-24 overflow-y-auto border border-slate-100 rounded">
                          {minHeap.length > 0 ? (
                            <table className="w-full border-collapse text-xs">
                              <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                  <th className="p-1 text-left border-b">
                                    Node
                                  </th>
                                  <th className="p-1 text-left border-b">
                                    Dist
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {minHeap.slice(0, 5).map((item, i) => (
                                  <tr
                                    key={i}
                                    className={i === 0 ? "bg-orange-50" : ""}
                                  >
                                    <td className="p-1 border-b">
                                      {nodes[item.id]?.label}
                                    </td>
                                    <td className="p-1 border-b">
                                      {item.dist}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-slate-500 text-center py-2 px-2 text-xs">
                              Empty
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white shadow-sm rounded-lg p-2 border border-blue-200">
                        <h3 className="text-xs font-bold mb-1 text-blue-800">
                          Distances
                        </h3>
                        <div className="max-h-24 overflow-y-auto border border-slate-100 rounded">
                          {Object.keys(distanceArray).length > 0 ? (
                            <table className="w-full border-collapse text-xs">
                              <thead className="bg-slate-50 sticky top-0">
                                <tr>
                                  <th className="p-1 text-left border-b">
                                    Node
                                  </th>
                                  <th className="p-1 text-left border-b">
                                    Dist
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {Object.keys(distanceArray)
                                  .sort()
                                  .slice(0, 5)
                                  .map((nodeId) => (
                                    <tr key={nodeId}>
                                      <td className="p-1 border-b">
                                        {nodes[nodeId]?.label}
                                      </td>
                                      <td className="p-1 border-b">
                                        {distanceArray[nodeId] === Infinity
                                          ? "∞"
                                          : distanceArray[nodeId]}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-slate-500 text-center py-2 px-2 text-xs">
                              No data
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-white shadow-sm rounded-lg p-2 border border-blue-200">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="text-xs font-bold text-blue-800">
                            Iteration
                          </h3>
                          {negativeCycleDetected && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                              Negative Cycle!
                            </span>
                          )}
                        </div>
                        <div className="border border-slate-100 p-2 rounded bg-white">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium">
                              {iterationCount} of {nodes.length}
                            </span>
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${
                                    (iterationCount /
                                      Math.max(nodes.length, 1)) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <MobileMetrics 
                  visitedNodes={visitedNodes}
                  selectedDestNode={selectedDestNode}
                  distanceArray={distanceArray}
                  steps={steps}
                  animationSpeed={animationSpeed}
                />

                {/* Explanation area */}
                <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 border border-indigo-100 dark:border-indigo-800 min-h-16 max-h-32 overflow-y-auto">
                  <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 text-sm mb-1">
                    Current Step:
                  </h3>
                  <div className="text-sm text-indigo-800 dark:text-indigo-200">{explanation}</div>
                </div>
              </div>
            </div>

            {/* MOBILE CONTROLS - Only visible on mobile */}
            {isMobile && (
              <MobileControls 
                currentStep={currentStep}
                isRunning={isRunning}
                handlePlayPause={handlePlayPause}
                isPaused={isPaused}
                handleStep={handleStep}
                resetGraph={resetGraph}
                resetGraphTransform={resetGraphTransform}
                explanation={explanation}
                steps={steps}
              />
            )}
          </div>
        </div>

      </div>

      {/* SETTINGS DRAWER */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle className="text-indigo-700 dark:text-indigo-400">Graph Settings</DrawerTitle>
            <DrawerDescription>Configure your graph parameters</DrawerDescription>
          </DrawerHeader>
          
          <div className="px-4 pb-4 overflow-y-auto">
            {/* Mode */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                Mode
              </label>
              <select
                value={mode}
                onChange={handleModeChange}
                className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 p-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
              >
                <option value="auto">Auto-Generate</option>
                <option value="manual">Manual Design</option>
              </select>
            </div>

            {/* Manual Mode Toolbar */}
            {mode === "manual" && (
              <div className="bg-amber-50 dark:bg-amber-950/50 p-3 rounded-lg border border-amber-200 dark:border-amber-800 mb-4 text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-400 mb-2">
                  Manual Mode Toolbar:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { handleAddNodeMode(); setIsDrawerOpen(false); }}
                    className={`px-3 py-1.5 rounded text-sm ${
                      isAddingNode
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                    }`}
                  >
                    {isAddingNode ? "Click Graph..." : "Add Node"}
                  </button>
                  <button
                    onClick={() => { handleAddEdgeMode(); setIsDrawerOpen(false); }}
                    className={`px-3 py-1.5 rounded text-sm ${
                      isAddingEdge
                        ? "bg-emerald-500 text-white"
                        : "bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                    }`}
                  >
                    {isAddingEdge ? "Select Nodes..." : "Add Edge"}
                  </button>
                  <button
                    onClick={() => { handleDeleteNodeMode(); setIsDrawerOpen(false); }}
                    className={`px-3 py-1.5 rounded text-sm ${
                      isDeletingNode
                        ? "bg-rose-500 text-white"
                        : "bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                    }`}
                  >
                    {isDeletingNode ? "Click Node..." : "Delete Node"}
                  </button>
                  <button
                    onClick={() => { handleDeleteEdgeMode(); setIsDrawerOpen(false); }}
                    className={`px-3 py-1.5 rounded text-sm ${
                      isDeletingEdge
                        ? "bg-rose-500 text-white"
                        : "bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                    }`}
                  >
                    {isDeletingEdge ? "Click Edge..." : "Delete Edge"}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => { handleSelectSourceMode(); setIsDrawerOpen(false); }}
                    className={`px-3 py-1.5 rounded text-sm ${
                      isSelectingSource
                        ? "bg-emerald-500 text-white"
                        : "bg-emerald-200 hover:bg-emerald-300 dark:bg-emerald-900 dark:hover:bg-emerald-800"
                    }`}
                  >
                    {isSelectingSource ? "Click Node..." : "Set Source"}
                  </button>
                  <button
                    onClick={() => { handleSelectDestMode(); setIsDrawerOpen(false); }}
                    className={`px-3 py-1.5 rounded text-sm ${
                      isSelectingDest
                        ? "bg-rose-500 text-white"
                        : "bg-rose-200 hover:bg-rose-300 dark:bg-rose-900 dark:hover:bg-rose-800"
                    }`}
                  >
                    {isSelectingDest ? "Click Node..." : "Set Target"}
                  </button>
                </div>

                <div className="mt-3">
                  <button
                    onClick={() => { clearGraph(); setIsDrawerOpen(false); }}
                    className="w-full px-3 py-2 rounded text-sm bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Clear Graph
                  </button>
                </div>
              </div>
            )}

            {/* Auto Mode Controls */}
            {mode === "auto" && (
              <>
                {/* Number of Nodes */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Number of Nodes
                    </label>
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      {graphParams.nodeCount}
                    </span>
                  </div>
                  <Slider
                    value={[graphParams.nodeCount]}
                    onValueChange={(value) => setGraphParams({ ...graphParams, nodeCount: value[0] })}
                    min={3}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Edge Density */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Edge Density
                    </label>
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      {graphParams.density.toFixed(1)}
                    </span>
                  </div>
                  <Slider
                    value={[graphParams.density * 10]}
                    onValueChange={(value) => setGraphParams({ ...graphParams, density: value[0] / 10 })}
                    min={2}
                    max={8}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Animation Speed */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Animation Speed
                    </label>
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      {animationSpeed <= 600 ? "Fast" : animationSpeed <= 1200 ? "Medium" : "Slow"}
                    </span>
                  </div>
                  <Slider
                    value={[(2200 - animationSpeed) / 400]}
                    onValueChange={(value) => setAnimationSpeed(2200 - value[0] * 400)}
                    min={1}
                    max={5}
                    step={1}
                    className="w-full"
                  />
                </div>

                {/* Weight Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Weight Range
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      name="minWeight"
                      min="1"
                      max="98"
                      value={graphParams.minWeight}
                      onChange={handleParamChange}
                      className="w-full border border-zinc-300 dark:border-zinc-700 rounded-md py-2 px-3 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-zinc-500">to</span>
                    <input
                      type="number"
                      name="maxWeight"
                      min="2"
                      max="99"
                      value={graphParams.maxWeight}
                      onChange={handleParamChange}
                      className="w-full border border-zinc-300 dark:border-zinc-700 rounded-md py-2 px-3 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Negative Edges (only for Bellman-Ford) */}
                {algorithm === "bellmanford" && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                          Allow Negative Edges
                        </label>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {graphParams.allowNegativeEdges
                            ? "May generate negative cycles"
                            : "All edge weights will be positive"}
                        </p>
                      </div>
                      <Switch
                        checked={graphParams.allowNegativeEdges}
                        onCheckedChange={(checked) => setGraphParams({ ...graphParams, allowNegativeEdges: checked })}
                      />
                    </div>
                  </div>
                )}

                {/* Generate New Graph */}
                <button
                  onClick={() => { handleGenerateRandomGraph(); setIsDrawerOpen(false); }}
                  className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white py-3 px-4 rounded-lg transition-colors shadow-sm flex items-center justify-center font-medium"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Generate New Graph
                </button>

                {/* Algorithm comparison */}
                <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  <h3 className="font-semibold text-zinc-700 dark:text-zinc-300 mb-3">
                    Compare Algorithms
                  </h3>
                  <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-3 text-xs">
                    <div className="flex">
                      <div className="w-1/2 pr-2 border-r border-zinc-200 dark:border-zinc-700">
                        <h4 className="font-bold text-indigo-700 dark:text-indigo-400 mb-1">Dijkstra's</h4>
                        <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
                          <li className="flex items-start"><span className="text-emerald-500 mr-1">✓</span> Faster for sparse graphs</li>
                          <li className="flex items-start"><span className="text-emerald-500 mr-1">✓</span> Priority queue optimized</li>
                          <li className="flex items-start"><span className="text-rose-500 mr-1">✗</span> No negative weights</li>
                        </ul>
                      </div>
                      <div className="w-1/2 pl-2">
                        <h4 className="font-bold text-indigo-700 dark:text-indigo-400 mb-1">Bellman-Ford</h4>
                        <ul className="space-y-1 text-zinc-600 dark:text-zinc-400">
                          <li className="flex items-start"><span className="text-emerald-500 mr-1">✓</span> Handles negative weights</li>
                          <li className="flex items-start"><span className="text-emerald-500 mr-1">✓</span> Detects negative cycles</li>
                          <li className="flex items-start"><span className="text-rose-500 mr-1">✗</span> Slower (checks all edges)</li>
                        </ul>
                      </div>
                    </div>
                    <div className="mt-2 text-zinc-500 border-t border-zinc-200 dark:border-zinc-700 pt-2">
                      <div className="flex justify-between">
                        <span>Time Complexity:</span>
                        <span className="font-mono">{algorithm === "dijkstra" ? "O((V+E)log V)" : "O(V⋅E)"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Weight Input Popover for Edge Creation */}
      <WeightInputPopover
        isOpen={weightPopover.isOpen}
        position={weightPopover.position}
        initialWeight={10}
        allowNegative={algorithm === "bellmanford" && graphParams.allowNegativeEdges}
        onConfirm={handleWeightConfirm}
        onCancel={handleWeightCancel}
      />

    </div>
  );
};

export default ShortestPathVisualizer;