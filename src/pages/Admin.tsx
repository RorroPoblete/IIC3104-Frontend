import React from 'react'
import { Card, Typography } from 'antd'
import { UserOutlined } from '@ant-design/icons'
import { useAuth } from '../components/AuthContext'
import { useNavigate } from 'react-router-dom'
import UCHeader from '../components/UCHeader'

const AdminPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="admin-page">
      <UCHeader 
        showNavigation={false}
        showUserActions={true}
        onLogout={handleLogout}
        userName={user?.email}
      />
      
      <div className="admin-content">
        <div className="text-center" style={{ paddingTop: '4rem' }}>
          <UserOutlined 
            style={{ 
              fontSize: '4rem', 
              color: 'var(--uc-primary-blue)',
              marginBottom: '2rem'
            }} 
          />
          
          <Typography.Title level={1} style={{ color: 'var(--uc-gray-900)', marginBottom: '1rem' }}>
            ¡Bienvenido, Administrador!
          </Typography.Title>
          
          <Typography.Paragraph 
            style={{ 
              fontSize: '1.2rem', 
              color: 'var(--uc-gray-600)',
              maxWidth: '600px',
              margin: '0 auto 2rem auto'
            }}
          >
            Has ingresado exitosamente al Sistema Unificado de Codificación y Facturación GRD-FONASA de UC CHRISTUS.
          </Typography.Paragraph>
          
          <Card className="uc-card" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <Typography.Text strong>Sesión iniciada como:</Typography.Text>
            <br />
            <Typography.Text type="secondary" style={{ fontSize: '1rem' }}>
              {user?.email}
            </Typography.Text>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AdminPage

