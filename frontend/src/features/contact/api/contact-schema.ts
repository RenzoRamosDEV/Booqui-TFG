import { z } from 'zod'

export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Indica tu nombre'),
  email: z.string().trim().min(1, 'Indica tu email').pipe(z.email('El email debe ser válido')),
  subject: z.string().trim().min(1, 'Indica el asunto'),
  message: z
    .string()
    .trim()
    .min(1, 'Escribe tu mensaje')
    .max(2000, 'El mensaje no puede superar 2000 caracteres'),
})

export type ContactValues = z.output<typeof contactSchema>
