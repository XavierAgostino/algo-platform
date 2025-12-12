"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BrowserFrame } from "@/components/ui/browser-frame";
import { Glow } from "@/components/ui/glow";
import { Github as GitHubIcon } from "lucide-react";
import { useState, useEffect } from "react";

export function HeroSection() {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const [iframeSrc, setIframeSrc] = useState('/shortest-path?embedded=true');

  useEffect(() => {
    // Use absolute URL in production (Vercel)
    if (typeof window !== 'undefined') {
      const isProduction = window.location.hostname.includes('vercel.app') || 
                          window.location.hostname.includes('algo-platform');
      if (isProduction) {
        setIframeSrc(`${window.location.origin}/shortest-path?embedded=true`);
      }
    }
    
    // Simulate iframe loading
    const loadingTimer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => {
      clearTimeout(loadingTimer);
    };
  }, []);

  const handleStartExploring = () => {
    const toolsSection = document.getElementById("tools-section");
    if (toolsSection) {
      toolsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      className={cn(
        "relative bg-background text-foreground",
        "py-12 px-4 md:py-24 lg:py-32",
        "overflow-hidden",
        "min-h-screen flex items-center"
      )}
    >
      <div className="relative mx-auto max-w-[1280px] flex flex-col gap-12 lg:gap-24 w-full">
        <div className="relative z-10 flex flex-col items-center gap-6 pt-8 md:pt-16 text-center lg:gap-12">
          {/* Heading */}
          <h1
            className={cn(
              "inline-block animate-appear",
              "bg-gradient-to-b from-foreground via-foreground/90 to-muted-foreground",
              "bg-clip-text text-transparent",
              "text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl",
              "leading-[1.1] sm:leading-[1.1]",
              "drop-shadow-sm dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            )}
          >
            Visualize Complex Algorithms. Master Graph Theory.
          </h1>

          {/* Description */}
          <p
            className={cn(
              "max-w-[550px] animate-appear opacity-0 [animation-delay:150ms]",
              "text-base sm:text-lg md:text-xl",
              "text-muted-foreground",
              "font-medium"
            )}
          >
            Interactive, step-by-step visualizations for Dijkstra, Bellman-Ford, and A*. Built for students and engineers.
          </p>

          {/* CTAs */}
          <div
            className={cn(
              "relative z-10 flex flex-wrap justify-center gap-4",
              "animate-appear opacity-0 [animation-delay:300ms]"
            )}
          >
            <Button
              onClick={handleStartExploring}
              size="lg"
              className={cn(
                "bg-gradient-to-b from-brand to-brand/90 dark:from-brand/90 dark:to-brand/80",
                "hover:from-brand/95 hover:to-brand/85 dark:hover:from-brand/80 dark:hover:to-brand/70",
                "text-white shadow-lg",
                "transition-all duration-300"
              )}
            >
              Start Exploring
            </Button>

            <Button
              asChild
              size="lg"
              variant="ghost"
              className={cn(
                "text-foreground/80 dark:text-foreground/70",
                "transition-all duration-300"
              )}
            >
              <a href="https://github.com/XavierAgostino/algo-platform" target="_blank" rel="noopener noreferrer">
                <GitHubIcon className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </div>

          {/* BrowserFrame Mockup */}
          <div className="relative w-full pt-12 px-4 sm:px-6 lg:px-8">
            <div
              className={cn(
                "shadow-[0_0_50px_-12px_rgba(0,0,0,0.3)] dark:shadow-[0_0_50px_-12px_rgba(255,255,255,0.1)]",
                "animate-appear opacity-0 [animation-delay:700ms]"
              )}
              style={{ 
                animationFillMode: 'forwards',
                // Ensure it becomes visible even if animation doesn't complete
                animation: 'appear 0.5s ease-out 0.7s forwards'
              }}
            >
              <BrowserFrame url="algo-platform.com/shortest-path">
                {isLoading ? (
                  <div className="flex h-[400px] md:h-[500px] lg:h-[600px] items-center justify-center bg-muted/20">
                    <div className="text-muted-foreground">Loading preview...</div>
                  </div>
                ) : iframeError ? (
                  <div className="flex h-[400px] md:h-[500px] lg:h-[600px] items-center justify-center bg-muted/20">
                    <div className="text-center">
                      <p className="text-muted-foreground mb-4">Preview unavailable</p>
                      <a 
                        href="/shortest-path" 
                        className="text-brand hover:underline"
                      >
                        Open Shortest Path Visualizer →
                      </a>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={iframeSrc}
                    className="w-full h-[400px] md:h-[500px] lg:h-[600px] border-0"
                    style={{ 
                      display: 'block',
                      minHeight: '400px',
                      background: 'transparent'
                    }}
                    title="Shortest Path Visualizer Preview"
                    loading="lazy"
                    onError={() => {
                      console.error('Iframe failed to load', iframeSrc);
                      setIframeError(true);
                      setIsLoading(false);
                    }}
                    onLoad={(e) => {
                      console.log('Iframe loaded successfully', iframeSrc);
                      setIsLoading(false);
                    }}
                    allow="fullscreen"
                    referrerPolicy="same-origin"
                  />
                )}
              </BrowserFrame>
            </div>
          </div>
        </div>
      </div>
      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Glow
          variant="above"
          className="animate-appear-zoom opacity-0 [animation-delay:1000ms]"
        />
      </div>
    </section>
  );
}

