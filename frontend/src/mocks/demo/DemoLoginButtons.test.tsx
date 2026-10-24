import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DemoLoginButtons } from './DemoLoginButtons'
import { DEMO_ACCOUNTS } from './seed'

describe('DemoLoginButtons', () => {
  it.each([
    ['Entrar como cliente demo', DEMO_ACCOUNTS[0]],
    ['Entrar como admin demo', DEMO_ACCOUNTS[1]],
  ])('"%s" picks its account', async (name, account) => {
    const onPick = vi.fn()
    render(<DemoLoginButtons onPick={onPick} />)
    await userEvent.click(screen.getByRole('button', { name }))
    expect(onPick).toHaveBeenCalledExactlyOnceWith(account)
  })

  it('shows the credentials of both accounts', () => {
    render(<DemoLoginButtons onPick={vi.fn()} />)
    for (const account of DEMO_ACCOUNTS) {
      expect(screen.getAllByText(account.email, { exact: false }).length).toBeGreaterThan(0)
    }
    expect(screen.getAllByText(DEMO_ACCOUNTS[0].password, { exact: false }).length).toBe(2)
  })

  it('disables both buttons while a login is in flight', () => {
    render(<DemoLoginButtons onPick={vi.fn()} disabled />)
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled()
  })
})
