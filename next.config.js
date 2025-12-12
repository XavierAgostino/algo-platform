/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode
  reactStrictMode: true,
  
  // Transpile packages if needed
  transpilePackages: [],
  
  // Headers to allow iframe embedding
  async headers() {
    return [
      {
        source: '/shortest-path',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self'",
          },
        ],
      },
    ];
  },
  
  // Webpack configuration for SVG handling
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    return config;
  },
};

module.exports = nextConfig;

