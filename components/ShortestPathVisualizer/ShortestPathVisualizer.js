import React, { useState, useEffect, useRef, useCallback } from "react";
// eslint-disable-next-line no-unused-vars
import _ from "lodash";

import GraphRenderer from "./GraphRenderer";
import { generateRandomGraph } from "./GraphGeneration";
import AlgorithmVisualizer from "./AlgorithmVisualizer";
import { useAlgorithmRunner } from "./hooks/useAlgorithmRunner";
import { getEuclideanWeight } from "./graphGenerationHelpers";

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

const ShortestPathVisualizer = ({ embedded = false }) => {
  // =========================
  //       GRAPH STATE (Component-managed)
  // =========================
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [showTutorial, setShowTutorial] = useState(false);

  // Smart defaults: Dijkstra defaults to spatial, Bellman-Ford to circular
  // Get initial algorithm from hook to set smart default
  const initialAlgorithm = "dijkstra"; // Default algorithm
  const [graphParams, setGraphParams] = useState({
    nodeCount: 6,
    density: 0.5,
    minWeight: 1,
    maxWeight: 20,
    allowNegativeEdges: false,
    sourceNode: 0,
    hasNegativeCycle: false,
    isDirected: true, // Default to directed for backward compatibility
    graphType: initialAlgorithm === 'dijkstra' ? 'spatial' : 'circular', // Smart default based on algorithm
  });

  const [mode, setMode] = useState("auto"); // 'auto' or 'manual'
  const [animationSpeed, setAnimationSpeed] = useState(1000);
  const [showLegend, setShowLegend] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Store original container dimensions for responsive scaling
  const [originalDimensions, setOriginalDimensions] = useState(null);
  // Store graph bounds to maintain centering
  const [graphBounds, setGraphBounds] = useState(null);

  // Manual mode enhancements
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [isAddingEdge, setIsAddingEdge] = useState(false);
  const [isDeletingNode, setIsDeletingNode] = useState(false);
  const [isDeletingEdge, setIsDeletingEdge] = useState(false);
  const [isEditingEdge, setIsEditingEdge] = useState(false);
  const [tempNode, setTempNode] = useState(null);
  const [selectedSourceNode, setSelectedSourceNode] = useState(null);
  const [selectedDestNode, setSelectedDestNode] = useState(null);
  const [isSelectingSource, setIsSelectingSource] = useState(false);
  const [isSelectingDest, setIsSelectingDest] = useState(false);

  // =========================
  //   ALGORITHM RUNNER HOOK
  // =========================
  const {
    algorithm,
    isRunning,
    isPaused,
    currentStep,
    steps,
    explanation,
    visualizationMode,
    distanceArray,
    visitedNodes,
    minHeap,
    iterationCount,
    negativeCycleDetected,
    currentAlgorithmStep,
    shortestPathResult,
    edgeUpdates,
    setAlgorithm,
    setShowAnswer,
    setVisualizationMode,
    play,
    step,
    reset,
    generateSteps,
    setExplanation,
    setIsRunning,
    setIsPaused,
  } = useAlgorithmRunner({
    nodes,
    edges,
    selectedSourceNode,
    graphParams,
    animationSpeed,
  });

  // Apply edge updates from hook
  useEffect(() => {
    if (edgeUpdates) {
      setEdges(edgeUpdates);
    }
  }, [edgeUpdates]);

  // When shortestPathResult is updated and we're in view mode, show the answer
  useEffect(() => {
    if (visualizationMode === "view" && shortestPathResult && shortestPathResult.paths && steps.length > 0) {
      handleShowAnswer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortestPathResult, visualizationMode, steps.length]);

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
    mode: 'create', // 'create' or 'edit'
    existingEdgeId: null, // For editing existing edges
    currentWeight: 10, // Current weight value
  });

  // Hint tooltip state
  const [showEditHint, setShowEditHint] = useState(true);

  // Refs
  const svgRef = useRef(null);

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
      reset(); // Reset algorithm state via hook
      const resetEdges = edges.map((edge) => ({ ...edge, status: "unvisited" }));
      setEdges(resetEdges);
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
    setSelectedSourceNode(null);
    setSelectedDestNode(null);

    // Reset algorithm state via hook
    reset();
    setExplanation(
      "Graph cleared. You can now build a new graph from scratch."
    );

    // Reset graph transform for mobile
    resetGraphTransform();
  };

  // =========================
  //   HANDLE SPEED CHANGE
  // =========================
  // =========================
  //   GENERATE RANDOM GRAPH
  // =========================
  const handleGenerateRandomGraph = () => {
    // Reset all algorithm state via hook
    reset();
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

    // Update original dimensions to current container size for proper resize handling
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setOriginalDimensions({ width: rect.width, height: rect.height });
    }

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

    // Smart defaults: Set layout based on algorithm
    // Dijkstra → Spatial (physical distance makes sense with positive weights)
    // Bellman-Ford → Circular (negative weights don't make physical sense)
    const smartLayout = newAlg === "dijkstra" ? "spatial" : "circular";
    
    // Update graph params with smart defaults
    const updatedParams = { 
      ...graphParams, 
      graphType: smartLayout 
    };

    // If switching to Dijkstra with negative edges, disable them
    if (newAlg === "dijkstra" && graphParams.allowNegativeEdges) {
      updatedParams.allowNegativeEdges = false;
      setExplanation(
        "Switched to Dijkstra. Negative edges disabled. Layout set to Spatial (physical distance)."
      );
    } else {
      setExplanation(
        newAlg === "dijkstra"
          ? "Switched to Dijkstra. Layout set to Spatial (weights match physical distance)."
          : "Switched to Bellman-Ford. Layout set to Circular (supports negative weights)."
      );
    }

    setGraphParams(updatedParams);
    resetGraph();
  };

  // =========================
  //   RESET GRAPH
  // =========================
  const resetGraph = () => {
    reset();
    const resetEdges = edges.map((edge) => ({ ...edge, status: "unvisited" }));
    setEdges(resetEdges);
    setExplanation(
      'Graph reset. Select an algorithm and press "Start" to begin.'
    );
  };

  // =========================
  //   PLAY / PAUSE
  // =========================
  const handlePlayPause = () => {
    play();
  };

  // =========================
  //   STEP-BY-STEP
  // =========================
  const handleStep = () => {
    step();
  };

  // =========================
  //   APPLY STEP (memoized for performance)
  // =========================
  // =========================
  //   SHOW FINAL SHORTEST PATHS
  // =========================
  const handleShowAnswer = () => {
    // If no steps yet, generate them via hook (which properly updates shortestPathResult)
    if (steps.length === 0) {
      generateSteps();
      // After generating steps, we need to wait for next render to have shortestPathResult
      return;
    }

    // If shortestPathResult is not populated yet, can't show answer
    if (!shortestPathResult || !shortestPathResult.paths) {
      return;
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
    let newValue;
    
    // Handle different input types
    if (type === "checkbox") {
      newValue = checked;
    } else if (type === "select-one" && (name === "graphType")) {
      // Handle string values for select dropdowns
      newValue = value;
    } else {
      newValue = parseFloat(value);
    }

    // If toggling negative edges in Dijkstra
    if (name === "allowNegativeEdges" && newValue && algorithm === "dijkstra") {
      setExplanation(
        "Warning: Dijkstra doesn't support negative edges. Switch to Bellman-Ford."
      );
    }

    // If changing graph type, provide helpful explanation
    if (name === "graphType") {
      setExplanation(
        newValue === "spatial"
          ? "Spatial graph: edge weights represent actual distance"
          : "Circular graph: edge weights are randomly assigned"
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
    setIsEditingEdge(false);
    setIsSelectingSource(false);
    setIsSelectingDest(false);
    setTempNode(null);
  };
  const handleEditEdgeMode = () => {
    setIsEditingEdge(!isEditingEdge);
    setIsAddingNode(false);
    setIsAddingEdge(false);
    setIsDeletingNode(false);
    setIsDeletingEdge(false);
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
    setIsEditingEdge(false);
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
    // In manual mode, allow all operations
    if (mode !== "manual" && mode !== "auto") return;

    // In auto mode, only allow source/target selection if in selection mode
    if (mode === "auto" && !isSelectingSource && !isSelectingDest) {
      // Don't block - just do nothing silently
      return;
    }

    // Selecting source
    if (isSelectingSource) {
      setSelectedSourceNode(nodeId);
      setIsSelectingSource(false);
      setExplanation(`Set node ${nodes[nodeId]?.label} as the source node.`);
      // When changing source, reset the visualization
      setShowAnswer(false);
      setVisualizationMode("explore");
      reset(); // Reset algorithm state via hook
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
    const isEditMode = weightPopover.mode === 'edit';
    
    // Validate weight
    let validWeight = true;
    let errorMsg = "";

    if (algorithm === "dijkstra" && weight < 0) {
      validWeight = false;
      errorMsg = "Dijkstra doesn't support negative edges.";
    }

    if (!validWeight) {
      setExplanation(errorMsg);
      setWeightPopover({ ...weightPopover, isOpen: false });
      return;
    }

    if (isEditMode) {
      // Edit existing edge weight
      const edgeId = weightPopover.existingEdgeId;
      setEdges(prevEdges =>
        prevEdges.map(edge =>
          edge.id === edgeId
            ? { ...edge, weight, isNegative: weight < 0, status: "unvisited" }
            : { ...edge, status: "unvisited" }
        )
      );

      // Reset algorithm state since graph was modified
      reset();

      // If we're in view mode, switch back to explore mode
      if (visualizationMode === "view") {
        setVisualizationMode("explore");
        setShowAnswer(false);
      }

      setExplanation(
        graphParams.graphType === 'spatial'
          ? "⚠️ Edge weight edited. Note: This breaks the spatial distance invariant. Algorithm state reset."
          : "Edge weight updated. Algorithm state reset."
      );
    } else {
      // Create new edge
      if (source !== undefined && target !== undefined) {
        const edgeId = `${source}-${target}`;
        if (!edges.some((e) => e.id === edgeId)) {
          // Respect the isDirected setting when manually adding edges
          const isDirected = graphParams.isDirected !== false;
          setEdges([
            ...edges,
            {
              id: edgeId,
              source,
              target,
              weight,
              status: "unvisited",
              isUndirected: !isDirected, // Mark as undirected if graph is undirected
            },
          ]);
        }
      }
    }

    // Reset states
    setWeightPopover({ 
      isOpen: false, 
      position: { x: 0, y: 0 }, 
      pendingEdge: null,
      mode: 'create',
      existingEdgeId: null,
      currentWeight: 10,
    });
    setTempNode(null);
    setIsAddingEdge(false);
    setIsEditingEdge(false);
  };

  // Handle weight cancel from popover
  const handleWeightCancel = () => {
    setWeightPopover({ 
      isOpen: false, 
      position: { x: 0, y: 0 }, 
      pendingEdge: null,
      mode: 'create',
      existingEdgeId: null,
      currentWeight: 10,
    });
    setTempNode(null);
    setIsAddingEdge(false);
    setIsEditingEdge(false);
  };

  // When an edge is clicked
  const handleEdgeClick = (edgeId) => {
    if (isDeletingEdge) {
      const filtered = edges.filter((e) => e.id !== edgeId);
      setEdges(filtered);
      setIsDeletingEdge(false);
    }
  };

  // When an edge weight is clicked (for editing)
  const handleWeightClick = (edge) => {
    // In manual mode, require edit mode to be active
    // In auto mode, always allow editing (no restrictions)
    if (mode === "manual" && !isEditingEdge) return;

    // Don't allow editing while algorithm is running
    if (isRunning) return;

    // The edge object from GraphRenderer has source/target as full objects, not IDs
    // Extract the actual node objects
    const sourceNode = edge.source;
    const targetNode = edge.target;

    if (!sourceNode || !targetNode) return;

    const midX = (sourceNode.x + targetNode.x) / 2;
    const midY = (sourceNode.y + targetNode.y) / 2;

    // Convert SVG coordinates to screen coordinates, accounting for transform
    const svgRect = svgRef.current?.getBoundingClientRect();
    const screenX = svgRect ? svgRect.left + midX * graphTransform.scale + graphTransform.x : midX;
    const screenY = svgRect ? svgRect.top + midY * graphTransform.scale + graphTransform.y : midY;

    // Extract the source/target IDs from the edge.id (format: "sourceId-targetId")
    const [sourceId, targetId] = edge.id.split('-').map(Number);

    setWeightPopover({
      isOpen: true,
      position: { x: screenX, y: screenY },
      pendingEdge: { source: sourceId, target: targetId },
      mode: 'edit',
      existingEdgeId: edge.id,
      currentWeight: edge.weight,
    });
  };

  // =========================
  //   INIT & RESIZE
  // =========================
  useEffect(() => {
    // Generate a random graph on first load only
    handleGenerateRandomGraph();
    // Capture initial container dimensions
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      setOriginalDimensions({ width: rect.width, height: rect.height });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Calculate graph bounds (centroid and extent) when nodes change
  useEffect(() => {
    if (nodes.length === 0) {
      setGraphBounds(null);
      return;
    }

    // Calculate bounding box and centroid
    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    
    const centroidX = (minX + maxX) / 2;
    const centroidY = (minY + maxY) / 2;
    const width = maxX - minX || 1; // Avoid division by zero
    const height = maxY - minY || 1;

    setGraphBounds({
      centroidX,
      centroidY,
      width,
      height,
      minX,
      minY,
      maxX,
      maxY
    });
  }, [nodes]);

  // Handle resize and orientation changes while maintaining graph centering
  useEffect(() => {
    if (!originalDimensions || !graphBounds || nodes.length === 0) return;

    let resizeTimeout;
    const handleResize = () => {
      // Debounce resize events
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!svgRef.current) return;
        
        const rect = svgRef.current.getBoundingClientRect();
        const newWidth = rect.width;
        const newHeight = rect.height;
        
        // Calculate scale factors
        const scaleX = newWidth / originalDimensions.width;
        const scaleY = newHeight / originalDimensions.height;
        
        // Only proceed if dimensions changed significantly and scale is reasonable
        if ((Math.abs(scaleX - 1) > 0.01 || Math.abs(scaleY - 1) > 0.01) && 
            scaleX > 0.3 && scaleX < 3 && scaleY > 0.3 && scaleY < 3) {
          
          // Calculate new center point (should remain at center of viewport)
          const newCenterX = newWidth / 2;
          const newCenterY = newHeight / 2;
          
          // Calculate offset needed to keep graph centered
          // Scale nodes relative to their centroid, then translate to new center
          setNodes(prevNodes => {
            // Calculate current centroid from prevNodes (ensures we use latest state)
            if (prevNodes.length === 0) return prevNodes;
            
            const xs = prevNodes.map(n => n.x);
            const ys = prevNodes.map(n => n.y);
            const currentCentroidX = (Math.min(...xs) + Math.max(...xs)) / 2;
            const currentCentroidY = (Math.min(...ys) + Math.max(...ys)) / 2;
            
            const updatedNodes = prevNodes.map(node => {
              // Calculate offset from current centroid
              const offsetX = node.x - currentCentroidX;
              const offsetY = node.y - currentCentroidY;
              
              // Scale the offset
              const scaledOffsetX = offsetX * scaleX;
              const scaledOffsetY = offsetY * scaleY;
              
              // Position relative to new center
              return {
                ...node,
                x: newCenterX + scaledOffsetX,
                y: newCenterY + scaledOffsetY
              };
            });
            
            // For spatial graphs, recalculate edge weights based on new node positions
            const isSpatial = graphParams.graphType === 'spatial';
            if (isSpatial && edges.length > 0) {
              // Use the updated nodes directly to recalculate weights
              setEdges(prevEdges => {
                return prevEdges.map(edge => {
                  const sourceNode = updatedNodes.find(n => n.id === edge.source);
                  const targetNode = updatedNodes.find(n => n.id === edge.target);
                  
                  if (sourceNode && targetNode) {
                    // Recalculate weight based on new positions, respecting user's weight range
                    const newWeight = getEuclideanWeight(
                      sourceNode,
                      targetNode,
                      { width: newWidth, height: newHeight },
                      graphParams.minWeight,
                      graphParams.maxWeight
                    );
                    return { ...edge, weight: newWeight };
                  }
                  return edge;
                });
              });
            }
            
            return updatedNodes;
          });
          
          // Update baseline dimensions for next resize
          setOriginalDimensions({ width: newWidth, height: newHeight });
        }
      }, 150); // 150ms debounce
    };

    // Listen for resize events
    window.addEventListener('resize', handleResize);
    // Listen for orientation changes (mobile)
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, [originalDimensions, graphBounds, nodes.length, graphParams.graphType, edges.length]);

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
    <div 
      className={embedded ? "flex flex-col bg-zinc-100 dark:bg-zinc-950" : "flex flex-col min-h-screen bg-zinc-100 dark:bg-zinc-950"}
      style={embedded ? { height: '600px', maxHeight: '600px', overflow: 'hidden' } : undefined}
    >
      {/* FLOATING NAVBAR */}
      <div className="fixed top-2 sm:top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1rem)] sm:w-auto max-w-[calc(100vw-2rem)] overflow-visible">
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

          {/* Visualization Mode Toggle (Desktop) */}
          {!isMobile && (
            <>
              <FloatingNavDivider />
              <div className="relative flex-shrink-0">
                <Tabs value={visualizationMode} onValueChange={(value) => {
                  if (value === "explore" && visualizationMode === "view") {
                    toggleVisualizationMode();
                  } else if (value === "view" && visualizationMode === "explore") {
                    toggleVisualizationMode();
                  }
                }}>
                  <TabsList className="h-8 sm:h-9 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                    <div className="relative group inline-block">
                      <TabsTrigger 
                        value="explore" 
                        className="text-[10px] sm:text-xs px-2 sm:px-3 rounded-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                        title="Step through the algorithm step-by-step"
                      >
                        Explore
                      </TabsTrigger>
                    </div>
                    <div className="relative group inline-block ml-0.5">
                      <TabsTrigger 
                        value="view" 
                        className="text-[10px] sm:text-xs px-2 sm:px-3 rounded-full data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm"
                        title="See final shortest paths instantly"
                      >
                        View
                      </TabsTrigger>
                    </div>
                  </TabsList>
                </Tabs>
              </div>
            </>
          )}

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
                    onWeightClick={handleWeightClick}
                    graphType={graphParams.graphType || 'circular'}
                    negativeCycleDetected={negativeCycleDetected}
                    isRunning={isRunning}
                    isEditingEdge={isEditingEdge}
                  />
                </g>
              </svg>

              {/* Mobile pinch/zoom indicator */}
              {isMobile && (
                <div className="absolute top-3 right-3 z-10 bg-white/70 dark:bg-zinc-800/70 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-gray-700 dark:text-gray-300 shadow-sm">
                  {Math.round(graphTransform.scale * 100)}%
                </div>
              )}

              {/* Interactive Hints - Auto Mode - Desktop only, dismissible */}
              {!isMobile && mode === "auto" && edges.length > 0 && !isRunning && steps.length === 0 && !isSelectingSource && !isSelectingDest && showEditHint && (
                <div className="absolute top-3 right-3 z-20 bg-indigo-500/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 max-w-xs group">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>💡 Click edge weights to edit them!</span>
                  <button
                    onClick={() => setShowEditHint(false)}
                    className="ml-1 opacity-70 hover:opacity-100 transition-opacity"
                    aria-label="Dismiss hint"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Selection Mode Hint */}
              {mode === "auto" && (isSelectingSource || isSelectingDest) && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-emerald-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2 animate-pulse">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <span>{isSelectingSource ? "Click a node to set as SOURCE" : "Click a node to set as TARGET"}</span>
                </div>
              )}

              {/* Negative Cycle Toast Banner */}
              {negativeCycleDetected && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-rose-500 text-white px-4 sm:px-6 py-3 rounded-lg shadow-xl border-2 border-rose-600 animate-pulse flex items-center gap-3 max-w-[90%] sm:max-w-md">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">!</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">Negative Cycle Detected</div>
                    <div className="text-xs opacity-90">No shortest paths exist. The algorithm cannot find a solution.</div>
                  </div>
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

              {/* Negative Cycle Toast Banner */}
              {negativeCycleDetected && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 bg-rose-500 text-white px-6 py-3 rounded-lg shadow-xl border-2 border-rose-600 animate-pulse flex items-center gap-3 max-w-md">
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm">!</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm">Negative Cycle Detected</div>
                    <div className="text-xs opacity-90">No shortest paths exist. The algorithm cannot find a solution.</div>
                  </div>
                </div>
              )}
            </div>

            {/* AUTO MODE TOOLBAR - Simple controls for source/dest selection */}
            {mode === "auto" && !isMobile && (
              <div className="bg-gradient-to-r from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800 border-t border-zinc-200 dark:border-zinc-700 px-4 py-3">
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={handleSelectSourceMode}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      isSelectingSource
                        ? "bg-emerald-500 text-white shadow-md"
                        : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    {isSelectingSource ? "Click a node..." : "Set Source"}
                  </button>

                  <button
                    onClick={handleSelectDestMode}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      isSelectingDest
                        ? "bg-orange-500 text-white shadow-md"
                        : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600 hover:bg-orange-50 dark:hover:bg-orange-950/20"
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    {isSelectingDest ? "Click a node..." : "Set Target"}
                  </button>

                  {(isSelectingSource || isSelectingDest) && (
                    <button
                      onClick={handleCancelOperation}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* MANUAL MODE TOOLBAR - Desktop only, when in manual mode */}
            {mode === "manual" && !isMobile && (
              <ManualModeToolbar
                isAddingNode={isAddingNode}
                isAddingEdge={isAddingEdge}
                isDeletingNode={isDeletingNode}
                isDeletingEdge={isDeletingEdge}
                isEditingEdge={isEditingEdge}
                isSelectingSource={isSelectingSource}
                isSelectingDest={isSelectingDest}
                tempNode={tempNode}
                onAddNodeMode={handleAddNodeMode}
                onAddEdgeMode={handleAddEdgeMode}
                onDeleteNodeMode={handleDeleteNodeMode}
                onDeleteEdgeMode={handleDeleteEdgeMode}
                onEditEdgeMode={handleEditEdgeMode}
                onSelectSourceMode={handleSelectSourceMode}
                onSelectDestMode={handleSelectDestMode}
                onClearGraph={clearGraph}
                onCancelOperation={handleCancelOperation}
                nodes={nodes}
                selectedSourceNode={selectedSourceNode}
                selectedDestNode={selectedDestNode}
              />
            )}

            {/* FLOATING CONTROL BAR - Desktop only */}
            <div className={`${isMobile ? "hidden" : "fixed bottom-5 left-1/2 -translate-x-1/2 z-40"}`}>
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
                      <div className="bg-white dark:bg-zinc-800 shadow-sm rounded-lg p-2 border border-blue-200 dark:border-zinc-700">
                        <h3 className="text-xs font-bold mb-1 text-blue-800 dark:text-blue-400">
                          Distances
                        </h3>
                        <div className="max-h-24 overflow-y-auto border border-slate-100 dark:border-zinc-700 rounded">
                          {Object.keys(distanceArray).length > 0 ? (
                            <table className="w-full border-collapse text-xs">
                              <thead className="bg-slate-50 dark:bg-zinc-700 sticky top-0">
                                <tr>
                                  <th className="p-1 text-left border-b dark:border-zinc-600 dark:text-zinc-200">
                                    Node
                                  </th>
                                  <th className="p-1 text-left border-b dark:border-zinc-600 dark:text-zinc-200">
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
                                      <td className="p-1 border-b dark:border-zinc-700 dark:text-zinc-200">
                                        {nodes[nodeId]?.label}
                                      </td>
                                      <td className="p-1 border-b dark:border-zinc-700 dark:text-zinc-200">
                                        {distanceArray[nodeId] === Infinity
                                          ? "∞"
                                          : distanceArray[nodeId]}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-slate-500 dark:text-zinc-400 text-center py-2 px-2 text-xs">
                              No data
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-zinc-800 shadow-sm rounded-lg p-2 border border-blue-200 dark:border-zinc-700">
                        <h3 className="text-xs font-bold mb-1 text-blue-800 dark:text-blue-400">
                          Priority Queue
                        </h3>
                        <div className="max-h-24 overflow-y-auto border border-slate-100 dark:border-zinc-700 rounded">
                          {minHeap.length > 0 ? (
                            <table className="w-full border-collapse text-xs">
                              <thead className="bg-slate-50 dark:bg-zinc-700 sticky top-0">
                                <tr>
                                  <th className="p-1 text-left border-b dark:border-zinc-600 dark:text-zinc-200">
                                    Node
                                  </th>
                                  <th className="p-1 text-left border-b dark:border-zinc-600 dark:text-zinc-200">
                                    Dist
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {minHeap.slice(0, 5).map((item, i) => (
                                  <tr
                                    key={i}
                                    className={i === 0 ? "bg-orange-50 dark:bg-orange-900/30" : ""}
                                  >
                                    <td className="p-1 border-b dark:border-zinc-700 dark:text-zinc-200">
                                      {nodes[item.id]?.label}
                                    </td>
                                    <td className="p-1 border-b dark:border-zinc-700 dark:text-zinc-200">
                                      {item.dist}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-slate-500 dark:text-zinc-400 text-center py-2 px-2 text-xs">
                              Empty
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="bg-white dark:bg-zinc-800 shadow-sm rounded-lg p-2 border border-blue-200 dark:border-zinc-700">
                        <h3 className="text-xs font-bold mb-1 text-blue-800 dark:text-blue-400">
                          Distances
                        </h3>
                        <div className="max-h-24 overflow-y-auto border border-slate-100 dark:border-zinc-700 rounded">
                          {Object.keys(distanceArray).length > 0 ? (
                            <table className="w-full border-collapse text-xs">
                              <thead className="bg-slate-50 dark:bg-zinc-700 sticky top-0">
                                <tr>
                                  <th className="p-1 text-left border-b dark:border-zinc-600 dark:text-zinc-200">
                                    Node
                                  </th>
                                  <th className="p-1 text-left border-b dark:border-zinc-600 dark:text-zinc-200">
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
                                      <td className="p-1 border-b dark:border-zinc-700 dark:text-zinc-200">
                                        {nodes[nodeId]?.label}
                                      </td>
                                      <td className="p-1 border-b dark:border-zinc-700 dark:text-zinc-200">
                                        {distanceArray[nodeId] === Infinity
                                          ? "∞"
                                          : distanceArray[nodeId]}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          ) : (
                            <div className="text-slate-500 dark:text-zinc-400 text-center py-2 px-2 text-xs">
                              No data
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="bg-white dark:bg-zinc-800 shadow-sm rounded-lg p-2 border border-blue-200 dark:border-zinc-700">
                        <div className="flex justify-between items-center mb-1">
                          <h3 className="text-xs font-bold text-blue-800 dark:text-blue-400">
                            Iteration
                          </h3>
                          {negativeCycleDetected && (
                            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 text-xs font-medium rounded-full">
                              Negative Cycle!
                            </span>
                          )}
                        </div>
                        <div className="border border-slate-100 dark:border-zinc-700 p-2 rounded bg-white dark:bg-zinc-900">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium dark:text-zinc-200">
                              {iterationCount} of {nodes.length}
                            </span>
                            <div className="w-24 bg-gray-200 dark:bg-zinc-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
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
                visualizationMode={visualizationMode}
                toggleVisualizationMode={toggleVisualizationMode}
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
            {/* Graph Structure Group */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">Graph Structure</h3>
              
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

              {/* Layout Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Layout
                </label>
                <select
                  name="graphType"
                  value={graphParams.graphType || 'circular'}
                  onChange={handleParamChange}
                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-700 p-2 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="circular">Circular</option>
                  <option value="spatial">Spatial</option>
                </select>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {graphParams.graphType === 'spatial' 
                    ? "Spatial: weights match distance (like a map)" 
                    : "Circular: weights are randomly assigned"}
                </p>
                {algorithm === "dijkstra" && graphParams.graphType === "circular" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic">
                    💡 Tip: Spatial layout works best with Dijkstra (positive weights)
                  </p>
                )}
                {algorithm === "bellmanford" && graphParams.graphType === "spatial" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic">
                    💡 Tip: Circular layout works better with Bellman-Ford (supports negative weights)
                  </p>
                )}
              </div>

              {/* Directed/Undirected Toggle */}
              <div className="mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Graph Type
                    </label>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {graphParams.isDirected !== false 
                        ? "Directed: edges have direction (one-way)" 
                        : "Undirected: edges can be traversed both ways"}
                    </p>
                  </div>
                  <Switch
                    checked={graphParams.isDirected !== false}
                    onCheckedChange={(checked) => {
                      setGraphParams({ ...graphParams, isDirected: checked });
                      setExplanation(
                        checked 
                          ? "Switched to directed graph. Edges have direction."
                          : "Switched to undirected graph. Edges can be traversed both ways."
                      );
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Auto Mode Quick Actions */}
            {mode === "auto" && (
              <div className="bg-indigo-50 dark:bg-indigo-950/50 p-3 rounded-lg border border-indigo-200 dark:border-indigo-800 mb-4">
                <p className="font-medium text-indigo-800 dark:text-indigo-400 mb-2 text-sm">
                  Graph Controls:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => { handleSelectSourceMode(); setIsDrawerOpen(false); }}
                    className={`px-3 py-1.5 rounded text-sm flex items-center gap-2 ${
                      isSelectingSource
                        ? "bg-emerald-500 text-white"
                        : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600"
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    {isSelectingSource ? "Click Node..." : "Set Source"}
                  </button>
                  <button
                    onClick={() => { handleSelectDestMode(); setIsDrawerOpen(false); }}
                    className={`px-3 py-1.5 rounded text-sm flex items-center gap-2 ${
                      isSelectingDest
                        ? "bg-orange-500 text-white"
                        : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600"
                    }`}
                  >
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                    {isSelectingDest ? "Click Node..." : "Set Target"}
                  </button>
                </div>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                  💡 Click edge weights directly on the graph to edit them
                </p>
              </div>
            )}

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
                {/* Graph Parameters Group */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">Graph Parameters</h3>
                  
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

                </div>

                {/* Algorithm Settings Group */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-3">Algorithm Settings</h3>
                  
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
                </div>

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

      {/* Weight Input Popover for Edge Creation/Editing */}
      <WeightInputPopover
        isOpen={weightPopover.isOpen}
        position={weightPopover.position}
        initialWeight={weightPopover.currentWeight}
        allowNegative={algorithm === "bellmanford" && graphParams.allowNegativeEdges}
        onConfirm={handleWeightConfirm}
        onCancel={handleWeightCancel}
      />

    </div>
  );
}

export default ShortestPathVisualizer;