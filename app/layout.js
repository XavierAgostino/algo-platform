import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

export const metadata = {
  title: 'AlgoPlatform - Master Computer Science Algorithms',
  description: 'Interactive visualizations for learning Dijkstra, Bellman-Ford, Prims, Kruskals and more algorithms',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}

