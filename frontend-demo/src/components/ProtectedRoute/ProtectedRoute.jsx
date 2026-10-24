import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && user.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return children
}
