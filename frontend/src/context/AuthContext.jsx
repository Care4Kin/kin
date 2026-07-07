import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [circleId, setCircleId] = useState(null)

  function login(userData, token) {
    localStorage.setItem('token', token)
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
    setCircleId(null)
  }

  return (
    <AuthContext.Provider value={{ user, circleId, setCircleId, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
