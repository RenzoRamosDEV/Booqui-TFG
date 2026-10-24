// MOCK: sin endpoint de contacto. El backend no tiene ningún endpoint para recibir mensajes
// (ver docs/BACKEND_GAPS.md, «Formulario de contacto»); el envío se simula en el navegador.
import type { ContactValues } from '../features/contact/api/contact-schema'

const SIMULATED_DELAY_MS = 900

export function sendContactMessage(values: ContactValues): Promise<{ receivedBy: string }> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ receivedBy: values.name }), SIMULATED_DELAY_MS)
  })
}
