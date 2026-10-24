import { z } from 'zod'
import { http } from '../../../lib/http'
import type {
  CreateUserRequest,
  LoginRequest,
  UpdateUserRequest,
  UserResponse,
} from '../../../types/user'
import { userResponseSchema } from './schemas'

const BASE = '/api/v1/users'

export const userKeys = {
  all: ['users'] as const,
}

export async function login(credentials: LoginRequest): Promise<UserResponse> {
  const { data } = await http.post<unknown>(`${BASE}/login`, credentials)
  return userResponseSchema.parse(data)
}

export async function register(body: CreateUserRequest): Promise<UserResponse> {
  const { data } = await http.post<unknown>(BASE, body)
  return userResponseSchema.parse(data)
}

export async function updateUser(id: number, patch: UpdateUserRequest): Promise<UserResponse> {
  const { data } = await http.put<unknown>(`${BASE}/${id}`, patch)
  return userResponseSchema.parse(data)
}

export async function listUsers(): Promise<UserResponse[]> {
  const { data } = await http.get<unknown>(BASE)
  return z.array(userResponseSchema).parse(data)
}

export async function deleteUser(id: number): Promise<void> {
  await http.delete(`${BASE}/${id}`)
}
