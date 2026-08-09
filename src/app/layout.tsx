import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import Script from 'next/script'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
})

export const metadata: Metadata = {
  title: 'petricor',
  description: 'la comunidad que huele a tierra mojada',
  manifest: '/manifest.json',
  icons: {
    icon: '/petricor-icon.svg',
    apple: '/icon-192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cfBeaconToken = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN

  return (
    <html lang="es" className={`${geist.variable} dark`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>

        {/* Cloudflare Web Analytics — gratis, sin cookies, sin banner de consentimiento necesario */}
        {cfBeaconToken && (
          <Script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${cfBeaconToken}"}`}
          />
        )}
      </body>
    </html>
  )
}