import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

type RankingProfileProps = {
  user?: { id: string; name: string; score: number; bio?: string | null } | null
}

export function RankingProfile({ user }: RankingProfileProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
      </CardHeader>
      <CardContent>
        {!user ? (
          <p className="text-sm text-muted-foreground">
            Selecione um usuário no ranking.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="text-base font-semibold">{user.name}</div>
            <div className="text-sm text-muted-foreground">
              Score: {user.score}
            </div>
            {user.bio ? <p className="text-sm">{user.bio}</p> : null}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
