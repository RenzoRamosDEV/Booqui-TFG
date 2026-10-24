import { useIsPresent } from 'motion/react'
import { Navigate, Outlet, useLocation } from 'react-router'
import {
  loginRedirectPath,
  resolveAccess,
  type AccessRequirement,
} from '../features/auth/hooks/access'
import { useSessionStore } from '../features/auth/hooks/session-store'
import { NotFoundPage } from './pages/NotFoundPage'

export function RequireAuth({ requirement }: { requirement: AccessRequirement }) {
  const user = useSessionStore((state) => state.user)
  const location = useLocation()
  const isPresent = useIsPresent()
  const access = resolveAccess(user, requirement)

  if (access === 'login') {
    // A page fading out still re-renders with the new location; redirecting from it would loop.
    return isPresent ? <Navigate to={loginRedirectPath(location)} replace /> : null
  }
  if (access === 'forbidden') return <NotFoundPage />
  return <Outlet />
}
