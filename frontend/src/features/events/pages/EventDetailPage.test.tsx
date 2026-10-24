import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useCartStore } from '../../cart/hooks/cart-store'
import { installFakeApi } from '../../../test/fake-api'
import { eventWith, jazzEvent } from '../../../test/fixtures/events'
import { renderApp } from '../../../test/render-app'
import { userWith } from '../../../test/users'
import type { EventResponse } from '../../../types/event'

function serve(event: EventResponse) {
  const api = installFakeApi()
  api.get(`/api/v1/events/${event.id}`, { status: 200, data: event })
  return api
}

function quantity() {
  return screen.getByRole('status', { name: 'Entradas seleccionadas' })
}

async function raise(times: number) {
  const more = screen.getByRole('button', { name: 'Añadir una entrada' })
  for (let index = 0; index < times; index += 1) {
    if (more.hasAttribute('disabled')) break
    await userEvent.click(more)
  }
}

describe('EventDetailPage', () => {
  it('shows the event information and titles the page after it', async () => {
    serve(jazzEvent)
    renderApp('/events/4')

    expect(await screen.findByRole('heading', { level: 1, name: 'Jazz en Madrid' })).toBeVisible()
    expect(screen.getByText(jazzEvent.description!)).toBeInTheDocument()
    expect(screen.getByText('Blue Note Madrid')).toBeInTheDocument()
    expect(screen.getAllByText('Música').length).toBeGreaterThan(0)
    expect(screen.getAllByText('12,50 €').length).toBeGreaterThan(0)
    await waitFor(() => expect(document.title).toBe('Jazz en Madrid · Booqi'))
  })

  it('links the location to a Google Maps search in a new tab', async () => {
    serve(eventWith({ location: 'IFEMA, Madrid' }))
    renderApp('/events/4')

    const link = await screen.findByRole('link', { name: /ver en google maps/i })
    expect(link).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=IFEMA%2C%20Madrid',
    )
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows Gratis for a free event', async () => {
    serve(eventWith({ price: 0 }))
    renderApp('/events/4')

    expect((await screen.findAllByText('Gratis')).length).toBeGreaterThan(0)
  })

  it('warns about the last tickets', async () => {
    serve(eventWith({ availableTickets: 2 }))
    renderApp('/events/4')

    expect(await screen.findByText('Últimas 2 entradas')).toBeInTheDocument()
  })

  it('disables the selector and CTA when sold out', async () => {
    serve(eventWith({ availableTickets: 0 }))
    renderApp('/events/4')

    expect(await screen.findByText('Agotado')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Añadir al carrito' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Añadir una entrada' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Quitar una entrada' })).toBeDisabled()
  })

  it.each([
    [2, 2],
    [500, 10],
  ])('caps the quantity at %i stock to %i', async (stock, max) => {
    serve(eventWith({ availableTickets: stock }))
    renderApp('/events/4')
    await screen.findByRole('heading', { level: 1 })

    await raise(15)

    expect(quantity()).toHaveTextContent(String(max))
    expect(screen.getByRole('button', { name: 'Añadir una entrada' })).toBeDisabled()
  })

  it('does not go below 1 ticket', async () => {
    serve(jazzEvent)
    renderApp('/events/4')
    await screen.findByRole('heading', { level: 1 })

    expect(quantity()).toHaveTextContent('1')
    expect(screen.getByRole('button', { name: 'Quitar una entrada' })).toBeDisabled()
  })

  it('shows the price summary for the chosen quantity', async () => {
    serve(eventWith({ price: 12.5, availableTickets: 50 }))
    renderApp('/events/4')
    await screen.findByRole('heading', { level: 1 })

    await raise(2)

    expect(screen.getByTestId('price-summary')).toHaveTextContent('3 × 12,50 €')
    expect(screen.getByTestId('price-summary')).toHaveTextContent('37,50 €')
  })

  it('sends an anonymous visitor to login and keeps the cart empty', async () => {
    serve(jazzEvent)
    const { router } = renderApp('/events/4')

    await userEvent.click(await screen.findByRole('button', { name: 'Añadir al carrito' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(router.state.location.search).toBe('?redirect=%2Fevents%2F4')
    expect(useCartStore.getState().lines).toEqual([])
  })

  it('adds the chosen quantity to the cart and confirms with a toast', async () => {
    serve(jazzEvent)
    renderApp('/events/4', { user: userWith('CUSTOMER') })
    await screen.findByRole('heading', { level: 1 })

    await raise(2)
    await userEvent.click(screen.getByRole('button', { name: 'Añadir al carrito' }))

    expect(useCartStore.getState().lines).toEqual([{ event: jazzEvent, quantity: 3 }])
    expect(await screen.findByText('Añadido al carrito')).toBeInTheDocument()
  })

  it('shows a not-found state linking back to the listing on 404', async () => {
    const api = installFakeApi()
    api.get('/api/v1/events/999', { status: 404, data: { detail: 'Event with id 999 not found' } })
    renderApp('/events/999')

    const heading = await screen.findByRole('heading', { name: 'Evento no encontrado' })
    expect(screen.getByRole('main')).toContainElement(heading)
    expect(screen.getByRole('link', { name: 'Ver todos los eventos' })).toHaveAttribute(
      'href',
      '/events',
    )
  })

  it('treats a non-numeric id as not found without requesting it', async () => {
    const api = installFakeApi()
    renderApp('/events/abc')

    expect(await screen.findByRole('heading', { name: 'Evento no encontrado' })).toBeInTheDocument()
    expect(api.requests).toEqual([])
  })

  it('falls back to the branded placeholder when the image fails', async () => {
    serve(jazzEvent)
    renderApp('/events/4')

    const image = await screen.findByRole('img', { name: 'Jazz en Madrid' })
    expect(image.tagName).toBe('IMG')
    fireEvent.error(image)

    const fallback = await screen.findByTestId('event-image-fallback')
    expect(fallback).toHaveAttribute('role', 'img')
    expect(fallback).toHaveAccessibleName('Jazz en Madrid')
  })

  it('uses the placeholder when there is no image', async () => {
    serve(eventWith({ imageUrl: null }))
    renderApp('/events/4')

    expect(await screen.findByTestId('event-image-fallback')).toBeInTheDocument()
  })
})
