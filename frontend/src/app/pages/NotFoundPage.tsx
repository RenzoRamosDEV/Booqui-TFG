import { Compass } from 'lucide-react'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageMeta } from '../PageMeta'

export function NotFoundPage() {
  return (
    <>
      <PageMeta
        title="Página no encontrada"
        description="La página que buscas no existe o no tienes acceso a ella."
      />
      <EmptyState
        icon={Compass}
        title="Página no encontrada"
        description="La página que buscas no existe o no tienes acceso a ella."
        action={<ButtonLink to="/">Volver al inicio</ButtonLink>}
      />
    </>
  )
}
