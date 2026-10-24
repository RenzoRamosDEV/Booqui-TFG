import { Link } from 'react-router'
import { focusRing } from '../../components/ui/button-styles'
import { cn } from '../../lib/cn'

const footerLinks = [
  { to: '/events', label: 'Eventos' },
  { to: '/contact', label: 'Contacto' },
  { to: '/my-bookings', label: 'Mis reservas' },
]

export function Footer() {
  return (
    <footer className="mt-16 border-t border-border bg-bg-elevated/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-display text-lg font-bold tracking-tight text-gradient-brand">
            Booqi
          </span>
          <p className="text-sm text-fg-muted">Tus entradas para lo que de verdad te importa.</p>
        </div>
        <nav aria-label="Pie de página" className="flex flex-wrap gap-1">
          {footerLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'rounded-md px-3 py-2 text-sm text-fg-muted transition-colors hover:text-fg',
                focusRing,
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-fg-muted">© {new Date().getFullYear()} Booqi</p>
      </div>
    </footer>
  )
}
