import { createContext, useContext, useState } from 'react'
import { MOCK_USERS } from '../data/mockData'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('booqi_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        // Verificar que el usuario sigue existiendo en mock data
        const exists = MOCK_USERS.find(u => u.idUser === parsed.idUser)
        if (exists) return parsed
      }
      return null
    } catch {
      return null
    }
  })

  const login = (userData) => {
    setUser(userData)
    localStorage.setItem('booqi_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('booqi_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
