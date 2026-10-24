import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { Providers } from '../app/providers'
import { createTestQueryClient } from './render-app'

export type LocationProbe = { pathname: string; search: string }

/** Wraps a hook in the app providers and a memory router, reporting the current location. */
export function hookWrapper(path = '/', probe?: LocationProbe) {
  const queryClient = createTestQueryClient()
  function Probe() {
    const location = useLocation()
    if (probe) Object.assign(probe, { pathname: location.pathname, search: location.search })
    return null
  }
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Providers queryClient={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route
              path="*"
              element={
                <>
                  {children}
                  <Probe />
                </>
              }
            />
          </Routes>
        </MemoryRouter>
      </Providers>
    )
  }
  return { wrapper: Wrapper, queryClient }
}
