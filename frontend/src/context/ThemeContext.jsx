import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { api } from '../services/api'

const ThemeContext = createContext(null)
const DEFAULT_THEME = 'sage-cream'

export function ThemeProvider({ children }) {
  const { user, loading: authLoading } = useAuth()
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || DEFAULT_THEME)

  // AuthContext's `user` only carries the login-response shape (no theme) —
  // fetch the full profile once we know who's logged in.
  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setThemeState(DEFAULT_THEME)
      localStorage.removeItem('theme')
      return
    }
    api.getMe().then(me => {
      const resolved = me.theme || DEFAULT_THEME
      setThemeState(resolved)
      localStorage.setItem('theme', resolved)
    }).catch(() => {})
  }, [user, authLoading])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  async function setTheme(next) {
    const prev = theme
    setThemeState(next)
    localStorage.setItem('theme', next)
    try {
      await api.updateProfile({ theme: next })
    } catch (err) {
      setThemeState(prev)
      localStorage.setItem('theme', prev)
      throw err
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
