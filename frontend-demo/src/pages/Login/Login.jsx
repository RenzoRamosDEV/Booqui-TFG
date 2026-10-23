import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { findUserByEmail } from '../../data/mockData'
import { useAuth } from '../../context/AuthContext'
import './Login.css'

const SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&q=80',
    title: <>Vive la música,<br />el arte y la <em>cultura.</em></>,
    sub: 'Los mejores conciertos y festivales están a un clic de distancia.',
  },
  {
    url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80',
    title: <>Conecta, aprende<br />y <em>crece</em> con otros.</>,
    sub: 'Descubre conferencias, workshops y eventos de networking cerca de ti.',
  },
  {
    url: 'https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=1200&q=80',
    title: <>Muévete, aprende<br />y <em>disfruta.</em></>,
    sub: 'Talleres de yoga, danza, meditación y mucho más cerca de ti.',
  },
]

export default function Login() {
  const [current, setCurrent] = useState(0)
  const [textVisible, setTextVisible] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setInterval(() => {
      setTextVisible(false)
      setTimeout(() => {
        setCurrent(prev => (prev + 1) % SLIDES.length)
        setTextVisible(true)
      }, 400)
    }, 4000)
    return () => clearInterval(timer)
  }, [])

  const goTo = (i) => {
    setTextVisible(false)
    setTimeout(() => { setCurrent(i); setTextVisible(true) }, 300)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Por favor completa todos los campos.'); return }
    setLoading(true)
    // Simular pequeña demora de red
    await new Promise(r => setTimeout(r, 400))
    try {
      const user = findUserByEmail(email)
      if (user && user.password === password) {
        login(user)
        navigate('/')
      } else {
        setError('Email o contraseña incorrectos.')
      }
    } catch {
      setError('Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">

      {/* PANEL IZQUIERDO */}
      <div className="login-left">
        {SLIDES.map((s, i) => (
          <div
            key={i}
            className={`login-slide${i === current ? ' active' : ''}`}
            style={{ backgroundImage: `url('${s.url}')` }}
          />
        ))}
        <div className="login-left-overlay" />
        <div className="login-left-content">
          <span className="login-left-top-label">booqi — eventos</span>
          <div className="login-tagline">
            <h2 style={{ opacity: textVisible ? 1 : 0, transition: 'opacity 0.4s ease' }}>
              {SLIDES[current].title}
            </h2>
            <p style={{ opacity: textVisible ? 1 : 0, transition: 'opacity 0.4s ease 0.1s' }}>
              {SLIDES[current].sub}
            </p>
          </div>
          <div className="login-dots">
            {SLIDES.map((_, i) => (
              <button key={i} className={`login-dot${i === current ? ' active' : ''}`} onClick={() => goTo(i)} />
            ))}
          </div>
        </div>
      </div>

      {/* PANEL DERECHO */}
      <div className="login-right">
        <Link to="/" className="login-logo-top">
          <span className="login-logo-text">booqi</span>
        </Link>

        <div className="login-form-wrapper">
          <div className="login-form-header">
            <h1>Bienvenido</h1>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {error && <div className="login-error">{error}</div>}

            <div className="login-field">
              <label htmlFor="email">Email</label>
              <input
                id="email" type="email" placeholder="tu@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div className="login-field">
              <label htmlFor="password">Contraseña</label>
              <input
                id="password" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? (
                <span className="login-btn-loading">
                  <span className="login-spinner" />Entrando...
                </span>
              ) : 'Iniciar sesión'}
            </button>
          </form>

          <div style={{ marginTop: '1rem', fontSize: '0.82rem', color: '#888', textAlign: 'center' }}>
            <p><strong>Demo:</strong></p>
            <p>Admin: admin@booqi.com / admin123</p>
            <p>User: user@booqi.com / user123</p>
          </div>

          <div className="login-register-link">
            ¿Primera vez aquí? <Link to="/register">Crea tu cuenta</Link>
          </div>
        </div>
      </div>

    </div>
  )
}
