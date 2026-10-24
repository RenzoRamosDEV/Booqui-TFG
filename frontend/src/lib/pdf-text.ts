/** Standard PDF fonts only cover WinAnsi; anything else (emoji, CJK, control characters) becomes "?". */
export function pdfSafe(text: string): string {
  return text.normalize('NFC').replace(/[^\x20-\x7E\xA0-\xFF€—–…“”‘’•]/gu, '?')
}
