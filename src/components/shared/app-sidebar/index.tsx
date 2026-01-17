import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar'
import Link from 'next/link'
import Image from 'next/image'
import { NavItems } from './nav-items'
import { NavUser } from './nav-user'

export const AppSidebar = () => {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex items-center justify-center py-3">
        <Link href="/" className="flex items-center justify-center w-full">
          {/* Logo expandido (controlado para não ficar gigante) */}
          <Image
            src="/logo.svg"
            alt="CRPHD"
            width={92}
            height={24}
            className="
              h-7 w-auto max-w-[92px] object-contain
              transition-all
              group-data-[state=collapsed]:hidden
            "
            priority
          />

          {/* Logo colapsado */}
          <Image
            src="/logo-icon.svg"
            alt="CRPHD"
            width={24}
            height={24}
            className="
              hidden
              h-6 w-6 object-contain
              group-data-[state=collapsed]:block
            "
            priority
          />
        </Link>
      </SidebarHeader>

      {/* Padding simétrico (esq = dir) */}
      <SidebarContent className="px-3 py-2">
        <NavItems />
      </SidebarContent>

      <SidebarFooter className="px-3 pb-3">
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
