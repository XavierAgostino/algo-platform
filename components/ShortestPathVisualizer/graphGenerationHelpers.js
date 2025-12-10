/**
 * graphGenerationHelpers.js
 * Pure helper functions for graph generation
 * Handles algorithm configuration, geometry calculations, edge generation, and topology
 */

import {
  LAYOUT,
  NODE_VARIANCE,
  EDGE_PREFERENCES,
  DENSITY,
  WEIGHTS,
  NEGATIVE_EDGES,
  NEGATIVE_CYCLE,
} from '../../constants/graphConfig';

/**
 * Get algorithm-specific configuration
 * Adjusts weight ranges and density based on the algorithm
 * 
 * @param {string} algorithm - 'dijkstra' or 'bellmanford'
 * @param {Object} baseParams - Base graph parameters
 * @returns {Object} Adjusted configuration with nodeCount, density, minWeight, maxWeight, allowNegativeEdges
 */
export function getAlgorithmConfig(algorithm, baseParams) {
  let { nodeCount, density, minWeight, maxWeight, allowNegativeEdges } = baseParams;
  
  if (algorithm === 'dijkstra') {
    // Smaller weight range for Dijkstra
    minWeight = WEIGHTS.DIJKSTRA.MIN;
    maxWeight = WEIGHTS.DIJKSTRA.MAX;
    
    // Slightly increase edge density for Dijkstra to show more path options
    density = Math.min(density * DENSITY.DIJKSTRA_DENSITY_BOOST, DENSITY.DIJKSTRA_DENSITY_CAP);
  } else if (algorithm === 'bellmanford') {
    // Larger weight values for Bellman-Ford
    minWeight = Math.max(minWeight, WEIGHTS.BELLMAN_FORD.MIN_FLOOR);
    maxWeight = Math.max(maxWeight, WEIGHTS.BELLMAN_FORD.MAX_FLOOR);
  }
  
  return { nodeCount, density, minWeight, maxWeight, allowNegativeEdges };
}

/**
 * Generate all possible edge candidates with distance calculations
 * Sorts edges by adjusted distance (factors in both physical and circle distance)
 * 
 * @param {Array} nodes - Array of node objects
 * @param {number} nodeCount - Number of nodes
 * @param {string} algorithm - Algorithm being used
 * @returns {Array} Sorted array of edge candidates with distance metrics
 */
export function generatePossibleEdges(nodes, nodeCount, algorithm) {
  const possibleEdges = [];
  
  for (let i = 0; i < nodeCount; i++) {
    for (let j = 0; j < nodeCount; j++) {
      if (i !== j) {
        // Calculate distance and angular distance (how far around the circle)
        const dist = Math.sqrt(
          (nodes[j].x - nodes[i].x) ** 2 + (nodes[j].y - nodes[i].y) ** 2
        );
        
        // Calculate how far apart nodes are in the circle (0 to nodeCount/2)
        const circleDistance = Math.min(
          Math.abs(i - j),
          nodeCount - Math.abs(i - j)
        );
        
        // Modify edge preference based on algorithm
        const circleDistanceFactor = algorithm === 'dijkstra'
          ? 1 + (circleDistance * EDGE_PREFERENCES.CIRCLE_DISTANCE_FACTOR.DIJKSTRA)
          : 1 + (circleDistance * EDGE_PREFERENCES.CIRCLE_DISTANCE_FACTOR.BELLMAN_FORD);
        
        // Adjusted distance that factors in both physical distance and circle position
        const adjustedDist = dist * circleDistanceFactor;
        
        possibleEdges.push({ 
          source: i, 
          target: j, 
          distance: dist,
          adjustedDistance: adjustedDist,
          circleDistance: circleDistance 
        });
      }
    }
  }
  
  // Sort by adjusted distance (which prioritizes "neighboring" nodes)
  return possibleEdges.sort((a, b) => a.adjustedDistance - b.adjustedDistance);
}

/**
 * Helper to calculate node placement variance based on node count
 * More nodes = less variance to avoid overlaps
 * 
 * @param {number} count - Number of nodes
 * @param {boolean} isMobile - Whether device is mobile
 * @returns {number} Variance factor for node placement
 */
