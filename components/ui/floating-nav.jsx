import React from 'react';
import { cn } from '@/lib/utils';

function FloatingNav({ children, className }) {
  return (
    <nav
      className={cn(
        'flex items-center gap-1 sm:gap-2 rounded-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-lg px-1 sm:px-2 py-1.5 sm:py-2 max-w-[calc(100vw-2rem)] overflow-x-auto scrollbar-hide',
        className
      )}
    >
      {children}
    </nav>
  );
}

function FloatingNavItem({ children, className, onClick, active, tooltip }) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={cn(
          'flex items-center justify-center rounded-full p-1.5 sm:p-2 transition-all duration-200',
          active
            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400'
            : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
          className
        )}
      >
        {children}
      </button>
      {tooltip && (
        <div className="hidden sm:block absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-zinc-900 dark:bg-zinc-800 text-white dark:text-zinc-100 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
          {tooltip}
        </div>
      )}
    </div>
  );
}

function FloatingNavDivider() {
  return <div className="w-px h-5 sm:h-6 bg-zinc-200 dark:bg-zinc-700 mx-0.5 sm:mx-1 flex-shrink-0" />;
}

export { FloatingNav, FloatingNavItem, FloatingNavDivider };

