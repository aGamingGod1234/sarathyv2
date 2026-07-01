import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appDir = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: appDir,
  async headers() {
    return [
      {
        source: '/assets/hero/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  async redirects() {
    const appRoutes = [
      'home',
      'pricing',
      'login',
      'signup',
      'forgot-password',
      'onboarding',
      'waitlist',
      'sarathy',
      'profile',
      'insights',
      'check',
      'fixed',
      'upload',
      'mydata',
      'remittance',
      'marketplace',
      'biases',
      'circles',
      'future',
      'story',
    ]

    return appRoutes.map(route => ({
      source: `/${route}/:path*`,
      destination: `/app/${route}/:path*`,
      permanent: false,
    }))
  },
}

export default nextConfig
