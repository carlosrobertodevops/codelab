export const dynamic = 'force-dynamic'
export const revalidate = 0

import { Skeleton } from '@/components/ui/skeleton'

export default function LoadingPage() {
  return <Skeleton className="w-full flex-1" />
}