function getNodePlacementVariance(count, isMobile) {
  if (count <= NODE_VARIANCE.FEW_NODES_THRESHOLD) {
    return isMobile ? NODE_VARIANCE.FEW_NODES.MOBILE : NODE_VARIANCE.FEW_NODES.DESKTOP;
  }
  if (count <= NODE_VARIANCE.MEDIUM_NODES_THRESHOLD) {
    return isMobile ? NODE_VARIANCE.MEDIUM_NODES.MOBILE : NODE_VARIANCE.MEDIUM_NODES.DESKTOP;
  }
  if (count <= NODE_VARIANCE.MANY_NODES_THRESHOLD) {
    return isMobile ? NODE_VARIANCE.MANY_NODES.MOBILE : NODE_VARIANCE.MANY_NODES.DESKTOP;
  }
  return isMobile ? NODE_VARIANCE.LOTS_OF_NODES.MOBILE : NODE_VARIANCE.LOTS_OF_NODES.DESKTOP;
}

/**
 * Generate nodes in a circular layout with optimized spacing
 * Applies variance to prevent perfectly uniform arrangement
 * 
 * @param {number} nodeCount - Number of nodes to generate
 * @param {number} svgWidth - SVG container width
 * @param {number} svgHeight - SVG container height
 * @param {boolean} isMobile - Whether device is mobile
 * @returns {Array} Array of node objects with {id, x, y, label}
 */
export function generateCircularNodes(nodeCount, svgWidth, svgHeight, isMobile) {
  const nodes = [];
  
  // Calculate optimal radius based on screen size and node count
  const radiusDivisor = isMobile 
    ? LAYOUT.BASE_RADIUS_DIVISOR.MOBILE 
    : LAYOUT.BASE_RADIUS_DIVISOR.DESKTOP;
  const baseRadius = Math.min(svgWidth, svgHeight) / radiusDivisor;
  
  const scaleFactor = 1 + (nodeCount > LAYOUT.SCALE.NODE_THRESHOLD 
    ? (nodeCount - LAYOUT.SCALE.NODE_THRESHOLD) * LAYOUT.SCALE.INCREMENT_PER_NODE 
    : 0);
  let radius = baseRadius * scaleFactor;
  
  // Enforce minimum radius
  const minRadius = isMobile ? LAYOUT.MIN_RADIUS.MOBILE : LAYOUT.MIN_RADIUS.DESKTOP;
  radius = Math.max(radius, minRadius);
  
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;
  
  // Calculate the radiusVariance based on node count
  const radiusVariance = getNodePlacementVariance(nodeCount, isMobile);

  for (let i = 0; i < nodeCount; i++) {
    // Perfect division around the circle
    const angle = (i * 2 * Math.PI) / nodeCount;
    
    // Apply smaller random offset to radius for natural look
    const randomOffset = (Math.random() * 2 - 1) * radiusVariance;
    const nodeRadius = radius + randomOffset;
    
    // Apply very slight random offset to angle for natural look
    const angleVariance = Math.PI / (LAYOUT.ANGLE_VARIANCE.BASE_DIVISOR * Math.max(1, nodeCount / LAYOUT.ANGLE_VARIANCE.NODE_COUNT_DIVISOR));
    const angleOffset = (Math.random() * 2 - 1) * angleVariance;
    const finalAngle = angle + angleOffset;
    
    nodes.push({
      id: i,
      x: centerX + nodeRadius * Math.cos(finalAngle),
      y: centerY + nodeRadius * Math.sin(finalAngle),
      label: String.fromCharCode(65 + i),
    });
  }
  
  return nodes;
}

/**
 * Generate a spanning tree using BFS-like approach
 * Ensures all nodes are reachable from the source node
 * 
 * @param {Array} nodes - Array of node objects
 * @param {number} sourceIndex - Index of the source node
 * @param {Array} possibleEdges - Array of possible edges (sorted by adjusted distance)
 * @returns {Object} {treeEdges: Array, connectedSet: Set} - Edges forming spanning tree and set of connected nodes
 */
