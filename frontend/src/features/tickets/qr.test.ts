import { qrDataUrl } from './qr'

describe('qrDataUrl', () => {
  it('returns a PNG data URL', async () => {
    expect(await qrDataUrl(42)).toMatch(/^data:image\/png;base64,/)
  })

  it('encodes only the booking id as decimal text', async () => {
    const generate = vi.fn(async (text: string) => `data:image/png;base64,${text}`)

    await qrDataUrl(42, generate)

    expect(generate).toHaveBeenCalledWith('42')
  })

  it('produces different images for different ids', async () => {
    expect(await qrDataUrl(42)).not.toBe(await qrDataUrl(43))
  })
})
