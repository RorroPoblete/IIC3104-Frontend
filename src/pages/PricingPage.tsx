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
  Tooltip,
  Form,
  Input,
  DatePicker,
  Divider,
  Statistic,
  Row,
  Col
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
  StarFilled,
  CalculatorOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { useAuth } from '../components/AuthContext'
import { useNavigate } from 'react-router-dom'
import UCHeader from '../components/UCHeader'
import UCBreadcrumb from '../components/UCBreadcrumb'
import type { UploadProps, TableColumnsType } from 'antd'

const API_BASE_URL = (import.meta.env.VITE_BACKEND_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
const PRICING_API_BASE = `${API_BASE_URL}/api/pricing`

const buildPricingUrl = (path: string) => {
  if (!path.startsWith('/')) {
    return `${PRICING_API_BASE}/${path}`
  }
  return `${PRICING_API_BASE}${path}`
}

const { Title, Text } = Typography
const { Option } = Select
const { TextArea } = Input

interface PricingFile {
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
    tarifas: number
  }
}

interface PricingTarifa {
  id: string
  convenioId: string
  descripcion?: string
  tramo: 'T1' | 'T2' | 'T3' | null
  precio: number
  fechaAdmision?: string
  fechaFin?: string
  tipoConvenio?: string
  tipoAseguradora?: string
  aseguradoraCodigo?: string
  aseguradoraNombre?: string
}

interface CalculatedPrecioBase {
  convenioId: string
  tipo: 'PRECIO_UNICO' | 'POR_TRAMOS'
  valor: number
  fuente: 'db' | 'attachment'
  tramo?: {
    id: 'T1' | 'T2' | 'T3'
    etiqueta: string
    min: number
    max?: number
    incluyeMin: boolean
    incluyeMax: boolean
  }
  tramoId?: 'T1' | 'T2' | 'T3'
  vigencia?: {
    desde?: string
    hasta?: string
  }
}

const PricingPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [pricingFiles, setPricingFiles] = useState<PricingFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedPricingFile, setSelectedPricingFile] = useState<PricingFile | null>(null)
  const [pricingTarifas, setPricingTarifas] = useState<PricingTarifa[]>([])
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [dataModalVisible, setDataModalVisible] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activePricingFileId, setActivePricingFileId] = useState<string>('')
  const [calculateForm] = Form.useForm()
  const [calculating, setCalculating] = useState(false)
  const [calculatedResult, setCalculatedResult] = useState<CalculatedPrecioBase | null>(null)

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

  const fetchPricingFiles = async () => {
    setLoading(true)
    try {
      const response = await fetch(buildPricingUrl('/import/files'))
      const result = await response.json()
      if (result.success) {
        setPricingFiles(result.data.files)
        // Encontrar el archivo activo
        const activeFile = result.data.files.find((file: PricingFile) => file.isActive)
        if (activeFile) {
          setActivePricingFileId(activeFile.id)
        }
      } else {
        message.error('Error al cargar los archivos de tarifas')
      }
    } catch (error) {
      message.error('Error de conexión al cargar los archivos de tarifas')
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveFile = async () => {
    try {
      const response = await fetch(buildPricingUrl('/import/active'))
      if (!response.ok) {
        // Si no hay archivo activo (404), no es un error crítico
        // No mostramos error en consola para evitar ruido
        return
      }
      const result = await response.json()
      if (result.success && result.data) {
        setActivePricingFileId(result.data.id)
      }
    } catch (error) {
      // Si no hay archivo activo, no es un error crítico
      // Silenciamos el error para evitar ruido en la consola
    }
  }

  const fetchPricingTarifas = async (fileId: string) => {
    try {
      const response = await fetch(buildPricingUrl(`/import/files/${fileId}/data`))
      const result = await response.json()

      if (result.success && result.data && result.data.data) {
        const rawData: unknown[] = Array.isArray(result.data.data)
          ? result.data.data
          : []
        
        const validTarifas: PricingTarifa[] = rawData.filter((item): item is PricingTarifa => 
          typeof item === 'object' && item !== null && 'id' in item
        ) as PricingTarifa[]

        setPricingTarifas(validTarifas)
      } else {
        message.error('Error al cargar las tarifas')
      }
    } catch (error) {
      console.error('Error en fetchPricingTarifas:', error)
      message.error('Error de conexión al cargar las tarifas')
    }
  }

  const setActivePricingFile = async (fileId: string) => {
    try {
      const response = await fetch(buildPricingUrl(`/import/files/${fileId}/activate`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      const result = await response.json()
      
      if (result.success) {
        setActivePricingFileId(fileId)
        message.success('Archivo de tarifas activado correctamente')
        fetchPricingFiles() // Actualizar la lista
      } else {
        message.error(result.message || 'Error al establecer el archivo activo')
      }
    } catch (error) {
      message.error('Error de conexión al establecer el archivo activo')
    }
  }

  useEffect(() => {
    fetchPricingFiles()
    fetchActiveFile()
  }, [])

  const handleFileSelect = (file: File) => {
    const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv')
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || 
                   file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                   file.type === 'application/vnd.ms-excel'

    if (!isCSV && !isExcel) {
      message.error('Solo se permiten archivos CSV y Excel (.xlsx, .xls)')
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
      formData.append('description', `Precios convenios GRD - ${new Date().toLocaleDateString()}`)

      const response = await fetch(buildPricingUrl('/import'), {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      
      if (result.success) {
        message.success(`Archivo de tarifas importado: ${result.data.processedRows} filas procesadas`)
        setSelectedFile(null)
        fetchPricingFiles() // Refresh the list
      } else {
        message.error(result.message || 'Error en la importación del archivo de tarifas')
      }
    } catch (error) {
      message.error('Error de conexión durante la importación')
    } finally {
      setUploading(false)
    }
  }

  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.csv,.xlsx,.xls',
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

  const handleViewPricingFile = (pricingFile: PricingFile) => {
    setSelectedPricingFile(pricingFile)
    setViewModalVisible(true)
  }

  const handleViewPricingData = async (pricingFile: PricingFile) => {
    setSelectedPricingFile(pricingFile)
    await fetchPricingTarifas(pricingFile.id)
    setDataModalVisible(true)
  }

  const handleCalculatePrecioBase = async (values: {
    convenioId: string
    pesoRelativo: number
    fechaReferencia?: any // Dayjs object from DatePicker
  }) => {
    setCalculating(true)
    setCalculatedResult(null)
    
    try {
      // Convert pesoRelativo to number if it's a string
      const pesoRelativoNum = typeof values.pesoRelativo === 'string' 
        ? parseFloat(values.pesoRelativo) 
        : values.pesoRelativo

      if (isNaN(pesoRelativoNum) || pesoRelativoNum <= 0) {
        message.error('El peso relativo debe ser un número mayor que 0')
        setCalculating(false)
        return
      }

      const params = new URLSearchParams({
        convenioId: values.convenioId,
        pesoRelativo: pesoRelativoNum.toString(),
      })
      
      if (values.fechaReferencia) {
        // DatePicker returns a Dayjs object, convert to ISO string
        const fechaStr = values.fechaReferencia.format('YYYY-MM-DD')
        params.append('fechaReferencia', fechaStr)
      }

      const response = await fetch(buildPricingUrl(`/calculate?${params.toString()}`))
      const result = await response.json()

      if (result.success) {
        setCalculatedResult(result.data)
        message.success('Precio base calculado correctamente')
      } else {
        let errorMessage = 'Error al calcular el precio base'
        
        switch (result.error) {
          case 'CONVENIO_NO_DISPONIBLE':
            errorMessage = `No se encontraron tarifas para el convenio ${values.convenioId}`
            break
          case 'PESO_RELATIVO_INVALIDO':
            errorMessage = 'El peso relativo debe ser un número mayor que 0'
            break
          case 'TARIFA_FUERA_DE_VIGENCIA':
            errorMessage = 'No hay tarifas vigentes para la fecha especificada'
            break
          case 'TARIFA_SOURCE_UNAVAILABLE':
            errorMessage = 'No hay archivo de tarifas activo configurado'
            break
          default:
            errorMessage = result.message || errorMessage
        }
        
        message.error(errorMessage)
      }
    } catch (error) {
      console.error('Error calculando precio base:', error)
      message.error('Error de conexión al calcular el precio base')
    } finally {
      setCalculating(false)
    }
  }

  const pricingFilesColumns: TableColumnsType<PricingFile> = [
    {
      title: 'Archivo',
      dataIndex: 'filename',
      key: 'filename',
      render: (filename: string, record: PricingFile) => (
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
      title: 'Tarifas',
      key: 'tarifas',
      render: (_, record) => (
        <Text>{record._count?.tarifas || 0}</Text>
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
            onClick={() => handleViewPricingFile(record)}
          >
            Ver
          </Button>
          <Button 
            type="link" 
            icon={<DownloadOutlined />}
            onClick={() => handleViewPricingData(record)}
            disabled={record.status !== 'COMPLETED' && record.status !== 'PARTIALLY_COMPLETED'}
          >
            Datos
          </Button>
          {!record.isActive && (
            <Button 
              type="link" 
              icon={<StarOutlined />}
              onClick={() => setActivePricingFile(record.id)}
              disabled={record.status !== 'COMPLETED' && record.status !== 'PARTIALLY_COMPLETED'}
            >
              Activar
            </Button>
          )}
        </Space>
      ),
    },
  ]

  const pricingTarifasColumns: TableColumnsType<PricingTarifa> = [
    {
      title: 'Convenio',
      dataIndex: 'convenioId',
      key: 'convenioId',
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
      title: 'Tramo',
      dataIndex: 'tramo',
      key: 'tramo',
      width: 80,
      render: (tramo: string | null) => tramo ? <Tag>{tramo}</Tag> : '-',
    },
    {
      title: 'Precio',
      dataIndex: 'precio',
      key: 'precio',
      width: 120,
      render: (precio: number) => precio ? `$${precio.toLocaleString('es-CL')}` : '-',
    },
    {
      title: 'Fecha Admisión',
      dataIndex: 'fechaAdmision',
      key: 'fechaAdmision',
      width: 120,
      render: (fecha: string) => fecha ? new Date(fecha).toLocaleDateString('es-CL') : '-',
    },
    {
      title: 'Fecha Fin',
      dataIndex: 'fechaFin',
      key: 'fechaFin',
      width: 120,
      render: (fecha: string) => fecha ? new Date(fecha).toLocaleDateString('es-CL') : '-',
    },
    {
      title: 'Tipo Convenio',
      dataIndex: 'tipoConvenio',
      key: 'tipoConvenio',
      width: 150,
    },
    {
      title: 'Aseguradora',
      dataIndex: 'aseguradoraNombre',
      key: 'aseguradoraNombre',
      width: 200,
      render: (nombre: string) => nombre || '-',
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
            Gestión de Precios Convenios GRD
          </Title>
          <Text type="secondary" style={{ fontSize: '1.1rem' }}>
            Administración de archivos de tarifas para cálculo de precios base GRD
          </Text>
        </div>

        {/* Selector de archivo activo */}
        <Card className="uc-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                Archivo Activo para Pricing
              </Title>
              <Text type="secondary">
                Selecciona el archivo que se utilizará para el cálculo de precios
              </Text>
            </div>
            <Select
              value={activePricingFileId}
              onChange={setActivePricingFile}
              style={{ width: 300 }}
              placeholder="Seleccionar archivo activo"
            >
              {(pricingFiles || [])
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
              label: 'Subir Archivo de Tarifas',
              children: (
                <Card className="uc-card">
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <Upload.Dragger {...uploadProps} style={{ marginBottom: '1rem' }}>
                      <p className="ant-upload-drag-icon">
                        <UploadOutlined style={{ fontSize: '3rem', color: 'var(--uc-primary-blue)' }} />
                      </p>
                      <p className="ant-upload-text" style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                        Arrastra tu archivo de tarifas (CSV o Excel) aquí
                      </p>
                      <p className="ant-upload-hint" style={{ fontSize: '1rem' }}>
                        O haz clic para seleccionar un archivo
                      </p>
                      <p style={{ color: 'var(--uc-gray-500)', fontSize: '0.9rem', marginTop: '1rem' }}>
                        Formatos soportados: CSV o Excel (.xlsx, .xls) de Precios convenios GRD<br />
                        CSV: separador ';' o ',' y codificación latin-1<br />
                        Excel: primera hoja será procesada automáticamente<br />
                        Columnas: Convenio, Tramo, Precio, Fecha Admisión, Fecha Fin, etc.<br />
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
                        {uploading ? 'Subiendo...' : 'Subir Archivo de Tarifas'}
                      </Button>
                    </div>
                    
                    {uploading && (
                      <Alert
                        message="Procesando archivo de tarifas..."
                        description="Por favor espera mientras se procesa tu archivo de tarifas."
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
              label: 'Archivos de Tarifas',
              children: (
                <Card className="uc-card">
                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={4} style={{ margin: 0 }}>
                      Historial de Archivos de Tarifas
                    </Title>
                    <Button 
                      type="primary" 
                      onClick={fetchPricingFiles}
                      loading={loading}
                    >
                      Actualizar
                    </Button>
                  </div>
                  
                  <Table
                    columns={pricingFilesColumns}
                    dataSource={pricingFiles}
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
            },
            {
              key: 'calculate',
              label: 'Calcular Precio Base',
              children: (
                <Card className="uc-card">
                  <Title level={4} style={{ marginBottom: '1rem' }}>
                    <CalculatorOutlined style={{ marginRight: '0.5rem' }} />
                    Calculadora de Precio Base GRD
                  </Title>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '2rem' }}>
                    Calcula el precio base para un convenio y peso relativo dados. 
                    Soporta convenios con precio único y por tramos (FNS012/FNS026).
                  </Text>

                  <Form
                    form={calculateForm}
                    layout="vertical"
                    onFinish={handleCalculatePrecioBase}
                    style={{ maxWidth: 600 }}
                  >
                    <Form.Item
                      label="Código de Convenio"
                      name="convenioId"
                      rules={[
                        { required: true, message: 'Debe ingresar un código de convenio' },
                        { pattern: /^[A-Z0-9]+$/, message: 'El código debe contener solo letras mayúsculas y números' }
                      ]}
                      tooltip="Ejemplo: FNS012, FNS026, CH0041"
                    >
                      <Input
                        placeholder="Ej: FNS012"
                        style={{ textTransform: 'uppercase' }}
                        onInput={(e) => {
                          e.currentTarget.value = e.currentTarget.value.toUpperCase()
                        }}
                      />
                    </Form.Item>

                    <Form.Item
                      label="Peso Relativo (IR)"
                      name="pesoRelativo"
                      rules={[
                        { required: true, message: 'Debe ingresar un peso relativo' },
                        {
                          validator: (_, value) => {
                            if (!value && value !== 0) {
                              return Promise.reject(new Error('Debe ingresar un peso relativo'))
                            }
                            const numValue = typeof value === 'string' ? parseFloat(value) : value
                            if (isNaN(numValue) || numValue <= 0) {
                              return Promise.reject(new Error('El peso relativo debe ser un número mayor que 0'))
                            }
                            return Promise.resolve()
                          }
                        }
                      ]}
                      normalize={(value) => {
                        // Normalizar el valor a número
                        if (value === '' || value === null || value === undefined) {
                          return undefined
                        }
                        const numValue = typeof value === 'string' ? parseFloat(value) : value
                        return isNaN(numValue) ? value : numValue
                      }}
                      tooltip="Peso relativo o IR del episodio. Para convenios por tramos: T1 (0-1.5), T2 (1.5-2.5), T3 (>2.5)"
                    >
                      <Input
                        type="number"
                        placeholder="Ej: 2.1"
                        step="0.01"
                        min="0.0001"
                      />
                    </Form.Item>

                    <Form.Item
                      label="Fecha de Referencia (Opcional)"
                      name="fechaReferencia"
                      tooltip="Fecha para validar la vigencia de las tarifas. Si no se especifica, se usa la fecha actual."
                    >
                      <DatePicker
                        style={{ width: '100%' }}
                        format="YYYY-MM-DD"
                        placeholder="Seleccionar fecha"
                      />
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        icon={<CalculatorOutlined />}
                        loading={calculating}
                        size="large"
                        style={{ minWidth: 200 }}
                      >
                        {calculating ? 'Calculando...' : 'Calcular Precio Base'}
                      </Button>
                    </Form.Item>
                  </Form>

                  {calculatedResult && (
                    <div style={{ marginTop: '2rem' }}>
                      <Divider orientation="left">
                        <Title level={4} style={{ margin: 0 }}>
                          Resultado del Cálculo
                        </Title>
                      </Divider>
                      
                      <Card 
                        style={{ 
                          backgroundColor: 'var(--uc-gray-50)',
                          border: '1px solid var(--uc-gray-200)'
                        }}
                      >
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12} md={8}>
                            <Statistic
                              title="Convenio"
                              value={calculatedResult.convenioId}
                              prefix={<FileTextOutlined />}
                            />
                          </Col>
                          <Col xs={24} sm={12} md={8}>
                            <Statistic
                              title="Tipo"
                              value={calculatedResult.tipo === 'PRECIO_UNICO' ? 'Precio Único' : 'Por Tramos'}
                              valueStyle={{ 
                                color: calculatedResult.tipo === 'PRECIO_UNICO' 
                                  ? 'var(--uc-primary-blue)' 
                                  : 'var(--uc-primary-green)' 
                              }}
                            />
                          </Col>
                          <Col xs={24} sm={12} md={8}>
                            <Statistic
                              title="Fuente"
                              value={calculatedResult.fuente === 'db' ? 'Base de Datos' : 'Archivo Adjunto'}
                              prefix={<InfoCircleOutlined />}
                            />
                          </Col>
                          <Col xs={24} sm={24}>
                            <Divider style={{ margin: '1rem 0' }} />
                            <Statistic
                              title="Precio Base Calculado"
                              value={calculatedResult.valor}
                              prefix="$"
                              precision={0}
                              valueStyle={{ 
                                fontSize: '2rem',
                                color: 'var(--uc-primary-blue)',
                                fontWeight: 'bold'
                              }}
                            />
                          </Col>
                        </Row>

                        {calculatedResult.tramo && (
                          <div style={{ marginTop: '1.5rem' }}>
                            <Divider style={{ margin: '1rem 0' }} />
                            <Title level={5}>Información del Tramo</Title>
                            <Descriptions column={1} bordered size="small">
                              <Descriptions.Item label="Tramo">
                                <Tag color="blue" style={{ fontSize: '1rem', padding: '4px 8px' }}>
                                  {calculatedResult.tramo.id}
                                </Tag>
                              </Descriptions.Item>
                              <Descriptions.Item label="Rango">
                                {calculatedResult.tramo.etiqueta}
                              </Descriptions.Item>
                              <Descriptions.Item label="Límites">
                                {calculatedResult.tramo.min} 
                                {calculatedResult.tramo.max !== undefined 
                                  ? ` - ${calculatedResult.tramo.max}` 
                                  : ' en adelante'}
                              </Descriptions.Item>
                            </Descriptions>
                          </div>
                        )}

                        {calculatedResult.vigencia && (
                          <div style={{ marginTop: '1.5rem' }}>
                            <Divider style={{ margin: '1rem 0' }} />
                            <Title level={5}>Vigencia de la Tarifa</Title>
                            <Descriptions column={1} bordered size="small">
                              {calculatedResult.vigencia.desde && (
                                <Descriptions.Item label="Desde">
                                  {new Date(calculatedResult.vigencia.desde).toLocaleDateString('es-CL', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </Descriptions.Item>
                              )}
                              {calculatedResult.vigencia.hasta && (
                                <Descriptions.Item label="Hasta">
                                  {new Date(calculatedResult.vigencia.hasta).toLocaleDateString('es-CL', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </Descriptions.Item>
                              )}
                            </Descriptions>
                          </div>
                        )}

                        <div style={{ marginTop: '1.5rem' }}>
                          <Alert
                            message="Información del Cálculo"
                            description={
                              <div>
                                <p style={{ margin: 0 }}>
                                  <strong>Convenio:</strong> {calculatedResult.convenioId}
                                </p>
                                <p style={{ margin: 0 }}>
                                  <strong>Tipo:</strong> {calculatedResult.tipo === 'PRECIO_UNICO' 
                                    ? 'Este convenio tiene un precio único independiente del peso relativo'
                                    : 'Este convenio usa tramos según el peso relativo del episodio'}
                                </p>
                                {calculatedResult.tramo && (
                                  <p style={{ margin: 0 }}>
                                    <strong>Tramo aplicado:</strong> {calculatedResult.tramo.etiqueta}
                                  </p>
                                )}
                                <p style={{ margin: 0 }}>
                                  <strong>Fuente de datos:</strong> {calculatedResult.fuente === 'db' 
                                    ? 'Base de datos (archivo activo)'
                                    : 'Archivo adjunto (fallback)'}
                                </p>
                              </div>
                            }
                            type="info"
                            showIcon
                            style={{ marginTop: '1rem' }}
                          />
                        </div>
                      </Card>
                    </div>
                  )}
                </Card>
              )
            }
          ]}
        />

        {/* Modal para ver detalles del archivo de tarifas */}
        <Modal
          title="Detalles del Archivo de Tarifas"
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
                if (selectedPricingFile) {
                  handleViewPricingData(selectedPricingFile)
                }
              }}
              disabled={selectedPricingFile?.status !== 'COMPLETED' && selectedPricingFile?.status !== 'PARTIALLY_COMPLETED'}
            >
              Ver Datos
            </Button>
          ]}
          width={600}
        >
          {selectedPricingFile && (
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Archivo">
                {selectedPricingFile.filename}
              </Descriptions.Item>
              <Descriptions.Item label="Descripción">
                {selectedPricingFile.description || 'Sin descripción'}
              </Descriptions.Item>
              <Descriptions.Item label="Estado">
                {getStatusTag(selectedPricingFile.status)}
              </Descriptions.Item>
              {selectedPricingFile.isActive && (
                <Descriptions.Item label="Estado">
                  <Tag color="gold" icon={<StarFilled />}>
                    Archivo Activo
                  </Tag>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Total de Filas">
                {selectedPricingFile.totalRows}
              </Descriptions.Item>
              <Descriptions.Item label="Filas Procesadas">
                {selectedPricingFile.processedRows}
              </Descriptions.Item>
              <Descriptions.Item label="Filas con Errores">
                {selectedPricingFile.errorRows}
              </Descriptions.Item>
              <Descriptions.Item label="Total Tarifas">
                {selectedPricingFile._count?.tarifas || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha de Creación">
                {new Date(selectedPricingFile.createdAt).toLocaleString('es-CL')}
              </Descriptions.Item>
              {selectedPricingFile.completedAt && (
                <Descriptions.Item label="Fecha de Finalización">
                  {new Date(selectedPricingFile.completedAt).toLocaleString('es-CL')}
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Modal>

        {/* Modal para ver datos de tarifas */}
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
              <span>Tarifas - {selectedPricingFile?.filename}</span>
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
          ]}
          width={isFullscreen ? '95vw' : 1200}
          style={{ top: isFullscreen ? 10 : 20 }}
        >
          <Table
            columns={pricingTarifasColumns}
            dataSource={pricingTarifas}
            rowKey="id"
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} de ${total} tarifas`,
            }}
            scroll={{ x: 800, y: isFullscreen ? '70vh' : 400 }}
            size="small"
          />
        </Modal>
      </div>
    </div>
  )
}

export default PricingPage

