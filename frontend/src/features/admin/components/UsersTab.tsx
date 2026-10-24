import { Trash2 } from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '../../../components/ConfirmDialog'
import { QueryState } from '../../../components/QueryState'
import { Avatar } from '../../../components/ui/Avatar'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../components/ui/use-toast'
import { toApiError } from '../../../lib/api-error'
import { userMessage } from '../../../lib/error-messages'
import type { UserResponse } from '../../../types/user'
import { useDeleteUser } from '../hooks/use-admin-mutations'
import { useUsers } from '../hooks/use-admin-queries'
import { cellClass, headCellClass, tableClass, tableFrameClass } from './table-styles'

const fullName = (user: UserResponse) => `${user.firstName} ${user.lastName}`

export function UsersTab({ currentUserId }: { currentUserId: number }) {
  const users = useUsers()
  const remove = useDeleteUser()
  const toast = useToast()
  const [pending, setPending] = useState<UserResponse | null>(null)

  function confirmDelete() {
    if (!pending) return
    remove.mutate(pending.id, {
      onSuccess: () =>
        toast.show({ tone: 'success', title: 'Usuario eliminado', description: fullName(pending) }),
      onError: (error) => toast.show({ tone: 'danger', title: userMessage(toApiError(error)) }),
      onSettled: () => setPending(null),
    })
  }

  return (
    <>
      <QueryState
        query={users}
        label="Cargando usuarios"
        skeleton={<Skeleton className="h-64 w-full" />}
      >
        {(list) => (
          <div className={tableFrameClass}>
            <table aria-label="Usuarios" className={tableClass}>
              <thead>
                <tr>
                  <th className={headCellClass}>Nombre</th>
                  <th className={headCellClass}>Email</th>
                  <th className={headCellClass}>Rol</th>
                  <th className={headCellClass}>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {list.map((user) => (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-brand-50/50 dark:hover:bg-white/[0.03]"
                  >
                    <td className={cellClass}>
                      <span className="flex items-center gap-3">
                        <Avatar name={fullName(user)} className="size-8" />
                        <span className="font-medium">{fullName(user)}</span>
                      </span>
                    </td>
                    <td className={`${cellClass} text-fg-muted`}>{user.contactEmail}</td>
                    <td className={cellClass}>
                      <Badge tone={user.role === 'ADMIN' ? 'brand' : 'neutral'}>
                        {user.role === 'ADMIN' ? 'Administrador' : 'Cliente'}
                      </Badge>
                    </td>
                    <td className={`${cellClass} text-right`}>
                      {user.id !== currentUserId && (
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={`Eliminar a ${fullName(user)}`}
                          onClick={() => setPending(user)}
                          className="text-danger hover:bg-danger/10 dark:hover:bg-danger/10"
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </QueryState>
      <ConfirmDialog
        open={pending !== null}
        title="¿Eliminar usuario?"
        description={
          pending
            ? `Se eliminará la cuenta de ${fullName(pending)}. Sus reservas y pagos no se borran.`
            : ''
        }
        confirmLabel="Eliminar"
        busy={remove.isPending}
        onConfirm={confirmDelete}
        onClose={() => setPending(null)}
      />
    </>
  )
}
