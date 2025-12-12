"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ShortestPathVisualizer from "@/components/ShortestPathVisualizer/ShortestPathVisualizer";

function ShortestPathContent() {
  const searchParams = useSearchParams();
  const isEmbedded = searchParams.get('embedded') === 'true';

  return <ShortestPathVisualizer embedded={isEmbedded} />;
}

export default function ShortestPathPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ShortestPathContent />
    </Suspense>
  );
}

