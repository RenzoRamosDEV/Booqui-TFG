import { OfflineState } from '../../components/OfflineState'
import { PageMeta } from '../PageMeta'

export function OfflinePage({ onRetry }: { onRetry: () => void }) {
  return (
    <>
      <PageMeta title="Sin conexión" description="Booqi necesita conexión a internet." />
      <OfflineState onRetry={onRetry} />
    </>
  )
}
