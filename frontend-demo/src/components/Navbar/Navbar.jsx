import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import logo from '../../assets/logo_booqi_nuevo.png'
import './Navbar.css'
import './Navbar.mobile.css'


export default function Navbar({ hideAnnouncement = false, hideLinks = false }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()
  const { cart } = useCart()
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  const cartCount = cart?.reduce((s, i) => s + (i.qty || 1), 0) || 0

  const handleLogout = () => {
    setMobileOpen(false)
    logout()
  }

  return (
    <header id="booqi-header">
      {!hideAnnouncement && (
        <div className="announcement-bar">
          Demo visual de BOOQI — creada por Renzo Ramos y Melanie Gabriela.
        </div>
      )}
      <nav
        id="booqi-navbar"
        className={`nav-root${scrolled ? ' scrolled' : ''}`}
      >
        <Link to="/" className="nav-logo">
          <img src={logo} alt="booqi" className="nav-logo-img" />
          <span className="nav-logo-text">booqi</span>
        </Link>

        {!hideLinks && (
          <div className="nav-links">
            <Link to="/">Inicio</Link>
            <Link to="/events">Eventos</Link>
            <Link to="/contact">Contacto</Link>
            {user?.role === 'ADMIN' && <Link to="/admin">Panel Admin</Link>}
          </div>
        )}

        <div className="nav-actions">
          {user ? (
            <>
              <span className="nav-hello">Hola, {user.firstName}</span>
              <Link to="/my-bookings" className="nav-btn nav-btn-ghost">🎫 Mis reservas</Link>
              <Link to="/cart" className="nav-btn nav-btn-ghost">
                🛒 {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
              </Link>
              <button className="nav-btn nav-btn-ghost" onClick={logout}>Salir</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-btn nav-btn-ghost">Iniciar sesión</Link>
              <Link to="/register" className="nav-btn nav-btn-solid">Registrarse</Link>
            </>
          )}
        </div>

        <button
          className={`nav-hamburger${mobileOpen ? ' open' : ''}`}
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Menú"
        >
          <span /><span /><span />
        </button>
      </nav>

      {mobileOpen && (
        <div className="nav-mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}
      <div className={`nav-mobile-drawer${mobileOpen ? ' open' : ''}`}>
        <div className="nav-mobile-header">
          <span className="nav-logo-text" style={{ color: '#6d28d9', fontWeight: 700, fontSize: '1.5rem' }}>booqi</span>
          <button className="nav-mobile-close" onClick={() => setMobileOpen(false)}>✕</button>
        </div>

        {!hideLinks && (
          <nav className="nav-mobile-links">
            <Link to="/">Inicio</Link>
            <Link to="/events">Eventos</Link>
            <Link to="/contact">Contacto</Link>
            {user?.role === 'ADMIN' && <Link to="/admin">Panel Admin</Link>}
          </nav>
        )}

        <div className="nav-mobile-actions">
          {user ? (
            <>
              <span className="nav-mobile-greeting">Hola, {user.firstName} 👋</span>
              <Link to="/my-bookings" className="nav-mobile-btn">🎫 Mis reservas</Link>
              <Link to="/cart" className="nav-mobile-btn">
                🛒 Carrito {cartCount > 0 && <span className="nav-cart-badge">{cartCount}</span>}
              </Link>
              <button className="nav-mobile-btn nav-mobile-btn-outline" onClick={handleLogout}>Salir</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-mobile-btn nav-mobile-btn-outline">Iniciar sesión</Link>
              <Link to="/register" className="nav-mobile-btn nav-mobile-btn-solid">Registrarse</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
