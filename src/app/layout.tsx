import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { ClerkProvider } from '@clerk/nextjs'
import { ptBR } from '@clerk/localizations'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'CodeLab',
  description: 'CodeLab - plataforma de cursos',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)

  const AppShell = (
    <html lang="pt-BR">
      <body
        className={cn(
          `${geistSans.variable} ${geistMono.variable} antialiased`,
          'min-h-screen'
        )}
      >
        {children}
      </body>
    </html>
  )

  // Permite build/rodar sem Clerk configurado.
  if (!hasClerkKey) return AppShell

  return (
    <ClerkProvider localization={ptBR} afterSignOutUrl="/">
      {AppShell}
    </ClerkProvider>
  )
}
