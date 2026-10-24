import type { Role, UserResponse } from '../../../types/user'
import { loginRedirectPath, resolveAccess, resolvePostLoginPath } from './access'

function userWith(role: Role): UserResponse {
  return {
    id: 1,
    firstName: 'A',
    lastName: 'B',
    dateOfBirth: '2000-01-01',
    contactPhone: null,
    contactEmail: 'a@b.c',
    role,
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
  }
}

describe('resolveAccess', () => {
  it.each([
    [null, 'auth', 'login'],
    [null, 'admin', 'login'],
    ['CUSTOMER', 'auth', 'allow'],
    ['CUSTOMER', 'admin', 'forbidden'],
    ['ADMIN', 'auth', 'allow'],
    ['ADMIN', 'admin', 'allow'],
  ] as const)('%s on a %s route gives %s', (role, requirement, expected) => {
    expect(resolveAccess(role && userWith(role), requirement)).toBe(expected)
  })
})

describe('loginRedirectPath', () => {
  it.each([
    [{ pathname: '/my-bookings', search: '' }, '/login?redirect=%2Fmy-bookings'],
    [
      { pathname: '/events', search: '?page=2&q=a b' },
      '/login?redirect=%2Fevents%3Fpage%3D2%26q%3Da%20b',
    ],
    [{ pathname: '/', search: '' }, '/login?redirect=%2F'],
  ])('encodes %j as %s', (location, expected) => {
    expect(loginRedirectPath(location)).toBe(expected)
  })
})

describe('resolvePostLoginPath', () => {
  it.each(['/x', '/my-bookings', '/events/3?tab=info', '/'])(
    'accepts the same-app path %j',
    (redirect) => {
      expect(resolvePostLoginPath(userWith('CUSTOMER'), redirect)).toBe(redirect)
    },
  )

  it.each(['//evil.example', '/\\evil', 'https://evil.example', 'events', '', null, undefined])(
    'rejects %j and falls back by role',
    (redirect) => {
      expect(resolvePostLoginPath(userWith('CUSTOMER'), redirect)).toBe('/')
      expect(resolvePostLoginPath(userWith('ADMIN'), redirect)).toBe('/admin')
    },
  )
})
