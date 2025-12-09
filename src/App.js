import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import ShortestPathVisualizer from './components/ShortestPathVisualizer/ShortestPathVisualizer';

function App() {
  return (
    <div>
      <ShortestPathVisualizer />
      <Analytics />
    </div>
  );
}

export default App;
