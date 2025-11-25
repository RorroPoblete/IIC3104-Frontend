import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth0, User as Auth0User } from '@auth0/auth0-react'
import type { RedirectLoginOptions } from '@auth0/auth0-spa-js'
import { apiUrl } from '../utils/apiConfig'
import { authFetch } from '../utils/authFetch'

type AuthUser = Pick<Auth0User, 'email' | 'name' | 'sub'> & Record<string, any>

type AppUser = {
  id: string
  name: string
  email: string
  role: string
}

type AuthContextType = {
  user: AuthUser | null
  appUser: AppUser | null
  isAuthenticated: boolean
  isAuthorized: boolean
  loading: boolean
  loadingAppUser: boolean
  authError: string | null
  loginWithRedirect: (options?: RedirectLoginOptions) => Promise<void>
  logout: () => void
  refreshAppUser: () => Promise<void>
  clearAuthError: () => void
  getAccessTokenSilently: (opts?: any) => Promise<string>
}

const AUTH_ERROR_STORAGE_KEY = 'appAuthError'

const readStoredAuthError = () => {
  try {
    return sessionStorage.getItem(AUTH_ERROR_STORAGE_KEY)
  } catch (err) {
    console.warn('No se pudo leer el error de autenticación almacenado', err)
    return null
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout, getAccessTokenSilently } = useAuth0()
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loadingAppUser, setLoadingAppUser] = useState(false)
  const [authError, setAuthError] = useState<string | null>(() => readStoredAuthError())

  const persistAuthError = useCallback((value: string | null) => {
    try {
      if (value) {
        sessionStorage.setItem(AUTH_ERROR_STORAGE_KEY, value)
      } else {
        sessionStorage.removeItem(AUTH_ERROR_STORAGE_KEY)
      }
    } catch (err) {
      console.warn('No se pudo persistir el error de autenticación', err)
    }
  }, [])

  const clearAuthError = useCallback(() => {
    setAuthError(null)
    persistAuthError(null)
  }, [persistAuthError])

  const logoutAndReset = useCallback(() => {
    setAppUser(null)
    clearAuthError()
    logout({ logoutParams: { returnTo: window.location.origin } })
  }, [clearAuthError, logout])

  const refreshAppUser = useCallback(async () => {
    if (!isAuthenticated) {
      setAppUser(null)
      return
    }

    setLoadingAppUser(true)
    try {
      const res = await authFetch(apiUrl('/api/users/me'), { method: 'GET' }, getAccessTokenSilently)
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          const message = 'Tu cuenta no está autorizada para acceder al sistema'
          setAuthError(message)
          persistAuthError(message)
          logout({ logoutParams: { returnTo: window.location.origin } })
          return
        }
        throw new Error('No se pudo validar tu usuario')
      }

      const data: AppUser = await res.json()
      setAppUser(data)
      clearAuthError()
    } catch (err) {
      console.error('Error cargando el usuario de la aplicación', err)
      const message = 'No se pudo validar tu sesión. Intenta nuevamente.'
      setAuthError(message)
      persistAuthError(message)
    } finally {
      setLoadingAppUser(false)
    }
  }, [clearAuthError, getAccessTokenSilently, isAuthenticated, logout, persistAuthError])

  useEffect(() => {
    refreshAppUser()
  }, [refreshAppUser])

  const value = useMemo(
    () => ({
      user: (user as AuthUser) || null,
      appUser,
      isAuthenticated: !!isAuthenticated,
      isAuthorized: !!isAuthenticated && !!appUser,
      loading: !!isLoading || loadingAppUser,
      loadingAppUser,
      authError,
      loginWithRedirect,
      logout: logoutAndReset,
      refreshAppUser,
      clearAuthError,
      getAccessTokenSilently,
    }),
    [
      appUser,
      authError,
      getAccessTokenSilently,
      isAuthenticated,
      isLoading,
      loadingAppUser,
      loginWithRedirect,
      logoutAndReset,
      refreshAppUser,
      clearAuthError,
      user,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
