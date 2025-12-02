import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Typography, 
  Upload, 
  Button, 
  message, 
  Table, 
  Tag, 
  Space, 
  Modal, 
  Descriptions,
  Progress,
  Tabs,
  Alert,
  Select,
  Tooltip
} from 'antd'
import { 
  UploadOutlined, 
  FileTextOutlined, 
  EyeOutlined, 
  DownloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  ArrowLeftOutlined,
  StarOutlined,
  StarFilled
} from '@ant-design/icons'
import { useAuth } from '../components/AuthContext'
import { useNavigate } from 'react-router-dom'
import UCHeader from '../components/UCHeader'
import UCBreadcrumb from '../components/UCBreadcrumb'
import { authFetch } from '../utils/authFetch'
import type { UploadProps, TableColumnsType } from 'antd'

const API_BASE_URL = (import.meta.env.VITE_BACKEND_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
const AJUSTES_API_BASE = `${API_BASE_URL}/api/ajustes`

const buildAjustesUrl = (path: string) => {
  if (!path.startsWith('/')) {
    return `${AJUSTES_API_BASE}/${path}`
  }
  return `${AJUSTES_API_BASE}${path}`
}

const { Title, Text } = Typography
const { Option } = Select

interface AjustesFile {
  id: string
  filename: string
  description?: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED'
  totalRows: number
  processedRows: number
  errorRows: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  completedAt?: string
  _count: {
    data: number
  }
}

interface AjustesRow {
  id: string
  fileId: string
  codigo: string
  descripcion?: string
  monto: number
  rawData: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

const AjustesPage: React.FC = () => {
  const { user, logout, getAccessTokenSilently } = useAuth()
  const navigate = useNavigate()
  const [ajustesFiles, setAjustesFiles] = useState<AjustesFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedAjustesFile, setSelectedAjustesFile] = useState<AjustesFile | null>(null)
  const [ajustesRows, setAjustesRows] = useState<AjustesRow[]>([])
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [dataModalVisible, setDataModalVisible] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeAjustesFileId, setActiveAjustesFileId] = useState<string>('')

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleBackToAdmin = () => {
    navigate('/admin')
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const fetchAjustesFiles = async () => {
    setLoading(true)
    try {
      const response = await authFetch(
        buildAjustesUrl('/import/files'),
        { method: 'GET' },
        getAccessTokenSilently
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al cargar los archivos de ajustes' }))
        if (response.status === 401) {
          message.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.')
        } else {
          message.error(errorData.message || 'Error al cargar los archivos de ajustes')
        }
        return
      }
      
      const result = await response.json()
      if (result.success) {
        setAjustesFiles(result.data.files)
        // Encontrar el archivo activo
        const activeFile = result.data.files.find((file: AjustesFile) => file.isActive)
        if (activeFile) {
          setActiveAjustesFileId(activeFile.id)
        }
      } else {
        message.error('Error al cargar los archivos de ajustes')
      }
    } catch (error) {
      message.error('Error de conexión al cargar los archivos de ajustes')
    } finally {
      setLoading(false)
    }
  }

  const fetchAjustesRows = async (ajustesFileId: string) => {
    try {
      const response = await authFetch(
        buildAjustesUrl(`/import/files/${ajustesFileId}/data`),
        { method: 'GET' },
        getAccessTokenSilently
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al cargar las filas de ajustes' }))
        message.error(errorData.message || 'Error al cargar las filas de ajustes')
        return
      }
      
      const result = await response.json()

      if (result.success && result.data && result.data.data) {
        const rawData: unknown[] = Array.isArray(result.data.data)
          ? result.data.data
          : []
        
        const validRows: AjustesRow[] = rawData.filter((item): item is AjustesRow => 
          typeof item === 'object' && item !== null && 'id' in item
        ) as AjustesRow[]

        setAjustesRows(validRows)
      } else {
        message.error('Error al cargar las filas de ajustes')
      }
    } catch (error) {
      console.error('Error en fetchAjustesRows:', error)
      message.error('Error de conexión al cargar los ajustes')
    }
  }

  const setActiveAjustesFile = async (ajustesFileId: string) => {
    try {
      const response = await authFetch(
        buildAjustesUrl(`/import/files/${ajustesFileId}/activate`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
        },
        getAccessTokenSilently
      )
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error al establecer el archivo de ajustes activo' }))
        message.error(errorData.message || 'Error al establecer el archivo de ajustes activo')
        return
      }
      
      const result = await response.json()
      
      if (result.success) {
        setActiveAjustesFileId(ajustesFileId)
        message.success('Archivo de ajustes activo actualizado correctamente')
        fetchAjustesFiles() // Actualizar la lista
      } else {
        message.error(result.message || 'Error al establecer el archivo de ajustes activo')
      }
    } catch (error) {
      message.error('Error de conexión al establecer el archivo de ajustes activo')
    }
  }

  useEffect(() => {
    fetchAjustesFiles()
  }, [])

  const handleFileSelect = (file: File) => {
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || 
                   file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.type === 'application/vnd.ms-excel'

    if (!isExcel) {
      message.error('Solo se permiten archivos Excel (.xlsx, .xls)')
      return false
    }
    const isLt5M = file.size / 1024 / 1024 < 5
    if (!isLt5M) {
      message.error('El archivo debe ser menor a 5MB')
      return false
    }
    setSelectedFile(file)
    return false // Prevent auto upload
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      message.error('Por favor selecciona un archivo')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('description', `Ajustes por Tecnología - ${new Date().toLocaleDateString()}`)

      const response = await authFetch(
        buildAjustesUrl('/import/excel'),
        {
          method: 'POST',
          body: formData,
        },
        getAccessTokenSilently
      )

      const result = await response.json()
      
      if (result.success) {
        message.success(`Archivo de ajustes importado: ${result.data.processedRows} filas procesadas`)
        setSelectedFile(null)
        fetchAjustesFiles() // Refresh the list
      } else {
        message.error(result.message || 'Error en la importación del archivo de ajustes')
      }
    } catch (error) {
      message.error('Error de conexión durante la importación')
    } finally {
      setUploading(false)
    }
  }

  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.xlsx,.xls',
    beforeUpload: handleFileSelect,
    showUploadList: false,
  }

  const getStatusTag = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'default', text: 'Pendiente', icon: <ClockCircleOutlined /> },
      PROCESSING: { color: 'processing', text: 'Procesando', icon: <ClockCircleOutlined /> },
      COMPLETED: { color: 'success', text: 'Completado', icon: <CheckCircleOutlined /> },
      FAILED: { color: 'error', text: 'Fallido', icon: <ExclamationCircleOutlined /> },
      PARTIALLY_COMPLETED: { color: 'warning', text: 'Parcial', icon: <ExclamationCircleOutlined /> }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  const handleViewAjustesFile = (ajustesFile: AjustesFile) => {
    setSelectedAjustesFile(ajustesFile)
    setViewModalVisible(true)
  }

  const handleViewAjustesData = async (ajustesFile: AjustesFile) => {
    setSelectedAjustesFile(ajustesFile)
    await fetchAjustesRows(ajustesFile.id)
    setDataModalVisible(true)
  }

  const ajustesFilesColumns: TableColumnsType<AjustesFile> = [
    {
      title: 'Archivo',
      dataIndex: 'filename',
      key: 'filename',
      render: (filename: string, record: AjustesFile) => (
        <Space>
          <FileTextOutlined />
          <div>
            <Text strong>{filename}</Text>
            {record.isActive && (
              <div>
                <Tag color="gold" icon={<StarFilled />}>
                  Archivo Activo
                </Tag>
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      render: (description: string) => description || '-',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Filas',
      key: 'rows',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text>Total: {record.totalRows}</Text>
          <Text type="success">Procesadas: {record.processedRows}</Text>
          {record.errorRows > 0 && (
            <Text type="danger">Errores: {record.errorRows}</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Progreso',
      key: 'progress',
      render: (_, record) => {
        const percentage = record.totalRows > 0 ? (record.processedRows / record.totalRows) * 100 : 0
        return (
          <Progress 
            percent={Math.round(percentage)} 
            size="small"
            status={record.status === 'FAILED' ? 'exception' : 'normal'}
          />
        )
      },
    },
    {
      title: 'Fecha',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString('es-CL'),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewAjustesFile(record)}
          >
            Ver
          </Button>
          <Button 
            type="link" 
            icon={<DownloadOutlined />}
            onClick={() => handleViewAjustesData(record)}
            disabled={record.status !== 'COMPLETED' && record.status !== 'PARTIALLY_COMPLETED'}
          >
            Datos
          </Button>
          {!record.isActive && (
            <Button 
              type="link" 
              icon={<StarOutlined />}
              onClick={() => setActiveAjustesFile(record.id)}
              disabled={record.status !== 'COMPLETED' && record.status !== 'PARTIALLY_COMPLETED'}
            >
              Activar
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const ajustesRowsColumns: TableColumnsType<AjustesRow> = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 200,
      fixed: 'left',
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      width: 300,
    },
    {
      title: 'Monto',
      dataIndex: 'monto',
      key: 'monto',
      width: 150,
      render: (value: number) => `$${Number(value).toLocaleString('es-CL')}`,
    },
  ]

  return (
    <div className="admin-page">
      <UCHeader 
        showNavigation={false}
        showUserActions={true}
        onLogout={handleLogout}
        userName={user?.email}
      />
      
      <div className="admin-content">
        <UCBreadcrumb />
        
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <Button 
              type="text" 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBackToAdmin}
              style={{ 
                color: 'var(--uc-primary-blue)',
                padding: '4px 8px',
                height: 'auto',
                marginBottom: '0.5rem'
              }}
            >
              Volver al Dashboard
            </Button>
          </div>
          <Title level={2} style={{ color: 'var(--uc-gray-900)', marginBottom: '0.5rem' }}>
            Gestión de Ajustes por Tecnología
          </Title>
          <Text type="secondary" style={{ fontSize: '1.1rem' }}>
            Administración de archivos Excel de ajustes por tecnología para cálculos GRD-FONASA
          </Text>
        </div>

        {/* Selector de archivo activo */}
        <Card className="uc-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                Archivo Activo para Cálculos
              </Title>
              <Text type="secondary">
                Selecciona el archivo de ajustes por tecnología que se utilizará en los cálculos
              </Text>
            </div>
            <Select
              value={activeAjustesFileId}
              onChange={setActiveAjustesFile}
              style={{ width: 300 }}
              placeholder="Seleccionar archivo activo"
            >
              {(ajustesFiles || [])
                .filter(file => file.status === 'COMPLETED' || file.status === 'PARTIALLY_COMPLETED')
                .map(file => (
                  <Option key={file.id} value={file.id}>
                    <Space>
                      <FileTextOutlined />
                      {file.filename}
                      {file.isActive && <Tag color="gold">Activo</Tag>}
                    </Space>
                  </Option>
                ))}
            </Select>
          </div>
        </Card>

        <Tabs 
          defaultActiveKey="upload" 
          size="large"
          items={[
            {
              key: 'upload',
              label: 'Subir Archivo de Ajustes',
              children: (
                <Card className="uc-card">
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <Upload.Dragger {...uploadProps} style={{ marginBottom: '1rem' }}>
                      <p className="ant-upload-drag-icon">
                        <UploadOutlined style={{ fontSize: '3rem', color: 'var(--uc-primary-blue)' }} />
                      </p>
                      <p className="ant-upload-text" style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                        Arrastra tu archivo Excel de ajustes por tecnología aquí
                      </p>
                      <p className="ant-upload-hint" style={{ fontSize: '1rem' }}>
                        O haz clic para seleccionar un archivo
                      </p>
                      <p style={{ color: 'var(--uc-gray-500)', fontSize: '0.9rem', marginTop: '1rem' }}>
                        Formato soportado: Excel (.xlsx, .xls)<br />
                        Primera hoja será procesada automáticamente<br />
                        Columnas esperadas: Código, Descripción, Monto/Valor<br />
                        Máximo 5MB
                      </p>
                    </Upload.Dragger>

                    {selectedFile && (
                      <div style={{ 
                        margin: '1rem 0', 
                        padding: '1rem', 
                        backgroundColor: 'var(--uc-gray-50)', 
                        borderRadius: '8px',
                        border: '1px solid var(--uc-gray-200)'
                      }}>
                        <FileTextOutlined style={{ marginRight: '0.5rem', color: 'var(--uc-primary-blue)' }} />
                        <Text strong>{selectedFile.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '0.9rem' }}>
                          Tamaño: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </Text>
                      </div>
                    )}

                    <div style={{ marginTop: '1rem' }}>
                      <Button 
                        type="primary" 
                        size="large"
                        icon={<UploadOutlined />}
                        onClick={handleUpload}
                        loading={uploading}
                        disabled={!selectedFile}
                        style={{ minWidth: '200px' }}
                      >
                        {uploading ? 'Subiendo...' : 'Subir Archivo de Ajustes'}
                      </Button>
                    </div>
                    
                    {uploading && (
                      <Alert
                        message="Procesando archivo de ajustes..."
                        description="Por favor espera mientras se procesa tu archivo Excel de ajustes por tecnología."
                        type="info"
                        showIcon
                        style={{ marginTop: '1rem' }}
                      />
                    )}
                  </div>
                </Card>
              )
            },
            {
              key: 'files',
              label: 'Archivos de Ajustes',
              children: (
                <Card className="uc-card">
                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={4} style={{ margin: 0 }}>
                      Historial de Archivos de Ajustes
                    </Title>
                    <Button 
                      type="primary" 
                      onClick={fetchAjustesFiles}
                      loading={loading}
                    >
                      Actualizar
                    </Button>
                  </div>
                  
                  <Table
                    columns={ajustesFilesColumns}
                    dataSource={ajustesFiles}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => 
                        `${range[0]}-${range[1]} de ${total} archivos`,
                    }}
                    scroll={{ x: 800 }}
                  />
                </Card>
              )
            }
          ]}
        />

        {/* Modal para ver detalles del archivo de ajustes */}
        <Modal
          title="Detalles del Archivo de Ajustes"
          open={viewModalVisible}
          onCancel={() => setViewModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setViewModalVisible(false)}>
              Cerrar
            </Button>,
            <Button 
              key="data" 
              type="primary" 
              onClick={() => {
                setViewModalVisible(false)
                if (selectedAjustesFile) {
                  handleViewAjustesData(selectedAjustesFile)
                }
              }}
              disabled={selectedAjustesFile?.status !== 'COMPLETED' && selectedAjustesFile?.status !== 'PARTIALLY_COMPLETED'}
            >
              Ver Datos
            </Button>
          ]}
          width={600}
        >
          {selectedAjustesFile && (
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Archivo">
                {selectedAjustesFile.filename}
              </Descriptions.Item>
              <Descriptions.Item label="Descripción">
                {selectedAjustesFile.description || 'Sin descripción'}
              </Descriptions.Item>
              <Descriptions.Item label="Estado">
                {getStatusTag(selectedAjustesFile.status)}
              </Descriptions.Item>
              {selectedAjustesFile.isActive && (
                <Descriptions.Item label="Estado">
                  <Tag color="gold" icon={<StarFilled />}>
                    Archivo Activo
                  </Tag>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Total de Filas">
                {selectedAjustesFile.totalRows}
              </Descriptions.Item>
              <Descriptions.Item label="Filas Procesadas">
                {selectedAjustesFile.processedRows}
              </Descriptions.Item>
              <Descriptions.Item label="Filas con Errores">
                {selectedAjustesFile.errorRows}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha de Creación">
                {new Date(selectedAjustesFile.createdAt).toLocaleString('es-CL')}
              </Descriptions.Item>
              {selectedAjustesFile.completedAt && (
                <Descriptions.Item label="Fecha de Finalización">
                  {new Date(selectedAjustesFile.completedAt).toLocaleString('es-CL')}
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Modal>

        {/* Modal para ver datos de ajustes */}
        <Modal
          title={
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingRight: '3rem',
              }}
            >
              <span>Datos de Ajustes - {selectedAjustesFile?.filename}</span>
              <Space style={{ gap: '0.5rem' }}>
                <Tooltip title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}>
                  <Button
                    icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
                    onClick={toggleFullscreen}
                    size="small"
                  />
                </Tooltip>
              </Space>
            </div>
          }
          open={dataModalVisible}
          onCancel={() => setDataModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setDataModalVisible(false)}>
              Cerrar
            </Button>,
            <Button 
              key="export" 
              icon={<DownloadOutlined />}
              onClick={() => {
                // Implementar exportación de datos de ajustes
                message.info('Función de exportación próximamente')
              }}
            >
              Exportar CSV
            </Button>
          ]}
          width={isFullscreen ? '95vw' : 1200}
          style={{ top: isFullscreen ? 10 : 20 }}
        >
          <Table
            columns={ajustesRowsColumns}
            dataSource={ajustesRows.filter(item => item && item.id)}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} de ${total} ajustes`,
            }}
            scroll={{ x: 800, y: isFullscreen ? '70vh' : 400 }}
            size="small"
          />
        </Modal>
      </div>
    </div>
  )
}

export default AjustesPage



