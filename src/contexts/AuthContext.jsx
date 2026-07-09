import { createContext, useContext, useState, useEffect } from 'react'
import { api } from '../lib/api'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasPassword, setHasPassword] = useState(false)

  useEffect(() => {
    api.getAuthStatus()
      .then(res => {
        setHasPassword(res.hasPassword)
        if (!res.hasPassword) setAuthenticated(true)
      })
      .catch(() => { setAuthenticated(true) })
      .finally(() => setLoading(false))
  }, [])

  async function login(password) {
    if (hasPassword) {
      await api.login(password)
    } else {
      await api.setupPassword(password)
      setHasPassword(true)
    }
    setAuthenticated(true)
  }

  function logout() {
    setAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ authenticated, loading, hasPassword, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
