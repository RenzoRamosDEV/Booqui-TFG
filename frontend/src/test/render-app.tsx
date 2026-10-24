import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { RouterProvider, createMemoryRouter, type RouteObject } from 'react-router'
import { Providers } from '../app/providers'
import { routes } from '../app/router'
import { useSessionStore } from '../features/auth/hooks/session-store'
import { createQueryClient } from '../lib/query-client'
import type { UserResponse } from '../types/user'

export function createTestQueryClient() {
  const client = createQueryClient()
  client.setDefaultOptions({
    queries: { ...client.getDefaultOptions().queries, retry: false },
    mutations: { retry: false },
  })
  return client
}

type RenderAppOptions = { user?: UserResponse | null; routeList?: RouteObject[] }

/** Renders the real route map (layout, guards, lazy pages) at `path` with retries disabled. */
export function renderApp(
  path: string,
  { user = null, routeList = routes }: RenderAppOptions = {},
) {
  useSessionStore.setState({ user })
  const queryClient = createTestQueryClient()
  const router = createMemoryRouter(routeList, { initialEntries: [path] })
  const view = render(
    <Providers queryClient={queryClient}>
      <RouterProvider router={router} />
    </Providers>,
  )
  return { ...view, router, queryClient }
}

/** Renders a single element inside the app providers and a memory router. */
export function renderWithProviders(element: ReactElement, path = '/') {
  const queryClient = createTestQueryClient()
  const router = createMemoryRouter([{ path: '*', element }], { initialEntries: [path] })
  const view = render(
    <Providers queryClient={queryClient}>
      <RouterProvider router={router} />
    </Providers>,
  )
  return { ...view, router, queryClient }
}

export function searchParam(router: { state: { location: { search: string } } }, key: string) {
  return new URLSearchParams(router.state.location.search).get(key)
}
