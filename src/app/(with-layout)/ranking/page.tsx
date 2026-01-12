import { getRanking } from '@/actions/ranking'
import { RankingList } from '@/components/pages/ranking/ranking-list'
import { RankingProfile } from '@/components/pages/ranking/ranking-profile'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { getUser } from '@/lib/auth'
import { Medal } from 'lucide-react'

// Depends on DB access, so render at runtime (avoids `next build` failures in Docker).
export const dynamic = 'force-dynamic'

export default async function RankingPage() {
  await getUser()

  const ranking = await getRanking()

  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-10 h-full">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Medal className="text-yellow-500" size={24} />
          Ranking
        </h2>
        <p className="text-muted-foreground mt-1">
          Veja os melhores alunos e suas pontuações
        </p>

        <Separator className="my-6" />

        <ScrollArea className="h-[calc(100vh-250px)]">
          <RankingList ranking={ranking} />
        </ScrollArea>
      </div>

      <RankingProfile />
    </section>
  )
}
