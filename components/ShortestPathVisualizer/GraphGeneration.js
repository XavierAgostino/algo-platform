/**
 * Generates a random directed graph with or without negative edges,
 * ensures connectivity from a chosen source node, etc.
 * Optimized for visual clarity and educational purpose.
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

export function generateRandomGraph({ svgRef, graphParams, algorithm }) {
  // Adjust weight ranges based on algorithm type
  let { nodeCount, density, minWeight, maxWeight, allowNegativeEdges } = graphParams;
  
  // Algorithm-specific adjustments
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

  const svgWidth = svgRef.current.clientWidth;
  const svgHeight = svgRef.current.clientHeight;
  
  // Check if we're on mobile based on user agent and viewport width
  const isMobile = 
    typeof window !== "undefined" &&
    (window.innerWidth < LAYOUT.MOBILE_BREAKPOINT || 
     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
       navigator.userAgent
     ));

  // Pick a source node at random but preferably one with a "nice" position in the circle
  const sourceNodeIdx = Math.floor(Math.random() * nodeCount);
  
  // Initialize negative cycle detection flag
  let hasNegativeCycle = false;

  // Create nodes in a circle layout with optimized spacing
  const newNodes = [];
  
  // Calculate optimal radius based on screen size and node count
  // More nodes = slightly larger radius to avoid crowding
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

  // Reduce randomness as node count increases to avoid overlaps
  const getNodePlacementVariance = (count) => {
    // Less variance with more nodes, scales down progressively
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
  };

  // Calculate the radiusVariance based on node count
  const radiusVariance = getNodePlacementVariance(nodeCount);

  for (let i = 0; i < nodeCount; i++) {
    // Perfect division around the circle
    const angle = (i * 2 * Math.PI) / nodeCount;
    
    // Apply smaller random offset to radius for natural look
    // More nodes = less randomness
    const randomOffset = (Math.random() * 2 - 1) * radiusVariance;
    const nodeRadius = radius + randomOffset;
    
    // Apply very slight random offset to angle for natural look
    // More nodes = less angle variance to prevent overlaps
    const angleVariance = Math.PI / (LAYOUT.ANGLE_VARIANCE.BASE_DIVISOR * Math.max(1, nodeCount / LAYOUT.ANGLE_VARIANCE.NODE_COUNT_DIVISOR));
    const angleOffset = (Math.random() * 2 - 1) * angleVariance;
    const finalAngle = angle + angleOffset;
    
    newNodes.push({
      id: i,
      x: centerX + nodeRadius * Math.cos(finalAngle),
      y: centerY + nodeRadius * Math.sin(finalAngle),
      label: String.fromCharCode(65 + i),
    });
  }

  // Potential edges (directed)
  const possibleEdges = [];
  for (let i = 0; i < nodeCount; i++) {
    for (let j = 0; j < nodeCount; j++) {
      if (i !== j) {
        // Calculate distance and angular distance (how far around the circle)
        const dist = Math.sqrt(
          (newNodes[j].x - newNodes[i].x) ** 2 + (newNodes[j].y - newNodes[i].y) ** 2
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
  possibleEdges.sort((a, b) => a.adjustedDistance - b.adjustedDistance);
  
  // We want to ensure connectivity from source using a more BFS-like approach
  // This creates a more organized "spanning tree" from the source
  const connectedNodes = new Set([sourceNodeIdx]);
  const treeEdges = [];
  
  // First, create a simple spanning structure that connects all nodes
  // in a way that looks more organized than purely shortest-distance
  
  // Queue-based approach (breadth-first-search style)
  let queue = [sourceNodeIdx];
  let processed = new Set([sourceNodeIdx]);
  
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

  // Convert these tree edges to final edges
  const newEdges = [];
  const edgeSet = new Set(); // Track edges we've already added
  
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
    
    // Generate weights with algorithm-specific range
    const weightRange = maxWeight - minWeight + 1;
    
    let w;
    
    if (algorithm === 'dijkstra') {
      // For Dijkstra: create a more varied distribution of weights
      // with some clustering to showcase the greedy selection better
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
    
    // Add extra metadata for edges
    newEdges.push({
      id: edgeKey,
      source: edge.source,
      target: edge.target,
      weight: w,
      status: 'unvisited',
      hasBidirectional: false,
      circleDistance: edge.circleDistance,
      // Flag negative edges to style them differently
      isNegative: w < 0
    });
  };
  
  // Add all tree edges to ensure connectivity
  treeEdges.forEach((e) => addEdge(e));

  // Calculate a density that scales down as node count increases
  // to keep the graph readable
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
  const remainingEdgeCount = Math.max(0, targetEdgeCount - treeEdges.length);

  // Prioritize edges that create cleaner layouts
  // Prefer edges between nodes that are close in the circle
  // and avoid creating bidirectional edges or crossing the center
  const shuffled = [...possibleEdges].filter(edge => {
    // Skip edge if it would create a bidirectional edge
    const oppositeEdgeKey = `${edge.target}-${edge.source}`;
    if (edgeSet.has(oppositeEdgeKey) && Math.random() < EDGE_PREFERENCES.BIDIRECTIONAL_SKIP_CHANCE) {
      return false;
    }
    
    // Skip edges that cross directly through the center
    // These are edges between almost opposite nodes on the circle
    const circleDistanceRatio = edge.circleDistance / (nodeCount / 2);
    
    const skipProbability = algorithm === 'dijkstra' 
      ? EDGE_PREFERENCES.CENTER_CROSS_SKIP_CHANCE.DIJKSTRA 
      : EDGE_PREFERENCES.CENTER_CROSS_SKIP_CHANCE.BELLMAN_FORD;
    if (circleDistanceRatio > EDGE_PREFERENCES.CENTER_CROSS_THRESHOLD && Math.random() < skipProbability) {
      return false;
    }
    
    return true;
  }).sort((a, b) => {
    // Factor in both geometric distance and position in the circle
    // with some randomness to avoid too regular patterns
    const aScore = a.adjustedDistance + Math.random() * EDGE_PREFERENCES.SORT_RANDOM_FACTOR;
    const bScore = b.adjustedDistance + Math.random() * EDGE_PREFERENCES.SORT_RANDOM_FACTOR;
    return aScore - bScore;
  });
  
  // Add additional edges up to target density
  for (let i = 0; i < remainingEdgeCount && i < shuffled.length; i++) {
    addEdge(shuffled[i]);
  }

  // Create a small negative cycle if appropriate
  if (algorithm === 'bellmanford' && allowNegativeEdges && Math.random() < NEGATIVE_CYCLE.CREATION_CHANCE) {
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
        const edgeToRemoveIndex = newEdges.findIndex(e => 
          e.source === target && e.target === source
        );
        if (edgeToRemoveIndex !== -1) {
          newEdges.splice(edgeToRemoveIndex, 1);
          edgeSet.delete(oppositeKey);
        }
      }
      
      // Check if this edge already exists
      const edgeKey = `${source}-${target}`;
      const existingEdgeIndex = newEdges.findIndex(e => 
        e.source === source && e.target === target
      );
      
      let weight = Math.floor(Math.random() * NEGATIVE_CYCLE.EDGE_WEIGHT_RANGE) + NEGATIVE_CYCLE.EDGE_WEIGHT_MIN;
      totalWeight += weight;
      
      if (existingEdgeIndex !== -1) {
        newEdges[existingEdgeIndex].weight = weight;
        newEdges[existingEdgeIndex].inNegativeCycle = true;
        cycleEdges.push(newEdges[existingEdgeIndex]);
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
        newEdges.push(newEdge);
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
      hasNegativeCycle = true;
    }
  }

  const newParams = {
    ...graphParams,
    sourceNode: sourceNodeIdx,
    hasNegativeCycle,
    algorithm
  };

  return { newNodes, newEdges, newParams };
}
