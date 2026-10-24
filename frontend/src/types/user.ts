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

export type LoginRequest = { contactEmail: string; password: string }

export type CreateUserRequest = {
  firstName: string
  lastName: string
  dateOfBirth: string
  contactPhone?: string
  contactEmail: string
  password: string
  role: Role
}

export type UpdateUserRequest = Partial<Omit<CreateUserRequest, 'role'>>
