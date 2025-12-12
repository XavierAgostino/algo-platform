"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react";

export function BrowserFrame({ 
  url = "algo-platform.com/shortest-path",
  children,
  className,
  showControls = true 
}) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-border/50",
        "bg-card shadow-2xl",
        className
      )}
    >
      {/* Browser Chrome */}
      {showControls && (
        <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-4 py-2.5">
          {/* Window Controls */}
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80 hover:bg-yellow-500 transition-colors" />
            <div className="h-3 w-3 rounded-full bg-green-500/80 hover:bg-green-500 transition-colors" />
          </div>

          {/* Navigation Controls */}
          <div className="ml-4 flex items-center gap-1">
            <button
              className="rounded p-1 hover:bg-muted transition-colors"
              aria-label="Back"
            >
              <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              className="rounded p-1 hover:bg-muted transition-colors"
              aria-label="Forward"
            >
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              className="rounded p-1 hover:bg-muted transition-colors"
              aria-label="Refresh"
            >
              <RotateCw className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Address Bar */}
          <div className="ml-4 flex flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="flex-1 truncate text-xs text-muted-foreground font-mono">
              {url}
            </span>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="relative bg-background">
        {children}
      </div>
    </div>
  );
}

