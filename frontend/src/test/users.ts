import type { Role, UserResponse } from '../types/user'

export function userWith(role: Role, firstName = 'Mel'): UserResponse {
  return {
    id: 1,
    firstName,
    lastName: 'García',
    dateOfBirth: '2000-01-01',
    contactPhone: null,
    contactEmail: 'mel@booqi.com',
    role,
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
  }
}
