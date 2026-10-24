import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib'
import logoUrl from '../../assets/logo_booqi_nuevo.png'
import type { TicketPage } from './hooks/ticket-content'
import { qrDataUrl } from './qr'

export type TicketPdfDeps = {
  loadLogo?: () => Promise<Uint8Array>
  qrImage?: (text: string) => Promise<string>
}

const PAGE = { width: 595.28, height: 419.53 }
const BAND = 78
const MARGIN = 36
const STUB_X = 392
const brand = rgb(0.427, 0.157, 0.851)
const brandDark = rgb(0.18, 0.063, 0.396)
const ink = rgb(0.09, 0.08, 0.12)
const muted = rgb(0.42, 0.4, 0.47)

async function fetchLogo(): Promise<Uint8Array> {
  const response = await fetch(logoUrl)
  if (!response.ok) throw new Error(`Logo not available (${response.status})`)
  return new Uint8Array(await response.arrayBuffer())
}

/** Standard PDF fonts only cover WinAnsi; anything else (emoji, CJK…) becomes "?". */
function printable(text: string): string {
  return text.normalize('NFC').replace(/[^\x20-\x7E\xA0-\xFF€]/g, '?')
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of printable(text).split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word
    if (line && font.widthOfTextAtSize(candidate, size) > maxWidth) {
      lines.push(line)
      line = word
    } else {
      line = candidate
    }
  }
  return line ? [...lines, line] : lines
}

function clampLines(lines: string[], max: number): string[] {
  if (lines.length <= max) return lines
  return [...lines.slice(0, max - 1), `${lines[max - 1]}…`]
}

type Fonts = { regular: PDFFont; bold: PDFFont }

function drawTicket(page: PDFPage, ticket: TicketPage, fonts: Fonts, logo: PDFImage, qr: PDFImage) {
  const { width, height } = PAGE
  page.drawRectangle({ x: 0, y: height - BAND, width, height: BAND, color: brand })
  page.drawRectangle({ x: 0, y: height - BAND - 4, width, height: 4, color: brandDark })
  page.drawRectangle({ x: MARGIN, y: height - 62, width: 46, height: 46, color: rgb(1, 1, 1) })
  page.drawImage(logo, { x: MARGIN + 5, y: height - 57, width: 36, height: 36 })
  page.drawText('Booqi', {
    x: MARGIN + 58,
    y: height - 46,
    size: 22,
    font: fonts.bold,
    color: rgb(1, 1, 1),
  })
  page.drawText('ENTRADA', {
    x: width - MARGIN - fonts.bold.widthOfTextAtSize('ENTRADA', 10),
    y: height - 34,
    size: 10,
    font: fonts.bold,
    color: rgb(0.92, 0.88, 1),
  })
  const label = printable(ticket.ticketLabel)
  page.drawText(label, {
    x: width - MARGIN - fonts.bold.widthOfTextAtSize(label, 18),
    y: height - 56,
    size: 18,
    font: fonts.bold,
    color: rgb(1, 1, 1),
  })

  let y = height - BAND - 44
  for (const line of clampLines(wrap(ticket.eventTitle, fonts.bold, 22, STUB_X - MARGIN - 20), 2)) {
    page.drawText(line, { x: MARGIN, y, size: 22, font: fonts.bold, color: ink })
    y -= 28
  }
  for (const line of [ticket.eventDate, ticket.eventLocation]) {
    page.drawText(printable(line), { x: MARGIN, y, size: 12, font: fonts.regular, color: muted })
    y -= 18
  }

  const detail = (title: string, value: string, x: number, top: number, size = 14) => {
    page.drawText(title.toUpperCase(), { x, y: top, size: 8, font: fonts.bold, color: muted })
    page.drawText(printable(value), { x, y: top - size - 4, size, font: fonts.bold, color: ink })
  }
  detail('Titular', ticket.buyerName, MARGIN, 150)
  detail('Código de reserva', ticket.code, MARGIN, 96, 24)

  for (let dash = 30; dash < height - BAND - 10; dash += 12) {
    page.drawLine({
      start: { x: STUB_X, y: dash },
      end: { x: STUB_X, y: dash + 6 },
      thickness: 1,
      color: rgb(0.8, 0.78, 0.86),
    })
  }
  const qrSize = 150
  const qrX = STUB_X + (width - STUB_X - qrSize) / 2
  page.drawImage(qr, { x: qrX, y: 110, width: qrSize, height: qrSize })
  const caption = 'Muestra este código en el acceso'
  page.drawText(caption, {
    x: STUB_X + (width - STUB_X - fonts.regular.widthOfTextAtSize(caption, 9)) / 2,
    y: 92,
    size: 9,
    font: fonts.regular,
    color: muted,
  })
  page.drawText('Entrada personal generada por Booqi. El código QR identifica tu reserva.', {
    x: MARGIN,
    y: 24,
    size: 8,
    font: fonts.regular,
    color: muted,
  })
}

export async function renderTicketPdf(
  pages: TicketPage[],
  { loadLogo = fetchLogo, qrImage = (text) => qrDataUrl(Number(text)) }: TicketPdfDeps = {},
): Promise<Blob> {
  const pdf = await PDFDocument.create()
  pdf.setTitle('Entradas Booqi')
  pdf.setCreator('Booqi')
  const fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  }
  const logo = await pdf.embedPng(await loadLogo())
  const qrByCode = new Map<string, PDFImage>()
  for (const ticket of pages) {
    let qr = qrByCode.get(ticket.qrText)
    if (!qr) {
      qr = await pdf.embedPng(await qrImage(ticket.qrText))
      qrByCode.set(ticket.qrText, qr)
    }
    drawTicket(pdf.addPage([PAGE.width, PAGE.height]), ticket, fonts, logo, qr)
  }
  const bytes = await pdf.save()
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
}
