// import { Sidebar, SidebarHeader } from '@/components/ui/sidebar'
// import Link from 'next/link'
// import Image from 'next/image'
// import { SidebarNav } from '@/components/shared/app-sidebar/nav'

// export const AppSidebar = () => {
//   return (
//     <Sidebar>
//       <SidebarHeader className="py-4">
//         <Link href="/">
//           {/* NOTE: SVGs como componentes quebram no Turbopack/Next sem SVGR.
//               Usamos arquivos em /public para evitar loader custom. */}
//           <Image
//             src="/logo.svg"
//             alt="Codelab"
//             width={519}
//             height={79}
//             className="w-full max-w-[150px] mx-auto pt-3 sm:hidden group-data-[state=expanded]:block"
//             priority
//           />
//           <Image
//             src="/logo-icon.svg"
//             alt="Codelab"
//             width={94}
//             height={79}
//             className="w-full max-w-[20px] mx-auto pt-3 hidden group-data-[state=collapsed]:block"
//             priority
//           />
//         </Link>
//       </SidebarHeader>
//       <SidebarNav />
//     </Sidebar>
//   )
// }

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar'
import Link from 'next/link'
import Image from 'next/image'
import { NavItems } from './nav-items'
import { NavUser } from './nav-user'

export const AppSidebar = () => {
  return (
    <Sidebar>
      <SidebarHeader className="py-4">
        <Link href="/">
          {/* NOTE: SVGs como componentes quebram no Turbopack/Next sem SVGR.
              Usamos arquivos em /public para evitar loader custom. */}
          <Image
            src="/logo.svg"
            alt="Codelab"
            width={519}
            height={79}
            className="w-full max-w-[150px] mx-auto pt-3 sm:hidden group-data-[state=expanded]:block"
            priority
          />
          <Image
            src="/logo-icon.svg"
            alt="Codelab"
            width={94}
            height={79}
            className="w-full max-w-[20px] mx-auto pt-3 hidden group-data-[state=collapsed]:block"
            priority
          />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <NavItems />
      </SidebarContent>

      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