export function generateSpanningTree(nodes, sourceIndex, possibleEdges) {
  const nodeCount = nodes.length;
  const connectedNodes = new Set([sourceIndex]);
  const treeEdges = [];
  
  // Queue-based approach (breadth-first-search style)
  let queue = [sourceIndex];
  let processed = new Set([sourceIndex]);
  
  while (connectedNodes.size < nodeCount) {
    if (queue.length === 0) {
      // If queue is empty but we haven't connected all nodes,
      // add a random connected node back to the queue
      const connectedArray = Array.from(connectedNodes);
      queue.push(connectedArray[Math.floor(Math.random() * connectedArray.length)]);
    }
    
    const currentNode = queue.shift();
    
    // Find nodes that are not yet connected, prioritizing closer ones
    const candidates = possibleEdges
      .filter(e => e.source === currentNode && !connectedNodes.has(e.target))
      .sort((a, b) => a.adjustedDistance - b.adjustedDistance);
    
    if (candidates.length > 0) {
      // Take the best candidate (closest with shortest adjusted distance)
      const bestEdge = candidates[0];
      treeEdges.push(bestEdge);
      connectedNodes.add(bestEdge.target);
      
      // Add the newly connected node to the queue
      if (!processed.has(bestEdge.target)) {
        queue.push(bestEdge.target);
        processed.add(bestEdge.target);
      }
    }
  }
  
  return { treeEdges, connectedSet: connectedNodes };
}

/**
 * Calculate effective density with adaptive scaling
 * Reduces density for larger graphs to maintain readability
 * 
 * @param {number} density - Base density value
 * @param {number} nodeCount - Number of nodes
 * @param {string} algorithm - Algorithm being used
 * @param {boolean} isMobile - Whether device is mobile
 * @returns {Object} {effectiveDensity, targetEdgeCount, maxPossibleEdges}
 */
export function calculateEffectiveDensity(density, nodeCount, algorithm, isMobile) {
  const maxPossibleEdges = nodeCount * (nodeCount - 1);
  
  // Adaptive density - reduces automatically for larger graphs
  const maxDensity = Math.min(DENSITY.MAX_CAP, DENSITY.BASE - (nodeCount * DENSITY.SCALE_PER_NODE));
  
  // Adjust density for mobile to reduce edge clutter
  const densityMultiplier = algorithm === 'dijkstra' 
    ? DENSITY.DIJKSTRA_MULTIPLIER 
    : DENSITY.BELLMAN_FORD_MULTIPLIER;
  const effectiveDensity = isMobile 
    ? Math.min(density * densityMultiplier, maxDensity * DENSITY.MOBILE_MULTIPLIER) 
    : Math.min(density * densityMultiplier, maxDensity);
  
  const targetEdgeCount = Math.ceil(maxPossibleEdges * effectiveDensity);
  
  return { effectiveDensity, targetEdgeCount, maxPossibleEdges };
}

/**
 * Generate algorithm-specific edge weight
 * Different distributions for Dijkstra vs Bellman-Ford
 * 
 * @param {string} algorithm - Algorithm type
 * @param {number} minWeight - Minimum weight value
 * @param {number} maxWeight - Maximum weight value
 * @param {boolean} allowNegativeEdges - Whether negative edges are allowed
 * @returns {number} Generated weight (can be negative)
 */
export function generateEdgeWeight(algorithm, minWeight, maxWeight, allowNegativeEdges) {
  const weightRange = maxWeight - minWeight + 1;
  let w;
  
  if (algorithm === 'dijkstra') {
    // For Dijkstra: create a more varied distribution of weights
    if (Math.random() < WEIGHTS.DIJKSTRA.SMALL_WEIGHT_CHANCE) {
      // Small weights (emphasize shorter paths)
      w = Math.floor(Math.random() * WEIGHTS.DIJKSTRA.SMALL_RANGE) + minWeight;
    } else if (Math.random() < WEIGHTS.DIJKSTRA.MEDIUM_WEIGHT_CHANCE) {
      // Medium weights (most common)
      w = Math.floor(Math.random() * WEIGHTS.DIJKSTRA.MEDIUM_RANGE) + minWeight + WEIGHTS.DIJKSTRA.MEDIUM_OFFSET;
    } else {
      // Larger weights (few, to have some challenging paths)
      w = Math.floor(Math.random() * WEIGHTS.DIJKSTRA.LARGE_RANGE) + maxWeight - WEIGHTS.DIJKSTRA.LARGE_OFFSET_FROM_MAX;
    }
  } else if (algorithm === 'bellmanford') {
    // For Bellman-Ford: more uniform distribution with occasional extremes
    if (Math.random() < WEIGHTS.BELLMAN_FORD.STANDARD_WEIGHT_CHANCE) {
      // Standard weights
      w = Math.floor(Math.random() * weightRange) + minWeight;
    } else {
      // Occasional larger weights to emphasize algorithm's capability
      w = Math.floor(Math.random() * WEIGHTS.BELLMAN_FORD.LARGE_WEIGHT_RANGE) + maxWeight - WEIGHTS.BELLMAN_FORD.LARGE_OFFSET_FROM_MAX;
    }
    
    // Negative edges logic - only allow if using Bellman-Ford
    if (allowNegativeEdges && Math.random() < NEGATIVE_EDGES.CREATION_CHANCE) {
      // More significant negative weights
      w = -Math.floor(Math.random() * NEGATIVE_EDGES.WEIGHT_RANGE + NEGATIVE_EDGES.WEIGHT_MIN);
    }
  } else {
    // Default weight calculation for any other algorithm
    w = Math.floor(Math.random() * weightRange) + minWeight;
  }
  
  return w;
}

