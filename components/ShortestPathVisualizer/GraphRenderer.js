import React, { useMemo, useState, useEffect } from "react";
import {
  findNonConflictingPosition,
  calculateEdgePath,
} from "./graphHelpers";

/**
 * Custom hook to detect mobile devices
 * Listens for window resize events to keep mobile state in sync with viewport
 */
function useIsMobile() {
  // Always start with false to match SSR, then update after mount
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    setMounted(true);
    
    const checkMobile = () => {
      return window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );
    };

    const handleResize = () => {
      setIsMobile(checkMobile());
    };

    // Set initial mobile state after mount
    setIsMobile(checkMobile());
    
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Return false during SSR and initial client render to prevent hydration mismatch
  return mounted ? isMobile : false;
}

/**
 * A pure "presentational" component that draws nodes and edges in the SVG.
 * - `nodes` (array): list of node objects {id, x, y, label}
 * - `edges` (array): list of edge objects {id, source, target, weight, status, isNegative, inNegativeCycle}
 * - `distanceArray`: object of { nodeId: distanceValue }
 * - `visitedNodes`: Set of node IDs that are considered visited
 * - `selectedSourceNode` / `selectedDestNode`: highlight them differently
 * - `onNodeClick(nodeId)`: callback for node clicks
 * - `onEdgeClick(edgeId)`: callback for edge clicks
 * - `algorithm`: 'dijkstra' or 'bellmanford' to apply algorithm-specific styling
 * - `hasNegativeCycle`: boolean flag indicating if a negative cycle was detected
 */
