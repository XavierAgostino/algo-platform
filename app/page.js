"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { HeroSection } from "@/components/landing/HeroSection";
import { ToolsGrid } from "@/components/landing/ToolsGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Roadmap } from "@/components/landing/Roadmap";

export default function Home() {
  return (
    <main className="bg-background min-h-screen">
      {/* Theme Toggle - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Landing Sections */}
      <HeroSection />
      <ToolsGrid />
      <HowItWorks />
      <Roadmap />
    </main>
  );
}
