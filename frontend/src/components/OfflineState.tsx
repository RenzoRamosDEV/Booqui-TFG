import { WifiOff } from 'lucide-react'
import { Button } from './ui/Button'
import { EmptyState } from './ui/EmptyState'

export function OfflineState({ onRetry }: { onRetry: () => void }) {
  return (
    <EmptyState
      icon={WifiOff}
      title="Sin conexión"
      description="No hemos podido conectar con Booqi. Comprueba tu conexión e inténtalo de nuevo."
      action={<Button onClick={onRetry}>Reintentar</Button>}
    />
  )
}
