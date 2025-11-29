import './App.css'
import React from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthContext'
import LoginPage from './pages/Login'
import LoginCallback from './pages/LoginCallback'
import AdminPage from './pages/Admin'
import CodificationPage from './pages/Codification'
import NormsPage from './pages/NormsPage'
import UserManagementPage from './pages/UserManagement'

const RequireAuth: React.FC<{ children: React.ReactElement; allowedRoles?: string[] }> = ({
  children,
  allowedRoles
}) => {
  const { isAuthorized, loading, appUser } = useAuth()
  const location = useLocation()

  if (loading) return null

  if (!isAuthorized) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (allowedRoles && appUser && !allowedRoles.includes(appUser.role)) {
    // Redirigir a una ruta apropiada según el rol del usuario en lugar de volver a login
    const getDefaultRoute = (role?: string) => {
      if (role === 'Administrador') {
        return '/admin'
      }
      // Para Analista, Codificador, Finanzas u otros roles, redirigir a codification
      return '/codification'
    }
    const defaultRoute = getDefaultRoute(appUser.role)
    return <Navigate to={defaultRoute} replace />
  }

  return children
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth allowedRoles={['Administrador']}>
              <AdminPage />
            </RequireAuth>
          }
        />
        <Route
          path="/codification"
          element={
            <RequireAuth>
              <CodificationPage />
            </RequireAuth>
          }
        />
        <Route
          path="/norms"
          element={
            <RequireAuth>
              <NormsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAuth allowedRoles={['Administrador']}>
              <UserManagementPage />
            </RequireAuth>
          }
        />
        <Route path="/login/callback" element={<LoginCallback />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
