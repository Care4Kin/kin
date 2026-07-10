import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

function ensureCircle(userData) {
  return api.getMyCircle().catch(() => {
    if (userData.role === 'elder') return api.createCircle()
    throw new Error('No circle found')
  })
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [circleId, setCircleId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const stored = localStorage.getItem('user')
    if (token && stored) {
      const u = JSON.parse(stored)
      setUser(u)
      ensureCircle(u).then(c => setCircleId(c.circle_id)).catch(() => {}).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  function login(userData, token) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    ensureCircle(userData).then(c => setCircleId(c.circle_id)).catch(() => {})
  }

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setCircleId(null)
  }

  return (
    <AuthContext.Provider value={{ user, circleId, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
