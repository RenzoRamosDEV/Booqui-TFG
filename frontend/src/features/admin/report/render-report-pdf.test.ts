import { PDFDocument } from 'pdf-lib'
import { bookingWith } from '../../../test/fixtures/bookings'
import { paymentWith } from '../../../test/fixtures/payments'
import { reportModel } from '../hooks/report-model'
import { buildSalesRows } from '../hooks/sales'
import { renderReportPdf } from './render-report-pdf'

async function pageCount(blob: Blob) {
  return (await PDFDocument.load(new Uint8Array(await blob.arrayBuffer()))).getPageCount()
}

function model(payments: number) {
  const rows = buildSalesRows(
    Array.from({ length: payments }, (_, index) => paymentWith({ id: index + 1, bookingId: 42 })),
    [bookingWith({ id: 42, eventTitle: 'Fiesta 🎉 en Málaga' })],
  )
  return reportModel(
    rows,
    { kind: 'event', eventTitle: 'Fiesta en Málaga' },
    'Mel García',
    new Date(),
  )!
}

describe('renderReportPdf', () => {
  it('renders a loadable PDF', async () => {
    const blob = await renderReportPdf(model(3))

    expect(blob.type).toBe('application/pdf')
    expect(await pageCount(blob)).toBe(1)
  })

  it('continues on new pages when the rows do not fit', async () => {
    expect(await pageCount(await renderReportPdf(model(80)))).toBeGreaterThan(1)
  })
})
