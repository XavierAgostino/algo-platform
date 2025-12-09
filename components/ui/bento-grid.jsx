"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function BentoGrid({ children, className }) {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-[22rem] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  badge,
  disabled = false,
}) {
  const CardWrapper = disabled ? "div" : "a";
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-xl",
        // Light styles
        "bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)]",
        // Dark styles
        "dark:bg-zinc-900 dark:[border:1px_solid_rgba(255,255,255,.1)] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset]",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      {/* Background */}
      <div className="absolute inset-0 z-0">{background}</div>
      
      {/* Content */}
      <div className="pointer-events-none z-10 flex transform-gpu flex-col gap-1 p-6 transition-all duration-300 group-hover:-translate-y-10">
        {badge && (
          <span className="inline-flex w-fit items-center rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-medium text-indigo-400 ring-1 ring-inset ring-indigo-500/20 mb-2">
            {badge}
          </span>
        )}
        {Icon && (
          <Icon className="h-12 w-12 origin-left transform-gpu text-zinc-700 transition-all duration-300 ease-in-out group-hover:scale-75 dark:text-zinc-300" />
        )}
        <h3 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300">
          {name}
        </h3>
        <p className="max-w-lg text-zinc-400">{description}</p>
      </div>

      {/* CTA */}
      <div
        className={cn(
          "pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
        )}
      >
        <CardWrapper
          href={disabled ? undefined : href}
          className={cn(
            "pointer-events-auto inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            disabled
              ? "bg-zinc-800 text-zinc-500"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          )}
        >
          {cta}
          {!disabled && (
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          )}
        </CardWrapper>
      </div>
      
      {/* Hover border glow effect */}
      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-black/[.03] group-hover:dark:bg-zinc-800/10" />
    </motion.div>
  );
}