function GraphRenderer({
  nodes,
  edges,
  distanceArray,
  visitedNodes,
  selectedSourceNode,
  selectedDestNode,
  onNodeClick,
  onEdgeClick,
  onWeightClick,
  algorithm = 'dijkstra',
  hasNegativeCycle = false,
  graphType = 'circular',
  negativeCycleDetected = false,
  isRunning = false,
  isEditingEdge = false,
  // Drag handlers
  onNodeDragStart,
  onNodeTouchStart,
  onNodeTouchMove,
  onNodeTouchEnd,
  draggedNodeId = null,
}) {
  // Use custom hook to detect mobile devices with proper resize handling
  const isMobile = useIsMobile();

  // Helper to get algorithm-specific styles - memoized since it only depends on algorithm and isMobile
  const styles = useMemo(() => {
    if (algorithm === 'dijkstra') {
      return {
        nodeColor: '#3b82f6',       // Bright blue for Dijkstra nodes
        sourceNodeColor: '#22c55e', // Green for source
        destNodeColor: '#f97316',   // Orange for destination
        edgeColor: '#94a3b8',       // Default edge color
        relaxedColor: '#22c55e',    // Green for relaxed edges
        candidateColor: '#fb923c',  // Orange for candidate edges
        excludedColor: '#ef4444',   // Red for excluded edges
        includedColor: '#22c55e',   // Green for final path
        weightLabelBg: 'white',     // White background for weight labels
        relaxedStrokeWidth: isMobile ? 5 : 3,
      };
    } else {
      return {
        nodeColor: '#2563eb',       // Darker blue for Bellman-Ford
        sourceNodeColor: '#16a34a', // Darker green for source
        destNodeColor: '#ea580c',   // Darker orange for destination
        edgeColor: '#64748b',       // Darker default edge color
        relaxedColor: '#059669',    // Teal-green for relaxed edges
        candidateColor: '#d97706',  // Darker orange for candidates
        excludedColor: '#dc2626',   // Darker red for excluded
        includedColor: '#059669',   // Teal-green for final path
        negativeEdgeColor: '#9333ea', // Purple for negative edges
        negativeCycleColor: '#db2777', // Pink for negative cycle edges
        weightLabelBg: '#f8fafc',   // Light gray background for weight labels
        relaxedStrokeWidth: isMobile ? 5 : 3,
      };
    }
  }, [algorithm, isMobile]);

  // Heavy geometry calculations - memoized to prevent recalculation on every render
  // This includes Bezier control points and label collision detection
  const processedEdges = useMemo(() => {
    // Create a map to track edge weight label positions and prevent overlap
    const usedLabelPositions = new Map();

    // Process all edges to assign optimal weight positions
    return edges
      .map((edge) => {
        const source = nodes[edge.source];
        const target = nodes[edge.target];
        if (!source || !target) return null;

        // Calculate edge path using extracted helper function
        const edgeCalculations = calculateEdgePath(source, target, isMobile);

        // Find a non-conflicting position for the weight label
        const { x: adjustedLabelX, y: adjustedLabelY } =
          findNonConflictingPosition(
            edgeCalculations.labelX,
            edgeCalculations.labelY,
            edgeCalculations.angle,
            usedLabelPositions,
            isMobile
          );

        return {
          ...edge,
          source,
          target,
          ...edgeCalculations,
          adjustedLabelX,
          adjustedLabelY,
        };
      })
      .filter(Boolean);
  }, [nodes, edges, isMobile]);

  // RENDER EDGES - uses memoized processedEdges
  const renderEdges = () => {
    return processedEdges.map(edge => {
      const {
        targetX, targetY,
        endTangentAngle, adjustedLabelX, adjustedLabelY,
        source, target, bezierPath
      } = edge;

      // Arrow properties - use end tangent angle for proper arrow direction on curved path
      const arrowSize = isMobile ? 14 : 10;
      const arrowAngle = Math.PI / 8;

      // Base color logic
      let color = styles.edgeColor;
      // Undirected edges are slightly thicker for visual distinction
      let strokeWidth = edge.isUndirected 
        ? (isMobile ? 5 : 2.5)
        : (isMobile ? 4 : 2);
      let strokeDasharray = "none";
      let strokeOpacity = 0.9;
      
      // For circular graphs, scale visual weight (thickness/opacity) with edge weight
      // This helps users understand that thicker/lighter edges = cheaper paths
      if (graphType === 'circular' && edge.status === 'unvisited') {
        // Normalize weight to 0-1 range (assuming weights 1-30 range)
        const normalizedWeight = Math.min(1, Math.max(0, (edge.weight - 1) / 29));
        // Invert: lower weight = thicker line (more prominent/cheaper)
        const thicknessFactor = 1 - (normalizedWeight * 0.5); // 1.0 to 0.5 range
        strokeWidth = strokeWidth * (0.7 + thicknessFactor * 0.3); // Scale between 0.7x and 1.0x
        strokeOpacity = 0.6 + (1 - normalizedWeight) * 0.4; // 0.6 to 1.0 opacity
      }
      
      // Handle negative edges with special styling for Bellman-Ford
      if (algorithm === 'bellmanford' && edge.isNegative) {
        color = styles.negativeEdgeColor;
        strokeWidth = isMobile ? 4.5 : 2.5;
        strokeDasharray = isMobile ? "6,4" : "4,3";
      }
      
      // Special styling for edges in negative cycles
      if (algorithm === 'bellmanford' && edge.inNegativeCycle) {
        color = edge.status === 'negativecycle' ? styles.negativeCycleColor : color;
        strokeDasharray = edge.status === 'negativecycle' ? "5,5" : strokeDasharray;
      }

      // Status-based styling (overrides negative edge styling)
      switch (edge.status) {
        case "candidate":
          color = styles.candidateColor;
          strokeWidth = isMobile ? 5 : 3;
          break;
        case "relaxed":
          color = styles.relaxedColor;
          strokeWidth = styles.relaxedStrokeWidth;
          break;
        case "excluded":
          color = styles.excludedColor;
          strokeWidth = isMobile ? 3 : 1.5;
          break;
        case "included":
          color = styles.includedColor;
          strokeWidth = isMobile ? 6 : 4;
          break;
        case "negativecycle":
          color = styles.negativeCycleColor;
          strokeWidth = isMobile ? 6 : 4;
          strokeDasharray = "5,5";
          break;
        default:
          break;
      }

      // For Bellman-Ford, if there's a detected negative cycle, add warning styling
      const cycleWarningEffect = algorithm === 'bellmanford' && 
                                negativeCycleDetected && 
                                (edge.status === 'negativecycle' || edge.inNegativeCycle);

      return (
        <g
          key={edge.id}
          onClick={() => onEdgeClick(edge.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onEdgeClick(edge.id);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Edge from ${source.label} to ${target.label} with weight ${edge.weight}`}
          className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          data-tooltip={`${source.label} → ${target.label} (${edge.weight})`}
          style={{ pointerEvents: 'visiblePainted' }}
        >
          {/* For Bellman-Ford, add a glow effect to negative edges (rendered first for layering) */}
          {algorithm === 'bellmanford' && edge.isNegative && (
            <path
              d={bezierPath}
              fill="none"
              stroke={styles.negativeEdgeColor}
              strokeWidth={strokeWidth + 4}
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              strokeOpacity="0.2"
              filter="blur(4px)"
              className="transition-all duration-300 ease-in-out"
            />
          )}
          
          {/* Glow effect for negative cycle edges */}
          {cycleWarningEffect && (
            <path
              d={bezierPath}
              fill="none"
              stroke={styles.negativeCycleColor}
              strokeWidth={strokeWidth + 6}
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              strokeOpacity="0.4"
              filter="url(#glow)"
              className="animate-pulse"
            />
          )}
          
          {/* Main curved path - Bezier curve */}
          <path
            d={bezierPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            strokeOpacity={strokeOpacity}
            className={`transition-all duration-300 ease-in-out ${
              cycleWarningEffect ? "animate-pulse" : ""
            }`}
            style={{ pointerEvents: 'stroke' }}
          />

          {/* Arrow head - positioned at end of curve with correct tangent angle (only for directed edges) */}
          {!edge.isUndirected && (
            <polygon
              points={`
                ${targetX},${targetY}
                ${targetX - arrowSize * Math.cos(endTangentAngle - arrowAngle)},${
                targetY - arrowSize * Math.sin(endTangentAngle - arrowAngle)
              }
                ${targetX - arrowSize * Math.cos(endTangentAngle + arrowAngle)},${
                targetY - arrowSize * Math.sin(endTangentAngle + arrowAngle)
              }
              `}
              fill={color}
            />
          )}

          {/* Weight label - with adjusted position to avoid overlaps */}
          <g
            onClick={(e) => {
              e.stopPropagation();
              if (onWeightClick) {
                onWeightClick(edge);
              }
            }}
            className="weight-label-group cursor-pointer"
            style={{ pointerEvents: 'bounding-box' }}
          >
            <rect
              x={adjustedLabelX - (isMobile ? 15 : 12)}
              y={adjustedLabelY - (isMobile ? 15 : 12)}
              width={isMobile ? 30 : 24}
              height={isMobile ? 30 : 24}
              fill={edge.isNegative ? "#f0ecfe" : styles.weightLabelBg}
              stroke={color}
              strokeWidth="1.5"
              rx="6"
              filter="drop-shadow(0px 1px 2px rgba(0,0,0,0.1))"
              opacity="0.95"
              className={`weight-label-bg transition-all duration-150 ${cycleWarningEffect ? "animate-pulse" : ""}`}
            />
            <text
              x={adjustedLabelX}
              y={adjustedLabelY}
              textAnchor="middle"
              dominantBaseline="middle"
              fontWeight="bold"
              fontSize={isMobile ? "14" : "12"}
              fill={edge.isNegative ? "#7e22ce" : "#333333"}
              className="weight-label-text transition-all duration-150"
              style={{ pointerEvents: 'none' }}
            >
              {edge.weight}
            </text>
          </g>
        </g>
      );
    });
  };

  // RENDER NODES
  const renderNodes = () => {
    return nodes.map((node) => {
      // Default color from algorithm style
      let fillColor = styles.nodeColor;
      let strokeColor = algorithm === 'dijkstra' ? '#2563eb' : '#1e40af';
      let strokeWidth = isMobile ? 3 : 2;
      let isAnimated = false;

      // Check if this node is being dragged
      const isBeingDragged = draggedNodeId === node.id;

      // Source node
      if (node.id === selectedSourceNode) {
        fillColor = styles.sourceNodeColor;
        strokeColor = algorithm === 'dijkstra' ? '#16a34a' : '#15803d';
        strokeWidth = isMobile ? 4 : 3;
      }

      // Dest node
      if (node.id === selectedDestNode) {
        fillColor = styles.destNodeColor;
        strokeColor = algorithm === 'dijkstra' ? '#ea580c' : '#c2410c';
        strokeWidth = isMobile ? 4 : 3;
      }

      // Visited - only animate if algorithm is still running
      if (visitedNodes.has(node.id) && isRunning) {
        isAnimated = true;
      }

      // Distance label
      const dist = distanceArray[node.id];
      const distanceLabel =
        dist === undefined || dist === Infinity ? "∞" : dist;

      // Negative cycle indicator for Bellman-Ford
      const isPartOfNegativeCycle = algorithm === 'bellmanford' &&
                                   hasNegativeCycle &&
                                   dist === -Infinity;

      // Smaller node radius on mobile
      const nodeRadius = isMobile ? 18 : 20;

      return (
        <g
          key={node.id}
          onMouseDown={(e) => onNodeDragStart && onNodeDragStart(e, node.id)}
          onTouchStart={(e) => onNodeTouchStart && onNodeTouchStart(e, node.id)}
          onTouchMove={(e) => onNodeTouchMove && onNodeTouchMove(e)}
          onTouchEnd={(e) => onNodeTouchEnd && onNodeTouchEnd(e, node.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNodeClick(node.id);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Node ${node.label}${
            dist !== undefined ? `, distance: ${distanceLabel}` : ''
          }`}
          className={`focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${isBeingDragged ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ touchAction: 'none' }}
        >
          {/* Invisible larger hit area for mobile */}
          {isMobile && (
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius + 20}
              fill="transparent"
              className="pointer-events-auto"
            />
          )}

          {/* Negative cycle warning glow for affected nodes */}
          {isPartOfNegativeCycle && (
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius + 8}
              fill="rgba(219, 39, 119, 0.3)"
              className="animate-pulse"
            />
          )}

          {/* Outer highlight if visited */}
          {isAnimated && !isPartOfNegativeCycle && (
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius + 5}
              fill={`rgba(${algorithm === 'dijkstra' ? '59, 130, 246' : '37, 99, 235'}, 0.2)`}
              className="animate-pulse"
            />
          )}

          {/* Drag highlight glow */}
          {isBeingDragged && (
            <circle
              cx={node.x}
              cy={node.y}
              r={nodeRadius + 8}
              fill="rgba(139, 92, 246, 0.3)"
              stroke="rgba(139, 92, 246, 0.6)"
              strokeWidth={2}
            />
          )}

          {/* Main circle */}
          <circle
            cx={node.x}
            cy={node.y}
            r={nodeRadius}
            fill={isPartOfNegativeCycle ? '#db2777' : fillColor}
            stroke={isBeingDragged ? '#8b5cf6' : (isPartOfNegativeCycle ? '#be185d' : strokeColor)}
            strokeWidth={isBeingDragged ? (isMobile ? 4 : 3) : strokeWidth}
            filter={isBeingDragged ? "drop-shadow(0px 4px 8px rgba(139,92,246,0.4))" : "drop-shadow(0px 2px 4px rgba(0,0,0,0.25))"}
            className="transition-all duration-150 ease-out"
          />

          {/* Node label */}
          <text
            x={node.x}
            y={node.y + 1}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontWeight="bold"
            fontSize={isMobile ? "18" : "14"}
          >
            {node.label}
          </text>

          {/* Distance label (if known) - position fixed */}
          {distanceArray && Object.keys(distanceArray).length > 0 && (
            <g>
              <circle
                cx={node.x}
                cy={node.y - (isMobile ? 26 : 30)}
                r={isMobile ? 14 : 14}
                fill={isPartOfNegativeCycle ? "#fecdd3" : styles.weightLabelBg}
                stroke={isPartOfNegativeCycle ? '#be185d' : strokeColor}
                strokeWidth="1.5"
                filter="drop-shadow(0px 2px 3px rgba(0,0,0,0.15))"
                className={isPartOfNegativeCycle ? "animate-pulse" : ""}
              />
              <text
                x={node.x}
                y={node.y - (isMobile ? 26 : 30)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={isMobile ? "13" : "12"}
                fontWeight="bold"
                fill={distanceLabel === "∞" ? styles.excludedColor : 
                      (distanceLabel === "-∞" ? "#be185d" : "#1e40af")}
              >
                {distanceLabel}
              </text>
            </g>
          )}
          
          {/* For Bellman-Ford: Add negative cycle indicator */}
          {isPartOfNegativeCycle && (
            <g>
              <circle
                cx={node.x}
                cy={node.y + (isMobile ? 35 : 40)}
                r={isMobile ? 14 : 12}
                fill="#db2777"
                className="animate-pulse"
              />
              <text
                x={node.x}
                y={node.y + (isMobile ? 35 : 40)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontWeight="bold"
                fontSize={isMobile ? "16" : "14"}
              >
                !
              </text>
            </g>
          )}
        </g>
      );
    });
  };

  // Add negative cycle warning indicator if a negative cycle is detected in Bellman-Ford
  const renderNegativeCycleIndicator = () => {
    if (algorithm !== 'bellmanford' || !hasNegativeCycle) return null;
    
    const x = 20;
    const y = 60;
    const padding = 10;
    const width = 180;
    
    return (
      <g className="animate-pulse">
        <rect
          x={x - padding}
          y={y - 15}
          rx={8}
          width={width}
          height={25}
          fill="#db2777"
          opacity={0.9}
        />
        <text
          x={x + width/2 - padding}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontWeight="bold"
          fontSize="14"
        >
          Negative Cycle Detected!
        </text>
      </g>
    );
  };

  return (
    <>
      <defs>
        {/* Glow filter for negative cycle edges */}
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        
        {graphType === 'spatial' && (
          <pattern
            id="gridPattern"
            x="0"
            y="0"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke={isMobile ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0.1)'}
              strokeWidth="1"
              className="dark:hidden"
            />
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke={isMobile ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.1)'}
              strokeWidth="1"
              className="hidden dark:block"
            />
          </pattern>
        )}
      </defs>
      {graphType === 'spatial' && (
        <rect
          width="100%"
          height="100%"
          fill="url(#gridPattern)"
          className="pointer-events-none"
        />
      )}
      <g>{renderEdges()}</g>
      <g>{renderNodes()}</g>
      <g>{renderNegativeCycleIndicator()}</g>
    </>
  );
}

export default GraphRenderer;
