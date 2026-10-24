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
  const access = resolveAccess(user, requirement)

  if (access === 'login') return <Navigate to={loginRedirectPath(location)} replace />
  if (access === 'forbidden') return <NotFoundPage />
  return <Outlet />
}
