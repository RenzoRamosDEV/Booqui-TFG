import {
  hoverLift,
  listStagger,
  overlayTransition,
  pageTransition,
  pressable,
  toastTransition,
} from './motion'

type Preset = ReturnType<typeof pageTransition>

function animatedKeys(preset: Preset): string[] {
  const keys = new Set<string>()
  for (const state of [preset.initial, preset.animate, preset.exit]) {
    Object.keys(state).forEach((key) => keys.add(key))
  }
  return [...keys].sort()
}

const presets = {
  page: pageTransition,
  dialog: (reduced: boolean) => overlayTransition(reduced, 'center'),
  drawer: (reduced: boolean) => overlayTransition(reduced, 'right'),
  toast: toastTransition,
}

describe('motion presets', () => {
  describe.each(Object.entries(presets))('%s', (_name, preset) => {
    it('with reduced motion animates only opacity within 150 ms', () => {
      const reduced = preset(true)

      expect(animatedKeys(reduced)).toEqual(['opacity'])
      expect(reduced.initial).toEqual({ opacity: 0 })
      expect(reduced.animate).toEqual({ opacity: 1 })
      expect(reduced.exit).toEqual({ opacity: 0 })
      expect(reduced.transition).toEqual({ duration: 0.15 })
    })

    it('without reduced motion fades from 0 to 1 and back', () => {
      const normal = preset(false)

      expect(normal.initial.opacity).toBe(0)
      expect(normal.animate.opacity).toBe(1)
      expect(normal.exit.opacity).toBe(0)
    })
  })

  it('page transition fades combined with a short vertical slide', () => {
    const page = pageTransition(false)

    expect(page.initial).toEqual({ opacity: 0, y: 12 })
    expect(page.animate).toEqual({ opacity: 1, y: 0 })
    expect(page.exit).toEqual({ opacity: 0, y: -8 })
    expect(page.transition).toEqual({ duration: 0.25, ease: [0.22, 1, 0.36, 1] })
  })

  it('dialog scales in with a spring', () => {
    const dialog = overlayTransition(false, 'center')

    expect(dialog.initial).toEqual({ opacity: 0, scale: 0.96, y: 8 })
    expect(dialog.animate).toEqual({ opacity: 1, scale: 1, y: 0 })
    expect(dialog.exit).toEqual({ opacity: 0, scale: 0.96, y: 8 })
    expect(dialog.transition).toEqual({ type: 'spring', stiffness: 380, damping: 32 })
  })

  it('drawer slides in from the right with a spring', () => {
    const drawer = overlayTransition(false, 'right')

    expect(drawer.initial).toEqual({ opacity: 0, x: '100%' })
    expect(drawer.animate).toEqual({ opacity: 1, x: 0 })
    expect(drawer.exit).toEqual({ opacity: 0, x: '100%' })
    expect(drawer.transition).toEqual({ type: 'spring', stiffness: 380, damping: 32 })
  })

  it('toast rises and scales slightly', () => {
    const toast = toastTransition(false)

    expect(toast.initial).toEqual({ opacity: 0, y: 16, scale: 0.98 })
    expect(toast.animate).toEqual({ opacity: 1, y: 0, scale: 1 })
    expect(toast.exit).toEqual({ opacity: 0, scale: 0.98 })
    expect(toast.transition).toEqual({ duration: 0.2, ease: 'easeOut' })
  })

  describe('pressable', () => {
    it('scales to at most 1.02 over 150-200 ms', () => {
      expect(pressable(false)).toEqual({
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 },
        transition: { duration: 0.18 },
      })
    })

    it('does not scale with reduced motion', () => {
      expect(pressable(true)).toEqual({})
    })
  })
})

describe('listStagger', () => {
  it('without reduced motion staggers children rising into place', () => {
    const { container, item } = listStagger(false)

    expect(container).toEqual({
      hidden: {},
      visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
    })
    expect(item.hidden).toEqual({ opacity: 0, y: 16 })
    expect(item.visible).toEqual({
      opacity: 1,
      y: 0,
      transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
    })
  })

  it('with reduced motion only fades items in, without stagger', () => {
    const { container, item } = listStagger(true)

    expect(container).toEqual({ hidden: {}, visible: {} })
    expect(item).toEqual({
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.15 } },
    })
  })
})

describe('hoverLift', () => {
  it('lifts and scales to 1.02 within 150-200 ms', () => {
    expect(hoverLift(false)).toEqual({
      whileHover: { scale: 1.02, y: -4 },
      transition: { duration: 0.18, ease: 'easeOut' },
    })
  })

  it('does nothing with reduced motion', () => {
    expect(hoverLift(true)).toEqual({})
  })
})
