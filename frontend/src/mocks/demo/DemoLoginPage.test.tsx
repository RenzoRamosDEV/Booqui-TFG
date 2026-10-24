import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { routes } from '../../app/router'
import { useSessionStore } from '../../features/auth/hooks/session-store'
import { http } from '../../lib/http'
import { renderApp } from '../../test/render-app'
import { DemoLoginPage } from './DemoLoginPage'
import { withDemoLogin } from './demo-routes'
import { installDemo } from './install'
import { DEMO_ACCOUNTS } from './seed'

function renderDemoLogin(path: string) {
  const previous = http.defaults.adapter
  installDemo({
    storage: { getItem: () => null, setItem: () => undefined },
    now: new Date(),
    delayMs: 0,
  })
  onTestFinished(() => {
    http.defaults.adapter = previous
  })
  return renderApp(path, { routeList: withDemoLogin(routes, DemoLoginPage) })
}

describe('DemoLoginPage', () => {
  it('keeps the normal login form', async () => {
    renderDemoLogin('/login')
    expect(await screen.findByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
  })

  it('logs the demo customer in with one click and honours the redirect', async () => {
    const { router } = renderDemoLogin('/login?redirect=%2Fmy-bookings')
    await userEvent.click(await screen.findByRole('button', { name: 'Entrar como cliente demo' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/my-bookings'))
    expect(useSessionStore.getState().user?.contactEmail).toBe(DEMO_ACCOUNTS[0].email)
  })

  it('sends the demo admin to the admin panel', async () => {
    const { router } = renderDemoLogin('/login')
    await userEvent.click(await screen.findByRole('button', { name: 'Entrar como admin demo' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/admin'))
    expect(useSessionStore.getState().user?.role).toBe('ADMIN')
  })
})
