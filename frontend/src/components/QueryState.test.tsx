import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ApiError } from '../lib/api-error'
import { QueryState, type QueryLike } from './QueryState'
import { EmptyState } from './ui/EmptyState'

function query(overrides: Partial<QueryLike<string[]>>): QueryLike<string[]> {
  return { data: undefined, error: null, isPending: false, refetch: vi.fn(), ...overrides }
}

function renderState(state: QueryLike<string[]>, overrides?: Record<number, string>) {
  return render(
    <QueryState
      query={state}
      label="Cargando eventos"
      skeleton={<p>esqueleto</p>}
      isEmpty={(data) => data.length === 0}
      empty={<EmptyState title="No hay eventos" />}
      errorOverrides={overrides}
    >
      {(data) => <p>{data.join(', ')}</p>}
    </QueryState>,
  )
}

describe('QueryState', () => {
  it('shows the skeleton in a busy region while loading', () => {
    renderState(query({ isPending: true }))

    const region = screen.getByRole('region', { name: 'Cargando eventos' })
    expect(region).toHaveAttribute('aria-busy', 'true')
    expect(region).toHaveTextContent('esqueleto')
  })

  it('renders the data once loaded', () => {
    renderState(query({ data: ['Jazz', 'Rock'] }))

    expect(screen.getByText('Jazz, Rock')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Cargando eventos' })).not.toBeInTheDocument()
  })

  it('shows the given empty state when the data is empty', () => {
    renderState(query({ data: [] }))

    expect(screen.getByRole('heading', { name: 'No hay eventos' })).toBeInTheDocument()
  })

  it('shows the offline content with a retry that refetches on a network error', async () => {
    const refetch = vi.fn()
    renderState(query({ error: new ApiError({ status: 0, title: '', detail: '' }), refetch }))

    expect(screen.getByRole('heading', { name: 'Sin conexión' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('shows the ApiError user message with a retry for other failures', async () => {
    const refetch = vi.fn()
    renderState(query({ error: new ApiError({ status: 503, title: '', detail: '' }), refetch }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'El servicio no está disponible. Inténtalo más tarde.',
    )
    expect(screen.queryByRole('heading', { name: 'Sin conexión' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('applies per-screen overrides to the message', () => {
    renderState(query({ error: new ApiError({ status: 404, title: '', detail: '' }) }), {
      404: 'Este evento no existe.',
    })

    expect(screen.getByRole('alert')).toHaveTextContent('Este evento no existe.')
  })

  it('shows a generic message for errors that are not ApiError', () => {
    renderState(query({ error: new Error('schema mismatch at path id') }))

    expect(screen.getByRole('alert')).toHaveTextContent('Ha ocurrido un error inesperado.')
    expect(screen.getByRole('alert')).not.toHaveTextContent('schema')
  })
})
