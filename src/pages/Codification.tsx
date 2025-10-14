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
  Checkbox,
  Row,
  Col,
  Input,
  Tooltip,
  Drawer
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
  SettingOutlined,
  SearchOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  UndoOutlined
} from '@ant-design/icons'
import { useAuth } from '../components/AuthContext'
import { useNavigate } from 'react-router-dom'
import UCHeader from '../components/UCHeader'
import UCBreadcrumb from '../components/UCBreadcrumb'
import type { UploadProps, TableColumnsType} from 'antd'
import type { ColumnType } from 'antd/es/table'

interface EditableColumn<T> extends ColumnType<T> {
  /** Permite marcar la columna como editable */
  editable?: boolean
}

type EditableTableColumns<T> = EditableColumn<T>[]  

const API_BASE_URL = (import.meta.env.VITE_BACKEND_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
const CODIFICATION_API_BASE = `${API_BASE_URL}/api/codification`

const buildCodificationUrl = (path: string) => {
  if (!path.startsWith('/')) {
    return `${CODIFICATION_API_BASE}/${path}`
  }
  return `${CODIFICATION_API_BASE}${path}`
}

const { Title, Text } = Typography

interface ImportBatch {
  id: string
  filename: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'PARTIALLY_COMPLETED'
  totalRows: number
  processedRows: number
  errorRows: number
  createdAt: string
  updatedAt: string
  completedAt?: string
  _count: {
    stagingRows: number
    normalizedData: number
  }
}

interface NormalizedData {
  id: string
  batchId: string
  episodioCmbd: string
  edadAnos?: number
  sexo?: string
  conjuntoDx?: string
  tipoActividad?: string
  fechaIngresoCompleta?: string
  fechaCompleta?: string
  estanciaEpisodio?: number
  pesoGrdMedio?: number
  irGrd?: string
  facturacionTotal?: number
  anio?: number
  mes?: number
  diagnosticoPrincipal?: string
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

const NUMERIC_FIELD_KEYS = new Set<string>([
  'edadAnos',
  'anio',
  'mes',
  'estanciasPrequirurgicas',
  'estanciasPostquirurgicas',
  'estanciaEpisodio',
  'estanciaRealEpisodio',
  'horasEstancia',
  'estanciaMedia',
  'pesoGrdMedio',
  'pesoMedioNorma',
  'iemaIrBruto',
  'emafIrBruta',
  'impactoEstancias',
  'irPuntoCorteInferior',
  'irPuntoCorteSuperior',
  'emNorma',
  'estanciasNorma',
  'casosNorma',
  'emTrasladosServicio',
  'facturacionTotal',
  'emPreQuirurgica',
  'emPostQuirurgica'
])

const parseNumericValue = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').trim()
    if (normalized === '') {
      return null
    }
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

const formatDecimalValue = (value: unknown): string => {
  const numericValue = parseNumericValue(value)
  if (numericValue === null) {
    return value !== undefined && value !== null ? String(value) : ''
  }
  return numericValue.toFixed(2)
}

const normalizeFieldValue = (field: string, value: unknown) => {
  if (!NUMERIC_FIELD_KEYS.has(field)) {
    return value
  }

  const numericValue = parseNumericValue(value)
  if (numericValue !== null) {
    return numericValue
  }

  if (value === '' || value === null || value === undefined) {
    return null
  }

  return value
}

const isValidNormalizedRow = (item: unknown): item is Record<string, unknown> & { id: string } => {
  if (typeof item !== 'object' || item === null) {
    return false
  }

  const candidate = item as { id?: unknown }
  return typeof candidate.id === 'string'
}

const sanitizeNumericFields = (row: Record<string, unknown>) => {
  const sanitized: Record<string, unknown> = { ...row }
  NUMERIC_FIELD_KEYS.forEach((field) => {
    if (field in sanitized) {
      const currentValue = sanitized[field]
      const parsed = parseNumericValue(currentValue)
      if (parsed !== null) {
        sanitized[field] = parsed
      } else if (typeof currentValue === 'string' && currentValue.trim() === '') {
        sanitized[field] = null
      }
    }
  })
  return sanitized as NormalizedData
}

const CodificationPage: React.FC = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [batches, setBatches] = useState<ImportBatch[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<ImportBatch | null>(null)
  const [normalizedData, setNormalizedData] = useState<NormalizedData[]>([])
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [dataModalVisible, setDataModalVisible] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [columnFilterVisible, setColumnFilterVisible] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({})
  const [columnSearch, setColumnSearch] = useState('')
  const [editingKey, setEditingKey] = useState('')
  const [modifiedData, setModifiedData] = useState<NormalizedData[]>([])
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingValues, setEditingValues] = useState<Record<string, Record<string, unknown>>>({})

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


  const selectAllColumns = () => {
    const allSelected: Record<string, boolean> = {}
    dataColumns.forEach(col => {
      allSelected[col.key as string] = true
    })
    setVisibleColumns(allSelected)
  }

  const deselectAllColumns = () => {
    const noneSelected: Record<string, boolean> = {}
    dataColumns.forEach(col => {
      noneSelected[col.key as string] = false
    })
    setVisibleColumns(noneSelected)
  }

  const isEditing = (record: NormalizedData) => {
    if (!record || !record.id) return false
    return record.id === editingKey
  }

  const edit = (record: NormalizedData) => {
    if (!record || !record.id) {
      console.warn('edit: record o record.id no válidos', record)
      return
    }
    
    setEditingKey(record.id)
    // Inicializar valores de edición con los datos actuales
    setEditingValues(prev => ({
      ...prev,
      [record.id]: { ...record }
    }))
  }

  const cancel = () => {
    setEditingKey('')
    // Limpiar valores de edición
    setEditingValues(prev => {
      const newValues = { ...prev }
      if (editingKey) {
        delete newValues[editingKey]
      }
      return newValues
    })
  }

  const save = async (key: string) => {
    try {
      if (!key) {
        console.warn('save: key no válido', key)
        return
      }

      const editingRow = editingValues[key]
      if (!editingRow) {
        console.warn('save: no hay datos de edición para la clave', key)
        return
      }

      // Actualizar los datos modificados con los valores de edición
      setModifiedData(prev => 
        prev.map(item => {
          if (!item || item.id !== key) {
            return item
          }

          const normalizedValues = Object.entries(editingRow).reduce<Record<string, unknown>>((acc, [field, value]) => {
            acc[field] = normalizeFieldValue(field, value)
            return acc
          }, {})

          return { ...item, ...normalizedValues }
        })
      )
      
      setEditingKey('')
      setHasUnsavedChanges(true)
      
      // Limpiar valores de edición
      setEditingValues(prev => {
        const newValues = { ...prev }
        delete newValues[key]
        return newValues
      })
      
      message.success('Cambios guardados localmente')
    } catch (errInfo) {
      console.error('Error en save:', errInfo)
      message.error('Error al guardar los cambios')
    }
  }

  const handleCellChange = React.useCallback((key: string, field: string, value: unknown) => {
    // Validaciones de seguridad
    if (!key || !field) {
      console.warn('handleCellChange: key o field no válidos', { key, field, value })
      return
    }

    // Actualizar solo los valores de edición, no modifiedData
    setEditingValues(prev => ({
      ...prev,
      [key]: {
        ...(prev[key] ?? {}),
        [field]: value
      }
    }))
  }, [])

  const handleSaveAllChanges = async () => {
    setSaving(true)
    try {
      // Aquí se enviarían todos los cambios al backend
      // Por ahora simulamos el guardado
      await new Promise(resolve => setTimeout(resolve, 1000))
      setHasUnsavedChanges(false)
      message.success('Todos los cambios han sido guardados')
    } catch {
      message.error('Error al guardar los cambios')
    } finally {
      setSaving(false)
    }
  }

  const handleExportModified = () => {
    try {
      // Convertir datos modificados a CSV
      const csvContent = convertToCSV(modifiedData)
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `datos_modificados_${selectedBatch?.filename || 'export'}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      message.success('Archivo exportado exitosamente')
    } catch {
      message.error('Error al exportar el archivo')
    }
  }

  const handleDiscardChanges = () => {
    Modal.confirm({
      title: '¿Descartar todos los cambios?',
      content: 'Esta acción revertirá todos los cambios realizados y volverá a los datos originales. ¿Estás seguro?',
      okText: 'Sí, descartar',
      cancelText: 'Cancelar',
      okType: 'danger',
      onOk() {
        setModifiedData(normalizedData.map(item => ({ ...item })))
        setHasUnsavedChanges(false)
        setEditingKey('')
        setEditingValues({})
        message.success('Cambios descartados')
      },
    })
  }

  const convertToCSV = (data: NormalizedData[]) => {
    if (data.length === 0) return ''
    
    const headers = Object.keys(data[0])
    const csvHeaders = headers.join(';')
    
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header as keyof NormalizedData]
        return value !== null && value !== undefined ? String(value) : ''
      }).join(';')
    )
    
    return [csvHeaders, ...csvRows].join('\n')
  }

  const fetchBatches = async () => {
    setLoading(true)
    try {
      const response = await fetch(buildCodificationUrl('/batches'))
      const result = await response.json()
      if (result.success) {
        setBatches(result.data.batches)
      } else {
        message.error('Error al cargar los lotes de importación')
      }
    } catch (error) {
      message.error('Error de conexión al cargar los lotes')
    } finally {
      setLoading(false)
    }
  }

  const fetchNormalizedData = async (batchId: string) => {
    try {
      const response = await fetch(buildCodificationUrl(`/batches/${batchId}/normalized`))
      const result = await response.json()

      if (result.success && result.data && result.data.normalizedData) {
        // 1) parte desde unknown[]
        const rawData: unknown[] = Array.isArray(result.data.normalizedData)
          ? result.data.normalizedData
          : []
        // 2) usa el type-guard para refinar el tipo
        const validRows: Array<Record<string, unknown> & { id: string }> =
          rawData.filter(isValidNormalizedRow)
        // 3) sanea y obtén NormalizedData[]
        const sanitizedData: NormalizedData[] = validRows.map((item) =>
          sanitizeNumericFields(item)
        )

        setNormalizedData(sanitizedData)
        // 4) si quieres clonar, evita any tipando el parámetro
        setModifiedData(sanitizedData.map((item: NormalizedData) => ({ ...item })))
        // (o simplemente: setModifiedData([...sanitizedData]))
        setHasUnsavedChanges(false)
        setEditingKey('')
        setEditingValues({})
      } else {
        message.error('Error al cargar los datos normalizados')
      }
    } catch (error) {
      console.error('Error en fetchNormalizedData:', error)
      message.error('Error de conexión al cargar los datos')
    }
  }

  useEffect(() => {
    fetchBatches()
  }, [])

  const handleFileSelect = (file: File) => {
    const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv')
    if (!isCSV) {
      message.error('Solo se permiten archivos CSV')
      return false
    }
    const isLt10M = file.size / 1024 / 1024 < 10
    if (!isLt10M) {
      message.error('El archivo debe ser menor a 10MB')
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

      const response = await fetch(buildCodificationUrl('/csv'), {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      
      if (result.success) {
        message.success(`Importación completada: ${result.data.processedRows} filas procesadas`)
        setSelectedFile(null)
        fetchBatches() // Refresh the list
      } else {
        message.error(result.message || 'Error en la importación')
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

  const handleViewBatch = (batch: ImportBatch) => {
    setSelectedBatch(batch)
    setViewModalVisible(true)
  }

  const handleViewData = async (batch: ImportBatch) => {
    setSelectedBatch(batch)
    await fetchNormalizedData(batch.id)
    setDataModalVisible(true)
  }

  const batchColumns: TableColumnsType<ImportBatch> = [
    {
      title: 'Archivo',
      dataIndex: 'filename',
      key: 'filename',
      render: (filename: string) => (
        <Space>
          <FileTextOutlined />
          <Text strong>{filename}</Text>
        </Space>
      ),
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
            onClick={() => handleViewBatch(record)}
          >
            Ver
          </Button>
          <Button 
            type="link" 
            icon={<DownloadOutlined />}
            onClick={() => handleViewData(record)}
            disabled={record.status !== 'COMPLETED' && record.status !== 'PARTIALLY_COMPLETED'}
          >
            Datos
          </Button>
        </Space>
      ),
    },
  ]

  const EditableCell: React.FC<{
    editing: boolean
    dataIndex: string
    inputType: 'number' | 'text'
    record: NormalizedData
    children: React.ReactNode
  }> = React.memo(({
    editing,
    dataIndex,
    inputType,
    record,
    children,
    ...restProps
  }) => {
    if (!record || !record.id) {
      return <td {...restProps}>{children}</td>
    }

    const currentValue =
      modifiedData.find(item => item && item.id === record.id)?.[dataIndex as keyof NormalizedData]

    const editingValue = editingValues[record.id]?.[dataIndex]
    const displayValue = editingValue !== undefined ? editingValue : currentValue

    // 🔹 valor local independiente del re-render global
    const [localValue, setLocalValue] = React.useState<string | number>(
      typeof displayValue === 'number' || typeof displayValue === 'string'
        ? displayValue
        : ''
    )

    // 🔹 sincroniza solo cuando cambia el registro o el campo
    React.useEffect(() => {
      if (typeof displayValue === 'number' || typeof displayValue === 'string') {
        setLocalValue(displayValue)
      } else {
        setLocalValue('')
      }
    }, [displayValue, record.id, dataIndex])

    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setLocalValue(e.target.value); // solo estado local
      },
      [setLocalValue] // 👈 sin handleCellChange, sin record.id, sin dataIndex
   );
    const commitCellChange = React.useCallback(
      (key: string, field: string, value: unknown) => {
        setEditingValues(prev => {
          const row = prev[key] ?? {}
          if (row[field] === value) return prev
          return { ...prev, [key]: { ...row, [field]: value } }
        })
        setHasUnsavedChanges(true)
      },
      []
    )

    return (
      <td {...restProps}>
        {editing ? (
          <Input
            value={localValue}
            onChange={handleChange}
            onBlur={() => commitCellChange(record.id, dataIndex, localValue)}
            onPressEnter={() => commitCellChange(record.id, dataIndex, localValue)}
            style={{ width: '100%' }}
            type={inputType === 'number' ? 'number' : 'text'}
          />
        ) : (
          children
        )}
      </td>
    )
  })
  const dataColumns: EditableTableColumns<NormalizedData> = [
    // Campos principales del episodio
    {
      title: 'Episodio CMBD',
      dataIndex: 'episodioCmbd',
      key: 'episodioCmbd',
      width: 150,
      fixed: 'left',
      editable: true,
    },
    {
      title: 'Edad',
      dataIndex: 'edadAnos',
      key: 'edadAnos',
      width: 80,
      editable: true,
    },
    {
      title: 'Sexo',
      dataIndex: 'sexo',
      key: 'sexo',
      width: 100,
      editable: true,
    },
    {
      title: 'Conjunto Dx',
      dataIndex: 'conjuntoDx',
      key: 'conjuntoDx',
      width: 120,
      editable: true,
    },
    {
      title: 'Tipo Actividad',
      dataIndex: 'tipoActividad',
      key: 'tipoActividad',
      width: 120,
      editable: true,
    },
    {
      title: 'Tipo Ingreso',
      dataIndex: 'tipoIngreso',
      key: 'tipoIngreso',
      width: 120,
      editable: true,
    },
    {
      title: 'Servicio Ingreso',
      dataIndex: 'servicioIngresoDesc',
      key: 'servicioIngresoDesc',
      width: 150,
      editable: true,
    },
    {
      title: 'Motivo Egreso',
      dataIndex: 'motivoEgreso',
      key: 'motivoEgreso',
      width: 120,
      editable: true,
    },
    {
      title: 'Médico Egreso',
      dataIndex: 'medicoEgreso',
      key: 'medicoEgreso',
      width: 150,
      editable: true,
    },
    {
      title: 'Especialidad Egreso',
      dataIndex: 'especialidadEgreso',
      key: 'especialidadEgreso',
      width: 150,
      editable: true,
    },
    {
      title: 'Servicio Egreso',
      dataIndex: 'servicioEgresoDesc',
      key: 'servicioEgresoDesc',
      width: 150,
      editable: true,
    },
    
    // Previsión
    {
      title: 'Previsión',
      dataIndex: 'previsionDesc',
      key: 'previsionDesc',
      width: 150,
      editable: true,
    },
    {
      title: 'Previsión 2',
      dataIndex: 'prevision2Desc',
      key: 'prevision2Desc',
      width: 150,
      editable: true,
    },
    
    // Ley y convenios
    {
      title: 'Ley',
      dataIndex: 'leyDesc',
      key: 'leyDesc',
      width: 120,
      editable: true,
    },
    {
      title: 'Convenios',
      dataIndex: 'conveniosDesc',
      key: 'conveniosDesc',
      width: 120,
      editable: true,
    },
    
    // Servicio de salud
    {
      title: 'Servicio Salud',
      dataIndex: 'servicioSaludDesc',
      key: 'servicioSaludDesc',
      width: 150,
      editable: true,
    },
    
    // Estancias
    {
      title: 'Estancias Prequirúrgicas',
      dataIndex: 'estanciasPrequirurgicas',
      key: 'estanciasPrequirurgicas',
      width: 120,
      editable: true,
    },
    {
      title: 'Estancias Postquirúrgicas',
      dataIndex: 'estanciasPostquirurgicas',
      key: 'estanciasPostquirurgicas',
      width: 120,
      editable: true,
    },
    {
      title: 'Estancia Episodio',
      dataIndex: 'estanciaEpisodio',
      key: 'estanciaEpisodio',
      width: 100,
      editable: true,
    },
    {
      title: 'Estancia Real',
      dataIndex: 'estanciaRealEpisodio',
      key: 'estanciaRealEpisodio',
      width: 100,
      editable: true,
    },
    {
      title: 'Horas Estancia',
      dataIndex: 'horasEstancia',
      key: 'horasEstancia',
      width: 100,
      editable: true,
      render: (value) => formatDecimalValue(value),
    },
    {
      title: 'Estancia Media',
      dataIndex: 'estanciaMedia',
      key: 'estanciaMedia',
      width: 100,
      editable: true,
      render: (value) => formatDecimalValue(value),
    },
    
    // GRD
    {
      title: 'Peso GRD Medio',
      dataIndex: 'pesoGrdMedio',
      key: 'pesoGrdMedio',
      width: 120,
      editable: true,
      render: (value) => formatDecimalValue(value),
    },
    {
      title: 'Peso Medio Norma',
      dataIndex: 'pesoMedioNorma',
      key: 'pesoMedioNorma',
      width: 120,
      editable: true,
      render: (value) => formatDecimalValue(value),
    },
    {
      title: 'IEMA IR Bruto',
      dataIndex: 'iemaIrBruto',
      key: 'iemaIrBruto',
      width: 120,
      editable: true,
      render: (value) => formatDecimalValue(value),
    },
    {
      title: 'EMAf IR Bruta',
      dataIndex: 'emafIrBruta',
      key: 'emafIrBruta',
      width: 120,
      editable: true,
      render: (value) => formatDecimalValue(value),
    },
    {
      title: 'Impacto Estancias',
      dataIndex: 'impactoEstancias',
      key: 'impactoEstancias',
      width: 120,
      editable: true,
      render: (value) => formatDecimalValue(value),
    },
    {
      title: 'IR Gravedad',
      dataIndex: 'irGravedad',
      key: 'irGravedad',
      width: 120,
      editable: true,
    },
    {
      title: 'IR Mortalidad',
      dataIndex: 'irMortalidad',
      key: 'irMortalidad',
      width: 120,
      editable: true,
    },
    {
      title: 'IR Tipo GRD',
      dataIndex: 'irTipoGrd',
      key: 'irTipoGrd',
      width: 120,
      editable: true,
    },
    {
      title: 'IR GRD Código',
      dataIndex: 'irGrdCodigo',
      key: 'irGrdCodigo',
      width: 120,
      editable: true,
    },
    {
      title: 'IR GRD',
      dataIndex: 'irGrd',
      key: 'irGrd',
      width: 150,
      editable: true,
    },
    {
      title: 'IR Punto Corte Inferior',
      dataIndex: 'irPuntoCorteInferior',
      key: 'irPuntoCorteInferior',
      width: 140,
      editable: true,
      render: (value) => formatDecimalValue(value),
    },
    {
      title: 'IR Punto Corte Superior',
      dataIndex: 'irPuntoCorteSuperior',
      key: 'irPuntoCorteSuperior',
      width: 140,
      editable: true,
      render: (value) => formatDecimalValue(value),
    },
    {
      title: 'EM Norma',
      dataIndex: 'emNorma',
      key: 'emNorma',
      width: 100,
      editable: true,
      render: (value) => formatDecimalValue(value),
    },
    {
      title: 'Estancias Norma',
      dataIndex: 'estanciasNorma',
      key: 'estanciasNorma',
      width: 120,
      editable: true,
      render: (value) => formatDecimalValue(value),
    },
    {
      title: 'Casos Norma',
      dataIndex: 'casosNorma',
      key: 'casosNorma',
      width: 100,
      editable: true,
    },
    
    // Fechas
    {
      title: 'Fecha Ingreso',
      dataIndex: 'fechaIngresoCompleta',
      key: 'fechaIngresoCompleta',
      width: 120,
      editable: true,
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      title: 'Fecha Completa',
      dataIndex: 'fechaCompleta',
      key: 'fechaCompleta',
      width: 120,
      editable: true,
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '-',
    },
    
    // Traslados
    {
      title: 'Conjunto Servicios Traslado',
      dataIndex: 'conjuntoServiciosTraslado',
      key: 'conjuntoServiciosTraslado',
      width: 180,
      editable: true,
    },
    {
      title: 'EM Traslados Servicio',
      dataIndex: 'emTrasladosServicio',
      key: 'emTrasladosServicio',
      width: 150,
      editable: true,
      render: (value) => formatDecimalValue(value),
    },
    
    // Facturación
    {
      title: 'Facturación Total',
      dataIndex: 'facturacionTotal',
      key: 'facturacionTotal',
      width: 140,
      editable: true,
      render: (value: number) => value ? `$${value.toLocaleString()}` : '-',
    },
    {
      title: 'Especialidad Médica',
      dataIndex: 'especialidadMedica',
      key: 'especialidadMedica',
      width: 150,
      editable: true,
    },
    {
      title: 'IR Alta Inlier',
      dataIndex: 'irAltaInlier',
      key: 'irAltaInlier',
      width: 120,
      editable: true,
    },
    
    // Metadatos
    {
      title: 'Año',
      dataIndex: 'anio',
      key: 'anio',
      width: 80,
      editable: true,
    },
    {
      title: 'Mes',
      dataIndex: 'mes',
      key: 'mes',
      width: 80,
      editable: true,
    },
    {
      title: 'Diagnóstico Principal',
      dataIndex: 'diagnosticoPrincipal',
      key: 'diagnosticoPrincipal',
      width: 150,
      editable: true,
    },
    {
      title: 'Procedimiento Principal',
      dataIndex: 'proced01Principal',
      key: 'proced01Principal',
      width: 150,
      editable: true,
    },
    {
      title: 'Conjunto Procedimientos Secundarios',
      dataIndex: 'conjuntoProcedimientosSecundarios',
      key: 'conjuntoProcedimientosSecundarios',
      width: 200,
      editable: true,
    },
    
    // Códigos adicionales
    {
      title: 'Previsión Código',
      dataIndex: 'previsionCod',
      key: 'previsionCod',
      width: 120,
      editable: true,
    },
    {
      title: 'Previsión 2 Código',
      dataIndex: 'prevision2Cod',
      key: 'prevision2Cod',
      width: 120,
      editable: true,
    },
    {
      title: 'Ley Código',
      dataIndex: 'leyCod',
      key: 'leyCod',
      width: 100,
      editable: true,
    },
    {
      title: 'Convenios Código',
      dataIndex: 'conveniosCod',
      key: 'conveniosCod',
      width: 120,
      editable: true,
    },
    {
      title: 'Servicio Salud Código',
      dataIndex: 'servicioSaludCod',
      key: 'servicioSaludCod',
      width: 150,
      editable: true,
    },
    {
      title: 'Servicio Ingreso Código',
      dataIndex: 'servicioIngresoCod',
      key: 'servicioIngresoCod',
      width: 150,
      editable: true,
    },
    {
      title: 'Servicio Egreso Código',
      dataIndex: 'servicioEgresoCod',
      key: 'servicioEgresoCod',
      width: 150,
      editable: true,
    },
    
    // Campos EM adicionales
    {
      title: 'EM Pre-Quirúrgica',
      dataIndex: 'emPreQuirurgica',
      key: 'emPreQuirurgica',
      width: 130,
      editable: true,
      render: (value) => formatDecimalValue(value),
    },
    {
      title: 'EM Post-Quirúrgica',
      dataIndex: 'emPostQuirurgica',
      key: 'emPostQuirurgica',
      width: 130,
      editable: true,
      render: (value) => formatDecimalValue(value),
    },
    
    // Fechas de traslados (mostramos solo las primeras 3 para no saturar)
    {
      title: 'Fecha Traslado 1',
      dataIndex: 'fechaTr1',
      key: 'fechaTr1',
      width: 120,
      editable: true,
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      title: 'Fecha Traslado 2',
      dataIndex: 'fechaTr2',
      key: 'fechaTr2',
      width: 120,
      editable: true,
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '-',
    },
    {
      title: 'Fecha Traslado 3',
      dataIndex: 'fechaTr3',
      key: 'fechaTr3',
      width: 120,
      editable: true,
      render: (value: string) => value ? new Date(value).toLocaleDateString() : '-',
    },
    
    // Servicios de traslado
    {
      title: 'Servicio Ingreso Código 1',
      dataIndex: 'servicioIngresoCod1',
      key: 'servicioIngresoCod1',
      width: 150,
      editable: true,
    },
    {
      title: 'Servicio Código Tr1',
      dataIndex: 'servicioCodTr1',
      key: 'servicioCodTr1',
      width: 130,
      editable: true,
    },
    {
      title: 'Servicio Código Tr2',
      dataIndex: 'servicioCodTr2',
      key: 'servicioCodTr2',
      width: 130,
      editable: true,
    },
    {
      title: 'Servicio Egreso Código 2',
      dataIndex: 'servicioEgresoCod2',
      key: 'servicioEgresoCod2',
      width: 150,
      editable: true,
    },
    {
      title: 'Acciones',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => {
        const editable = isEditing(record)
        return editable ? (
          <Space>
            <Button
              type="link"
              onClick={() => save(record.id)}
              icon={<SaveOutlined />}
              size="small"
            >
              Guardar
            </Button>
            <Button
              type="link"
              onClick={cancel}
              icon={<CloseOutlined />}
              size="small"
            >
              Cancelar
            </Button>
          </Space>
        ) : (
          <Button
            type="link"
            disabled={editingKey !== ''}
            onClick={() => edit(record)}
            icon={<EditOutlined />}
            size="small"
          >
            Editar
          </Button>
        )
      },
    },
  ]

  // Inicializar columnas visibles
  useEffect(() => {
    const initialColumns: Record<string, boolean> = {}
    dataColumns.forEach(col => {
      initialColumns[col.key as string] = true
    })
    setVisibleColumns(initialColumns)
  }, [])

  // Filtrar columnas basado en búsqueda y selección
  const filteredColumns = dataColumns.filter(col => {
    const isVisible = visibleColumns[col.key as string] !== false
    const matchesSearch = columnSearch === '' || 
      (col.title as string).toLowerCase().includes(columnSearch.toLowerCase())
    return isVisible && matchesSearch
  })

  // Aplicar componentes editables a las columnas
  const mergedColumns = filteredColumns.map((col: any) => {
    if (!col.editable) {
      return col
    }

    return {
      ...col,
      onCell: (record: NormalizedData) => ({
        record,
        inputType: NUMERIC_FIELD_KEYS.has(col.dataIndex as string) ? 'number' : 'text',
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    }
  })

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
            Sistema de Codificación GRD-FONASA
          </Title>
          <Text type="secondary" style={{ fontSize: '1.1rem' }}>
            Importación y gestión de archivos CSV para codificación de episodios médicos
          </Text>
        </div>

        <Tabs 
          defaultActiveKey="upload" 
          size="large"
          items={[
            {
              key: 'upload',
              label: 'Subir Archivo',
              children: (
                <Card className="uc-card">
                  <div style={{ textAlign: 'center', padding: '2rem' }}>
                    <Upload.Dragger {...uploadProps} style={{ marginBottom: '1rem' }}>
                      <p className="ant-upload-drag-icon">
                        <UploadOutlined style={{ fontSize: '3rem', color: 'var(--uc-primary-blue)' }} />
                      </p>
                      <p className="ant-upload-text" style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                        Arrastra tu archivo CSV aquí
                      </p>
                      <p className="ant-upload-hint" style={{ fontSize: '1rem' }}>
                        O haz clic para seleccionar un archivo
                      </p>
                      <p style={{ color: 'var(--uc-gray-500)', fontSize: '0.9rem', marginTop: '1rem' }}>
                        Formato requerido: CSV con separador ';' y codificación latin-1<br />
                        Máximo 10MB, 80 columnas específicas
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
                        {uploading ? 'Subiendo...' : 'Subir Archivo'}
                      </Button>
                    </div>
                    
                    {uploading && (
                      <Alert
                        message="Procesando archivo..."
                        description="Por favor espera mientras se procesa tu archivo CSV."
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
              key: 'batches',
              label: 'Lotes de Importación',
              children: (
                <Card className="uc-card">
                  <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={4} style={{ margin: 0 }}>
                      Historial de Importaciones
                    </Title>
                    <Button 
                      type="primary" 
                      onClick={fetchBatches}
                      loading={loading}
                    >
                      Actualizar
                    </Button>
                  </div>
                  
                  <Table
                    columns={batchColumns}
                    dataSource={batches}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => 
                        `${range[0]}-${range[1]} de ${total} lotes`,
                    }}
                    scroll={{ x: 800 }}
                  />
                </Card>
              )
            }
          ]}
        />

        {/* Modal para ver detalles del lote */}
        <Modal
          title="Detalles del Lote de Importación"
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
                if (selectedBatch) {
                  handleViewData(selectedBatch)
                }
              }}
              disabled={selectedBatch?.status !== 'COMPLETED' && selectedBatch?.status !== 'PARTIALLY_COMPLETED'}
            >
              Ver Datos
            </Button>
          ]}
          width={600}
        >
          {selectedBatch && (
            <Descriptions column={1} bordered>
              <Descriptions.Item label="Archivo">
                {selectedBatch.filename}
              </Descriptions.Item>
              <Descriptions.Item label="Estado">
                {getStatusTag(selectedBatch.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Total de Filas">
                {selectedBatch.totalRows}
              </Descriptions.Item>
              <Descriptions.Item label="Filas Procesadas">
                {selectedBatch.processedRows}
              </Descriptions.Item>
              <Descriptions.Item label="Filas con Errores">
                {selectedBatch.errorRows}
              </Descriptions.Item>
              <Descriptions.Item label="Fecha de Creación">
                {new Date(selectedBatch.createdAt).toLocaleString('es-CL')}
              </Descriptions.Item>
              {selectedBatch.completedAt && (
                <Descriptions.Item label="Fecha de Finalización">
                  {new Date(selectedBatch.completedAt).toLocaleString('es-CL')}
                </Descriptions.Item>
              )}
            </Descriptions>
          )}
        </Modal>

        {/* Modal para ver datos normalizados */}
        <Modal
          title={
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingRight: '3rem', // 🔹 mueve los botones hacia la izquierda
              }}
            >
              <span>Datos Normalizados - {selectedBatch?.filename}</span>
              <Space style={{ gap: '0.5rem' }}>
                <Tooltip title="Filtrar columnas">
                  <Button
                    icon={<SettingOutlined />}
                    onClick={() => setColumnFilterVisible(true)}
                    size="small"
                  />
                </Tooltip>
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
              key="discard" 
              icon={<UndoOutlined />}
              onClick={handleDiscardChanges}
              disabled={!hasUnsavedChanges}
            >
              Descartar Cambios
            </Button>,
            <Button 
              key="save" 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={handleSaveAllChanges}
              loading={saving}
              disabled={!hasUnsavedChanges}
            >
              Guardar Cambios
            </Button>,
            <Button 
              key="export" 
              icon={<DownloadOutlined />}
              onClick={handleExportModified}
            >
              Exportar CSV
            </Button>
          ]}
          width={isFullscreen ? '95vw' : 1200}
          style={{ top: isFullscreen ? 10 : 20 }}
        >
          {hasUnsavedChanges && (
            <Alert
              message="Tienes cambios sin guardar"
              description="Los datos han sido modificados. Recuerda guardar los cambios antes de cerrar."
              type="warning"
              showIcon
              style={{ marginBottom: '1rem' }}
            />
          )}
          <Table
            components={{
              body: {
                cell: EditableCell,
              },
            }}
            columns={mergedColumns}
            dataSource={modifiedData.filter(item => item && item.id)} // Filtrar elementos válidos
            rowKey="id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} de ${total} registros`,
            }}
            scroll={{ x: 800, y: isFullscreen ? '70vh' : 400 }}
            size="small"
            rowClassName={(record) => 
              record && record.id && isEditing(record) ? 'editing-row' : ''
            }
          />
        </Modal>

        {/* Drawer para filtro de columnas */}
        <Drawer
          title="Filtrar Columnas"
          placement="right"
          onClose={() => setColumnFilterVisible(false)}
          open={columnFilterVisible}
          width={400}
        >
          <div style={{ marginBottom: 16 }}>
            <Input
              placeholder="Buscar columnas..."
              prefix={<SearchOutlined />}
              value={columnSearch}
              onChange={(e) => setColumnSearch(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <Space style={{ marginBottom: 16 }}>
              <Button size="small" onClick={selectAllColumns}>
                Seleccionar Todas
              </Button>
              <Button size="small" onClick={deselectAllColumns}>
                Deseleccionar Todas
              </Button>
            </Space>
          </div>
          
          <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <Checkbox.Group
              value={Object.keys(visibleColumns).filter(key => visibleColumns[key])}
              onChange={(checkedValues) => {
                const newVisibleColumns: Record<string, boolean> = {}
                dataColumns.forEach(col => {
                  newVisibleColumns[col.key as string] = checkedValues.includes(col.key as string)
                })
                setVisibleColumns(newVisibleColumns)
              }}
            >
              <Row gutter={[8, 8]}>
                {dataColumns
                  .filter(col => 
                    columnSearch === '' || 
                    (col.title as string).toLowerCase().includes(columnSearch.toLowerCase())
                  )
                  .map(col => (
                    <Col span={24} key={col.key as string}>
                      <Checkbox value={col.key as string}>
                        {col.title as string}
                      </Checkbox>
                    </Col>
                  ))}
              </Row>
            </Checkbox.Group>
          </div>
          
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Mostrando {filteredColumns.length} de {dataColumns.length} columnas
            </Text>
          </div>
        </Drawer>
      </div>
    </div>
  )
}

export default CodificationPage
