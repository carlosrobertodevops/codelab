import { cn } from '@/lib/utils'
import Link from 'next/link'
import Image from 'next/image'
import { ReactNode } from 'react'

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-2">
      <Link href="/" className="block w-full max-w-[200px]">
        <Image
          src="/logo.svg"
          alt="Codelab"
          width={519}
          height={79}
          className="w-full h-auto"
          priority
        />
      </Link>
      <div
        className={cn(
          'w-full max-w-[400px]',
          'bg-background border border-border rounded-xl shadow-md px-5 py-7'
        )}
      >
        {children}
      </div>
    </div>
  )
}

export default AuthLayout
