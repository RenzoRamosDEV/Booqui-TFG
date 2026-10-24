import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { Button } from './Button'

describe('Button', () => {
  it.each(['primary', 'secondary', 'ghost', 'destructive'] as const)(
    'renders the %s variant as a clickable button',
    async (variant) => {
      const onClick = vi.fn()
      render(
        <Button variant={variant} onClick={onClick}>
          Guardar
        </Button>,
      )

      await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

      expect(onClick).toHaveBeenCalledTimes(1)
      expect(screen.getByRole('button')).toHaveAttribute('data-variant', variant)
    },
  )

  it('defaults to the primary variant and type button', () => {
    render(<Button>Ok</Button>)

    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'primary')
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('in loading state is disabled, busy and ignores clicks', async () => {
    const onClick = vi.fn()
    render(
      <Button loading onClick={onClick}>
        Pagar
      </Button>,
    )
    const button = screen.getByRole('button', { name: /Pagar/ })

    await userEvent.click(button)

    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(onClick).not.toHaveBeenCalled()
  })

  it('is not busy when not loading', () => {
    render(<Button>Pagar</Button>)

    expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy')
    expect(screen.getByRole('button')).toBeEnabled()
  })

  it('shows a ring in the --ring color when focused by keyboard', async () => {
    render(<Button>Foco</Button>)

    await userEvent.tab()

    const button = screen.getByRole('button')
    expect(button).toHaveFocus()
    expect(button.className).toContain('focus-visible:ring-2')
    expect(button.className).toContain('focus-visible:ring-ring')
  })

  it('forwards its ref to the button element', () => {
    const ref = createRef<HTMLButtonElement>()
    render(<Button ref={ref}>Ref</Button>)

    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })
})
