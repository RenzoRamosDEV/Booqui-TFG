import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation, useNavigationType } from 'react-router'
import { useEventFilters } from './use-event-filters'

function renderAt(url: string) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
  )
  return renderHook(
    () => ({ ...useEventFilters(), location: useLocation(), navigationType: useNavigationType() }),
    { wrapper },
  )
}

describe('useEventFilters', () => {
  it('reads the filters from the query string', () => {
    const { result } = renderAt('/events?q=rock&page=2')

    expect(result.current.filters).toEqual({ q: 'rock', page: 2 })
  })

  it('setFilter changes the filter and drops the page', () => {
    const { result } = renderAt('/events?q=rock&page=2')

    act(() => result.current.setFilter('category', 'Arte'))

    expect(result.current.location.search).toBe('?q=rock&category=Arte')
  })

  it('setFilter with an empty value removes it', () => {
    const { result } = renderAt('/events?q=rock&category=Arte')

    act(() => result.current.setFilter('q', ''))

    expect(result.current.location.search).toBe('?category=Arte')
  })

  it('setFilters applies several values at once and drops the page', () => {
    const { result } = renderAt('/events?category=Arte&page=3')

    act(() => result.current.setFilters({ q: 'rock', city: 'Madrid', maxPrice: undefined }))

    expect(result.current.location.search).toBe('?q=rock&category=Arte&city=Madrid')
  })

  it('setPage keeps the filters', () => {
    const { result } = renderAt('/events?q=rock')

    act(() => result.current.setPage(3))

    expect(result.current.location.search).toBe('?q=rock&page=3')
  })

  it('clear removes every filter', () => {
    const { result } = renderAt('/events?q=rock&maxPrice=20&page=2')

    act(() => result.current.clear())

    expect(result.current.location.pathname).toBe('/events')
    expect(result.current.location.search).toBe('')
  })

  it.each([
    ['setFilter', 'REPLACE'],
    ['setFilters', 'REPLACE'],
    ['setPage', 'PUSH'],
    ['clear', 'PUSH'],
  ] as const)('%s records a %s history entry', (action, type) => {
    const { result } = renderAt('/events?q=rock')

    act(() => {
      if (action === 'setFilter') result.current.setFilter('city', 'Madrid')
      if (action === 'setFilters') result.current.setFilters({ city: 'Madrid' })
      if (action === 'setPage') result.current.setPage(2)
      if (action === 'clear') result.current.clear()
    })

    expect(result.current.navigationType).toBe(type)
  })

  it('reports whether any filter is active', () => {
    expect(renderAt('/events?page=2').result.current.hasFilters).toBe(false)
    expect(renderAt('/events?maxPrice=0').result.current.hasFilters).toBe(true)
  })
})
