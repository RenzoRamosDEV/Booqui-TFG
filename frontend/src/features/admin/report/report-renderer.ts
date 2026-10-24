import { createContext } from 'react'
import type { ReportModel } from '../hooks/report-model'

export type ReportRenderer = (model: ReportModel) => Promise<Blob>

const renderOnDemand: ReportRenderer = async (model) => {
  const { renderReportPdf } = await import('./render-report-pdf')
  return renderReportPdf(model)
}

/** Lets screen tests swap the pdf-lib renderer for a fake; the app always uses the lazy one. */
export const ReportRendererContext = createContext<ReportRenderer>(renderOnDemand)
