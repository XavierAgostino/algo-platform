import React from "react";
import { 
  Plus, 
  Link2, 
  Trash2, 
  Unlink, 
  Flag, 
  Target, 
  Eraser,
  MousePointer2,
  Edit3
} from "lucide-react";

/**
 * Floating toolbar for manual graph design mode.
 * Provides quick access to graph editing tools without needing to open the drawer.
 */
const ManualModeToolbar = ({
  // Tool states
  isAddingNode,
  isAddingEdge,
  isDeletingNode,
  isDeletingEdge,
  isEditingEdge,
  isSelectingSource,
  isSelectingDest,
  tempNode, // For edge creation - shows which node is selected
  
  // Tool handlers
  onAddNodeMode,
  onAddEdgeMode,
  onDeleteNodeMode,
  onDeleteEdgeMode,
  onEditEdgeMode,
  onSelectSourceMode,
  onSelectDestMode,
  onClearGraph,
  onCancelOperation,
  
  // Node labels for display
  nodes,
  selectedSourceNode,
  selectedDestNode,
}) => {
  // Determine current active mode for display
  const getActiveMode = () => {
    if (isAddingNode) return "Click on graph to add node";
    if (isAddingEdge && tempNode === null) return "Click first node for edge";
    if (isAddingEdge && tempNode !== null) return `Click second node (from ${nodes[tempNode]?.label})`;
    if (isDeletingNode) return "Click node to delete";
    if (isDeletingEdge) return "Click edge to delete";
    if (isEditingEdge) return "Click edge weight to edit";
    if (isSelectingSource) return "Click node to set as source";
    if (isSelectingDest) return "Click node to set as target";
    return null;
  };

  const activeMode = getActiveMode();

  // Tool button component for consistency
  const ToolButton = ({ 
    icon: Icon, 
    label, 
    isActive, 
    onClick, 
    variant = "default",
    disabled = false 
  }) => {
    const baseStyles = "relative group flex flex-col items-center justify-center p-2.5 rounded-xl transition-all duration-200";
    
    const variantStyles = {
      default: isActive 
        ? "bg-indigo-600 text-white shadow-md" 
        : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700",
      success: isActive 
        ? "bg-emerald-600 text-white shadow-md" 
        : "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900",
      danger: isActive 
        ? "bg-rose-600 text-white shadow-md" 
        : "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900",
      warning: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900",
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseStyles} ${variantStyles[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={label}
      >
        <Icon className="w-5 h-5" />
        <span className="text-[10px] font-medium mt-1 leading-none">{label}</span>
        
        {/* Tooltip */}
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-900 dark:bg-zinc-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          {label}
        </div>
      </button>
    );
  };

  return (
    <div className="fixed bottom-5 left-5 z-40 flex flex-col gap-3">
      {/* Active Mode Indicator */}
      {activeMode && (
        <div className="bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2 animate-pulse">
          <MousePointer2 className="w-4 h-4" />
          <span>{activeMode}</span>
          <button 
            onClick={onCancelOperation}
            className="ml-2 px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
          >
            ESC
          </button>
        </div>
      )}
      
      {/* Main Toolbar */}
      <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-2xl shadow-xl border border-zinc-200 dark:border-zinc-800 p-2">
        {/* Node/Edge Creation Row */}
        <div className="flex items-center gap-1 pb-2 border-b border-zinc-200 dark:border-zinc-700">
          <ToolButton
            icon={Plus}
            label="Node"
            isActive={isAddingNode}
            onClick={onAddNodeMode}
            variant="default"
          />
          <ToolButton
            icon={Link2}
            label="Edge"
            isActive={isAddingEdge}
            onClick={onAddEdgeMode}
            variant="default"
          />
          
          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700 mx-1" />
          
          <ToolButton
            icon={Trash2}
            label="Del Node"
            isActive={isDeletingNode}
            onClick={onDeleteNodeMode}
            variant="danger"
          />
          <ToolButton
            icon={Unlink}
            label="Del Edge"
            isActive={isDeletingEdge}
            onClick={onDeleteEdgeMode}
            variant="danger"
          />
          <ToolButton
            icon={Edit3}
            label="Edit Edge"
            isActive={isEditingEdge}
            onClick={onEditEdgeMode}
            variant="default"
          />
        </div>
        
        {/* Source/Target Row */}
        <div className="flex items-center gap-1 pt-2">
          <ToolButton
            icon={Flag}
            label="Source"
            isActive={isSelectingSource}
            onClick={onSelectSourceMode}
            variant="success"
          />
          <ToolButton
            icon={Target}
            label="Target"
            isActive={isSelectingDest}
            onClick={onSelectDestMode}
            variant="success"
          />
          
          <div className="w-px h-8 bg-zinc-200 dark:bg-zinc-700 mx-1" />
          
          <ToolButton
            icon={Eraser}
            label="Clear"
            isActive={false}
            onClick={onClearGraph}
            variant="warning"
          />
        </div>
      </div>
      
      {/* Current Selection Info */}
      {(selectedSourceNode !== null || selectedDestNode !== null) && (
        <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-xl shadow-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs">
          <div className="flex items-center gap-3">
            {selectedSourceNode !== null && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">
                  {nodes[selectedSourceNode]?.label}
                </div>
                <span className="text-zinc-600 dark:text-zinc-400">Source</span>
              </div>
            )}
            {selectedSourceNode !== null && selectedDestNode !== null && (
              <span className="text-zinc-400">→</span>
            )}
            {selectedDestNode !== null && (
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-white text-[10px] font-bold">
                  {nodes[selectedDestNode]?.label}
                </div>
                <span className="text-zinc-600 dark:text-zinc-400">Target</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualModeToolbar;

