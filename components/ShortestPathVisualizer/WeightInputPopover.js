import React, { useState, useEffect, useRef, useCallback } from "react";
import { Minus, Plus, Check, X } from "lucide-react";

/**
 * Inline popover for entering edge weights.
 * Replaces the browser prompt() for a better UX.
 */
const WeightInputPopover = ({
  isOpen,
  position, // { x, y } coordinates for positioning
  initialWeight = 10,
  allowNegative = false,
  onConfirm,
  onCancel,
}) => {
  const [weight, setWeight] = useState(initialWeight);
  const inputRef = useRef(null);

  const handleConfirm = useCallback(() => {
    const numWeight = parseFloat(weight);
    if (isNaN(numWeight)) {
      // Show error state or just use default
      onConfirm(initialWeight);
    } else if (!allowNegative && numWeight < 0) {
      // Force positive if negative not allowed
      onConfirm(Math.abs(numWeight));
    } else {
      onConfirm(numWeight);
    }
  }, [weight, onConfirm, initialWeight, allowNegative]);

  // Reset weight when popover opens
  useEffect(() => {
    if (isOpen) {
      setWeight(initialWeight);
      // Focus input after a short delay to ensure DOM is ready
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialWeight]);

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel, handleConfirm]);

  const incrementWeight = () => {
    setWeight((prev) => {
      const num = parseFloat(prev) || 0;
      return num + 1;
    });
  };

  const decrementWeight = () => {
    setWeight((prev) => {
      const num = parseFloat(prev) || 0;
      const newVal = num - 1;
      if (!allowNegative && newVal < 1) return 1;
      return newVal;
    });
  };

  if (!isOpen) return null;

  // Calculate position with bounds checking
  const popoverStyle = {
    position: "fixed",
    left: `${Math.min(position?.x || 200, window.innerWidth - 200)}px`,
    top: `${Math.min(position?.y || 200, window.innerHeight - 150)}px`,
    transform: "translate(-50%, -50%)",
    zIndex: 100,
  };

  return (
    <div 
      style={popoverStyle}
      className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-4 min-w-[180px]"
    >
      {/* Header */}
      <div className="text-center mb-3">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Edge Weight
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {allowNegative ? "Enter weight (can be negative)" : "Enter weight (1-99)"}
        </p>
      </div>

      {/* Input with +/- buttons */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button
          onClick={decrementWeight}
          className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors"
        >
          <Minus className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </button>
        
        <input
          ref={inputRef}
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          min={allowNegative ? undefined : 1}
          max={99}
          className="w-16 h-12 text-center text-xl font-bold rounded-xl border-2 border-indigo-300 dark:border-indigo-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none transition-all"
        />
        
        <button
          onClick={incrementWeight}
          className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 flex items-center justify-center transition-colors"
        >
          <Plus className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
        </button>
      </div>

      {/* Confirm/Cancel buttons */}
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 px-3 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium flex items-center justify-center gap-1 transition-colors"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          className="flex-1 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium flex items-center justify-center gap-1 transition-colors"
        >
          <Check className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Keyboard hint */}
      <div className="mt-3 text-center">
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
          Press <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px]">Enter</kbd> to confirm, <kbd className="px-1 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px]">Esc</kbd> to cancel
        </span>
      </div>
    </div>
  );
};

export default WeightInputPopover;

