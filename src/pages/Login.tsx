import React, { useState } from 'react'
import { Form, Input, Button, Card, Typography, message, Space } from 'antd'
import { UserOutlined, LockOutlined, MedicineBoxOutlined } from '@ant-design/icons'
import { useAuth } from '../components/AuthContext'
import { useNavigate } from 'react-router-dom'

const LoginPage: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [form] = Form.useForm()

  const handleSubmit = async (values: { email: string; password: string }) => {
    setSubmitting(true)
    try {
      const res = await login(values.email, values.password)
      if (res.ok) {
        message.success('Ingreso exitoso')
        navigate('/admin')
      } else {
        message.error(res.message || 'Credenciales inválidas')
      }
    } catch (error) {
      message.error('Error al iniciar sesión')
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

          <Form
            form={form}
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="email"
              label="Correo electrónico"
              rules={[
                { required: true, message: 'Por favor ingrese su correo electrónico' },
                { type: 'email', message: 'Ingrese un correo electrónico válido' }
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: 'var(--uc-gray-400)' }} />}
                placeholder="admin@demo.cl"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Contraseña"
              rules={[{ required: true, message: 'Por favor ingrese su contraseña' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: 'var(--uc-gray-400)' }} />}
                placeholder="Ingrese su contraseña"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: '1rem' }}>
              <Button
                type="primary"
                htmlType="submit"
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
                {submitting ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center">
            <Typography.Text type="secondary" style={{ fontSize: '0.875rem' }}>
              <strong>Usuario de prueba:</strong><br />
              admin@demo.cl / Admin!123
            </Typography.Text>
          </div>
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
