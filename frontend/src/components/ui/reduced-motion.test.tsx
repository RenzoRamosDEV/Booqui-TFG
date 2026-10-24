import { render, screen } from '@testing-library/react'
import { Dialog } from './Dialog'
import { Drawer } from './Drawer'

const reducedMotion = vi.hoisted(() => ({ value: true }))

vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  useReducedMotion: () => reducedMotion.value,
}))

describe.each([
  ['Dialog', Dialog],
  ['Drawer', Drawer],
] as const)('%s motion', (_name, Overlay) => {
  it('with reduced motion starts with an opacity-only style', () => {
    reducedMotion.value = true
    render(<Overlay open onClose={() => {}} title="Hola" />)

    const panel = screen.getByRole('dialog')
    expect(panel.style.opacity).toBe('0')
    expect(panel.style.transform).toBe('')
  })

  it('without reduced motion also moves the panel', () => {
    reducedMotion.value = false
    render(<Overlay open onClose={() => {}} title="Hola" />)

    expect(screen.getByRole('dialog').style.transform).not.toBe('')
  })
})
