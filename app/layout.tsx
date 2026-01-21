import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/auth-context'

export const metadata: Metadata = {
  title: 'Pete System',
  description: 'Created by botivate.ai',
  generator: 'botivate',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
