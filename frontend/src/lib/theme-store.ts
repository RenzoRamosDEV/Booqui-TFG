import { create } from 'zustand'
import { THEME_STORAGE_KEY, applyTheme, currentTheme, type Theme } from './theme'

type ThemeState = {
  theme: Theme
  toggle: () => void
}

function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Private mode or a full quota must not block switching the theme for this visit.
  }
}

export const useThemeStore = create<ThemeState>()((set, get) => ({
  theme: currentTheme(),
  toggle: () => {
    const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
    storeTheme(next)
    applyTheme(next)
    set({ theme: next })
  },
}))
