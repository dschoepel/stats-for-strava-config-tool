import './globals.css'
import { Providers } from '../src/components/Providers'

export const metadata = {
  title: 'Stats for Strava Config Tool',
  description: 'Configuration file manager for Stats for Strava',
  icons: {
    icon: '/logo.svg',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning={true}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}