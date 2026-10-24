import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef } from 'react'
import { useFocusTrap } from './use-focus-trap'

type TrapProps = { active: boolean; empty?: boolean; mounted?: boolean }

function Trap({ active, empty = false, mounted = active }: TrapProps) {
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, active)
  return (
    <>
      <button>outside</button>
      {mounted && (
        <div ref={ref} data-testid="trap">
          {!empty && (
            <>
              <button disabled>disabled</button>
              <button>first</button>
              <a href="#x">middle</a>
              <span tabIndex={-1}>skipped</span>
              <input aria-label="last" />
            </>
          )}
        </div>
      )}
    </>
  )
}

describe('useFocusTrap', () => {
  it('focuses the first enabled focusable element when activated', () => {
    render(<Trap active />)

    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus()
  })

  it('wraps Tab from the last element to the first', async () => {
    const user = userEvent.setup()
    render(<Trap active />)
    screen.getByRole('textbox', { name: 'last' }).focus()

    await user.tab()

    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus()
  })

  it('wraps Shift+Tab from the first element to the last', async () => {
    const user = userEvent.setup()
    render(<Trap active />)

    await user.tab({ shift: true })

    expect(screen.getByRole('textbox', { name: 'last' })).toHaveFocus()
  })

  it('lets Tab move normally between inner elements', async () => {
    const user = userEvent.setup()
    render(<Trap active />)

    await user.tab()

    expect(screen.getByRole('link', { name: 'middle' })).toHaveFocus()
  })

  it('lets Shift+Tab move normally between inner elements', async () => {
    const user = userEvent.setup()
    render(<Trap active />)
    screen.getByRole('textbox', { name: 'last' }).focus()

    await user.tab({ shift: true })

    expect(screen.getByRole('link', { name: 'middle' })).toHaveFocus()
  })

  it('focuses the container itself when it has no focusable children', async () => {
    const user = userEvent.setup()
    render(<Trap active empty />)
    const trap = screen.getByTestId('trap')

    expect(trap).toHaveFocus()
    expect(trap).toHaveAttribute('tabindex', '-1')
    await user.tab()
    expect(trap).toHaveFocus()
  })

  it('restores focus to the previously focused element on deactivate', () => {
    const { rerender } = render(<Trap active={false} />)
    const outside = screen.getByRole('button', { name: 'outside' })
    outside.focus()

    rerender(<Trap active />)
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus()

    rerender(<Trap active={false} />)
    expect(outside).toHaveFocus()
  })

  it('ignores keys other than Tab', async () => {
    const user = userEvent.setup()
    render(<Trap active />)
    screen.getByRole('textbox', { name: 'last' }).focus()

    await user.keyboard('{Enter}')

    expect(screen.getByRole('textbox', { name: 'last' })).toHaveFocus()
  })

  it('does nothing while inactive even if the container is mounted', () => {
    render(<Trap active={false} mounted />)

    expect(screen.getByRole('button', { name: 'first' })).not.toHaveFocus()
    expect(document.body).toHaveFocus()
  })

  it('does not fail when active without a mounted container', () => {
    render(<Trap active mounted={false} />)

    expect(screen.queryByTestId('trap')).not.toBeInTheDocument()
  })

  it('stops trapping Tab once deactivated', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<Trap active mounted />)
    rerender(<Trap active={false} mounted />)
    screen.getByRole('textbox', { name: 'last' }).focus()

    await user.tab()

    expect(screen.getByRole('button', { name: 'first' })).not.toHaveFocus()
  })
})
