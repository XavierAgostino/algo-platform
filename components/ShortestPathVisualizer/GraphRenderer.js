import React, { useMemo } from "react";

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
  algorithm = 'dijkstra',
  hasNegativeCycle = false
}) {
  // Check if we're on mobile based on user agent and screen size
  const isMobile = useMemo(() => {
    return typeof window !== "undefined" &&
      (window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ));
  }, []);

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
    
    // Helper to get a unique key for a position (for collision detection)
    const getPositionKey = (x, y) => {
      // Round to the nearest 5 pixels to create collision "cells"
      const gridSize = isMobile ? 15 : 10;
      const cellX = Math.round(x / gridSize);
      const cellY = Math.round(y / gridSize);
      return `${cellX},${cellY}`;
    };
    
    // Helper to check if a position is already in use
    const isPositionUsed = (x, y) => {
      const key = getPositionKey(x, y);
      return usedLabelPositions.has(key);
    };
    
    // Mark a position as used
    const markPositionUsed = (x, y) => {
      const key = getPositionKey(x, y);
      usedLabelPositions.set(key, true);
    };
    
    // Find a nearby non-conflicting position for a label
    const findNonConflictingPosition = (baseX, baseY, angle, attempts = 8) => {
      // First try the original position
      if (!isPositionUsed(baseX, baseY)) {
        markPositionUsed(baseX, baseY);
        return { x: baseX, y: baseY };
      }
      
      // Try positions along and perpendicular to the edge
      const perpAngle = angle + Math.PI / 2;
      const offset = isMobile ? 20 : 15;
      
      for (let i = 1; i <= attempts; i++) {
        // Try perpendicular offset
        const perpX = baseX + Math.cos(perpAngle) * offset * i;
        const perpY = baseY + Math.sin(perpAngle) * offset * i;
        
        if (!isPositionUsed(perpX, perpY)) {
          markPositionUsed(perpX, perpY);
          return { x: perpX, y: perpY };
        }
        
        // Try moving along the edge
        const alongX = baseX + Math.cos(angle) * offset * i * 0.5;
        const alongY = baseY + Math.sin(angle) * offset * i * 0.5;
        
        if (!isPositionUsed(alongX, alongY)) {
          markPositionUsed(alongX, alongY);
          return { x: alongX, y: alongY };
        }
        
        // Try diagonals for more options
        const diagX1 = baseX + Math.cos(perpAngle + Math.PI/4) * offset * i;
        const diagY1 = baseY + Math.sin(perpAngle + Math.PI/4) * offset * i;
        
        if (!isPositionUsed(diagX1, diagY1)) {
          markPositionUsed(diagX1, diagY1);
          return { x: diagX1, y: diagY1 };
        }
        
        const diagX2 = baseX + Math.cos(perpAngle - Math.PI/4) * offset * i;
        const diagY2 = baseY + Math.sin(perpAngle - Math.PI/4) * offset * i;
        
        if (!isPositionUsed(diagX2, diagY2)) {
          markPositionUsed(diagX2, diagY2);
          return { x: diagX2, y: diagY2 };
        }
      }
      
      // If all positions are taken, just use the original
      markPositionUsed(baseX, baseY);
      return { x: baseX, y: baseY };
    };

    // Process all edges to assign optimal weight positions
    return edges.map(edge => {
      const source = nodes[edge.source];
      const target = nodes[edge.target];
      if (!source || !target) return null;

      // Compute angle for arrow
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const angle = Math.atan2(dy, dx);

      // For node radius, arrow offset, etc.
      const nodeRadius = isMobile ? 18 : 20;

      // Variables for path calculation
      const sourceX = source.x + nodeRadius * Math.cos(angle);
      const sourceY = source.y + nodeRadius * Math.sin(angle);
      const targetX = target.x - nodeRadius * Math.cos(angle);
      const targetY = target.y - nodeRadius * Math.sin(angle);
      
      // Calculate edge length and determine placement strategy
      const edgeLength = Math.sqrt(dx * dx + dy * dy);
      const isShorterEdge = edgeLength < 100;
      const isLongerEdge = edgeLength > 180;
      
      // Calculate Bezier curve control point for smooth edges
      const perpAngle = angle + Math.PI / 2;
      // Curve intensity scales with edge length - longer edges get more curve
      const curveIntensity = isMobile 
        ? Math.min(edgeLength * 0.12, 25) 
        : Math.min(edgeLength * 0.1, 20);
      
      // Calculate midpoint of the straight line
      const straightMidX = (sourceX + targetX) / 2;
      const straightMidY = (sourceY + targetY) / 2;
      
      // Control point for quadratic Bezier - offset perpendicular to the edge
      const controlX = straightMidX + Math.cos(perpAngle) * curveIntensity;
      const controlY = straightMidY + Math.sin(perpAngle) * curveIntensity;
      
      // Calculate the actual midpoint of the Bezier curve (at t=0.5)
      // For quadratic Bezier: B(0.5) = 0.25*P0 + 0.5*P1 + 0.25*P2
      const bezierMidX = 0.25 * sourceX + 0.5 * controlX + 0.25 * targetX;
      const bezierMidY = 0.25 * sourceY + 0.5 * controlY + 0.25 * targetY;
      
      // Determine weight label position relative to the Bezier curve midpoint
      const baseOffset = isMobile ? 14 : 10;
      const lengthAdjustment = isShorterEdge ? 0.8 : (isLongerEdge ? 1.2 : 1.0);
      const labelOffset = baseOffset * lengthAdjustment;
      
      // Calculate initial label position (offset from Bezier midpoint)
      const labelX = bezierMidX + Math.cos(perpAngle) * labelOffset;
      const labelY = bezierMidY + Math.sin(perpAngle) * labelOffset;
      
      // Find a non-conflicting position for this label
      const { x: adjustedLabelX, y: adjustedLabelY } = findNonConflictingPosition(
        labelX, labelY, angle
      );
      
      // Calculate the tangent angle at the end of the curve for the arrowhead
      // For quadratic Bezier, the tangent at t=1 is the direction from control point to end point
      const endTangentAngle = Math.atan2(targetY - controlY, targetX - controlX);
      
      // Create the Bezier curve path
      const bezierPath = `M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`;
      
      return {
        ...edge,
        source,
        target,
        sourceX,
        sourceY,
        targetX,
        targetY,
        controlX,
        controlY,
        angle,
        endTangentAngle,
        adjustedLabelX,
        adjustedLabelY,
        bezierPath
      };
    }).filter(Boolean);
  }, [nodes, edges, isMobile]);

  // RENDER EDGES - uses memoized processedEdges
  const renderEdges = () => {
    return processedEdges.map(edge => {
      const { 
        sourceX, sourceY, targetX, targetY, 
        endTangentAngle, adjustedLabelX, adjustedLabelY,
        source, target, bezierPath
      } = edge;

      // Arrow properties - use end tangent angle for proper arrow direction on curved path
      const arrowSize = isMobile ? 14 : 10;
      const arrowAngle = Math.PI / 8;

      // Base color logic
      let color = styles.edgeColor;
      let strokeWidth = isMobile ? 4 : 2;
      let strokeDasharray = "none";
      
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
                                hasNegativeCycle && 
                                edge.inNegativeCycle &&
                                (edge.status === 'negativecycle' || edge.status === 'unvisited');

      return (
        <g
          key={edge.id}
          onClick={() => onEdgeClick(edge.id)}
          className="cursor-pointer"
          data-tooltip={`${source.label} → ${target.label} (${edge.weight})`}
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
          
          {/* Main curved path - Bezier curve */}
          <path
            d={bezierPath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            strokeOpacity="0.9"
            className={`transition-all duration-300 ease-in-out ${
              cycleWarningEffect ? "animate-pulse" : ""
            }`}
          />

          {/* Arrow head - positioned at end of curve with correct tangent angle */}
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

          {/* Weight label - with adjusted position to avoid overlaps */}
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
            className={cycleWarningEffect ? "animate-pulse" : ""}
          />
          <text
            x={adjustedLabelX}
            y={adjustedLabelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontWeight="bold"
            fontSize={isMobile ? "14" : "12"}
            fill={edge.isNegative ? "#7e22ce" : "#333333"}
          >
            {edge.weight}
          </text>
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

      // Visited
      if (visitedNodes.has(node.id)) {
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
          onClick={() => onNodeClick(node.id)}
          className="cursor-pointer"
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

          {/* Main circle */}
          <circle
            cx={node.x}
            cy={node.y}
            r={nodeRadius}
            fill={isPartOfNegativeCycle ? '#db2777' : fillColor}
            stroke={isPartOfNegativeCycle ? '#be185d' : strokeColor}
            strokeWidth={strokeWidth}
            filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.25))"
            className="transition-all duration-300 ease-out"
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
      <g>{renderEdges()}</g>
      <g>{renderNodes()}</g>
      <g>{renderNegativeCycleIndicator()}</g>
    </>
  );
}

export default GraphRenderer;
