import { useContext, useState } from 'react'
import { useToast } from '../../../components/ui/use-toast'
import { downloadBlob } from '../../../lib/download'
import { reportModel, type ReportModel, type ReportScope } from '../hooks/report-model'
import type { SalesRow } from '../hooks/sales'
import { ReportRendererContext } from '../report/report-renderer'

export type ReportPreview = { url: string; blob: Blob; model: ReportModel }

export function useReportExport(adminName: string) {
  const render = useContext(ReportRendererContext)
  const toast = useToast()
  const [preview, setPreview] = useState<ReportPreview | null>(null)
  const [busy, setBusy] = useState(false)

  async function build(rows: SalesRow[], scope: ReportScope) {
    const model = reportModel(rows, scope, adminName, new Date())
    if (!model) {
      toast.show({
        tone: 'warning',
        title: 'No hay ventas que exportar',
        description: 'Cambia los filtros o elige otro evento.',
      })
      return null
    }
    setBusy(true)
    try {
      return { model, blob: await render(model) }
    } catch {
      toast.show({ tone: 'danger', title: 'No se pudo generar el informe' })
      return null
    } finally {
      setBusy(false)
    }
  }

  return {
    busy,
    preview,
    async showPreview(rows: SalesRow[], scope: ReportScope) {
      const report = await build(rows, scope)
      if (report) setPreview({ ...report, url: URL.createObjectURL(report.blob) })
    },
    async download(rows: SalesRow[], scope: ReportScope) {
      const report = await build(rows, scope)
      if (report) downloadBlob(report.blob, report.model.fileName)
    },
    closePreview() {
      if (preview) URL.revokeObjectURL(preview.url)
      setPreview(null)
    },
  }
}
