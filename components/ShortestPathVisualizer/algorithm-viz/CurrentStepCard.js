import React from 'react';

/**
 * Displays the current algorithm step progress and action.
 */
const CurrentStepCard = ({ currentStep, totalSteps, currentAlgorithmStep }) => {
  return (
    <div className="bg-white/90 dark:bg-zinc-900/90 shadow-lg rounded-lg p-2 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800">
      <div className="flex justify-between items-center pl-8">
        <h3 className="text-sm font-bold text-indigo-700 dark:text-indigo-400">Current Step</h3>
        <div className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 tabular-nums">
          {currentStep}/{totalSteps || 0}
        </div>
      </div>
      {currentAlgorithmStep && (
        <div className="mt-1 p-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded text-xs">
          <span className="font-medium text-indigo-700 dark:text-indigo-400">Action:</span>{' '}
          <span className="text-indigo-600 dark:text-indigo-300">{currentAlgorithmStep}</span>
        </div>
      )}
    </div>
  );
};

export default CurrentStepCard;

