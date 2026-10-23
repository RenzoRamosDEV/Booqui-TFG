import { useState } from 'react'
import { addMockEvent } from '../../data/mockData'
import './CreateEventModal.css'

const CATEGORIES = ['Música', 'Arte', 'Deporte', 'Gastronomía', 'Tecnología', 'Educación', 'Otros']

export default function CreateEventModal({ isOpen, onClose, onEventCreated }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    availableTickets: '',
    location: '',
    startDate: '',
    endDate: '',
    organized: '',
    price: '',
    category: 'Otros',
    contactEmail: '',
    contactPhone: '',
    urlImage: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    if (!formData.title.trim()) newErrors.title = 'El título es obligatorio'
    if (formData.title.length < 3) newErrors.title = 'Mínimo 3 caracteres'
    
    if (!formData.availableTickets) newErrors.availableTickets = 'El número de entradas es obligatorio'
    if (formData.availableTickets < 0) newErrors.availableTickets = 'No puede ser negativo'
    
    if (!formData.location.trim()) newErrors.location = 'La ubicación es obligatoria'
    
    if (!formData.startDate) newErrors.startDate = 'La fecha de inicio es obligatoria'
    if (!formData.endDate) newErrors.endDate = 'La fecha de fin es obligatoria'
    
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'La fecha de fin debe ser posterior a la de inicio'
    }
    
    if (!formData.organized.trim()) newErrors.organized = 'El organizador es obligatorio'
    
    if (!formData.price && formData.price !== 0) newErrors.price = 'El precio es obligatorio'
    if (formData.price < 0) newErrors.price = 'El precio no puede ser negativo'
    
    if (!formData.contactEmail.trim()) newErrors.contactEmail = 'El email es obligatorio'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (formData.contactEmail && !emailRegex.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Email inválido'
    }
    
    if (!formData.contactPhone.trim()) newErrors.contactPhone = 'El teléfono es obligatorio'
    const phoneRegex = /^\+?[0-9]{9,15}$/
    if (formData.contactPhone && !phoneRegex.test(formData.contactPhone)) {
      newErrors.contactPhone = 'Teléfono inválido (9-15 dígitos)'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    try {
      const eventData = {
        ...formData,
        availableTickets: parseInt(formData.availableTickets),
        price: parseFloat(formData.price)
      }
      
      const newEvent = addMockEvent(eventData)
      
      if (newEvent) {
        onEventCreated(newEvent)
        onClose()
        resetForm()
      }
    } catch (err) {
      console.error('Error creando evento:', err)
      setErrors({ submit: 'Error al crear el evento' })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      availableTickets: '',
      location: '',
      startDate: '',
      endDate: '',
      organized: '',
      price: '',
      category: 'Otros',
      contactEmail: '',
      contactPhone: '',
      urlImage: ''
    })
    setErrors({})
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="create-event-modal-overlay" onClick={handleClose}>
      <div className="create-event-modal" onClick={(e) => e.stopPropagation()}>
        {/* Cabecera del modal */}
        <div className="create-event-modal-header">
          <h2>
            <i className="bi bi-calendar-plus"></i>
            Crear nuevo evento
          </h2>
          <button className="create-event-modal-close" onClick={handleClose}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Formulario de creación de evento */}
        <form onSubmit={handleSubmit} className="create-event-form">
          <div className="create-event-form-grid">
            
            {/* Título del evento - campo obligatorio */}
            <div className="form-group full-width">
              <label htmlFor="title">
                Título del evento <span className="required">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Ej: Festival de Música Indie 2026"
                className={errors.title ? 'error' : ''}
              />
              {errors.title && <span className="error-text">{errors.title}</span>}
            </div>

            {/* Descripción del evento - campo opcional */}
            <div className="form-group full-width">
              <label htmlFor="description">Descripción</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                placeholder="Describe el evento, horarios, actividades..."
              />
            </div>

            {/* Entradas disponibles y precio - dos columnas */}
            <div className="form-group">
              <label htmlFor="availableTickets">
                Nº de entradas <span className="required">*</span>
              </label>
              <input
                type="number"
                id="availableTickets"
                name="availableTickets"
                value={formData.availableTickets}
                onChange={handleChange}
                min="0"
                className={errors.availableTickets ? 'error' : ''}
              />
              {errors.availableTickets && <span className="error-text">{errors.availableTickets}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="price">
                Precio (€) <span className="required">*</span>
              </label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={errors.price ? 'error' : ''}
              />
              {errors.price && <span className="error-text">{errors.price}</span>}
              <small>0 = Evento gratuito</small>
            </div>

            {/* Ubicación - campo obligatorio */}
            <div className="form-group full-width">
              <label htmlFor="location">
                Ubicación <span className="required">*</span>
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ej: Auditorio Nacional, Madrid"
                className={errors.location ? 'error' : ''}
              />
              {errors.location && <span className="error-text">{errors.location}</span>}
            </div>

            {/* Fechas: inicio y fin - dos columnas */}
            <div className="form-group">
              <label htmlFor="startDate">
                Fecha y hora de inicio <span className="required">*</span>
              </label>
              <input
                type="datetime-local"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={errors.startDate ? 'error' : ''}
              />
              {errors.startDate && <span className="error-text">{errors.startDate}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="endDate">
                Fecha y hora de fin <span className="required">*</span>
              </label>
              <input
                type="datetime-local"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={errors.endDate ? 'error' : ''}
              />
              {errors.endDate && <span className="error-text">{errors.endDate}</span>}
            </div>

            {/* Organizador y categoría - dos columnas */}
            <div className="form-group">
              <label htmlFor="organized">
                Organizador <span className="required">*</span>
              </label>
              <input
                type="text"
                id="organized"
                name="organized"
                value={formData.organized}
                onChange={handleChange}
                placeholder="Ej: Rock Productions S.A."
                className={errors.organized ? 'error' : ''}
              />
              {errors.organized && <span className="error-text">{errors.organized}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="category">Categoría</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Email y teléfono de contacto - dos columnas */}
            <div className="form-group">
              <label htmlFor="contactEmail">
                Email de contacto <span className="required">*</span>
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="info@evento.com"
                className={errors.contactEmail ? 'error' : ''}
              />
              {errors.contactEmail && <span className="error-text">{errors.contactEmail}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="contactPhone">
                Teléfono de contacto <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="910123456"
                className={errors.contactPhone ? 'error' : ''}
              />
              {errors.contactPhone && <span className="error-text">{errors.contactPhone}</span>}
            </div>

            {/* URL de la imagen - campo opcional */}
            <div className="form-group full-width">
              <label htmlFor="urlImage">URL de la imagen</label>
              <input
                type="url"
                id="urlImage"
                name="urlImage"
                value={formData.urlImage}
                onChange={handleChange}
                placeholder="https://ejemplo.com/imagen.jpg"
              />
              <small>Dejar vacío para usar imagen por defecto</small>
            </div>
          </div>

          {/* Mensaje de error general */}
          {errors.submit && (
            <div className="form-error-banner">
              <i className="bi bi-exclamation-triangle"></i>
              {errors.submit}
            </div>
          )}

          {/* Botones del formulario */}
          <div className="create-event-modal-footer">
            <button type="button" className="btn-cancel" onClick={handleClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Creando...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg"></i>
                  Crear evento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
