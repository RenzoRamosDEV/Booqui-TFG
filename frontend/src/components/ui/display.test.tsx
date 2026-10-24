import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Avatar } from './Avatar'
import { Badge } from './Badge'
import { Card } from './Card'
import { EmptyState } from './EmptyState'
import { Skeleton } from './Skeleton'

describe('Card', () => {
  it('renders its children and merges classes', () => {
    render(<Card className="extra">Contenido</Card>)

    const card = screen.getByText('Contenido')
    expect(card).toHaveClass('extra')
    expect(card.className).toContain('rounded-lg')
  })
})

describe('Badge', () => {
  it.each(['neutral', 'brand', 'success', 'warning', 'danger'] as const)(
    'renders the %s tone',
    (tone) => {
      render(<Badge tone={tone}>Agotado</Badge>)

      expect(screen.getByText('Agotado')).toHaveAttribute('data-tone', tone)
    },
  )

  it('defaults to the neutral tone', () => {
    render(<Badge>Info</Badge>)

    expect(screen.getByText('Info')).toHaveAttribute('data-tone', 'neutral')
  })
})

describe('Skeleton', () => {
  it('is hidden from assistive technology', () => {
    const { container } = render(<Skeleton className="h-4" />)

    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
    expect(container.firstChild).toHaveClass('h-4')
  })
})

describe('Avatar', () => {
  it.each([
    ['Ana López', 'AL'],
    ['ana', 'A'],
    ['  maría   del carmen ruiz ', 'MD'],
    ['', '?'],
  ])('shows initials for %j as %s when there is no image', (name, initials) => {
    render(<Avatar name={name} />)

    expect(
      screen.getByRole('img', { name: name.trim().replace(/\s+/g, ' ') || 'Usuario' }),
    ).toHaveTextContent(initials)
  })

  it('shows the image with the name as alt text', () => {
    render(<Avatar name="Ana López" src="/ana.png" />)

    expect(screen.getByRole('img', { name: 'Ana López' })).toHaveAttribute('src', '/ana.png')
  })

  it('falls back to initials when the image fails', () => {
    render(<Avatar name="Ana López" src="/broken.png" />)

    screen.getByRole('img', { name: 'Ana López' }).dispatchEvent(new Event('error'))

    return expect(screen.findByText('AL')).resolves.toBeInTheDocument()
  })
})

describe('EmptyState', () => {
  it('shows title and description', () => {
    render(<EmptyState title="Sin reservas" description="Aún no has reservado nada." />)

    expect(screen.getByRole('heading', { name: 'Sin reservas' })).toBeInTheDocument()
    expect(screen.getByText('Aún no has reservado nada.')).toBeInTheDocument()
  })

  it('renders the optional action', async () => {
    const onClick = vi.fn()
    render(<EmptyState title="Vacío" action={<button onClick={onClick}>Explorar</button>} />)

    await userEvent.click(screen.getByRole('button', { name: 'Explorar' }))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('omits description and action when not given', () => {
    const { container } = render(<EmptyState title="Vacío" />)

    expect(container.querySelectorAll('p')).toHaveLength(0)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
