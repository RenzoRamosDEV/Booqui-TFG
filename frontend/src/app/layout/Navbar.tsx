import { LogOut, Menu, Moon, ShoppingBag, Sun } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router'
import logo from '../../assets/logo_booqi_nuevo.png'
import { Avatar } from '../../components/ui/Avatar'
import { focusRing } from '../../components/ui/button-styles'
import { Drawer } from '../../components/ui/Drawer'
import { useSessionStore } from '../../features/auth/hooks/session-store'
import { ticketCount, useCartStore } from '../../features/cart/hooks/cart-store'
import { cn } from '../../lib/cn'
import { useThemeStore } from '../../lib/theme-store'
import { navLinksFor } from './nav-links'

const linkBase = cn(
  'rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150',
  focusRing,
)

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    linkBase,
    isActive
      ? 'bg-brand-50 text-brand-700 dark:bg-brand-400/10 dark:text-brand-300'
      : 'text-fg-muted hover:bg-brand-50/70 hover:text-fg dark:hover:bg-white/5',
  )
}

const iconButton = cn(
  'grid size-10 place-items-center rounded-md text-fg-muted transition-colors duration-150 hover:bg-brand-50 hover:text-fg dark:hover:bg-white/5',
  focusRing,
)

const primaryAction = cn(
  'inline-flex h-10 items-center rounded-md bg-gradient-brand px-4 text-sm font-semibold text-primary-fg shadow-md shadow-brand-600/25 transition-shadow hover:shadow-lg dark:bg-none dark:bg-primary dark:shadow-none',
  focusRing,
)

function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme)
  const toggle = useThemeStore((state) => state.toggle)
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Activar tema claro' : 'Activar tema oscuro'}
      className={iconButton}
    >
      {dark ? (
        <Sun aria-hidden="true" className="size-5" />
      ) : (
        <Moon aria-hidden="true" className="size-5" />
      )}
    </button>
  )
}

function CartLink() {
  const count = useCartStore((state) => ticketCount(state.lines))
  return (
    <Link
      to="/cart"
      aria-label={`Carrito, ${count} ${count === 1 ? 'entrada' : 'entradas'}`}
      className={cn(iconButton, 'relative')}
    >
      <ShoppingBag aria-hidden="true" className="size-5" />
      <AnimatePresence initial={false}>
        {count > 0 && (
          <motion.span
            key={count}
            aria-hidden="true"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-gradient-brand px-1 text-[11px] leading-5 font-bold text-white shadow-sm dark:bg-none dark:bg-primary dark:text-primary-fg"
          >
            {count}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )
}

export function Navbar() {
  const user = useSessionStore((state) => state.user)
  const signOut = useSessionStore((state) => state.signOut)
  const clearCart = useCartStore((state) => state.clear)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const links = navLinksFor(user)

  function logout() {
    setMenuOpen(false)
    signOut()
    clearCart()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 sm:px-4">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 rounded-lg border border-glass-border bg-glass px-3 shadow-md backdrop-blur-xl backdrop-saturate-150 sm:px-4">
        <Link to="/" className={cn('flex items-center gap-2 rounded-md pr-2', focusRing)}>
          <span className="grid size-9 place-items-center rounded-md bg-white shadow-sm ring-1 ring-brand-100 dark:ring-white/10">
            <img src={logo} alt="" className="size-7 object-contain" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight text-fg">Booqi</span>
        </Link>

        <nav aria-label="Principal" className="ml-2 hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <ThemeToggle />
          {user && <CartLink />}
          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <span className="flex items-center gap-2 rounded-full border border-border bg-surface/60 py-1 pr-3 pl-1">
                <Avatar name={`${user.firstName} ${user.lastName}`} className="size-7" />
                <span className="text-sm font-medium text-fg">{user.firstName}</span>
              </span>
              <button
                type="button"
                onClick={logout}
                className={iconButton}
                aria-label="Cerrar sesión"
              >
                <LogOut aria-hidden="true" className="size-5" />
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 md:flex">
              <Link to="/login" className={navLinkClass({ isActive: false })}>
                Iniciar sesión
              </Link>
              <Link to="/register" className={primaryAction}>
                Crear cuenta
              </Link>
            </div>
          )}
          <button
            type="button"
            aria-label="Abrir menú"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
            className={cn(iconButton, 'md:hidden')}
          >
            <Menu aria-hidden="true" className="size-5" />
          </button>
        </div>
      </div>

      <Drawer open={menuOpen} onClose={() => setMenuOpen(false)} title="Menú">
        <nav aria-label="Menú móvil" className="flex flex-col gap-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={navLinkClass}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-border pt-4">
          {user ? (
            <>
              <span className="flex items-center gap-2 text-sm font-medium text-fg">
                <Avatar name={`${user.firstName} ${user.lastName}`} className="size-8" />
                {user.firstName}
              </span>
              <button
                type="button"
                onClick={logout}
                className={cn(
                  linkBase,
                  'flex items-center gap-2 text-left text-fg-muted hover:text-fg',
                )}
              >
                <LogOut aria-hidden="true" className="size-4" />
                Cerrar sesión
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className={navLinkClass({ isActive: false })}
              >
                Iniciar sesión
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className={cn(primaryAction, 'justify-center')}
              >
                Crear cuenta
              </Link>
            </>
          )}
        </div>
      </Drawer>
    </header>
  )
}
