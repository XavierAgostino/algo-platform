"use client";

import { motion } from "framer-motion";
import { Github, GitFork, Star, Users, Code2, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const contributionAreas = [
  {
    icon: Code2,
    title: "New Algorithms",
    description: "Implement additional algorithm visualizations like A*, sorting algorithms, or tree traversals.",
  },
  {
    icon: Users,
    title: "Accessibility",
    description: "Improve screen reader support, keyboard navigation, and color contrast for all users.",
  },
  {
    icon: Heart,
    title: "Educational Content",
    description: "Add tutorials, explanations, and learning resources to help students understand better.",
  },
];

export function OpenSource() {
  return (
    <section className="relative py-16 px-4 md:py-24 lg:py-32 bg-muted/30">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center rounded-full bg-purple-500/10 px-4 py-2 mb-6">
            <Github className="h-5 w-5 text-purple-500 mr-2" />
            <span className="text-sm font-medium text-purple-500">Open Source</span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
            Built by the Community, for the Community
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            AlgoPlatform is 100% open source under the MIT license. We believe educational tools should be free and accessible to everyone. Join us in making algorithm learning better for students worldwide.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Button
              asChild
              size="lg"
              className={cn(
                "bg-gradient-to-b from-zinc-800 to-zinc-900 dark:from-zinc-700 dark:to-zinc-800",
                "hover:from-zinc-700 hover:to-zinc-800 dark:hover:from-zinc-600 dark:hover:to-zinc-700",
                "text-white shadow-lg",
                "transition-all duration-300"
              )}
            >
              <a href="https://github.com/XavierAgostino/algo-platform" target="_blank" rel="noopener noreferrer">
                <Star className="mr-2 h-4 w-4" />
                Star on GitHub
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-purple-500/50 hover:bg-purple-500/10 hover:border-purple-500"
            >
              <a href="https://github.com/XavierAgostino/algo-platform/fork" target="_blank" rel="noopener noreferrer">
                <GitFork className="mr-2 h-4 w-4" />
                Fork Repository
              </a>
            </Button>
          </div>
        </motion.div>

        {/* Contribution Areas */}
        <div className="grid gap-6 md:grid-cols-3">
          {contributionAreas.map((area, index) => {
            const Icon = area.icon;
            return (
              <motion.div
                key={area.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15, duration: 0.5 }}
                className={cn(
                  "rounded-xl border border-border bg-card p-6",
                  "transition-all duration-300",
                  "hover:border-purple-500/50 hover:shadow-md"
                )}
              >
                <div className="mb-4 inline-flex rounded-lg bg-purple-500/10 p-3">
                  <Icon className="h-6 w-6 text-purple-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{area.title}</h3>
                <p className="text-sm text-muted-foreground">{area.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Contribution Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-12 rounded-xl border border-border bg-card p-8 text-center"
        >
          <h3 className="text-xl font-semibold mb-4">Ready to Contribute?</h3>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="inline-flex items-center">
              <span className="inline-block w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 text-xs font-bold mr-2 flex items-center justify-center">1</span>
              Fork the repo
            </span>
            <span className="text-muted-foreground/50">→</span>
            <span className="inline-flex items-center">
              <span className="inline-block w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 text-xs font-bold mr-2 flex items-center justify-center">2</span>
              Create a branch
            </span>
            <span className="text-muted-foreground/50">→</span>
            <span className="inline-flex items-center">
              <span className="inline-block w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 text-xs font-bold mr-2 flex items-center justify-center">3</span>
              Make changes
            </span>
            <span className="text-muted-foreground/50">→</span>
            <span className="inline-flex items-center">
              <span className="inline-block w-6 h-6 rounded-full bg-purple-500/20 text-purple-500 text-xs font-bold mr-2 flex items-center justify-center">4</span>
              Open a PR
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Check out our{" "}
            <a
              href="https://github.com/XavierAgostino/algo-platform/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-500 hover:underline"
            >
              Contributing Guide
            </a>
            {" "}for detailed instructions.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
