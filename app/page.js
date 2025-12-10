"use client";

import { motion } from "framer-motion";
import { Route, Network, ArrowRight, GraduationCap } from "lucide-react";
import Link from "next/link";
import { BentoGrid } from "@/components/ui/bento-grid";
import { BorderBeam } from "@/components/ui/border-beam";
import { RetroGrid } from "@/components/ui/retro-grid";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Background component for Pathfinding card
function PathfindingBackground() {
  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-30">
      <svg
        className="h-full w-full"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Nodes */}
        <circle cx="40" cy="40" r="8" className="fill-indigo-500" />
        <circle cx="160" cy="40" r="8" className="fill-indigo-500" />
        <circle cx="100" cy="100" r="8" className="fill-indigo-500" />
        <circle cx="40" cy="160" r="8" className="fill-indigo-500" />
        <circle cx="160" cy="160" r="8" className="fill-indigo-500" />
        
        {/* Edges */}
        <line x1="40" y1="40" x2="100" y2="100" className="stroke-indigo-400 stroke-2" />
        <line x1="160" y1="40" x2="100" y2="100" className="stroke-indigo-400 stroke-2" />
        <line x1="40" y1="160" x2="100" y2="100" className="stroke-indigo-400 stroke-2" />
        <line x1="160" y1="160" x2="100" y2="100" className="stroke-indigo-400 stroke-2" />
        <line x1="40" y1="40" x2="160" y2="40" className="stroke-indigo-400/50 stroke-1" />
        <line x1="40" y1="160" x2="160" y2="160" className="stroke-indigo-400/50 stroke-1" />
        
        {/* Highlighted path */}
        <motion.line
          x1="40"
          y1="40"
          x2="100"
          y2="100"
          className="stroke-indigo-500 stroke-[3]"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        />
        <motion.line
          x1="100"
          y1="100"
          x2="160"
          y2="160"
          className="stroke-indigo-500 stroke-[3]"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 0.5, repeat: Infinity, repeatDelay: 1 }}
        />
      </svg>
    </div>
  );
}

// Background component for MST card
function MSTBackground() {
  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-20">
      <svg
        className="h-full w-full"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Tree structure */}
        <circle cx="100" cy="40" r="6" className="fill-purple-500" />
        <circle cx="50" cy="100" r="6" className="fill-purple-500" />
        <circle cx="150" cy="100" r="6" className="fill-purple-500" />
        <circle cx="30" cy="160" r="6" className="fill-purple-500" />
        <circle cx="70" cy="160" r="6" className="fill-purple-500" />
        <circle cx="130" cy="160" r="6" className="fill-purple-500" />
        <circle cx="170" cy="160" r="6" className="fill-purple-500" />
        
        {/* Tree edges */}
        <line x1="100" y1="40" x2="50" y2="100" className="stroke-purple-400 stroke-2" />
        <line x1="100" y1="40" x2="150" y2="100" className="stroke-purple-400 stroke-2" />
        <line x1="50" y1="100" x2="30" y2="160" className="stroke-purple-400 stroke-2" />
        <line x1="50" y1="100" x2="70" y2="160" className="stroke-purple-400 stroke-2" />
        <line x1="150" y1="100" x2="130" y2="160" className="stroke-purple-400 stroke-2" />
        <line x1="150" y1="100" x2="170" y2="160" className="stroke-purple-400 stroke-2" />
      </svg>
    </div>
  );
}

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Retro Grid Background */}
      <RetroGrid />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-transparent to-background/80" />
      
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-400"
          >
            <GraduationCap className="h-4 w-4" />
            Interactive Algorithm Visualizations
          </motion.div>
          
          <h1 className="mb-4 bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text pb-2 text-5xl font-bold leading-tight tracking-tight text-transparent sm:text-6xl md:text-7xl">
            Master Algorithms.
          </h1>
          
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground sm:text-xl">
            Visualize, understand, and master computer science algorithms with interactive step-by-step walkthroughs.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="w-full max-w-4xl"
        >
          <BentoGrid className="md:grid-cols-2 lg:grid-cols-2">
            {/* Pathfinding Card */}
            <Link href="/shortest-path" className="group relative">
              <div className="relative h-[22rem] overflow-hidden rounded-xl border border-border bg-card/50 p-6 transition-all duration-300 hover:border-indigo-500/50 hover:bg-card/80">
                <BorderBeam size={250} duration={12} delay={0} />
                <PathfindingBackground />
                
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div>
                    <div className="mb-4 inline-flex rounded-lg bg-indigo-500/10 p-3">
                      <Route className="h-8 w-8 text-indigo-400" />
                    </div>
                    <h3 className="mb-2 text-2xl font-semibold text-foreground">
                      Pathfinding
                    </h3>
                    <p className="text-muted-foreground">
                      Explore Dijkstra&apos;s and Bellman-Ford algorithms. Watch how shortest paths are discovered in real-time.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-indigo-400 transition-transform duration-300 group-hover:translate-x-2">
                    <span className="font-medium">Start Exploring</span>
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </Link>

            {/* MST Card */}
            <div className="relative cursor-not-allowed">
              <div className="relative h-[22rem] overflow-hidden rounded-xl border border-border bg-card/50 p-6 opacity-60">
                <BorderBeam 
                  size={250} 
                  duration={12} 
                  delay={6} 
                  colorFrom="#a855f7"
                  colorTo="#6366f1"
                />
                <MSTBackground />
                
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div>
                    <div className="mb-2 flex items-center gap-3">
                      <div className="inline-flex rounded-lg bg-purple-500/10 p-3">
                        <Network className="h-8 w-8 text-purple-400" />
                      </div>
                      <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                        Coming Soon
                      </span>
                    </div>
                    <h3 className="mb-2 text-2xl font-semibold text-foreground">
                      Network Design
                    </h3>
                    <p className="text-muted-foreground">
                      Visualize Prim&apos;s and Kruskal&apos;s algorithms. Learn how minimum spanning trees connect networks efficiently.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span className="font-medium">Under Development</span>
                  </div>
                </div>
              </div>
            </div>
          </BentoGrid>
        </motion.div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-12 text-sm text-muted-foreground"
        >
          Built with React, Next.js, and Framer Motion
        </motion.p>
      </div>
    </div>
  );
}
