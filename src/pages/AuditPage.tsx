import React, { useEffect, useMemo, useState } from 'react'
import {
  Card,
  Typography,
  Table,
  Tag,
  Space,
  Button,
  Input,
  DatePicker,
  Select,
  Modal,
  Descriptions,
  Row,
  Col,
  message
} from 'antd'
import {
  AuditOutlined,
  EyeOutlined,
  ReloadOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons'
import type { TablePaginationConfig } from 'antd'
import type { Dayjs } from 'dayjs'
import { useNavigate } from 'react-router-dom'
import UCHeader from '../components/UCHeader'
import UCBreadcrumb from '../components/UCBreadcrumb'
import { useAuth } from '../components/AuthContext'
import { authFetch } from '../utils/authFetch'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

const API_BASE_URL = (import.meta.env.VITE_BACKEND_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
const AUDIT_API_BASE = `${API_BASE_URL}/api/audit`

type AuditLog = {
  id: string
  action: string
  entityType: string
  entityId?: string | null
  userId?: string | null
  userEmail?: string | null
  userName?: string | null
  description?: string | null
  before?: unknown
  after?: unknown
  metadata?: Record<string, unknown> | null
  createdAt: string
}

const actionColors: Record<string, string> = {
  CODIFICATION_IMPORT_COMPLETED: 'green',
  CODIFICATION_IMPORT_FAILED: 'red',
  CODIFICATION_ROW_UPDATED: 'blue',
  NORMA_IMPORT_COMPLETED: 'green',
  NORMA_IMPORT_FAILED: 'red',
  NORMA_BATCH_ACTIVATED: 'purple',
  NORMA_BATCH_DELETED: 'volcano'
}

const AuditPage: React.FC = () => {
  const { user, logout, getAccessTokenSilently } = useAuth()
  const navigate = useNavigate()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 })
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [detailVisible, setDetailVisible] = useState(false)
  const [filters, setFilters] = useState<{
    userEmail: string
    action: string
    entityType: string
    entityId: string
    dateRange: [Dayjs | null, Dayjs | null]
  }>({
    userEmail: '',
    action: '',
    entityType: '',
    entityId: '',
    dateRange: [null, null],
  })

  const buildUserHeaders = () => ({
    ...(user?.email ? { 'x-user-email': user.email } : {}),
    ...(user?.sub ? { 'x-user-id': user.sub } : {}),
    ...(user?.name ? { 'x-user-name': user.name } : {}),
  })

  const actionOptions = useMemo(
    () => [
      'CODIFICATION_IMPORT_COMPLETED',
      'CODIFICATION_IMPORT_FAILED',
      'CODIFICATION_ROW_UPDATED',
      'NORMA_IMPORT_COMPLETED',
      'NORMA_IMPORT_FAILED',
      'NORMA_BATCH_ACTIVATED',
      'NORMA_BATCH_DELETED',
    ],
    []
  )

  const fetchLogs = async (page = 1) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', String(pagination.limit))

      if (filters.userEmail) params.set('userEmail', filters.userEmail)
      if (filters.action) params.set('action', filters.action)
      if (filters.entityType) params.set('entityType', filters.entityType)
      if (filters.entityId) params.set('entityId', filters.entityId)
      if (filters.dateRange[0]) params.set('from', filters.dateRange[0].toISOString())
      if (filters.dateRange[1]) params.set('to', filters.dateRange[1].toISOString())

      const response = await authFetch(
        `${AUDIT_API_BASE}/logs?${params.toString()}`,
        { headers: buildUserHeaders() },
        getAccessTokenSilently
      )
      const result = await response.json()

      if (result.success) {
        setLogs(result.data.logs)
        setPagination({
          page: result.data.pagination.page,
          limit: result.data.pagination.limit,
          total: result.data.pagination.total,
        })
      } else {
        message.error(result.message || 'No se pudieron cargar los registros de auditoría')
      }
    } catch (error) {
      console.error('Error cargando auditoría', error)
      message.error('Error de conexión al cargar la auditoría')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.action, filters.entityId, filters.entityType, filters.userEmail, filters.dateRange])

  const handleTableChange = (pager: TablePaginationConfig) => {
    const nextPage = pager.current ?? 1
    fetchLogs(nextPage)
  }

  const renderJson = (value: unknown) => {
    if (value === null || value === undefined) return '—'
    try {
      return JSON.stringify(value, null, 2)
    } catch (error) {
      return String(value)
    }
  }

  const columns = [
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
      render: (value: string) => <Tag color={actionColors[value] || 'default'}>{value}</Tag>,
      width: 190,
    },
    {
      title: 'Entidad',
      key: 'entity',
      render: (_: unknown, record: AuditLog) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.entityType}</Text>
          {record.entityId && <Text type="secondary">ID: {record.entityId}</Text>}
        </Space>
      ),
      width: 180,
    },
    {
      title: 'Usuario',
      key: 'user',
      render: (_: unknown, record: AuditLog) => (
        <Space direction="vertical" size={0}>
          <Text>{record.userName || record.userEmail || '—'}</Text>
          {record.userEmail && <Text type="secondary">{record.userEmail}</Text>}
        </Space>
      ),
      width: 200,
    },
    {
      title: 'Descripción',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value: string | null) => value || '—',
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: unknown, record: AuditLog) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => {
            setSelectedLog(record)
            setDetailVisible(true)
          }}
        >
          Ver detalle
        </Button>
      ),
      width: 120,
      fixed: 'right' as const,
    },
  ]

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleBackToAdmin = () => navigate('/admin')

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
              <Title level={2} style={{ marginBottom: 0 }}>Auditoría de cambios</Title>
              <Text type="secondary">Registro detallado de operaciones con before/after</Text>
            </div>
            <Space>
              <Button icon={<ArrowLeftOutlined />} onClick={handleBackToAdmin}>
                Volver
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => fetchLogs(pagination.page)}>
                Refrescar
              </Button>
            </Space>
          </Space>
        </Card>

        <Card className="uc-card" style={{ marginBottom: '1rem' }}>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Usuario (email)"
                value={filters.userEmail}
                onChange={(e) => setFilters({ ...filters, userEmail: e.target.value })}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                placeholder="Acción"
                value={filters.action || undefined}
                onChange={(value) => setFilters({ ...filters, action: value || '' })}
                allowClear
                style={{ width: '100%' }}
              >
                {actionOptions.map((action) => (
                  <Select.Option key={action} value={action}>
                    {action}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="Entidad (ej: importBatch, normaMinsalFile)"
                value={filters.entityType}
                onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Input
                placeholder="ID de entidad"
                value={filters.entityId}
                onChange={(e) => setFilters({ ...filters, entityId: e.target.value })}
                allowClear
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <RangePicker
                style={{ width: '100%' }}
                showTime
                value={filters.dateRange}
                onChange={(dates) => setFilters({ ...filters, dateRange: dates ?? [null, null] })}
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Button type="primary" icon={<AuditOutlined />} onClick={() => fetchLogs(1)} block>
                Aplicar filtros
              </Button>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Button
                onClick={() =>
                  setFilters({ userEmail: '', action: '', entityType: '', entityId: '', dateRange: [null, null] })
                }
                block
              >
                Limpiar
              </Button>
            </Col>
          </Row>
        </Card>

        <Card className="uc-card">
          <Table
            rowKey="id"
            dataSource={logs}
            columns={columns}
            loading={loading}
            scroll={{ x: 900 }}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
              showSizeChanger: false,
            }}
            onChange={handleTableChange}
          />
        </Card>
      </div>

      <Modal
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        onOk={() => setDetailVisible(false)}
        title="Detalle de auditoría"
        width={900}
      >
        {selectedLog && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Descriptions bordered size="small" column={2}>
              <Descriptions.Item label="Acción">{selectedLog.action}</Descriptions.Item>
              <Descriptions.Item label="Fecha">
                {new Date(selectedLog.createdAt).toLocaleString('es-CL')}
              </Descriptions.Item>
              <Descriptions.Item label="Entidad">{selectedLog.entityType}</Descriptions.Item>
              <Descriptions.Item label="ID">{selectedLog.entityId || '—'}</Descriptions.Item>
              <Descriptions.Item label="Usuario">{selectedLog.userName || selectedLog.userEmail || '—'}</Descriptions.Item>
              <Descriptions.Item label="Email">{selectedLog.userEmail || '—'}</Descriptions.Item>
              <Descriptions.Item label="Descripción" span={2}>
                {selectedLog.description || '—'}
              </Descriptions.Item>
            </Descriptions>

            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="Before">
                  <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
                    {renderJson(selectedLog.before)}
                  </pre>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="After">
                  <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 300, overflow: 'auto' }}>
                    {renderJson(selectedLog.after)}
                  </pre>
                </Card>
              </Col>
            </Row>

            {selectedLog.metadata && (
              <Card size="small" title="Metadata">
                <pre style={{ whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
                  {renderJson(selectedLog.metadata)}
                </pre>
              </Card>
            )}
          </Space>
        )}
      </Modal>
    </div>
  )
}

export default AuditPage
