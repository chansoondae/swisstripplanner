/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  // Disable ESLint in production builds as requested
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  
  // Configure image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.wixstatic.com',
        port: '',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images-webcams.windy.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Add experimental features for optimizing performance
  experimental: {
    // Enable CSS optimization for better handling of preloaded CSS
    optimizeCss: true,
    
    // Improve page loading performance
    scrollRestoration: true,
  },
  
  // Reduce the impact of unused CSS by only including what's needed
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Improve performance by enabling React strict mode
  reactStrictMode: true,
  
  // Add rewrites or redirects if needed
  // async redirects() {
  //   return [
  //     {
  //       source: '/old-path',
  //       destination: '/new-path',
  //       permanent: true,
  //     },
  //   ]
  // },
};

export default nextConfig;