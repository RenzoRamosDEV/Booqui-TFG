;(function () {
  'use strict'

  var THEME_KEY = 'booqi-theme'

  function storeTheme(theme) {
    try {
      localStorage.setItem(THEME_KEY, theme)
    } catch (e) {}
  }

  function currentTheme() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  }

  function applyTheme(theme) {
    var root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
  }

  function initThemeToggle() {
    var button = document.querySelector('[data-theme-toggle]')
    if (!button) return

    function sync() {
      var dark = currentTheme() === 'dark'
      button.setAttribute('aria-pressed', String(dark))
      button.setAttribute('aria-label', dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro')
    }

    button.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      storeTheme(next)
      sync()
    })
    sync()
  }

  initThemeToggle()
})()
