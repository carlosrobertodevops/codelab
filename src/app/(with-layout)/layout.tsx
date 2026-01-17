'use client'

import { AppSidebar } from '@/components/shared/app-sidebar'
import { SearchInput } from '@/components/shared/search-input'
import { Button } from '@/components/ui/button'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { useUser } from '@clerk/nextjs'
import { LogIn } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ReactNode, Suspense } from 'react'

type LayoutProps = {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useUser()
  const pathname = usePathname()

  const isHomePage = pathname === '/'
  const isCoursePage = /^\/courses\/(?!details\/).+/.test(pathname)

  return (
    <SidebarProvider
      defaultOpen
      // ESSENCIAL: isso controla o sidebar-gap (retângulo vermelho)
      style={
        {
          // largura aberta: ajustada para “Configurações” + padding simétrico
          '--sidebar-width': '10.50rem',
          // largura colapsada (ícones): manter compacto e alinhado
          '--sidebar-width-icon': '3.50rem',
        } as React.CSSProperties
      }
    >
      <AppSidebar />

      <SidebarInset className="ml-0 pl-0">
        <header
          className={cn(
            'flex h-[70px] shrink-0 border-b items-center px-6 justify-between gap-2'
          )}
        >
          <div className="flex-1 flex items-center gap-4">
            {/* Agora ficará colado na sidebar tanto aberta quanto fechada */}
            <SidebarTrigger className="flex -ml-1" />

            {isHomePage && (
              <Suspense>
                <SearchInput />
              </Suspense>
            )}
          </div>

          {!user && (
            <Link href="/auth/sign-in">
              <Button size="sm">
                <LogIn />
                Entrar
              </Button>
            </Link>
          )}
        </header>

        <div
          className={cn(
            'flex flex-1 flex-col gap-6 p-6 overflow-auto',
            isCoursePage && 'p-0'
          )}
        >
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
