import type { Metadata, Viewport } from 'next'
import { Archivo, Instrument_Sans } from 'next/font/google'
import './globals.css'

const instrumentSans = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-instrument-sans',
  weight: ['400', '500', '600', '700'],
})

const archivo = Archivo({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-archivo',
  weight: ['500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: 'Sarathy - Money clarity for university life in Singapore',
  description: 'A personalized finance companion for university students managing spending, bills, goals, and money stress.',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    shortcut: ['/icon.svg'],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Sarathy',
  },
}

export const viewport: Viewport = {
  themeColor: '#F97316',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${archivo.variable}`}>
      <body className="font-sans bg-cream antialiased">
        {children}
      </body>
    </html>
  )
}
