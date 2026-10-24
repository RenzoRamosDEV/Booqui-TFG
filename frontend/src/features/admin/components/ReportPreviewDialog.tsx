import { Download } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Dialog } from '../../../components/ui/Dialog'
import { downloadBlob } from '../../../lib/download'
import type { ReportPreview } from './use-report-export'

export function ReportPreviewDialog({
  preview,
  onClose,
}: {
  preview: ReportPreview | null
  onClose: () => void
}) {
  return (
    <Dialog
      open={preview !== null}
      onClose={onClose}
      title="Vista previa del informe"
      description={preview?.model.title}
      className="max-w-4xl"
      footer={
        preview && (
          <Button onClick={() => downloadBlob(preview.blob, preview.model.fileName)}>
            <Download aria-hidden="true" className="size-4" />
            Descargar
          </Button>
        )
      }
    >
      {preview && (
        <iframe
          title="Vista previa del informe"
          src={preview.url}
          className="h-[65dvh] w-full rounded-md border border-border bg-white"
        />
      )}
    </Dialog>
  )
}
