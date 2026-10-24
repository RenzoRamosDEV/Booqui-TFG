import type { UserResponse } from '../../../types/user'

export type AccessRequirement = 'auth' | 'admin'
export type AccessDecision = 'allow' | 'login' | 'forbidden'

export function resolveAccess(
  user: UserResponse | null,
  requirement: AccessRequirement,
): AccessDecision {
  if (!user) return 'login'
  if (requirement === 'admin' && user.role !== 'ADMIN') return 'forbidden'
  return 'allow'
}

export function loginRedirectPath({ pathname, search }: { pathname: string; search: string }) {
  return `/login?redirect=${encodeURIComponent(pathname + search)}`
}

function isSameAppPath(path: string | null | undefined): path is string {
  return !!path && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\')
}

export function resolvePostLoginPath(
  user: Pick<UserResponse, 'role'>,
  redirect: string | null | undefined,
): string {
  if (isSameAppPath(redirect)) return redirect
  return user.role === 'ADMIN' ? '/admin' : '/'
}
