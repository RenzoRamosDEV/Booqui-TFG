import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MOCK_EVENTS } from '../../data/mockData'
import Navbar from '../../components/Navbar/Navbar'
import './Home.css'

const FEATURED_IMAGES = [
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80',
  'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&q=80',
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&q=80',
  'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80',
]

const HASHTAG_IMAGES = [
  { src: MOCK_EVENTS[0].urlImage,  area: '1 / 1 / 3 / 2' },   // tall 2x1
  { src: MOCK_EVENTS[4].urlImage,   area: '1 / 2 / 2 / 3' },   // normal
  { src: MOCK_EVENTS[9].urlImage,   area: '1 / 3 / 2 / 5' },   // wide 1x2
  { src: MOCK_EVENTS[7].urlImage,  area: '2 / 2 / 3 / 3' },   // normal
  { src: MOCK_EVENTS[5].urlImage,  area: '2 / 3 / 3 / 4' },   // normal
  { src: MOCK_EVENTS[11].urlImage, area: '2 / 4 / 3 / 5' },   // normal
  { src: MOCK_EVENTS[3].urlImage,  area: '3 / 1 / 4 / 2' },   // normal
  { src: MOCK_EVENTS[13].urlImage, area: '3 / 2 / 4 / 3' },   // normal
  { src: MOCK_EVENTS[15].urlImage, area: '3 / 3 / 4 / 4' },   // normal
  { src: MOCK_EVENTS[17].urlImage, area: '3 / 4 / 4 / 5' },   // normal
]

export default function Home() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Simular carga desde datos mock
    setEvents(MOCK_EVENTS.slice(0, 6))
    setLoading(false)
  }, [])

  const handleEventClick = (eventId) => {
    navigate(`/events/${eventId}`)
  }

  return (
    <div className="home-root">
      <Navbar />

      <section className="home-hero">
        <div className="home-hero-bg" />
        <div className="home-hero-overlay" />
        <div className="home-hero-card">
          <h1>Gestiona tus eventos sin complicaciones.</h1>
          <Link to="/events" className="home-hero-cta">EMPIEZA AHORA</Link>
        </div>
      </section>

      <section className="home-featured">
        <div className="home-featured-text">
          <h2>Explora los mejores eventos de la semana.</h2>
          <p>"Soluciones a medida para cada tipo de reserva."</p>
          
          <Link to="/events" className="home-featured-link">Explorar más</Link>
        </div>
        <div className="home-featured-slider">
          {loading
            ? Array.from({ length: 6 }, (_, i) => i + 1).map(i => (
                <div key={i} style={{ flex: '0 0 260px', height: 220, borderRadius: 6 }} className="home-skeleton" />
              ))
            : events.map((ev, i) => (
                <div 
                  key={ev.idEvent || i} 
                  className="home-featured-card" 
                  onClick={() => handleEventClick(ev.idEvent)}
                >
                  <img
                    src={ev.urlImage || FEATURED_IMAGES[i % FEATURED_IMAGES.length]}
                    alt={ev.title}
                    onError={e => { e.target.src = FEATURED_IMAGES[i % FEATURED_IMAGES.length] }}
                  />
                  <div className="home-featured-card-info">
                    <div className="home-featured-card-date">
                      {ev.startDate ? new Date(ev.startDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''} — {ev.location}
                    </div>
                    <div className="home-featured-card-title">{ev.title}</div>
                  </div>
                </div>
              ))
          }
        </div>
      </section>

      {/* Opiniones */}
      <section className="home-testimonials">
        <div className="home-testimonials-header">
          <p className="subtitle">LO QUE DICEN DE NOSOTROS</p>
          <h2>Nuestros clientes confían en Booqi</h2>
        </div>
        
        <div className="home-testimonials-grid">
          <div className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <p>"La mejor plataforma para organizar mis talleres de yoga. La interfaz es intuitiva y el soporte técnico es excelente."</p>
            <div className="testimonial-user">
              <img src="https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg" alt="Ana García" />
              <div>
                <span className="user-name">Ana García</span>
                <span className="user-role">Instructora de Yoga</span>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <p>"Comprar entradas nunca fue tan rápido. Recibo mis tickets al instante y el proceso de pago es muy seguro."</p>
            <div className="testimonial-user">
              <img src="https://i.pravatar.cc/150?u=marcos" alt="Marcos Ruiz" />
              <div>
                <span className="user-name">Marcos Ruiz</span>
                <span className="user-role">Asistente frecuente</span>
              </div>
            </div>
          </div>

          <div className="testimonial-card">
            <div className="testimonial-stars">★★★★★</div>
            <p>"Gestionar el aforo de mi club se ha vuelto una tarea sencilla gracias a las herramientas de Booqi."</p>
            <div className="testimonial-user">
              <img src="https://images.pexels.com/photos/21370302/pexels-photo-21370302.jpeg" alt="Carlos Rodríguez" />
              <div>
                <span className="user-name">Carlos Rodríguez</span>
                <span className="user-role">Manager de eventos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hashtag Section */}
      <section className="home-hashtag">
        <p>Comparte nuestros eventos con</p>
        <h3>#BooqiEvents</h3>
        <div className="home-hashtag-grid">
          {HASHTAG_IMAGES.map((img, i) => (
            <div key={i} className="home-hashtag-img" style={{ gridArea: img.area }}>
              <img src={img.src} alt="" />
            </div>
          ))}
        </div>
      </section>

      {/* Desarrolladores */}
      <section className="home-developers">
        <p className="subtitle">EQUIPO</p>
        <h2>Conoce a los desarrolladores</h2>
        <div className="home-developers-grid">
          <div className="home-developer-card">
            <div className="home-developer-avatar">
              <span>RR</span>
            </div>
            <h3>Renzo Ramos</h3>
            <div className="home-developer-links">
              <a
                href="https://www.linkedin.com/in/renzoinv04/"
                target="_blank"
                rel="noopener noreferrer"
                className="home-developer-link"
              >
                <i className="bi bi-linkedin"></i> LinkedIn
              </a>
              <a
                href="https://github.com/RenzoRamosDEV"
                target="_blank"
                rel="noopener noreferrer"
                className="home-developer-link"
              >
                <i className="bi bi-github"></i> GitHub
              </a>
            </div>
          </div>

          <div className="home-developer-card">
            <div className="home-developer-avatar">
              <span>MC</span>
            </div>
            <h3>Melanie Gabriela</h3>
            <div className="home-developer-links">
              <a
                href="https://www.linkedin.com/in/melanie-gabriela-cardenas-hidalgo-4b670a234/"
                target="_blank"
                rel="noopener noreferrer"
                className="home-developer-link"
              >
                <i className="bi bi-linkedin"></i> LinkedIn
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <span className="home-footer-logo">booqi</span>
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
