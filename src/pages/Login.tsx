import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography } from 'antd'
import { UserOutlined, LockOutlined, MedicineBoxOutlined } from '@ant-design/icons'
import { useAuth } from '../components/AuthContext'
import { useNavigate } from 'react-router-dom'

const LoginPage: React.FC = () => {
  const { loginWithRedirect } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const handleLogin = async () => {
    setSubmitting(true)
    try {
      await loginWithRedirect()
      navigate('/admin')
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
              Ingreso Administrador
            </Typography.Text>
          </div>

          <Form form={form} name="login" layout="vertical" size="large">
            <Form.Item style={{ marginBottom: '1rem' }}>
              <Button
                type="primary"
                onClick={handleLogin}
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
                {submitting ? 'Redirigiendo…' : 'Ingresar con Auth0'}
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
