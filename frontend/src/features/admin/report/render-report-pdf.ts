import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib'
import { pdfSafe } from '../../../lib/pdf-text'
import type { ReportModel } from '../hooks/report-model'

const PAGE = { width: 841.89, height: 595.28 }
const MARGIN = 36
const ROW_HEIGHT = 20
const COLUMN_WIDTHS = [64, 130, 170, 52, 72, 110, 70, 102]
const brand = rgb(0.427, 0.157, 0.851)
const ink = rgb(0.09, 0.08, 0.12)
const muted = rgb(0.42, 0.4, 0.47)
const zebra = rgb(0.965, 0.953, 0.996)

type Fonts = { regular: PDFFont; bold: PDFFont }

function fit(text: string, font: PDFFont, size: number, width: number): string {
  const safe = pdfSafe(text)
  if (font.widthOfTextAtSize(safe, size) <= width) return safe
  let cut = safe
  while (cut.length > 1 && font.widthOfTextAtSize(`${cut}…`, size) > width) cut = cut.slice(0, -1)
  return `${cut}…`
}

function drawRow(page: PDFPage, cells: string[], y: number, font: PDFFont, color = ink) {
  let x = MARGIN
  cells.forEach((cell, index) => {
    const width = COLUMN_WIDTHS[index] ?? 80
    page.drawText(fit(cell, font, 9, width - 8), { x: x + 4, y, size: 9, font, color })
    x += width
  })
}

function drawHeader(page: PDFPage, model: ReportModel, fonts: Fonts, first: boolean): number {
  const top = PAGE.height - MARGIN
  page.drawRectangle({ x: 0, y: PAGE.height - 8, width: PAGE.width, height: 8, color: brand })
  page.drawText('Booqi', { x: MARGIN, y: top - 14, size: 14, font: fonts.bold, color: brand })
  page.drawText(fit(model.title, fonts.bold, 18, 600), {
    x: MARGIN,
    y: top - 40,
    size: 18,
    font: fonts.bold,
    color: ink,
  })
  let y = top - 58
  if (first) {
    for (const line of [model.subtitle, model.generatedAt, model.exportedBy]) {
      page.drawText(pdfSafe(line), { x: MARGIN, y, size: 10, font: fonts.regular, color: muted })
      y -= 14
    }
  }
  y -= 10
  page.drawRectangle({
    x: MARGIN,
    y: y - 6,
    width: PAGE.width - MARGIN * 2,
    height: ROW_HEIGHT,
    color: brand,
  })
  drawRow(page, model.columns, y, fonts.bold, rgb(1, 1, 1))
  return y - ROW_HEIGHT
}

export async function renderReportPdf(model: ReportModel): Promise<Blob> {
  const pdf = await PDFDocument.create()
  pdf.setTitle(pdfSafe(model.title))
  pdf.setCreator('Booqi')
  const fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  }
  let page = pdf.addPage([PAGE.width, PAGE.height])
  let y = drawHeader(page, model, fonts, true)
  model.rows.forEach((row, index) => {
    if (y < MARGIN + ROW_HEIGHT * 2) {
      page = pdf.addPage([PAGE.width, PAGE.height])
      y = drawHeader(page, model, fonts, false)
    }
    if (index % 2 === 1) {
      page.drawRectangle({
        x: MARGIN,
        y: y - 6,
        width: PAGE.width - MARGIN * 2,
        height: ROW_HEIGHT,
        color: zebra,
      })
    }
    drawRow(page, row, y, fonts.regular)
    y -= ROW_HEIGHT
  })
  if (y < MARGIN + 70) {
    page = pdf.addPage([PAGE.width, PAGE.height])
    y = PAGE.height - MARGIN - 20
  }
  y -= 16
  page.drawText('Totales', { x: MARGIN, y, size: 12, font: fonts.bold, color: ink })
  for (const [label, amount] of model.totals) {
    y -= 16
    page.drawText(pdfSafe(`${label}: ${amount}`), {
      x: MARGIN,
      y,
      size: 10,
      font: fonts.regular,
      color: ink,
    })
  }
  pdf.getPages().forEach((current, index, all) => {
    current.drawText(`Página ${index + 1} de ${all.length}`, {
      x: PAGE.width - MARGIN - 80,
      y: 18,
      size: 8,
      font: fonts.regular,
      color: muted,
    })
  })
  const bytes = await pdf.save()
  return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' })
}
