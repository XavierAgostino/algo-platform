"use client";

import { motion } from "framer-motion";
import { MousePointerClick, Play, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    icon: MousePointerClick,
    title: "Select Algorithm",
    description: "Choose from Dijkstra or Bellman-Ford algorithms to visualize.",
    color: "indigo",
  },
  {
    icon: Play,
    title: "Draw Graph",
    description: "Create your graph using spatial mode or auto-generate one.",
    color: "purple",
  },
  {
    icon: Lightbulb,
    title: "Visualize Steps",
    description: "Watch the algorithm execute step-by-step with real-time visualizations.",
    color: "amber",
  },
];

export function HowItWorks() {
  return (
    <section className="relative py-16 px-4 md:py-24 lg:py-32 bg-muted/30">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get started in three simple steps and start visualizing algorithms like a pro.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className={cn(
                  "relative group",
                  "rounded-xl border border-border bg-card p-8",
                  "transition-all duration-300",
                  "hover:border-indigo-500/50 hover:shadow-lg hover:-translate-y-1"
                )}
              >
                <div
                  className={cn(
                    "mb-6 inline-flex rounded-lg p-4",
                    step.color === "indigo" && "bg-indigo-500/10",
                    step.color === "purple" && "bg-purple-500/10",
                    step.color === "amber" && "bg-amber-500/10"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-8 w-8",
                      step.color === "indigo" && "text-indigo-400",
                      step.color === "purple" && "text-purple-400",
                      step.color === "amber" && "text-amber-400"
                    )}
                  />
                </div>

                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Step {index + 1}
                  </span>
                </div>

                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {step.title}
                </h3>

                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

