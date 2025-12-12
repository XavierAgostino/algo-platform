"use client";

import { motion } from "framer-motion";
import { Route, Network, ArrowRight } from "lucide-react";
import Link from "next/link";
import { BentoGrid } from "@/components/ui/bento-grid";
import { BorderBeam } from "@/components/ui/border-beam";

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

export function ToolsGrid() {
  return (
    <section id="tools-section" className="relative py-16 px-4 md:py-24 lg:py-32">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            Available Tools
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our interactive algorithm visualizations designed to help you understand complex computer science concepts.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="w-full"
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
      </div>
    </section>
  );
}

