"use client";

import { useSearchParams } from 'next/navigation';
import ShortestPathVisualizer from "@/components/ShortestPathVisualizer/ShortestPathVisualizer";

export default function ShortestPathPage() {
  const searchParams = useSearchParams();
  const isEmbedded = searchParams.get('embedded') === 'true';

  return (
    <div className={isEmbedded ? 'h-full overflow-hidden' : ''}>
      <ShortestPathVisualizer embedded={isEmbedded} />
    </div>
  );
}

