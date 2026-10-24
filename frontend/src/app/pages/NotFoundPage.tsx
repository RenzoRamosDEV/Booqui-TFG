import { Compass } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '../../components/ui/EmptyState'
import { focusRing } from '../../components/ui/Button'
import { cn } from '../../lib/cn'

export function NotFoundPage() {
  return (
    <EmptyState
      icon={Compass}
      title="Página no encontrada"
      description="La página que buscas no existe o no tienes acceso a ella."
      action={
        <Link
          to="/"
          className={cn(
            'inline-flex h-11 items-center rounded-md bg-gradient-brand px-5 text-sm font-semibold text-primary-fg shadow-md dark:bg-none dark:bg-primary',
            focusRing,
          )}
        >
          Volver al inicio
        </Link>
      }
    />
  )
}
