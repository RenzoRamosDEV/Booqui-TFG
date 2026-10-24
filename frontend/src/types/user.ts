export type Role = 'ADMIN' | 'CUSTOMER'

export type UserResponse = {
  id: number
  firstName: string
  lastName: string
  dateOfBirth: string
  contactPhone: string | null
  contactEmail: string
  role: Role
  createdAt: string
  updatedAt: string
}
