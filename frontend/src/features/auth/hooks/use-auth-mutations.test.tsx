import { act, renderHook, waitFor } from '@testing-library/react'
import { installFakeApi } from '../../../test/fake-api'
import { hookWrapper } from '../../../test/hook-wrapper'
import { userWith } from '../../../test/users'
import { useSessionStore } from './session-store'
import { useLogin, useRegister, useUpdateProfile } from './use-auth-mutations'

const customer = userWith('CUSTOMER')

describe('useLogin', () => {
  it('stores the returned user as the session', async () => {
    const api = installFakeApi()
    api.post('/api/v1/users/login', { status: 200, data: customer })
    const { result } = renderHook(() => useLogin(), hookWrapper())

    await act(() => result.current.mutateAsync({ contactEmail: 'mel@booqi.com', password: 'x' }))

    expect(useSessionStore.getState().user).toEqual(customer)
  })

  it('stores nothing when the login fails', async () => {
    const api = installFakeApi()
    api.post('/api/v1/users/login', { status: 401, data: { detail: 'Invalid email or password' } })
    const { result } = renderHook(() => useLogin(), hookWrapper())

    act(() => result.current.mutate({ contactEmail: 'mel@booqi.com', password: 'x' }))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(useSessionStore.getState().user).toBeNull()
  })
})

describe('useRegister', () => {
  it('creates the user without signing in', async () => {
    const api = installFakeApi()
    api.post('/api/v1/users', { status: 201, data: customer })
    const { result } = renderHook(() => useRegister(), hookWrapper())

    const created = await act(() =>
      result.current.mutateAsync({
        firstName: 'Mel',
        lastName: 'García',
        dateOfBirth: '2000-01-01',
        contactEmail: 'mel@booqi.com',
        password: 'secreto12',
        role: 'CUSTOMER',
      }),
    )

    expect(created).toEqual(customer)
    expect(api.requests[0]!.path).toBe('/api/v1/users')
    expect(useSessionStore.getState().user).toBeNull()
  })
})

describe('useUpdateProfile', () => {
  it('sends the patch for the session user and replaces the session', async () => {
    useSessionStore.setState({ user: customer })
    const updated = { ...customer, contactPhone: '+34600111222' }
    const api = installFakeApi()
    api.put('/api/v1/users/1', { status: 200, data: updated })
    const { result } = renderHook(() => useUpdateProfile(1), hookWrapper())

    await act(() => result.current.mutateAsync({ contactPhone: '+34600111222' }))

    expect(api.requests[0]!.body).toStrictEqual({ contactPhone: '+34600111222' })
    expect(useSessionStore.getState().user).toEqual(updated)
  })

  it('keeps the session when saving fails', async () => {
    useSessionStore.setState({ user: customer })
    const api = installFakeApi()
    api.put('/api/v1/users/1', { status: 409, data: { detail: 'taken' } })
    const { result } = renderHook(() => useUpdateProfile(1), hookWrapper())

    act(() => result.current.mutate({ contactEmail: 'otro@booqi.com' }))

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(useSessionStore.getState().user).toEqual(customer)
  })
})
