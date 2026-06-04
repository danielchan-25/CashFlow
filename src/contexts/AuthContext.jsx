import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

async function checkAuth(password) {
  const headers = { 'Content-Type': 'application/json' }
  if (password) headers['Authorization'] = `Bearer ${password}`
  try {
    const res = await fetch('/api/accounts', { headers })
    return res.ok
  } catch {
    return false
  }
}

export function AuthProvider({ children }) {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('cashflow_password')
    checkAuth(saved).then(ok => {
      if (ok) {
        setAuthenticated(true)
      } else {
        localStorage.removeItem('cashflow_password')
      }
    }).finally(() => setLoading(false))
  }, [])

  async function login(password) {
    const ok = await checkAuth(password)
    if (!ok) throw new Error('密码错误')
    localStorage.setItem('cashflow_password', password)
    setAuthenticated(true)
  }

  function logout() {
    localStorage.removeItem('cashflow_password')
    setAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ authenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
