import { ScrollArea } from '@/components/ui/scroll-area'

type RankingListProps = {
  users: Array<{ id: string; name: string; score: number }>
  selectedUserId?: string | null
  onSelect?: (userId: string) => void
}

export function RankingList({
  users,
  selectedUserId,
  onSelect,
}: RankingListProps) {
  return (
    <ScrollArea className="h-[520px] rounded-md border p-2">
      <div className="space-y-2">
        {users.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => onSelect?.(u.id)}
            className={[
              'w-full rounded-md border px-3 py-2 text-left',
              selectedUserId === u.id ? 'bg-muted' : 'bg-background',
            ].join(' ')}
          >
            <div className="font-medium">{u.name}</div>
            <div className="text-sm text-muted-foreground">
              Score: {u.score}
            </div>
          </button>
        ))}
      </div>
    </ScrollArea>
  )
}
