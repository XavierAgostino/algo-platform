"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const roadmapItems = [
  {
    period: "Q1",
    title: "Pathfinding Suite",
    description: "Dijkstra and Bellman-Ford algorithms with interactive visualizations.",
    status: "done",
  },
  {
    period: "Q2",
    title: "Network Design",
    description: "MST algorithms (Prim's and Kruskal's) - In Progress",
    status: "in-progress",
  },
  {
    period: "Future",
    title: "Advanced Algorithms",
    description: "Heuristic Search (A*) & Flow Networks (Max Flow)",
    status: "planned",
  },
];

export function Roadmap() {
  return (
    <section className="relative py-16 px-4 md:py-24 lg:py-32">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            Roadmap
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our journey to build the most comprehensive algorithm visualization platform.
          </p>
        </motion.div>

        <div className="space-y-6">
          {roadmapItems.map((item, index) => (
            <motion.div
              key={item.period}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className={cn(
                "relative flex items-start gap-4",
                "rounded-xl border border-border bg-card p-6",
                "transition-all duration-300",
                "hover:border-indigo-500/50 hover:shadow-md"
              )}
            >
              {/* Status Icon */}
              <div className="flex-shrink-0 mt-1">
                {item.status === "done" && (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                )}
                {item.status === "in-progress" && (
                  <Clock className="h-6 w-6 text-amber-500 animate-pulse" />
                )}
                {item.status === "planned" && (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    {item.period}
                  </span>
                  {item.status === "in-progress" && (
                    <span className="inline-flex items-center rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-400">
                      In Progress
                    </span>
                  )}
                  {item.status === "done" && (
                    <span className="inline-flex items-center rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
                      Done
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  {item.title}
                </h3>

                <p className="text-muted-foreground">
                  {item.description}
                </p>

                {/* Progress Bar for In Progress */}
                {item.status === "in-progress" && (
                  <div className="mt-4 h-2 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: "60%" }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

