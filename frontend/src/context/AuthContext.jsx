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
  // Distinguishes "still checking for a circle" from "checked, and there
  // isn't one" — circleId alone can't tell those apart, since it's null in
  // both cases. Pages use this to show a real message instead of an
  // infinite loading state when a caregiver has no circle to join yet.
  const [circleChecked, setCircleChecked] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const stored = localStorage.getItem('user')
    if (token && stored) {
      const u = JSON.parse(stored)
      setUser(u)
      ensureCircle(u)
        .then(c => setCircleId(c.circle_id))
        .catch(() => {})
        .finally(() => { setCircleChecked(true); setLoading(false) })
    } else {
      setLoading(false)
    }
  }, [])

  function login(userData, token) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    setCircleChecked(false)
    ensureCircle(userData)
      .then(c => setCircleId(c.circle_id))
      .catch(() => {})
      .finally(() => setCircleChecked(true))
  }

  function logout() {
    api.logout().catch(() => {})
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setCircleId(null)
    setCircleChecked(false)
  }

  return (
    <AuthContext.Provider value={{ user, circleId, circleChecked, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
