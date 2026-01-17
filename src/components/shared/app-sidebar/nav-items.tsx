'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { BookOpen, GraduationCap, Home, Crown } from 'lucide-react'

const items = [
  { title: 'Início', href: '/', icon: Home },
  { title: 'Cursos', href: '/courses', icon: BookOpen },
  { title: 'Meus Cursos', href: '/my-courses', icon: GraduationCap },
  { title: 'Ranking', href: '/ranking', icon: Crown },
]

export const NavItems = () => {
  const pathname = usePathname()

  return (
    <SidebarMenu>
      {items.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href

        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              tooltip={item.title}
              className={cn(
                // padding simétrico e largura “justa” visualmente
                'w-full justify-start px-3',
                isActive && 'bg-muted text-primary font-medium'
              )}
            >
              <Link href={item.href} className="flex items-baseline gap-4">
                <Icon className="size-5 shrink-0" />

                {/* Quando colapsado, some o texto */}
                <span className="truncate group-data-[state=collapsed]:hidden">
                  {item.title}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
