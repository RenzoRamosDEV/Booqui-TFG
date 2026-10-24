import { act, render, screen } from '@testing-library/react'
import { SuccessBurst } from './SuccessBurst'

const reducedMotion = vi.hoisted(() => ({ value: false }))

vi.mock('motion/react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('motion/react')>()),
  useReducedMotion: () => reducedMotion.value,
}))

describe('SuccessBurst', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('draws the check and throws confetti that disappears after 1.5 s', () => {
    vi.useFakeTimers()
    reducedMotion.value = false
    render(<SuccessBurst />)

    expect(screen.getByTestId('success-check')).toBeInTheDocument()
    expect(screen.getAllByTestId('confetti').length).toBeGreaterThanOrEqual(20)

    act(() => vi.advanceTimersByTime(1500))

    expect(screen.queryAllByTestId('confetti')).toHaveLength(0)
  })

  it('with reduced motion only fades the static check in, without confetti', () => {
    reducedMotion.value = true
    render(<SuccessBurst />)

    const burst = screen.getByTestId('success-burst')
    expect(screen.queryAllByTestId('confetti')).toHaveLength(0)
    expect(burst.style.opacity).toBe('0')
    expect(burst.style.transform).toBe('')
  })

  it('is decorative for assistive technology', () => {
    render(<SuccessBurst />)

    expect(screen.getByTestId('success-burst')).toHaveAttribute('aria-hidden', 'true')
  })
})
