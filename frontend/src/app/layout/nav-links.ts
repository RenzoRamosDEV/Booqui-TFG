import type { UserResponse } from '../../types/user'

export type NavLinkItem = { to: string; label: string }

export function navLinksFor(user: UserResponse | null): NavLinkItem[] {
  const links: NavLinkItem[] = [
    { to: '/', label: 'Inicio' },
    { to: '/events', label: 'Eventos' },
    { to: '/contact', label: 'Contacto' },
  ]
  if (user) {
    links.push({ to: '/my-bookings', label: 'Mis reservas' }, { to: '/profile', label: 'Perfil' })
  }
  if (user?.role === 'ADMIN') links.push({ to: '/admin', label: 'Administración' })
  return links
}
