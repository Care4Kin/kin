import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../services/api'

const AuthContext = createContext(null)

function ensureCircle(userData) {
  return api.getMyCircle().catch(err => {
    // Only a "no circle yet" 404 should trigger creating one — any other
    // failure (network error, server error) should propagate as-is rather
    // than being silently treated as "elder needs a new circle".
    if (userData.role === 'elder' && err.status === 404) return api.createCircle()
    throw err
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
    api.logout().catch(() => {})
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
