import { createContext, useContext, useState, useEffect } from 'react'

const AccessibilityContext = createContext(null)
const VALID_TEXT_SIZES = ['normal', 'large', 'xlarge']

export function AccessibilityProvider({ children }) {
  const [textSize, setTextSizeState] = useState(() => {
    const stored = localStorage.getItem('textSize')
    return VALID_TEXT_SIZES.includes(stored) ? stored : 'normal'
  })
  const [highContrast, setHighContrastState] = useState(() => localStorage.getItem('highContrast') === 'true')

  useEffect(() => {
    document.documentElement.setAttribute('data-text-size', textSize)
  }, [textSize])

  useEffect(() => {
    document.documentElement.setAttribute('data-high-contrast', String(highContrast))
  }, [highContrast])

  function setTextSize(next) {
    setTextSizeState(next)
    localStorage.setItem('textSize', next)
  }

  function setHighContrast(next) {
    setHighContrastState(next)
    localStorage.setItem('highContrast', String(next))
  }

  return (
    <AccessibilityContext.Provider value={{ textSize, setTextSize, highContrast, setHighContrast }}>
      {children}
    </AccessibilityContext.Provider>
  )
}

export function useAccessibility() {
  return useContext(AccessibilityContext)
}
