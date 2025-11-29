import React, { useEffect, useMemo, useState } from 'react'
import { Form, Button, Card, Typography, Alert } from 'antd'
import { ArrowLeftOutlined, MedicineBoxOutlined } from '@ant-design/icons'
import type { RedirectLoginOptions } from '@auth0/auth0-spa-js'
import { useAuth } from '../components/AuthContext'
import { useLocation, useNavigate } from 'react-router-dom'

const LoginPage: React.FC = () => {
  const { loginWithRedirect, isAuthorized, loading, authError, clearAuthError, appUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const getDefaultRoute = (role?: string) => {
    if (role === 'Administrador') {
      return '/admin'
    }
    // Para Analista, Codificador, Finanzas u otros roles, redirigir a codification
    return '/codification'
  }

  const returnTo = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | undefined
    if (state?.from?.pathname) {
      return state.from.pathname
    }
    // Si tenemos el usuario, usar su rol para determinar la ruta por defecto
    if (appUser?.role) {
      return getDefaultRoute(appUser.role)
    }
    // Por defecto, ir a codification (más seguro que /admin)
    return '/codification'
  }, [location.state, appUser?.role])

  useEffect(() => {
    if (!loading && isAuthorized && appUser) {
      // Verificar que la ruta de destino sea accesible para el rol del usuario
      const targetRoute = returnTo
      const isAdminRoute = targetRoute.startsWith('/admin')
      
      if (isAdminRoute && appUser.role !== 'Administrador') {
        // Si intenta ir a una ruta de admin pero no es administrador, redirigir a su ruta por defecto
        navigate(getDefaultRoute(appUser.role), { replace: true })
      } else {
        navigate(targetRoute, { replace: true })
      }
    }
  }, [isAuthorized, loading, navigate, returnTo, appUser])

  const handleLogin = async (forcePrompt = false) => {
    clearAuthError()
    setSubmitting(true)
    try {
      const redirectOptions: RedirectLoginOptions = {
        appState: { returnTo }
      }

      if (forcePrompt) {
        redirectOptions.authorizationParams = {
          ...redirectOptions.authorizationParams,
          prompt: 'login'
        }
      }

      await loginWithRedirect(redirectOptions)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <Card className="uc-card" style={{ borderRadius: '16px' }}>
          <div className="text-center mb-6">
            <MedicineBoxOutlined 
              style={{ 
                fontSize: '3rem', 
                color: 'var(--uc-primary-blue)',
                marginBottom: '1rem'
              }} 
            />
            <h1 className="uc-form-title">UC CHRISTUS</h1>
            <p className="uc-form-subtitle">Sistema Unificado GRD-FONASA</p>
            <Typography.Text type="secondary">
              Inicio de Sesión
            </Typography.Text>
          </div>

          <Form form={form} name="login" layout="vertical" size="large">
            {authError && (
              <Alert
                type="error"
                message={authError}
                showIcon
                style={{ marginBottom: '1rem' }}
              />
            )}
            {authError && (
              <Form.Item style={{ marginBottom: '1rem' }}>
                <Button
                  icon={<ArrowLeftOutlined />}
                  block
                  onClick={() => handleLogin(true)}
                >
                  Volver e intentar con otra cuenta
                </Button>
              </Form.Item>
            )}
            <Form.Item style={{ marginBottom: '1rem' }}>
              <Button
                type="primary"
                onClick={() => handleLogin()}
                loading={submitting}
                className="btn-primary"
                style={{
                  width: '100%',
                  height: '48px',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                {submitting ? 'Redirigiendo…' : 'Ingresar'}
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center" />
        </Card>

        <div className="text-center mt-4">
          <Typography.Text type="secondary" style={{ fontSize: '0.875rem' }}>
            © 2024 UC CHRISTUS - Sistema Unificado de Codificación y Facturación GRD-FONASA
          </Typography.Text>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