/**
 * Check if an edge meets visual preference criteria
 * Avoids bidirectional edges and center-crossing edges based on probability
 * 
 * @param {Object} edge - Edge object with source, target, circleDistance
 * @param {Set} edgeSet - Set of existing edge keys
 * @param {number} nodeCount - Total number of nodes
 * @param {string} algorithm - Algorithm being used
 * @returns {boolean} True if edge is visually acceptable
 */
export function isEdgeVisuallyPleasing(edge, edgeSet, nodeCount, algorithm) {
  // Skip edge if it would create a bidirectional edge
  const oppositeEdgeKey = `${edge.target}-${edge.source}`;
  if (edgeSet.has(oppositeEdgeKey) && Math.random() < EDGE_PREFERENCES.BIDIRECTIONAL_SKIP_CHANCE) {
    return false;
  }
  
  // Skip edges that cross directly through the center
  const circleDistanceRatio = edge.circleDistance / (nodeCount / 2);
  const skipProbability = algorithm === 'dijkstra' 
    ? EDGE_PREFERENCES.CENTER_CROSS_SKIP_CHANCE.DIJKSTRA 
    : EDGE_PREFERENCES.CENTER_CROSS_SKIP_CHANCE.BELLMAN_FORD;
  if (circleDistanceRatio > EDGE_PREFERENCES.CENTER_CROSS_THRESHOLD && Math.random() < skipProbability) {
    return false;
  }
  
  return true;
}

/**
 * Generate random edges with visual filtering and weight assignment
 * Adds tree edges first, then additional edges up to target density
 * 
 * @param {Array} nodes - Array of node objects
 * @param {Array} treeEdges - Spanning tree edges (for connectivity)
 * @param {Array} possibleEdges - All possible edges sorted by distance
 * @param {number} targetEdgeCount - Target number of edges
 * @param {Object} config - Configuration with minWeight, maxWeight, allowNegativeEdges
 * @param {string} algorithm - Algorithm being used
 * @returns {Object} {edges: Array, edgeSet: Set} - Generated edges and edge tracking set
 */
export function generateRandomEdges(nodes, treeEdges, possibleEdges, targetEdgeCount, config, algorithm) {
  const newEdges = [];
  const edgeSet = new Set();
  
  const addEdge = (edge) => {
    // Skip if we've already added this exact edge
    const edgeKey = `${edge.source}-${edge.target}`;
    if (edgeSet.has(edgeKey)) return;
    edgeSet.add(edgeKey);
    
    // Check if the opposite direction edge already exists
    const oppositeEdgeKey = `${edge.target}-${edge.source}`;
    const hasOppositeEdge = edgeSet.has(oppositeEdgeKey);
    
    // If we already have an edge in the opposite direction, 
    // consider skipping this one to avoid bidirectional edges
    if (hasOppositeEdge && Math.random() < EDGE_PREFERENCES.BIDIRECTIONAL_SKIP_CHANCE) {
      return;
    }
    
    // Generate weight using extracted helper
    const w = generateEdgeWeight(algorithm, config.minWeight, config.maxWeight, config.allowNegativeEdges);
    
    // Add extra metadata for edges
    newEdges.push({
      id: edgeKey,
      source: edge.source,
      target: edge.target,
      weight: w,
      status: 'unvisited',
      hasBidirectional: false,
      circleDistance: edge.circleDistance,
      isNegative: w < 0
    });
  };
  
  // Add all tree edges to ensure connectivity
  treeEdges.forEach((e) => addEdge(e));
  
  const remainingEdgeCount = Math.max(0, targetEdgeCount - treeEdges.length);
  
  // Filter and sort possible edges
  const shuffled = [...possibleEdges]
    .filter(edge => isEdgeVisuallyPleasing(edge, edgeSet, nodes.length, algorithm))
    .sort((a, b) => {
      // Factor in both geometric distance and position in the circle with some randomness
      const aScore = a.adjustedDistance + Math.random() * EDGE_PREFERENCES.SORT_RANDOM_FACTOR;
      const bScore = b.adjustedDistance + Math.random() * EDGE_PREFERENCES.SORT_RANDOM_FACTOR;
      return aScore - bScore;
    });
  
  // Add additional edges up to target density
  for (let i = 0; i < remainingEdgeCount && i < shuffled.length; i++) {
    addEdge(shuffled[i]);
  }
  
  return { edges: newEdges, edgeSet };
}

