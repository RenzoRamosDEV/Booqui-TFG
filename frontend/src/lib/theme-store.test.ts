import { useThemeStore } from './theme-store'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ''
  useThemeStore.setState({ theme: 'light' })
})

describe('useThemeStore', () => {
  it('toggles light to dark, storing the choice and applying the class', () => {
    useThemeStore.getState().toggle()

    expect(useThemeStore.getState().theme).toBe('dark')
    expect(localStorage.getItem('booqi-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('toggles dark back to light', () => {
    useThemeStore.setState({ theme: 'dark' })
    document.documentElement.classList.add('dark')

    useThemeStore.getState().toggle()

    expect(useThemeStore.getState().theme).toBe('light')
    expect(localStorage.getItem('booqi-theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('still switches the theme when storage rejects writes', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })

    useThemeStore.getState().toggle()

    expect(useThemeStore.getState().theme).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})
