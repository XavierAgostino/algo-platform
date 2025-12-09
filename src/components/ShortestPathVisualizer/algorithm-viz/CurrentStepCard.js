import React from 'react';

/**
 * Displays the current algorithm step progress and action.
 */
const CurrentStepCard = ({ currentStep, totalSteps, currentAlgorithmStep }) => {
  return (
    <div className="bg-white/95 shadow-lg rounded-lg p-2 backdrop-blur-sm border border-indigo-200/50">
      <div className="flex justify-between items-center pl-8">
        <h3 className="text-sm font-bold text-indigo-800">Current Step</h3>
        <div className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-300 tabular-nums">
          {currentStep}/{totalSteps || 0}
        </div>
      </div>
      {currentAlgorithmStep && (
        <div className="mt-1 p-1.5 bg-indigo-50 rounded text-xs">
          <span className="font-medium text-indigo-700">Action:</span>{' '}
          <span className="text-indigo-600">{currentAlgorithmStep}</span>
        </div>
      )}
    </div>
  );
};

export default CurrentStepCard;

