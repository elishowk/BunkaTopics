const translate = require('next-translate')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // process.env.NEXT_PUBLIC_BETA !== 'true',
  images: {
    unoptimized: process.env.NO_TRANSLATE === 'true',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.twimg.com',
      }
    ]
  },
  exportPathMap: async function (_, __) {
    return {
      '/': { page: '/' },
      '/search': { page: '/search' }
    }
  },
}

module.exports = process.env.NO_TRANSLATE === 'true' ? nextConfig : translate(nextConfig)
