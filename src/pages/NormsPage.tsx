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
  Row,
  Col,
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
  SettingOutlined,
  StarOutlined,
  StarFilledOutlined
} from '@ant-design/icons'
import { useAuth } from '../components/AuthContext'
import { useNavigate } from 'react-router-dom'
import UCHeader from '../components/UCHeader'
import UCBreadcrumb from '../components/UCBreadcrumb'
import type { UploadProps, TableColumnsType } from 'antd'

const API_BASE_URL = (import.meta.env.VITE_BACKEND_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
const NORMS_API_BASE = `${API_BASE_URL}/api/norms`

const buildNormsUrl = (path: string) => {
  if (!path.startsWith('/')) {
    return `${NORMS_API_BASE}/${path}`
  }
  return `${NORMS_API_BASE}${path}`
}

const { Title, Text } = Typography
const { Option } = Select

interface NormFile {
  id: string
  filename: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED'
  totalRows: number
  processedRows: number
  errorRows: number
  createdAt: string
  updatedAt: string
  completedAt?: string
  isActive: boolean
  normType: 'GRD' | 'FONASA' | 'CUSTOM'
  version: string
  description?: string
  _count: {
    normRows: number
  }
}

interface NormRow {
  id: string
  normFileId: string
  codigo: string
  descripcion: string
  categoria?: string
  subcategoria?: string
  valor?: number
  unidad?: string
  fechaVigencia?: string
  fechaVencimiento?: string
  activo: boolean
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

const NormsPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [normFiles, setNormFiles] = useState<NormFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedNormFile, setSelectedNormFile] = useState<NormFile | null>(null)
  const [normRows, setNormRows] = useState<NormRow[]>([])
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [dataModalVisible, setDataModalVisible] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeNormFileId, setActiveNormFileId] = useState<string>('')

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

  const fetchNormFiles = async () => {
    setLoading(true)
    try {
      const response = await fetch(buildNormsUrl('/files'))
      const result = await response.json()
      if (result.success) {
        setNormFiles(result.data.normFiles)
        // Encontrar el archivo activo
        const activeFile = result.data.normFiles.find((file: NormFile) => file.isActive)
        if (activeFile) {
          setActiveNormFileId(activeFile.id)
        }
      } else {
        message.error('Error al cargar los archivos de normas')
      }
    } catch (error) {
      message.error('Error de conexión al cargar los archivos de normas')
    } finally {
      setLoading(false)
    }
  }

  const fetchNormRows = async (normFileId: string) => {
    try {
      const response = await fetch(buildNormsUrl(`/files/${normFileId}/rows`))
      const result = await response.json()

      if (result.success && result.data && result.data.normRows) {
        const rawData: unknown[] = Array.isArray(result.data.normRows)
          ? result.data.normRows
          : []
        
        const validRows: NormRow[] = rawData.filter((item): item is NormRow => 
          typeof item === 'object' && item !== null && 'id' in item
        ) as NormRow[]

        setNormRows(validRows)
      } else {
        message.error('Error al cargar las filas de normas')
      }
    } catch (error) {
      console.error('Error en fetchNormRows:', error)
      message.error('Error de conexión al cargar las normas')
    }
  }

  const setActiveNormFile = async (normFileId: string) => {
    try {
      const response = await fetch(buildNormsUrl(`/files/${normFileId}/set-active`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const result = await response.json()
      
      if (result.success) {
        setActiveNormFileId(normFileId)
        message.success('Norma activa actualizada correctamente')
        fetchNormFiles() // Actualizar la lista
      } else {
        message.error(result.message || 'Error al establecer la norma activa')
      }
    } catch (error) {
      message.error('Error de conexión al establecer la norma activa')
    }
  }

  useEffect(() => {
    fetchNormFiles()
  }, [])

  const handleFileSelect = (file: File) => {
    const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv')
    if (!isCSV) {
      message.error('Solo se permiten archivos CSV')
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

      const response = await fetch(buildNormsUrl('/upload'), {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      
      if (result.success) {
        message.success(`Archivo de normas importado: ${result.data.processedRows} filas procesadas`)
        setSelectedFile(null)
        fetchNormFiles() // Refresh the list
      } else {
        message.error(result.message || 'Error en la importación del archivo de normas')
      }
    } catch (error) {
      message.error('Error de conexión durante la importación')
    } finally {
      setUploading(false)
    }
  }

  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.csv',
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

  const getNormTypeTag = (type: string) => {
    const typeConfig = {
      GRD: { color: 'blue', text: 'GRD' },
      FONASA: { color: 'green', text: 'FONASA' },
      CUSTOM: { color: 'orange', text: 'Personalizada' }
    }
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.CUSTOM
    return (
      <Tag color={config.color}>
        {config.text}
      </Tag>
    )
  }

  const handleViewNormFile = (normFile: NormFile) => {
    setSelectedNormFile(normFile)
    setViewModalVisible(true)
  }

  const handleViewNormData = async (normFile: NormFile) => {
    setSelectedNormFile(normFile)
    await fetchNormRows(normFile.id)
    setDataModalVisible(true)
  }

  const normFilesColumns: TableColumnsType<NormFile> = [
    {
      title: 'Archivo',
      dataIndex: 'filename',
      key: 'filename',
      render: (filename: string, record: NormFile) => (
        <Space>
          <FileTextOutlined />
          <div>
            <Text strong>{filename}</Text>
            {record.isActive && (
              <div>
                <Tag color="gold" icon={<StarFilledOutlined />}>
                  Norma Activa
                </Tag>
              </div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: 'Tipo',
      dataIndex: 'normType',
      key: 'normType',
      render: (type: string) => getNormTypeTag(type),
    },
    {
      title: 'Versión',
      dataIndex: 'version',
      key: 'version',
      width: 100,
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
            onClick={() => handleViewNormFile(record)}
          >
            Ver
          </Button>
          <Button 
            type="link" 
            icon={<DownloadOutlined />}
            onClick={() => handleViewNormData(record)}
            disabled={record.status !== 'COMPLETED' && record.status !== 'PARTIALLY_COMPLETED'}
          >
            Datos
          </Button>
          {!record.isActive && (
            <Button 
              type="link" 
              icon={<StarOutlined />}
              onClick={() => setActiveNormFile(record.id)}
              disabled={record.status !== 'COMPLETED' && record.status !== 'PARTIALLY_COMPLETED'}
            >
              Activar
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const normRowsColumns: TableColumnsType<NormRow> = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      key: 'codigo',
      width: 120,
      fixed: 'left',
    },
    {
      title: 'Descripción',
      dataIndex: 'descripcion',
      key: 'descripcion',
      width: 200,
    },
    {
      title: 'Categoría',
      dataIndex: 'categoria',
      key: 'categoria',
      width: 120,
    },
    {
      title: 'Subcategoría',
      dataIndex: 'subcategoria',
      key: 'subcategoria',
      width: 120,
    },
    {
      title: 'Valor',
      dataIndex: 'valor',
      key: 'valor',
      width: 100,
      render: (value: number) => value ? value.toFixed(2) : '-',
    },
    {
      title: 'Unidad',
      dataIndex: 'unidad',
      key: 'unidad',
      width: 80,
    },
    {
      title: 'Fecha Vigencia',
      dataIndex: 'fechaVigencia',
      key: 'fechaVigencia',
      width: 120,
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      title: 'Fecha Vencimiento',
      dataIndex: 'fechaVencimiento',
      key: 'fechaVencimiento',
      width: 120,
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      title: 'Estado',
      dataIndex: 'activo',
      key: 'activo',
      width: 80,
      render: (activo: boolean) => (
        <Tag color={activo ? 'success' : 'default'}>
          {activo ? 'Activo' : 'Inactivo'}
        </Tag>
      ),
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
            Gestión de Normas GRD-FONASA
          </Title>
          <Text type="secondary" style={{ fontSize: '1.1rem' }}>
            Administración de archivos de normas para codificación de episodios médicos
          </Text>
        </div>

        {/* Selector de norma activa */}
        <Card className="uc-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                Norma Activa para Codificación
              </Title>
              <Text type="secondary">
                Selecciona la norma que se utilizará para la codificación de episodios
              </Text>
            </div>
            <Select
              value={activeNormFileId}
              onChange={setActiveNormFile}
              style={{ width: 300 }}
              placeholder="Seleccionar norma activa"
            >
              {normFiles
                .filter(file => file.status === 'COMPLETED' || file.status === 'PARTIALLY_COMPLETED')
                .map(file => (
                  <Option key={file.id} value={file.id}>
                    <Space>
                      <FileTextOutlined />
                      {file.filename}
                      <Tag color="blue">{file.version}</Tag>
                      {file.isActive && <Tag color="gold">Activa</Tag>}
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
              label: 'Subir Archivo de Normas',
              children: (
                <Card className="uc-card">
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <Upload.Dragger {...uploadProps} style={{ marginBottom: '1rem' }}>
                      <p className="ant-upload-drag-icon">
                        <UploadOutlined style={{ fontSize: '3rem', color: 'var(--uc-primary-blue)' }} />
                      </p>
                      <p className="ant-upload-text" style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                        Arrastra tu archivo de normas CSV aquí
                      </p>
                      <p className="ant-upload-hint" style={{ fontSize: '1rem' }}>
                        O haz clic para seleccionar un archivo
                      </p>
                      <p style={{ color: 'var(--uc-gray-500)', fontSize: '0.9rem', marginTop: '1rem' }}>
                        Formato requerido: CSV con columnas: código, descripción, categoría, valor, unidad<br />
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
                        {uploading ? 'Subiendo...' : 'Subir Archivo de Normas'}
                      </Button>
                    </div>
                    
                    {uploading && (
                      <Alert
                        message="Procesando archivo de normas..."
                        description="Por favor espera mientras se procesa tu archivo CSV de normas."
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
              label: 'Archivos de Normas',
              children: (
                <Card className="uc-card">
                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={4} style={{ margin: 0 }}>
                      Historial de Archivos de Normas
                    </Title>
                    <Button 
                      type="primary" 
                      onClick={fetchNormFiles}
                      loading={loading}
                    >
                      Actualizar
                    </Button>
                  </div>
                  
                  <Table
                    columns={normFilesColumns}
                    dataSource={normFiles}
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

        {/* Modal para ver detalles del archivo de normas */}
        <Modal
          title="Detalles del Archivo de Normas"
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
                if (selectedNormFile) {
                  handleViewNormData(selectedNormFile)
                }
              }}
              disabled={selectedNormFile?.status !== 'COMPLETED' && selectedNormFile?.status !== 'PARTIALLY_COMPLETED'}
            >
              Ver Datos
            </Button>
          ]}
          width={600}
        >
          {selectedNormFile && (
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Archivo">
                {selectedNormFile.filename}
              </Descriptions.Item>
              <Descriptions.Item label="Tipo">
                {getNormTypeTag(selectedNormFile.normType)}
              </Descriptions.Item>
              <Descriptions.Item label="Versión">
                {selectedNormFile.version}
              </Descriptions.Item>
              <Descriptions.Item label="Estado">
                {getStatusTag(selectedNormFile.status)}
              </Descriptions.Item>
              {selectedNormFile.isActive && (
                <Descriptions.Item label="Estado">
                  <Tag color="gold" icon={<StarFilledOutlined />}>
                    Norma Activa
                  </Tag>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Total de Filas">
                {selectedNormFile.totalRows}
              </Descriptions.Item>
              <Descriptions.Item label="Filas Procesadas">
                {selectedNormFile.processedRows}
              </Descriptions.Item>
              <Descriptions.Item label="Filas con Errores">
                {selectedNormFile.errorRows}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha de Creación">
                {new Date(selectedNormFile.createdAt).toLocaleString('es-CL')}
              </Descriptions.Item>
              {selectedNormFile.completedAt && (
                <Descriptions.Item label="Fecha de Finalización">
                  {new Date(selectedNormFile.completedAt).toLocaleString('es-CL')}
                </Descriptions.Item>
              )}
              {selectedNormFile.description && (
                <Descriptions.Item label="Descripción">
                  {selectedNormFile.description}
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Modal>

        {/* Modal para ver datos de normas */}
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
              <span>Datos de Normas - {selectedNormFile?.filename}</span>
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
                // Implementar exportación de datos de normas
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
            columns={normRowsColumns}
            dataSource={normRows.filter(item => item && item.id)}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} de ${total} normas`,
            }}
            scroll={{ x: 800, y: isFullscreen ? '70vh' : 400 }}
            size="small"
          />
        </Modal>
      </div>
    </div>
  )
}

export default NormsPage
