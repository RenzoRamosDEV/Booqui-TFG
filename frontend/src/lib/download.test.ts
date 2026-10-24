import { downloadBlob } from './download'

describe('downloadBlob', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    URL.createObjectURL = vi.fn(() => 'blob:booqi/1')
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('clicks a temporary download link for the blob and revokes its URL', () => {
    const clicked: Array<{ href: string; download: string; attached: boolean }> = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push({ href: this.href, download: this.download, attached: this.isConnected })
    })
    const blob = new Blob(['%PDF'], { type: 'application/pdf' })

    downloadBlob(blob, 'booqi-jazz-42.pdf')

    expect(URL.createObjectURL).toHaveBeenCalledWith(blob)
    expect(clicked).toEqual([
      { href: 'blob:booqi/1', download: 'booqi-jazz-42.pdf', attached: true },
    ])
    expect(document.querySelector('a[download]')).toBeNull()
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()

    vi.runAllTimers()

    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:booqi/1')
  })
})
