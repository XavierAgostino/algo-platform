/**
 * Generates a random directed graph with or without negative edges,
 * ensures connectivity from a chosen source node, etc.
 * Optimized for visual clarity and educational purpose.
 * 
 * This is the main orchestrator that delegates to helper functions
 * for specific responsibilities (geometry, topology, edge generation)
 */
import { LAYOUT, NEGATIVE_CYCLE } from '../../constants/graphConfig';
import {
  getAlgorithmConfig,
  generateCircularNodes,
  generateSpatialNodes,
  generatePossibleEdges,
  generateSpanningTree,
  calculateEffectiveDensity,
  generateRandomEdges,
  getEuclideanWeight,
  applyForceDirected,
  injectNegativeCycle,
} from './graphGenerationHelpers';

export function generateRandomGraph({ svgRef, graphParams, algorithm }) {
  // 1. Setup & Configuration
  const config = getAlgorithmConfig(algorithm, graphParams);
  const svgWidth = svgRef.current.clientWidth;
  const svgHeight = svgRef.current.clientHeight;
  
  // Check if we're on mobile based on user agent and viewport width
  const isMobile = 
    typeof window !== "undefined" &&
    (window.innerWidth < LAYOUT.MOBILE_BREAKPOINT || 
     /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
       navigator.userAgent
     ));

  // Pick a source node at random
  const sourceNodeIdx = Math.floor(Math.random() * config.nodeCount);
  
  // 2. Geometry: Generate nodes based on graph type
  const graphType = graphParams.graphType || 'circular';
  const newNodes = graphType === 'spatial'
    ? generateSpatialNodes(config.nodeCount, svgWidth, svgHeight, isMobile)
    : generateCircularNodes(config.nodeCount, svgWidth, svgHeight, isMobile);
  
  // 3. Topology: Generate edge candidates and ensure connectivity
  const possibleEdges = generatePossibleEdges(newNodes, config.nodeCount, algorithm);
  const { treeEdges } = generateSpanningTree(
    newNodes, 
    sourceNodeIdx, 
    possibleEdges
  );
  
  // 4. Density: Calculate target edge count
  const { targetEdgeCount } = calculateEffectiveDensity(
    config.density,
    config.nodeCount,
    algorithm,
    isMobile
  );
  
  // 5. Edge Generation: Create edges with visual filtering
  // For spatial graphs, use Euclidean weights; for circular, use random weights
  const useEuclideanWeights = graphType === 'spatial';
  let { edges: newEdges, edgeSet } = generateRandomEdges(
    newNodes,
    treeEdges,
    possibleEdges,
    targetEdgeCount,
    {
      ...config,
      useEuclideanWeights,
      viewportScale: { width: svgWidth, height: svgHeight }
    },
    algorithm
  );
  
  // 5.5. Apply force-directed layout to spatial graphs (auto-applied)
  let finalNodes = newNodes;
  if (graphType === 'spatial') {
    // Use fewer iterations for faster, more stable layout
    // Pass isMobile for optimized mobile spacing
    finalNodes = applyForceDirected(newNodes, newEdges, svgWidth, svgHeight, 80, isMobile);
    
    // Recalculate edge weights after force-directed layout using new positions
    newEdges = newEdges.map(edge => {
      const sourceNode = finalNodes[edge.source];
      const targetNode = finalNodes[edge.target];
      if (sourceNode && targetNode) {
        const newWeight = getEuclideanWeight(
          sourceNode, 
          targetNode, 
          { width: svgWidth, height: svgHeight },
          config.minWeight,
          config.maxWeight
        );
        return { ...edge, weight: newWeight };
      }
      return edge;
    });
  }
  
  // 6. Special Cases: Inject negative cycle if needed
  let hasNegativeCycle = false;
  if (algorithm === 'bellmanford' && config.allowNegativeEdges && 
      Math.random() < NEGATIVE_CYCLE.CREATION_CHANCE) {
    hasNegativeCycle = injectNegativeCycle(newEdges, edgeSet, finalNodes, config.nodeCount);
  }
  
  // 7. Return results
  const newParams = {
    ...graphParams,
    sourceNode: sourceNodeIdx,
    hasNegativeCycle,
    algorithm
  };
  
  return { newNodes: finalNodes, newEdges, newParams };
}