/**
 * Inject a negative cycle into the graph
 * Creates a small cycle with total negative weight
 * 
 * @param {Array} edges - Array of edges (modified in place)
 * @param {Set} edgeSet - Set of edge keys (modified in place)
 * @param {Array} nodes - Array of nodes
 * @param {number} nodeCount - Number of nodes
 * @returns {boolean} True if negative cycle was successfully created
 */
export function injectNegativeCycle(edges, edgeSet, nodes, nodeCount) {
  // Create a small negative cycle using a sequence of distinct nodes
  const cycleSize = Math.min(NEGATIVE_CYCLE.MAX_SIZE, Math.floor(nodeCount / 2));
  let startPos = Math.floor(Math.random() * nodeCount);
  
  // Create array of node indices for the cycle (no duplicate nodes)
  const cycleNodes = [];
  for (let i = 0; i < cycleSize; i++) {
    cycleNodes.push((startPos + i) % nodeCount);
  }
  
  // Add edges to form a cycle
  let totalWeight = 0;
  const cycleEdges = [];
  
  for (let i = 0; i < cycleSize; i++) {
    const source = cycleNodes[i];
    const target = cycleNodes[(i + 1) % cycleSize];
    
    // Ensure no bidirectional edges
    const oppositeKey = `${target}-${source}`;
    if (edgeSet.has(oppositeKey)) {
      // Remove the opposite edge if it exists
      const edgeToRemoveIndex = edges.findIndex(e => 
        e.source === target && e.target === source
      );
      if (edgeToRemoveIndex !== -1) {
        edges.splice(edgeToRemoveIndex, 1);
        edgeSet.delete(oppositeKey);
      }
    }
    
    // Check if this edge already exists
    const edgeKey = `${source}-${target}`;
    const existingEdgeIndex = edges.findIndex(e => 
      e.source === source && e.target === target
    );
    
    let weight = Math.floor(Math.random() * NEGATIVE_CYCLE.EDGE_WEIGHT_RANGE) + NEGATIVE_CYCLE.EDGE_WEIGHT_MIN;
    totalWeight += weight;
    
    if (existingEdgeIndex !== -1) {
      edges[existingEdgeIndex].weight = weight;
      edges[existingEdgeIndex].inNegativeCycle = true;
      cycleEdges.push(edges[existingEdgeIndex]);
    } else {
      const newEdge = {
        id: edgeKey,
        source,
        target,
        weight,
        status: 'unvisited',
        hasBidirectional: false,
        circleDistance: 1,
        inNegativeCycle: true
      };
      edges.push(newEdge);
      edgeSet.add(edgeKey);
      cycleEdges.push(newEdge);
    }
  }
  
  // Make the cycle negative by making one edge negative enough
  if (totalWeight > 0 && cycleEdges.length === cycleSize) {
    const edgeToMakeNegative = cycleEdges[cycleSize - 1];
    const extraNegative = Math.floor(Math.random() * NEGATIVE_CYCLE.EXTRA_NEGATIVE_RANGE) + NEGATIVE_CYCLE.EXTRA_NEGATIVE_MIN;
    edgeToMakeNegative.weight = -(totalWeight + extraNegative);
    edgeToMakeNegative.isNegative = true;
    return true;
  }
  
  return false;
}
