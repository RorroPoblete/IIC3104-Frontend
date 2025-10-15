import './App.css'
import React from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './components/AuthContext'
import LoginPage from './pages/Login'
import LoginCallback from './pages/LoginCallback'
import AdminPage from './pages/Admin'
import CodificationPage from './pages/Codification'

const RequireAdmin: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  if (loading) return null
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
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
            <RequireAdmin>
              <AdminPage />
            </RequireAdmin>
          }
        />
        <Route
          path="/codification"
          element={
            <RequireAdmin>
              <CodificationPage />
            </RequireAdmin>
          }
        />
        <Route path="/login/callback" element={<LoginCallback />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
