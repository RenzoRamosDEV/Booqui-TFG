import { render } from '@testing-library/react'
import { PageMeta } from './PageMeta'

function description() {
  return document.head.querySelector('meta[name="description"]')?.getAttribute('content')
}

describe('PageMeta', () => {
  it('sets the title ending in Booqi and the meta description', () => {
    render(<PageMeta title="Contacto" description="Escríbenos y te respondemos pronto." />)

    expect(document.title).toBe('Contacto · Booqi')
    expect(description()).toBe('Escríbenos y te respondemos pronto.')
  })

  it('updates when the page changes', () => {
    const { rerender } = render(<PageMeta title="Eventos" description="Todos los eventos." />)

    rerender(<PageMeta title="Carrito" description="Tu carrito." />)

    expect(document.title).toBe('Carrito · Booqi')
    expect(document.head.querySelectorAll('meta[name="description"]')).toHaveLength(1)
    expect(description()).toBe('Tu carrito.')
  })
})
