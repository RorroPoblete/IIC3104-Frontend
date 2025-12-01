import React, { useEffect, useState } from 'react'
import {
  Card,
  Typography,
  Row,
  Col,
  Statistic,
  Table,
  Spin,
  message,
  Button,
  Space,
} from 'antd'
import {
  BarChartOutlined,
  FileTextOutlined,
  CalculatorOutlined,
  DatabaseOutlined,
  TeamOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
  AuditOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import UCHeader from '../components/UCHeader'
import UCBreadcrumb from '../components/UCBreadcrumb'
import { useAuth } from '../components/AuthContext'
import { authFetch } from '../utils/authFetch'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'

const { Title, Text } = Typography

const API_BASE_URL = (import.meta.env.VITE_BACKEND_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
const REPORTES_API_BASE = `${API_BASE_URL}/api/reportes`

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D']

type EstadisticasGenerales = {
  totalEpisodios: number
  totalImportBatches: number
  totalNormaFiles: number
  totalPricingFiles: number
  totalAjustesFiles: number
  totalCalculos: number
  totalAuditorias: number
}

type DistribucionItem = {
  grd?: string
  convenio?: string
  rango?: string
  sexo?: string
  cantidad: number
}

type EstadisticasCalculos = {
  totalCalculos: number
  calculosPorConvenio: { convenio: string; cantidad: number }[]
  promedioTotalFinal: number
}

type ActividadReciente = {
  id: string
  action: string
  entityType: string
  userEmail: string | null
  userName: string | null
  description: string | null
  createdAt: string
}

type TendenciaItem = {
  mes: string
  cantidad: number
  totalRows: number
}

const ReportsPage: React.FC = () => {
  const { user, logout, getAccessTokenSilently } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(false)
  const [estadisticasGenerales, setEstadisticasGenerales] = useState<EstadisticasGenerales | null>(null)
  const [distribucionGRD, setDistribucionGRD] = useState<DistribucionItem[]>([])
  const [distribucionConvenio, setDistribucionConvenio] = useState<DistribucionItem[]>([])
  const [distribucionEdad, setDistribucionEdad] = useState<DistribucionItem[]>([])
  const [distribucionSexo, setDistribucionSexo] = useState<DistribucionItem[]>([])
  const [estadisticasCalculos, setEstadisticasCalculos] = useState<EstadisticasCalculos | null>(null)
  const [actividadReciente, setActividadReciente] = useState<ActividadReciente[]>([])
  const [tendenciaImportaciones, setTendenciaImportaciones] = useState<TendenciaItem[]>([])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const [
        resEstadisticas,
        resGRD,
        resConvenio,
        resEdad,
        resSexo,
        resCalculos,
        resActividad,
        resTendencia,
      ] = await Promise.all([
        authFetch(`${REPORTES_API_BASE}/estadisticas-generales`, {}, getAccessTokenSilently),
        authFetch(`${REPORTES_API_BASE}/distribucion-grd?limit=10`, {}, getAccessTokenSilently),
        authFetch(`${REPORTES_API_BASE}/distribucion-convenio?limit=10`, {}, getAccessTokenSilently),
        authFetch(`${REPORTES_API_BASE}/distribucion-edad`, {}, getAccessTokenSilently),
        authFetch(`${REPORTES_API_BASE}/distribucion-sexo`, {}, getAccessTokenSilently),
        authFetch(`${REPORTES_API_BASE}/estadisticas-calculos`, {}, getAccessTokenSilently),
        authFetch(`${REPORTES_API_BASE}/actividad-reciente?limit=10`, {}, getAccessTokenSilently),
        authFetch(`${REPORTES_API_BASE}/tendencia-importaciones`, {}, getAccessTokenSilently),
      ])

      const [
        dataEstadisticas,
        dataGRD,
        dataConvenio,
        dataEdad,
        dataSexo,
        dataCalculos,
        dataActividad,
        dataTendencia,
      ] = await Promise.all([
        resEstadisticas.json(),
        resGRD.json(),
        resConvenio.json(),
        resEdad.json(),
        resSexo.json(),
        resCalculos.json(),
        resActividad.json(),
        resTendencia.json(),
      ])

      if (dataEstadisticas.success) setEstadisticasGenerales(dataEstadisticas.data)
      if (dataGRD.success) setDistribucionGRD(dataGRD.data)
      if (dataConvenio.success) setDistribucionConvenio(dataConvenio.data)
      if (dataEdad.success) setDistribucionEdad(dataEdad.data)
      if (dataSexo.success) setDistribucionSexo(dataSexo.data)
      if (dataCalculos.success) setEstadisticasCalculos(dataCalculos.data)
      if (dataActividad.success) setActividadReciente(dataActividad.data)
      if (dataTendencia.success) setTendenciaImportaciones(dataTendencia.data)
    } catch (error) {
      console.error('Error cargando reportes', error)
      message.error('Error al cargar los reportes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleBackToAdmin = () => navigate('/admin')

  const actividadColumns = [
    {
      title: 'Fecha',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value: string) => new Date(value).toLocaleString('es-CL'),
      width: 180,
    },
    {
      title: 'Acción',
      dataIndex: 'action',
      key: 'action',
      width: 200,
    },
    {
      title: 'Entidad',
      dataIndex: 'entityType',
      key: 'entityType',
      width: 150,
    },
    {
      title: 'Usuario',
      dataIndex: 'userName',
      key: 'userName',
      render: (_: unknown, record: ActividadReciente) => record.userName || record.userEmail || '—',
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value: string | null) => value || '—',
    },
  ]

  return (
    <div className="admin-page">
      <UCHeader
        showNavigation={false}
        showUserActions
        onLogout={handleLogout}
        userName={user?.email}
        showCodificationButton={false}
      />

      <div className="admin-content">
        <UCBreadcrumb />

        <Card className="uc-card" style={{ marginBottom: '1.5rem' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <div>
              <Title level={2} style={{ marginBottom: 0 }}>Reportes y Análisis</Title>
              <Text type="secondary">Visualización de estadísticas y datos del sistema</Text>
            </div>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBackToAdmin}>
                Volver
              </Button>
              <Button icon={<ReloadOutlined />} onClick={fetchAllData} loading={loading}>
                Refrescar
              </Button>
            </Space>
          </Space>
        </Card>

        {loading && !estadisticasGenerales ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* Estadísticas Generales */}
            <Row gutter={[16, 16]} style={{ marginBottom: '1.5rem' }}>
              <Col xs={24} sm={12} lg={6}>
                <Card className="uc-card">
                  <Statistic
                    title="Episodios Procesados"
                    value={estadisticasGenerales?.totalEpisodios || 0}
                    prefix={<DatabaseOutlined />}
                    valueStyle={{ color: 'var(--uc-primary-blue)' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="uc-card">
                  <Statistic
                    title="Archivos Importados"
                    value={estadisticasGenerales?.totalImportBatches || 0}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: 'var(--uc-success)' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="uc-card">
                  <Statistic
                    title="Cálculos Realizados"
                    value={estadisticasGenerales?.totalCalculos || 0}
                    prefix={<CalculatorOutlined />}
                    valueStyle={{ color: 'var(--uc-warning)' }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card className="uc-card">
                  <Statistic
                    title="Registros de Auditoría"
                    value={estadisticasGenerales?.totalAuditorias || 0}
                    prefix={<AuditOutlined />}
                    valueStyle={{ color: 'var(--uc-primary-blue)' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Gráficos de Distribución */}
            <Row gutter={[16, 16]} style={{ marginBottom: '1.5rem' }}>
              <Col xs={24} lg={12}>
                <Card className="uc-card" title="Top 10 GRDs más frecuentes">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={distribucionGRD}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="grd" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="cantidad" fill="#0088FE" name="Episodios" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card className="uc-card" title="Top 10 Convenios más frecuentes">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={distribucionConvenio}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="convenio" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="cantidad" fill="#00C49F" name="Episodios" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>

            {/* Distribución por Edad y Sexo */}
            <Row gutter={[16, 16]} style={{ marginBottom: '1.5rem' }}>
              <Col xs={24} lg={12}>
                <Card className="uc-card" title="Distribución por Rango de Edad">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={distribucionEdad}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rango" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="cantidad" fill="#FFBB28" name="Episodios" />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card className="uc-card" title="Distribución por Sexo">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={distribucionSexo}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ sexo, cantidad }) => `${sexo}: ${cantidad}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="cantidad"
                      >
                        {distribucionSexo.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>

            {/* Tendencia de Importaciones */}
            {tendenciaImportaciones.length > 0 && (
              <Row gutter={[16, 16]} style={{ marginBottom: '1.5rem' }}>
                <Col xs={24}>
                  <Card className="uc-card" title="Tendencia de Importaciones (Últimos 6 meses)">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={tendenciaImportaciones}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="cantidad"
                          stroke="#8884d8"
                          name="Importaciones"
                        />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="totalRows"
                          stroke="#82ca9d"
                          name="Total Filas"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Estadísticas de Cálculos */}
            {estadisticasCalculos && estadisticasCalculos.calculosPorConvenio.length > 0 && (
              <Row gutter={[16, 16]} style={{ marginBottom: '1.5rem' }}>
                <Col xs={24} lg={16}>
                  <Card className="uc-card" title="Cálculos por Convenio">
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={estadisticasCalculos.calculosPorConvenio}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="convenio" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="cantidad" fill="#FF8042" name="Cálculos" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </Col>
                <Col xs={24} lg={8}>
                  <Card className="uc-card">
                    <Statistic
                      title="Promedio Total Final"
                      value={estadisticasCalculos.promedioTotalFinal}
                      precision={2}
                      prefix="$"
                      valueStyle={{ color: 'var(--uc-success)' }}
                    />
                  </Card>
                  <Card className="uc-card" style={{ marginTop: '1rem' }}>
                    <Statistic
                      title="Total Cálculos"
                      value={estadisticasCalculos.totalCalculos}
                      prefix={<CalculatorOutlined />}
                      valueStyle={{ color: 'var(--uc-primary-blue)' }}
                    />
                  </Card>
                </Col>
              </Row>
            )}

            {/* Actividad Reciente */}
            <Row gutter={[16, 16]}>
              <Col xs={24}>
                <Card className="uc-card" title="Actividad Reciente del Sistema">
                  <Table
                    rowKey="id"
                    dataSource={actividadReciente}
                    columns={actividadColumns}
                    pagination={false}
                    scroll={{ x: 800 }}
                  />
                </Card>
              </Col>
            </Row>
          </>
        )}
      </div>
    </div>
  )
}

export default ReportsPage

