import { render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { installFakeApi } from '../test/fake-api'
import { App } from './App'
import { routes, routerReady } from './router'

describe('App', () => {
  beforeEach(() => {
    installFakeApi().get('/api/v1/events', { status: 200, data: [] })
  })

  it('renders a main landmark', () => {
    render(<App router={createMemoryRouter(routes)} />)

    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  it('waits for the first route before resolving routerReady', async () => {
    const router = createMemoryRouter(routes)
    expect(router.state.initialized).toBe(false)

    await routerReady(router)

    expect(router.state.initialized).toBe(true)
    await expect(routerReady(router)).resolves.toBeUndefined()
  })
})
