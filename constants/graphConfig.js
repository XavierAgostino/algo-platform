/**
 * Configuration constants for graph generation.
 * Extracted from GraphGeneration.js to avoid magic numbers and enable easy tuning.
 */

// =========================
//   LAYOUT CONFIGURATION
// =========================
export const LAYOUT = {
  // Mobile detection breakpoint
  MOBILE_BREAKPOINT: 768,
  
  // Base radius divisors for circle layout
  BASE_RADIUS_DIVISOR: {
    MOBILE: 2.8,
    DESKTOP: 3.2,
  },
  
  // Minimum radius constraints
  MIN_RADIUS: {
    MOBILE: 120,
    DESKTOP: 150,
  },
  
  // Scale factor for larger graphs
  SCALE: {
    NODE_THRESHOLD: 8,        // Start scaling when nodeCount > this
    INCREMENT_PER_NODE: 0.03, // How much to increase radius per extra node
  },
  
  // Angle variance for natural node placement
  ANGLE_VARIANCE: {
    BASE_DIVISOR: 180,        // Math.PI / this = base variance
    NODE_COUNT_DIVISOR: 4,    // nodeCount / this = scale factor
  },
};

// =========================
//   NODE PLACEMENT VARIANCE
// =========================
// Controls randomness in node positions (less variance = more uniform circle)
export const NODE_VARIANCE = {
  // Thresholds for different variance levels
  FEW_NODES_THRESHOLD: 5,
  MEDIUM_NODES_THRESHOLD: 8,
  MANY_NODES_THRESHOLD: 12,
  
  // Variance values (pixels) for each tier
  FEW_NODES: {
    MOBILE: 15,
    DESKTOP: 20,
  },
  MEDIUM_NODES: {
    MOBILE: 10,
    DESKTOP: 15,
  },
  MANY_NODES: {
    MOBILE: 7,
    DESKTOP: 10,
  },
  LOTS_OF_NODES: {
    MOBILE: 4,
    DESKTOP: 6,
  },
};

// =========================
//   EDGE PREFERENCES
// =========================
export const EDGE_PREFERENCES = {
  // Circle distance factor multipliers (higher = more penalty for far nodes)
  CIRCLE_DISTANCE_FACTOR: {
    DIJKSTRA: 0.15,      // Less penalty - more diverse paths
    BELLMAN_FORD: 0.2,   // Standard penalty
  },
  
  // Probability to skip creating a bidirectional edge
  BIDIRECTIONAL_SKIP_CHANCE: 0.8,
  
  // Threshold for considering an edge as "crossing the center"
  CENTER_CROSS_THRESHOLD: 0.8,
  
  // Probability to skip center-crossing edges
  CENTER_CROSS_SKIP_CHANCE: {
    DIJKSTRA: 0.4,       // Allow more long-distance edges
    BELLMAN_FORD: 0.5,   // Standard
  },
  
  // Random factor added to edge sorting to avoid too regular patterns
  SORT_RANDOM_FACTOR: 20,
};

// =========================
//   DENSITY CONFIGURATION
// =========================
export const DENSITY = {
  // Maximum density cap (prevents overcrowding)
  MAX_CAP: 0.5,
  
  // Base density value for adaptive scaling
  BASE: 0.8,
  
  // How much to reduce max density per node
  SCALE_PER_NODE: 0.04,
  
  // Mobile density reduction factor
  MOBILE_MULTIPLIER: 0.7,
  
  // Algorithm-specific density adjustments
  DIJKSTRA_MULTIPLIER: 1.05,   // Slightly higher density for path options
  BELLMAN_FORD_MULTIPLIER: 1.0,
  
  // Dijkstra density boost and cap
  DIJKSTRA_DENSITY_BOOST: 1.15,
  DIJKSTRA_DENSITY_CAP: 0.5,
};

// =========================
//   WEIGHT CONFIGURATION
// =========================
export const WEIGHTS = {
  // Dijkstra algorithm weight range
  DIJKSTRA: {
    MIN: 1,
    MAX: 15,
    // Weight distribution probabilities
    SMALL_WEIGHT_CHANCE: 0.3,
    MEDIUM_WEIGHT_CHANCE: 0.7,  // Of remaining after small
    // Weight ranges for each tier
    SMALL_RANGE: 5,
    MEDIUM_RANGE: 7,
    MEDIUM_OFFSET: 4,
    LARGE_RANGE: 5,
    LARGE_OFFSET_FROM_MAX: 4,
  },
  
  // Bellman-Ford algorithm weight range
  BELLMAN_FORD: {
    MIN_FLOOR: 2,              // Minimum value for minWeight
    MAX_FLOOR: 25,             // Minimum value for maxWeight
    STANDARD_WEIGHT_CHANCE: 0.7,
    LARGE_WEIGHT_RANGE: 10,
    LARGE_OFFSET_FROM_MAX: 9,
  },
};

// =========================
//   NEGATIVE EDGE CONFIG
// =========================
export const NEGATIVE_EDGES = {
  // Probability of creating a negative edge (when allowed)
  CREATION_CHANCE: 0.25,
  
  // Range for negative weights (will be negated)
  WEIGHT_RANGE: 12,
  WEIGHT_MIN: 1,
};

// =========================
//   NEGATIVE CYCLE CONFIG
// =========================
export const NEGATIVE_CYCLE = {
  // Probability of attempting to create a negative cycle
  CREATION_CHANCE: 0.4,
  
  // Maximum cycle size (or nodeCount/2, whichever is smaller)
  MAX_SIZE: 3,
  
  // Weight range for cycle edges
  EDGE_WEIGHT_RANGE: 10,
  EDGE_WEIGHT_MIN: 1,
  
  // Extra negative offset range when making cycle negative
  EXTRA_NEGATIVE_RANGE: 3,
  EXTRA_NEGATIVE_MIN: 1,
};

