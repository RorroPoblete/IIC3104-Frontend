import React, { useEffect, useState } from 'react'
import { Card, Typography, Button, Row, Col } from 'antd'
import { 
  UserOutlined, 
  FileTextOutlined, 
  BarChartOutlined,
  TeamOutlined,
  BookOutlined,
  DollarOutlined,
  ToolOutlined,
  AuditOutlined
} from '@ant-design/icons'
import { useAuth } from '../components/AuthContext'
import { useNavigate } from 'react-router-dom'
import UCHeader from '../components/UCHeader'
import UCBreadcrumb from '../components/UCBreadcrumb'
import { authFetch } from '../utils/authFetch'

const API_BASE_URL = (import.meta.env.VITE_BACKEND_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

const AdminPage: React.FC = () => {
  const { user, appUser, logout, getAccessTokenSilently } = useAuth()
  const navigate = useNavigate()
  const userEmail = appUser?.email ?? user?.email
  const [totalUsers, setTotalUsers] = useState<number>(0)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleNavigateToCodification = () => {
    navigate('/codification')
  }

  const handleNavigateToNorms = () => {
    navigate('/norms')
  }

  const handleNavigateToUsers = () => {
    navigate('/admin/users')
  }
  const handleNavigateToPricing = () => {
    navigate('/pricing')
  }

  const handleNavigateToAjustes = () => {
    navigate('/ajustes')
  }

  const handleNavigateToAudit = () => {
    navigate('/auditoria')
  }

  const handleNavigateToReports = () => {
    navigate('/reportes')
  }

  // Cargar número total de usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await authFetch(
          `${API_BASE_URL}/api/users`,
          { method: 'GET' },
          getAccessTokenSilently
        )
        if (response.ok) {
          const users = await response.json()
          setTotalUsers(users.length)
        }
      } catch (error) {
        console.error('Error cargando usuarios:', error)
      }
    }
    fetchUsers()
  }, [getAccessTokenSilently])

  return (
    <div className="admin-page">
      <UCHeader 
        showNavigation={false}
        showUserActions={true}
        showCodificationButton={false}
        onLogout={handleLogout}
        userName={userEmail}
      />
      
      <div className="admin-content">
        <UCBreadcrumb />
        
        {/* Header Section */}
        <div style={{ marginBottom: '2rem' }}>
          <Typography.Title level={1} style={{ color: 'var(--uc-gray-900)', marginBottom: '0.5rem' }}>
            Dashboard Administrativo
          </Typography.Title>
          <Typography.Paragraph 
            style={{ 
              fontSize: '1.1rem', 
              color: 'var(--uc-gray-600)',
              marginBottom: '2rem'
            }}
          >
            Sistema Unificado de Codificación y Facturación GRD-FONASA
          </Typography.Paragraph>
        </div>

        {/* Welcome Card */}
        <Card className="uc-card" style={{ marginBottom: '2rem' }}>
          <Row align="middle" gutter={[16, 16]}>
            <Col xs={24} sm={24} md={8}>
              <div style={{ textAlign: 'center' }}>
                <UserOutlined 
                  style={{ 
                    fontSize: '3rem', 
                    color: 'var(--uc-primary-blue)',
                    marginBottom: '1rem'
                  }} 
                />
              </div>
            </Col>
            <Col xs={24} sm={24} md={16}>
              <Typography.Title level={3} style={{ color: 'var(--uc-gray-900)', marginBottom: '0.5rem' }}>
                ¡Bienvenido, Administrador!
              </Typography.Title>
              <Typography.Paragraph style={{ fontSize: '1rem', color: 'var(--uc-gray-600)', marginBottom: '1rem' }}>
                Has ingresado exitosamente al sistema. Desde aquí puedes acceder a todas las funcionalidades del sistema.
              </Typography.Paragraph>
              <Typography.Text strong>Sesión iniciada como: </Typography.Text>
              <Typography.Text type="secondary">{userEmail}</Typography.Text>
            </Col>
          </Row>
        </Card>

        {/* Quick Actions */}
        <Row gutter={[16, 16]} style={{ marginBottom: '2rem' }}>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              className="uc-card" 
              hoverable
              onClick={handleNavigateToCodification}
              style={{ cursor: 'pointer', height: '100%' }}
            >
              <div style={{ textAlign: 'center' }}>
                <FileTextOutlined 
                  style={{ 
                    fontSize: '2.5rem', 
                    color: 'var(--uc-primary-blue)',
                    marginBottom: '1rem'
                  }} 
                />
                <Typography.Title level={4} style={{ color: 'var(--uc-gray-900)', marginBottom: '0.5rem' }}>
                  Codificación GRD
                </Typography.Title>
                <Typography.Paragraph style={{ color: 'var(--uc-gray-600)', marginBottom: '1rem' }}>
                  Importar y gestionar archivos CSV para codificación de episodios médicos
                </Typography.Paragraph>
                <Button type="primary" icon={<FileTextOutlined />} size="large">
                  Acceder
                </Button>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card 
              className="uc-card" 
              hoverable
              onClick={handleNavigateToNorms}
              style={{ cursor: 'pointer', height: '100%' }}
            >
              <div style={{ textAlign: 'center' }}>
                <BookOutlined 
                  style={{ 
                    fontSize: '2.5rem', 
                    color: 'var(--uc-primary-blue)',
                    marginBottom: '1rem'
                  }} 
                />
                <Typography.Title level={4} style={{ color: 'var(--uc-gray-900)', marginBottom: '0.5rem' }}>
                  Gestión de Norma Minsal
                </Typography.Title>
                <Typography.Paragraph style={{ color: 'var(--uc-gray-600)', marginBottom: '1rem' }}>
                  Administrar archivos CSV de Norma Minsal para codificación GRD-FONASA
                </Typography.Paragraph>
                <Button type="primary" icon={<BookOutlined />} size="large">
                  Acceder
                </Button>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card 
              className="uc-card" 
              hoverable
              onClick={handleNavigateToPricing}
              style={{ cursor: 'pointer', height: '100%' }}
            >
              <div style={{ textAlign: 'center' }}>
                <DollarOutlined 
                  style={{ 
                    fontSize: '2.5rem', 
                    color: 'var(--uc-primary-blue)',
                    marginBottom: '1rem'
                  }} 
                />
                <Typography.Title level={4} style={{ color: 'var(--uc-gray-900)', marginBottom: '0.5rem' }}>
                  Gestión de Precios
                </Typography.Title>
                <Typography.Paragraph style={{ color: 'var(--uc-gray-600)', marginBottom: '1rem' }}>
                  Administrar archivos de tarifas para realizar el cálculo de precios base GRD
                </Typography.Paragraph>
                <Button type="primary" icon={<DollarOutlined />} size="large">
                  Acceder
                </Button>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card 
              className="uc-card" 
              hoverable
              onClick={handleNavigateToAjustes}
              style={{ cursor: 'pointer', height: '100%' }}
            >
              <div style={{ textAlign: 'center' }}>
                <ToolOutlined 
                  style={{ 
                    fontSize: '2.5rem', 
                    color: 'var(--uc-primary-blue)',
                    marginBottom: '1rem'
                  }} 
                />
                <Typography.Title level={4} style={{ color: 'var(--uc-gray-900)', marginBottom: '0.5rem' }}>
                  Ajustes por Tecnología
                </Typography.Title>
                <Typography.Paragraph style={{ color: 'var(--uc-gray-600)', marginBottom: '1rem' }}>
                  Administrar archivos Excel de ajustes por tecnología para cálculos GRD
                </Typography.Paragraph>
                <Button type="primary" icon={<ToolOutlined />} size="large">
                  Acceder
                </Button>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card 
              className="uc-card" 
              hoverable
              onClick={handleNavigateToAudit}
              style={{ cursor: 'pointer', height: '100%' }}
            >
              <div style={{ textAlign: 'center' }}>
                <AuditOutlined 
                  style={{ 
                    fontSize: '2.5rem', 
                    color: 'var(--uc-primary-blue)',
                    marginBottom: '1rem'
                  }} 
                />
                <Typography.Title level={4} style={{ color: 'var(--uc-gray-900)', marginBottom: '0.5rem' }}>
                  Auditoría de Cambios
                </Typography.Title>
                <Typography.Paragraph style={{ color: 'var(--uc-gray-600)', marginBottom: '1rem' }}>
                  Revisa quién modificó, qué campo cambió y los valores antes/después.
                </Typography.Paragraph>
                <Button type="primary" icon={<AuditOutlined />} size="large">
                  Ver auditoría
                </Button>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card 
              className="uc-card" 
              hoverable
              onClick={handleNavigateToUsers}
              style={{ cursor: 'pointer', height: '100%' }}
            >
              <div style={{ textAlign: 'center' }}>
                <TeamOutlined 
                  style={{ 
                    fontSize: '2.5rem', 
                    color: 'var(--uc-primary-blue)',
                    marginBottom: '1rem'
                  }} 
                />
                <Typography.Title level={4} style={{ color: 'var(--uc-gray-900)', marginBottom: '0.5rem' }}>
                  Gestión de Usuarios
                </Typography.Title>
                <Typography.Paragraph style={{ color: 'var(--uc-gray-600)', marginBottom: '1rem' }}>
                  Actualmente se encuentran {totalUsers} {totalUsers === 1 ? 'usuario registrado' : 'usuarios registrados'} en el sistema
                </Typography.Paragraph>
                <Button type="primary" icon={<TeamOutlined />} size="large">
                  Ver usuarios
                </Button>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card 
              className="uc-card" 
              hoverable
              onClick={handleNavigateToReports}
              style={{ cursor: 'pointer', height: '100%' }}
            >
              <div style={{ textAlign: 'center' }}>
                <BarChartOutlined 
                  style={{ 
                    fontSize: '2.5rem', 
                    color: 'var(--uc-primary-blue)',
                    marginBottom: '1rem'
                  }} 
                />
                <Typography.Title level={4} style={{ color: 'var(--uc-gray-900)', marginBottom: '0.5rem' }}>
                  Reportes y Análisis
                </Typography.Title>
                <Typography.Paragraph style={{ color: 'var(--uc-gray-600)', marginBottom: '1rem' }}>
                  Visualiza estadísticas, gráficos y análisis de datos del sistema
                </Typography.Paragraph>
                <Button type="primary" icon={<BarChartOutlined />} size="large">
                  Ver reportes
                </Button>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Tarjetas de estadísticas eliminadas a petición del usuario */}
      </div>
    </div>
  )
}

export default AdminPage
