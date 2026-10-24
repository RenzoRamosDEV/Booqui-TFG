import { TriangleAlert } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ButtonLink } from '../../components/ui/ButtonLink'
import { EmptyState } from '../../components/ui/EmptyState'
import { PageMeta } from '../PageMeta'

export function RouteErrorPage() {
  return (
    <>
      <PageMeta
        title="Algo ha salido mal"
        description="Ha ocurrido un error inesperado al mostrar esta página."
      />
      <EmptyState
        icon={TriangleAlert}
        title="Algo ha salido mal"
        description="Ha ocurrido un error inesperado al mostrar esta página. Prueba a recargarla o vuelve al inicio."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={() => window.location.reload()}>Recargar</Button>
            <ButtonLink to="/" variant="secondary">
              Volver al inicio
            </ButtonLink>
          </div>
        }
      />
    </>
  )
}
