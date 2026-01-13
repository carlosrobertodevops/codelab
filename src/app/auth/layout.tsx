export const dynamic = 'force-dynamic'
export const revalidate = 0

import { cn } from '@/lib/utils'
import Link from 'next/link'
import Logo from '@/assets/logo.svg'
import { ReactNode } from 'react'

type AuthLayoutProps = {
  children: ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main
      className={cn(
        'flex flex-col items-center justify-center gap-10 w-full h-screen',
        'min-h-max px-6 py-10'
      )}
    >
      <Link href="/" className="block w-full max-w-[200px]">
        <Logo />
      </Link>

      {children}
    </main>
  )
}
