import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MOCK_EVENTS, getEventsByCategory, getEventsByTitle } from '../../data/mockData'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import Navbar from '../../components/Navbar/Navbar'
import './Events.css'
import './Events.mobile.css'

const CATEGORIES = ['Todas', 'Música', 'Arte', 'Deporte', 'Gastronomía', 'Tecnología', 'Educación', 'Otros']

const PLACEHOLDER_IMGS = [
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=400&q=70',
  'https://images.unsplash.com/photo-1601924582975-5c6d4e9b1d98?w=400&q=70',
  'https://images.unsplash.com/photo-1511578314322-379afb476865?w=400&q=70',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&q=70',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=400&q=70',
  'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&q=70',
]

const EVENTS_PER_PAGE = 20

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('Todas')
  const [searchInput, setSearchInput] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const { cart, addToCart, removeFromCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const loadEvents = () => {
      setLoading(true)
      const data = getEventsByCategory(activeCategory)
      setEvents(data || [])
      setCurrentPage(1)
      setLoading(false)
    }
    loadEvents()
  }, [activeCategory])

  const loadEvents = () => {
    setLoading(true)
    const data = getEventsByCategory(activeCategory)
    setEvents(data || [])
    setCurrentPage(1)
    setLoading(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (!searchInput.trim()) { loadEvents(); return }
    setLoading(true)
    const data = getEventsByTitle(searchInput.trim())
    setEvents(data || [])
    setCurrentPage(1)
    setLoading(false)
  }

  const isInCart = (id) => cart?.some(i => i.idEvent === id || i.id === id)

  const handleAdd = (e, event) => {
    e.stopPropagation()
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    addToCart(event)
  }

  const totalPages = Math.ceil(events.length / EVENTS_PER_PAGE)
  const paginatedEvents = events.slice((currentPage - 1) * EVENTS_PER_PAGE, currentPage * EVENTS_PER_PAGE)

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  return (
    <div className="ev-root">
      <Navbar />

      <section className="ev-hero">
        <div className="ev-hero-bg" />
        <div className="ev-hero-overlay" />
        <div className="ev-hero-content">
          <h1>Eventos</h1>
          <div className="ev-breadcrumb">
            <Link to="/">Inicio</Link>
            <span>›</span>
            Eventos
          </div>
        </div>
      </section>

      <div className="ev-toolbar">
        <div className="ev-category-tabs">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`ev-cat-tab${activeCategory === cat ? ' active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="ev-toolbar-right">
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              className="ev-search"
              placeholder="Buscar eventos..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            <button type="submit" className="ev-nav-btn ev-nav-btn-solid" style={{ borderRadius: 8 }}>Buscar</button>
          </form>
          <span className="ev-show-label">{events.length} eventos</span>
        </div>
      </div>

      <div className="ev-grid-wrap">
        <div className="ev-grid">
          {loading
            ? Array.from({ length: 12 }, (_, i) => i + 1).map(i => (
                <div key={i} style={{ height: 300 }} className="ev-skeleton" />
              ))
            : events.length === 0
              ? (
                <div className="ev-empty">
                  <h3>No hay eventos disponibles</h3>
                  <p>Prueba con otra categoría o búsqueda</p>
                </div>
              )
              : paginatedEvents.map((ev, i) => {
                  const added = isInCart(ev.idEvent)
                  const isNew = i < 3
                  const isSoldOut = ev.availableTickets === 0
                  const isLowStock = ev.availableTickets > 0 && ev.availableTickets <= 10 && !isSoldOut
                  
                  return (
                    <div 
                      key={ev.idEvent || i} 
                      className={`ev-card${isSoldOut ? ' sold-out' : ''}`}
                      onClick={() => navigate(`/events/${ev.idEvent}`)}
                    >
                      <div className="ev-card-img">
                        <img
                          src={ev.urlImage || PLACEHOLDER_IMGS[i % PLACEHOLDER_IMGS.length]}
                          alt={ev.title}
                          onError={e => { e.target.src = PLACEHOLDER_IMGS[i % PLACEHOLDER_IMGS.length] }}
                        />
                        {isSoldOut && <span className="ev-badge ev-badge-soldout">AGOTADO</span>}
                        {!isSoldOut && isLowStock && <span className="ev-badge ev-badge-low">ÚLTIMAS</span>}
                        {!isSoldOut && !isLowStock && isNew && !ev.urlImage && <span className="ev-badge ev-badge-new">New</span>}
                      </div>
                      
                      <div className="ev-card-body">
                        <div className="ev-card-title">{ev.title}</div>
                        <div className="ev-card-location">{ev.location}</div>
                        {ev.startDate && (
                          <div className="ev-card-meta">
                            📅 {new Date(ev.startDate).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' })}
                          </div>
                        )}
                        
                        <div className="ev-card-footer">
                          <div>
                            <div className="ev-stock-info">
                              {isSoldOut ? (
                                <span className="stock-text soldout">Sin entradas</span>
                              ) : (
                                <span className="stock-text">{ev.availableTickets} disponibles</span>
                              )}
                            </div>
                            <span className="ev-card-price">
                              {ev.price === 0 ? 'Gratis' : `${ev.price}€`}
                            </span>
                          </div>
                          
                          <button
                            className={`ev-add-btn${added ? ' added' : ''}${isSoldOut ? ' disabled' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              e.preventDefault()
                              if (isSoldOut) return
                              if (added) removeFromCart(ev.idEvent || ev.id)
                              else handleAdd(e, ev)
                            }}
                            disabled={isSoldOut}
                          >
                            {isSoldOut ? 'Agotado' : added ? '✓ Añadido' : '+ Carrito'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
          }
        </div>

        {/* Paginación */}
        {!loading && events.length > EVENTS_PER_PAGE && (
          <div className="ev-pagination">
            <button
              className="ev-page-btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ← Anterior
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`ev-page-btn${page === currentPage ? ' active' : ''}`}
                onClick={() => goToPage(page)}
              >
                {page}
              </button>
            ))}
            
            <button
              className="ev-page-btn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
      <footer className="home-footer">
        <Link to="/" className="home-footer-logo">booqi</Link>
        <div className="home-footer-links">
          <Link to="/">Inicio</Link>
          <Link to="/events">Eventos</Link>
          <Link to="/contact">Contacto</Link>
        </div>
        <span className="home-footer-copy">2026 booqi. Todos los derechos reservados a Mel y Renzo</span>
      </footer>
    </div>
  )
}
