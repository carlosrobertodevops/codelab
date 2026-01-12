import { getAdminUsers } from '@/actions/user'
import { UsersTable } from '@/components/pages/admin/users-table'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const { users } = await getAdminUsers()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Usuários</h1>
        <p className="text-muted-foreground">
          Gerencie usuários e permissões do sistema
        </p>
      </div>

      <UsersTable users={users} />
    </div>
  )
}
