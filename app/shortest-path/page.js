"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ShortestPathVisualizer from "@/components/ShortestPathVisualizer/ShortestPathVisualizer";

function ShortestPathContent() {
  const searchParams = useSearchParams();
  const isEmbedded = searchParams.get('embedded') === 'true';

  return (
    <div className={isEmbedded ? 'h-full overflow-hidden' : ''}>
      <ShortestPathVisualizer embedded={isEmbedded} />
    </div>
  );
}

export default function ShortestPathPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ShortestPathContent />
    </Suspense>
  );
}

