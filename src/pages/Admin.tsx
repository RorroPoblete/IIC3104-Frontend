import React from 'react'
import { Card, Typography, Button, Row, Col, Statistic } from 'antd'
import { 
  UserOutlined, 
  FileTextOutlined, 
  DatabaseOutlined, 
  BarChartOutlined,
  SettingOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  BookOutlined
} from '@ant-design/icons'
import { useAuth } from '../components/AuthContext'
import { useNavigate } from 'react-router-dom'
import UCHeader from '../components/UCHeader'
import UCBreadcrumb from '../components/UCBreadcrumb'

const AdminPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

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

  return (
    <div className="admin-page">
      <UCHeader 
        showNavigation={false}
        showUserActions={true}
        showCodificationButton={false}
        onLogout={handleLogout}
        userName={user?.email}
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
              <Typography.Text type="secondary">{user?.email}</Typography.Text>
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
            <Card className="uc-card" hoverable style={{ cursor: 'pointer', height: '100%' }}>
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
                  Generar reportes y análisis de datos de codificación (Próximamente)
                </Typography.Paragraph>
                <Button disabled icon={<BarChartOutlined />} size="large">
                  Próximamente
                </Button>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} lg={6}>
            <Card className="uc-card" hoverable style={{ cursor: 'pointer', height: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <SettingOutlined 
                  style={{ 
                    fontSize: '2.5rem', 
                    color: 'var(--uc-primary-blue)',
                    marginBottom: '1rem'
                  }} 
                />
                <Typography.Title level={4} style={{ color: 'var(--uc-gray-900)', marginBottom: '0.5rem' }}>
                  Configuración
                </Typography.Title>
                <Typography.Paragraph style={{ color: 'var(--uc-gray-600)', marginBottom: '1rem' }}>
                  Configurar parámetros del sistema y usuarios (Próximamente)
                </Typography.Paragraph>
                <Button disabled icon={<SettingOutlined />} size="large">
                  Próximamente
                </Button>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="uc-card">
              <Statistic
                title="Episodios Procesados"
                value={0}
                prefix={<DatabaseOutlined />}
                valueStyle={{ color: 'var(--uc-primary-blue)' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="uc-card">
              <Statistic
                title="Archivos Importados"
                value={0}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: 'var(--uc-success)' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="uc-card">
              <Statistic
                title="Usuarios Activos"
                value={1}
                prefix={<TeamOutlined />}
                valueStyle={{ color: 'var(--uc-warning)' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="uc-card">
              <Statistic
                title="Sistema"
                value="Operativo"
                prefix={<MedicineBoxOutlined />}
                valueStyle={{ color: 'var(--uc-success)' }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default AdminPage

