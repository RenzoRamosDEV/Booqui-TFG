import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from './Pagination'

function setup(page: number, totalPages: number) {
  const onPageChange = vi.fn()
  render(<Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />)
  return {
    onPageChange,
    prev: screen.getByRole('button', { name: 'Página anterior' }),
    next: screen.getByRole('button', { name: 'Página siguiente' }),
  }
}

describe('Pagination', () => {
  it('on page 1 of 5 disables previous and next goes to page 2', async () => {
    const { prev, next, onPageChange } = setup(1, 5)

    expect(screen.getByRole('navigation', { name: 'Paginación' })).toBeInTheDocument()
    expect(prev).toBeDisabled()
    await userEvent.click(next)
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('on the last page disables next and previous goes back', async () => {
    const { prev, next, onPageChange } = setup(5, 5)

    expect(next).toBeDisabled()
    await userEvent.click(prev)
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('marks the current page with aria-current', () => {
    setup(3, 5)

    expect(screen.getByRole('button', { name: 'Página 3' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('button', { name: 'Página 2' })).not.toHaveAttribute('aria-current')
  })

  it('jumps to a page button', async () => {
    const { onPageChange } = setup(1, 5)

    await userEvent.click(screen.getByRole('button', { name: 'Página 4' }))

    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('renders ellipses for long ranges', () => {
    setup(10, 20)

    expect(screen.getAllByText('…')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Página 20' })).toBeInTheDocument()
  })

  it('renders nothing with a single page', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={vi.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })
})
