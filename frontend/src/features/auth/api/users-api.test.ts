import { ApiError } from '../../../lib/api-error'
import { installFakeApi } from '../../../test/fake-api'
import { userWith } from '../../../test/users'
import type { CreateUserRequest } from '../../../types/user'
import { deleteUser, listUsers, login, register, updateUser, userKeys } from './users-api'

const customer = userWith('CUSTOMER')
const admin = { ...userWith('ADMIN'), id: 2 }

const registration: CreateUserRequest = {
  firstName: 'Mel',
  lastName: 'García',
  dateOfBirth: '2000-01-01',
  contactPhone: '+34600111222',
  contactEmail: 'mel@booqi.com',
  password: 'secreto123',
  role: 'CUSTOMER',
}

describe('users api', () => {
  it('logs in with contactEmail and password', async () => {
    const api = installFakeApi()
    api.post('/api/v1/users/login', { status: 200, data: customer })

    await expect(login({ contactEmail: 'mel@booqi.com', password: 'x' })).resolves.toEqual(customer)
    expect(api.requests[0]!.body).toStrictEqual({ contactEmail: 'mel@booqi.com', password: 'x' })
  })

  it('registers a user', async () => {
    const api = installFakeApi()
    api.post('/api/v1/users', { status: 201, data: customer })

    await expect(register(registration)).resolves.toEqual(customer)
    expect(api.requests[0]!.body).toStrictEqual(registration)
  })

  it('updates a user sending only the patch', async () => {
    const api = installFakeApi()
    const updated = { ...customer, contactPhone: '+34600111222' }
    api.put('/api/v1/users/1', { status: 200, data: updated })

    await expect(updateUser(1, { contactPhone: '+34600111222' })).resolves.toEqual(updated)
    expect(api.requests[0]!.body).toStrictEqual({ contactPhone: '+34600111222' })
  })

  it('lists every user without query string', async () => {
    const api = installFakeApi()
    api.get('/api/v1/users', { status: 200, data: [customer, admin] })

    await expect(listUsers()).resolves.toEqual([customer, admin])
    expect(api.requests[0]!.url).toBe('/api/v1/users')
  })

  it('deletes a user answering 204', async () => {
    const api = installFakeApi()
    api.delete('/api/v1/users/9', { status: 204 })

    await expect(deleteUser(9)).resolves.toBeUndefined()
    expect(api.requests[0]!.method).toBe('DELETE')
  })

  it.each([
    ['login', () => login({ contactEmail: 'a@b.com', password: 'x' })],
    ['register', () => register(registration)],
    ['updateUser', () => updateUser(1, { firstName: 'Ana' })],
    ['listUsers', () => listUsers()],
  ])('%s rejects a response that breaks the schema', async (_name, call) => {
    const api = installFakeApi()
    const broken = { ...customer, role: 'ROOT' }
    api.post('/api/v1/users/login', { status: 200, data: broken })
    api.post('/api/v1/users', { status: 201, data: broken })
    api.put('/api/v1/users/1', { status: 200, data: broken })
    api.get('/api/v1/users', { status: 200, data: [broken] })

    const error = await call().catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(Error)
    expect(error).not.toBeInstanceOf(ApiError)
  })

  it('rejects HTTP failures as ApiError', async () => {
    const api = installFakeApi()
    api.post('/api/v1/users/login', {
      status: 401,
      data: { status: 401, detail: 'Invalid email or password' },
    })

    const error = await login({ contactEmail: 'a@b.com', password: 'x' }).catch(
      (reason: unknown) => reason,
    )
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 401 })
  })

  it('builds stable query keys', () => {
    expect(userKeys.all).toEqual(['users'])
  })
})
