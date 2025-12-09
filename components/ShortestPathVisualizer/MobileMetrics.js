import React from "react";

const MobileMetrics = ({
  visitedNodes,
  selectedDestNode,
  distanceArray,
  steps,
  animationSpeed
}) => {
  return (
    <div className="grid grid-cols-3 gap-2 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm p-2 rounded border border-zinc-200 dark:border-zinc-800 mb-3">
      <div className="text-center">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">Visited</div>
        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
          {visitedNodes.size}
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">Path Length</div>
        <div className="text-lg font-bold text-green-600 dark:text-green-400">
          {selectedDestNode !== null &&
          distanceArray[selectedDestNode] !== Infinity
            ? distanceArray[selectedDestNode]
            : "-"}
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">Time</div>
        <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
          {steps.length > 0
            ? (steps.length * animationSpeed) / 1000 + "s"
            : "-"}
        </div>
      </div>
    </div>
  );
};

export default MobileMetrics;