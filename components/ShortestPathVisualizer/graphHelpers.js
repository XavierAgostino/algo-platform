/**
 * graphHelpers.js
 * Pure mathematical functions for graph rendering calculations
 * These functions handle geometry, collision detection, and Bezier curve calculations
 */

/**
 * Get neighbors of a node, respecting directed/undirected graph structure
 * 
 * @param {number} nodeId - The node ID to get neighbors for
 * @param {Array} edges - Array of edge objects
 * @param {boolean} isDirected - Whether the graph is directed
 * @returns {Array} Array of neighbor objects {nodeId, weight, edgeId}
 */
export function getNeighbors(nodeId, edges, isDirected) {
  const neighbors = [];
  for (const edge of edges) {
    // Check outgoing edges (source -> target)
    if (edge.source === nodeId) {
      neighbors.push({ 
        nodeId: edge.target, 
        weight: edge.weight, 
        edgeId: edge.id 
      });
    }
    // For undirected graphs, also check incoming edges (target -> source)
    if (!isDirected && edge.isUndirected && edge.target === nodeId) {
      neighbors.push({ 
        nodeId: edge.source, 
        weight: edge.weight, 
        edgeId: edge.id 
      });
    }
  }
  return neighbors;
}

/**
 * Get a unique key for a position (for collision detection)
 * Rounds to the nearest grid cell to create collision "cells"
 * 
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {boolean} isMobile - Whether device is mobile
 * @returns {string} Position key for collision map
 */
export function getPositionKey(x, y, isMobile) {
  const gridSize = isMobile ? 15 : 10;
  const cellX = Math.round(x / gridSize);
  const cellY = Math.round(y / gridSize);
  return `${cellX},${cellY}`;
}

/**
 * Check if a position is already in use
 * 
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Map} usedLabelPositions - Map tracking used positions
 * @param {boolean} isMobile - Whether device is mobile
 * @returns {boolean} True if position is occupied
 */
export function isPositionUsed(x, y, usedLabelPositions, isMobile) {
  const key = getPositionKey(x, y, isMobile);
  return usedLabelPositions.has(key);
}

/**
 * Mark a position as used in the collision map
 * 
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {Map} usedLabelPositions - Map tracking used positions
 * @param {boolean} isMobile - Whether device is mobile
 */
export function markPositionUsed(x, y, usedLabelPositions, isMobile) {
  const key = getPositionKey(x, y, isMobile);
  usedLabelPositions.set(key, true);
}

/**
 * Find a nearby non-conflicting position for a label
 * Tries multiple positions in a spiral pattern to avoid overlaps
 * 
 * @param {number} baseX - Original X position
 * @param {number} baseY - Original Y position
 * @param {number} angle - Edge angle in radians
 * @param {Map} usedLabelPositions - Map tracking used positions
 * @param {boolean} isMobile - Whether device is mobile
 * @param {number} attempts - Number of positions to try (default: 8)
 * @returns {{x: number, y: number}} Adjusted position coordinates
 */
export function findNonConflictingPosition(
  baseX,
  baseY,
  angle,
  usedLabelPositions,
  isMobile,
  attempts = 8
) {
  // First try the original position
  if (!isPositionUsed(baseX, baseY, usedLabelPositions, isMobile)) {
    markPositionUsed(baseX, baseY, usedLabelPositions, isMobile);
    return { x: baseX, y: baseY };
  }

  // Try positions along and perpendicular to the edge
  const perpAngle = angle + Math.PI / 2;
  const offset = isMobile ? 20 : 15;

  for (let i = 1; i <= attempts; i++) {
    // Try perpendicular offset
    const perpX = baseX + Math.cos(perpAngle) * offset * i;
    const perpY = baseY + Math.sin(perpAngle) * offset * i;

    if (!isPositionUsed(perpX, perpY, usedLabelPositions, isMobile)) {
      markPositionUsed(perpX, perpY, usedLabelPositions, isMobile);
      return { x: perpX, y: perpY };
    }

    // Try moving along the edge
    const alongX = baseX + Math.cos(angle) * offset * i * 0.5;
    const alongY = baseY + Math.sin(angle) * offset * i * 0.5;

    if (!isPositionUsed(alongX, alongY, usedLabelPositions, isMobile)) {
      markPositionUsed(alongX, alongY, usedLabelPositions, isMobile);
      return { x: alongX, y: alongY };
    }

    // Try diagonals for more options
    const diagX1 = baseX + Math.cos(perpAngle + Math.PI / 4) * offset * i;
    const diagY1 = baseY + Math.sin(perpAngle + Math.PI / 4) * offset * i;

    if (!isPositionUsed(diagX1, diagY1, usedLabelPositions, isMobile)) {
      markPositionUsed(diagX1, diagY1, usedLabelPositions, isMobile);
      return { x: diagX1, y: diagY1 };
    }

    const diagX2 = baseX + Math.cos(perpAngle - Math.PI / 4) * offset * i;
    const diagY2 = baseY + Math.sin(perpAngle - Math.PI / 4) * offset * i;

    if (!isPositionUsed(diagX2, diagY2, usedLabelPositions, isMobile)) {
      markPositionUsed(diagX2, diagY2, usedLabelPositions, isMobile);
      return { x: diagX2, y: diagY2 };
    }
  }

  // If all positions are taken, just use the original
  markPositionUsed(baseX, baseY, usedLabelPositions, isMobile);
  return { x: baseX, y: baseY };
}

/**
 * Calculate edge path using quadratic Bezier curves
 * Returns all necessary data for rendering curved edges with labels
 * 
 * @param {Object} source - Source node {x, y}
 * @param {Object} target - Target node {x, y}
 * @param {boolean} isMobile - Whether device is mobile
 * @returns {Object} Edge calculation results including path, control points, midpoint, and angles
 */
export function calculateEdgePath(source, target, isMobile) {
  // Compute angle for arrow
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const angle = Math.atan2(dy, dx);

  // Node radius for offsetting the edge endpoints
  const nodeRadius = isMobile ? 18 : 20;

  // Calculate edge endpoints (offset from node centers by node radius)
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
  const lengthAdjustment = isShorterEdge ? 0.8 : isLongerEdge ? 1.2 : 1.0;
  const labelOffset = baseOffset * lengthAdjustment;

  // Calculate initial label position (offset from Bezier midpoint)
  const labelX = bezierMidX + Math.cos(perpAngle) * labelOffset;
  const labelY = bezierMidY + Math.sin(perpAngle) * labelOffset;

  // Calculate the tangent angle at the end of the curve for the arrowhead
  // For quadratic Bezier, the tangent at t=1 is the direction from control point to end point
  const endTangentAngle = Math.atan2(targetY - controlY, targetX - controlX);

  // Create the Bezier curve path
  const bezierPath = `M ${sourceX} ${sourceY} Q ${controlX} ${controlY} ${targetX} ${targetY}`;

  return {
    sourceX,
    sourceY,
    targetX,
    targetY,
    controlX,
    controlY,
    angle,
    endTangentAngle,
    labelX,
    labelY,
    bezierPath,
    bezierMidX,
    bezierMidY,
  };
}
