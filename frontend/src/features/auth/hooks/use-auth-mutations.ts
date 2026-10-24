import { useMutation } from '@tanstack/react-query'
import type { UpdateUserRequest } from '../../../types/user'
import { login, register, updateUser } from '../api/users-api'
import { useSessionStore } from './session-store'

export function useLogin() {
  const signIn = useSessionStore((state) => state.signIn)
  return useMutation({ mutationFn: login, onSuccess: signIn })
}

export function useRegister() {
  return useMutation({ mutationFn: register })
}

export function useUpdateProfile(userId: number) {
  const signIn = useSessionStore((state) => state.signIn)
  return useMutation({
    mutationFn: (patch: UpdateUserRequest) => updateUser(userId, patch),
    onSuccess: signIn,
  })
}
