import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('ss_theme') === 'dark')
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('ss_sidebar') === 'true')
  const [username, setUsername] = useState(() => localStorage.getItem('ss_username') || '')

  const toggleTheme = useCallback(() => {
    setDark(d => {
      const next = !d
      document.body.classList.toggle('dark', next)
      localStorage.setItem('ss_theme', next ? 'dark' : 'light')
      return next
    })
  }, [])

  const toggleSidebar = useCallback(() => {
    setCollapsed(c => {
      const next = !c
      localStorage.setItem('ss_sidebar', next)
      return next
    })
  }, [])

  return (
    <AppContext.Provider value={{ dark, collapsed, username, toggleTheme, toggleSidebar, setUsername }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}
