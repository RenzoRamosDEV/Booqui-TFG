export type QrGenerator = (text: string) => Promise<string>

async function generateWithQrcode(text: string): Promise<string> {
  const QRCode = await import('qrcode')
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 320,
    color: { dark: '#2e1065', light: '#ffffff' },
  })
}

/** QR of the booking id only: no backend can verify it, it just identifies the booking. */
export function qrDataUrl(bookingId: number, generate: QrGenerator = generateWithQrcode) {
  return generate(String(bookingId))
}
