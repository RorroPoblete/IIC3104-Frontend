import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type AuthUser = {
  email?: string
}

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  loading: boolean
  loginWithRedirect: () => Promise<void>
  logout: () => void
  handleCallback: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const raw = localStorage.getItem('auth:user')
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AuthUser
        setUser(parsed)
      } catch {
        localStorage.removeItem('auth:user')
      }
    }
    setLoading(false)
  }, [])

  const loginWithRedirect = useCallback(async () => {
    // Simula redirección a proveedor y vuelve a /login/callback
    window.location.replace('/login/callback')
  }, [])

  const handleCallback = useCallback(() => {
    // Marca sesión iniciada de forma local (stub sin IdP)
    const demoUser: AuthUser = { email: 'admin@example.com' }
    localStorage.setItem('auth:user', JSON.stringify(demoUser))
    setUser(demoUser)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('auth:user')
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      loginWithRedirect,
      logout,
      handleCallback,
    }),
    [user, loading, loginWithRedirect, logout, handleCallback],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return ctx
}


