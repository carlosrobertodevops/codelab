'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getPurchasedCourses } from '@/actions/courses'
import { Separator } from '@/components/ui/separator'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { queryKeys } from '@/constants/query-keys'
import { cn } from '@/lib/utils'
import { useUser } from '@clerk/nextjs'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  BookUp2,
  ChartArea,
  MessageCircle,
  SquareDashedBottomCode,
  Trophy,
  Users,
  GraduationCap,
  Home,
  Crown,
} from 'lucide-react'

type NavItem = {
  title: string
  href: string
  icon: React.ElementType
}

export const NavItems = () => {
  const pathname = usePathname()
  const { user } = useUser()

  const isAdmin = user?.publicMetadata?.role === 'admin'

  const { data: purchasedCourses } = useQuery({
    queryKey: queryKeys.purchasedCourses,
    queryFn: () => getPurchasedCourses(),
  })

  // =========================
  // Área "normal"
  // =========================
  const navItems: NavItem[] = [
    { title: 'Início', href: '/', icon: Home },
    { title: 'Cursos', href: '/courses', icon: BookOpen },

    // mantém a regra do original: só mostra "Meus Cursos" se houver compra
    ...(purchasedCourses?.length
      ? [{ title: 'Meus Cursos', href: '/my-courses', icon: GraduationCap }]
      : []),

    { title: 'Ranking', href: '/ranking', icon: Crown },
  ]

  // =========================
  // Área Admin
  // =========================
  const adminNavItems: NavItem[] = [
    { title: 'Estatísticas', href: '/admin', icon: ChartArea },
    {
      title: 'Cursos',
      href: '/admin/courses',
      icon: SquareDashedBottomCode,
    },
    { title: 'Usuários', href: '/admin/users', icon: Users },
    {
      title: 'Comentários',
      href: '/admin/comments',
      icon: MessageCircle,
    },
  ]

  const renderNavItems = (items: NavItem[]) =>
    items.map((item) => {
      const Icon = item.icon

      // ativa também para sub-rotas (ex: /admin/courses/123)
      const isActive =
        pathname === item.href ||
        (item.href !== '/' &&
          item.href !== '/admin' &&
          pathname.startsWith(item.href))

      return (
        <SidebarMenuItem key={item.href}>
          <SidebarMenuButton
            asChild
            tooltip={item.title}
            className={cn(
              'w-full justify-start px-3',
              isActive && 'bg-muted text-primary font-medium'
            )}
          >
            <Link href={item.href} className="flex items-baseline gap-4">
              <Icon
                className={cn(
                  'size-5 shrink-0',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />

              <span
                className={cn(
                  'truncate group-data-[state=collapsed]:hidden',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {item.title}
              </span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    })

  return (
    <SidebarGroup>
      <SidebarMenu>
        {renderNavItems(navItems)}

        {isAdmin && (
          <>
            <Separator className="my-2" />
            {renderNavItems(adminNavItems)}
          </>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
