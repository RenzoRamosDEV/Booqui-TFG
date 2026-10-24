import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { bookingWith, jazzBooking } from '../../test/fixtures/bookings'
import { ticketPages } from './hooks/ticket-content'
import { renderTicketPdf } from './render-ticket-pdf'

const logoPath = resolve(process.cwd(), 'src/assets/logo_booqi_nuevo.png')
const sourcePath = resolve(process.cwd(), 'src/features/tickets/render-ticket-pdf.ts')
const logo = new Uint8Array(readFileSync(logoPath))
// 1×1 transparent PNG: the QR content is checked in qr.test.ts, here only the layout matters.
const tinyPng =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

async function pagesOf(blob: Blob) {
  const pdf = await PDFDocument.load(new Uint8Array(await blob.arrayBuffer()))
  return pdf.getPageCount()
}

describe('renderTicketPdf', () => {
  const deps = { loadLogo: async () => logo, qrImage: async () => tinyPng }

  it('renders one PDF page per ticket', async () => {
    const blob = await renderTicketPdf(ticketPages([jazzBooking]), deps)

    expect(blob.type).toBe('application/pdf')
    expect(await pagesOf(blob)).toBe(3)
  })

  it('renders the tickets of several bookings in one file', async () => {
    const pages = ticketPages([
      bookingWith({ id: 42, ticketQuantity: 2 }),
      bookingWith({ id: 43, ticketQuantity: 1 }),
    ])

    expect(await pagesOf(await renderTicketPdf(pages, deps))).toBe(3)
  })

  it('asks for one QR per booking, encoding only its id', async () => {
    const qrImage = vi.fn(async () => tinyPng)
    const pages = ticketPages([
      bookingWith({ id: 42, ticketQuantity: 2 }),
      bookingWith({ id: 43, ticketQuantity: 1 }),
    ])

    await renderTicketPdf(pages, { ...deps, qrImage })

    expect(qrImage.mock.calls).toEqual([['42'], ['43']])
  })

  it('survives characters the PDF font cannot encode', async () => {
    const pages = ticketPages([
      bookingWith({ eventTitle: 'Fiesta 🎉 en Málaga', ticketQuantity: 1 }),
    ])

    expect(await pagesOf(await renderTicketPdf(pages, deps))).toBe(1)
  })

  it('bundles the logo through a Vite asset import, never a /src path', () => {
    const source = readFileSync(sourcePath, 'utf8')

    expect(source).toMatch(/import logoUrl from '\.\.\/\.\.\/assets\/logo_booqi_nuevo\.png'/)
    expect(source).not.toContain('/src/')
  })
})
