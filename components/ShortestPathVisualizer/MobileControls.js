import React from "react";
import { Play, Pause, SkipForward, RotateCcw, Focus, Eye, EyeOff } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MobileControls = ({
  currentStep, 
  isRunning, 
  handlePlayPause,
  isPaused,
  handleStep,
  resetGraph,
  resetGraphTransform,
  explanation,
  steps,
  visualizationMode,
  toggleVisualizationMode
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-4">
      {/* Visualization Mode Toggle */}
      <div className="mb-4 flex justify-center">
        <Tabs value={visualizationMode} onValueChange={(value) => {
          if (value === "explore" && visualizationMode === "view") {
            toggleVisualizationMode();
          } else if (value === "view" && visualizationMode === "explore") {
            toggleVisualizationMode();
          }
        }} className="w-full max-w-xs">
          <TabsList className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-lg">
            <TabsTrigger 
              value="explore" 
              className="flex-1 data-[state=active]:bg-indigo-600 data-[state=active]:text-white flex items-center gap-1.5"
            >
              <Eye className="w-4 h-4" />
              Explore
            </TabsTrigger>
            <TabsTrigger 
              value="view" 
              className="flex-1 data-[state=active]:bg-amber-600 data-[state=active]:text-white flex items-center gap-1.5"
            >
              <EyeOff className="w-4 h-4" />
              View
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Progress Indicator */}
      {steps && steps.length > 0 && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
            {currentStep} / {steps.length}
          </span>
          <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full flex-1 max-w-[200px]">
            <div
              className="h-2 bg-indigo-500 rounded-full transition-all"
              style={{
                width: `${(currentStep / steps.length) * 100}%`,
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Simplified Control Buttons: Start, Step, Reset */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Start/Pause Button - Primary action */}
        <button
          onClick={handlePlayPause}
          className="py-3 px-2 rounded-lg flex flex-col items-center justify-center bg-indigo-600 text-white shadow-sm active:scale-95 transition-transform"
        >
          {isRunning ? (
            isPaused ? (
              <>
                <Play className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">Pause</span>
              </>
            )
          ) : (
            <>
              <Play className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">Start</span>
            </>
          )}
        </button>

        {/* Step Button - Outline variant */}
        <button
          onClick={handleStep}
          className="py-3 px-2 rounded-lg flex flex-col items-center justify-center bg-white dark:bg-zinc-900 border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 active:scale-95 transition-transform"
        >
          <SkipForward className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Step</span>
        </button>

        {/* Reset Button - Ghost variant */}
        <button
          onClick={resetGraph}
          className="py-3 px-2 rounded-lg flex flex-col items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 active:scale-95 transition-transform"
        >
          <RotateCcw className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">Reset</span>
        </button>
      </div>

      {/* Center View Button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={resetGraphTransform}
          className="py-2 px-4 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-2 active:scale-95 transition-transform"
        >
          <Focus className="w-4 h-4" />
          Center View
        </button>
      </div>

      {/* Explanation Area */}
      <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-lg p-3 border border-indigo-100 dark:border-indigo-900 min-h-14 max-h-28 overflow-y-auto">
        <div className="text-sm text-zinc-700 dark:text-zinc-300">{explanation}</div>
      </div>
    </div>
  );
};

export default MobileControls;
