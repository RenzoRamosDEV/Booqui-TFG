import { z } from 'zod'
import type { CreateUserRequest } from '../../../types/user'

const PHONE = /^\+?[0-9]{9,15}$/
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/

const requiredEmail = z
  .string()
  .trim()
  .min(1, 'El email es obligatorio')
  .pipe(z.email('El email debe ser válido'))

function name(required: string, length: string) {
  return z.string().trim().min(1, required).min(2, length).max(50, length)
}

function localDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function pastDay(now: Date) {
  return z
    .string()
    .regex(ISO_DAY, 'La fecha de nacimiento es obligatoria')
    .refine((day) => day < localDay(now), 'La fecha de nacimiento debe ser una fecha pasada')
}

const optionalPhone = z
  .string()
  .trim()
  .refine(
    (phone) => phone === '' || PHONE.test(phone),
    'El teléfono debe tener entre 9 y 15 dígitos',
  )

const PASSWORD_LENGTH = 'La contraseña debe tener al menos 8 caracteres'
const PASSWORD_MISMATCH = { message: 'Las contraseñas no coinciden', path: ['confirmPassword'] }

function personFields(now: Date) {
  return {
    firstName: name('El nombre es obligatorio', 'El nombre debe tener entre 2 y 50 caracteres'),
    lastName: name('El apellido es obligatorio', 'El apellido debe tener entre 2 y 50 caracteres'),
    dateOfBirth: pastDay(now),
    contactPhone: optionalPhone,
    contactEmail: requiredEmail,
  }
}

export const loginSchema = z.object({
  contactEmail: requiredEmail,
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export type LoginValues = z.input<typeof loginSchema>

export function registerSchema(now = new Date()) {
  return z
    .object({
      ...personFields(now),
      password: z.string().min(8, PASSWORD_LENGTH),
      confirmPassword: z.string(),
    })
    .refine((values) => values.password === values.confirmPassword, PASSWORD_MISMATCH)
}

export type RegisterValues = z.input<ReturnType<typeof registerSchema>>

export function profileSchema(now = new Date()) {
  return z
    .object({
      ...personFields(now),
      password: z
        .string()
        .refine((password) => password === '' || password.length >= 8, PASSWORD_LENGTH),
      confirmPassword: z.string(),
    })
    .refine((values) => values.password === values.confirmPassword, PASSWORD_MISMATCH)
}

export type ProfileValues = z.input<ReturnType<typeof profileSchema>>

export function toCreateUserRequest(values: RegisterValues): CreateUserRequest {
  const { firstName, lastName, dateOfBirth, contactPhone, contactEmail, password } = values
  return {
    firstName,
    lastName,
    dateOfBirth,
    ...(contactPhone ? { contactPhone } : {}),
    contactEmail,
    password,
    role: 'CUSTOMER',
  }
}
