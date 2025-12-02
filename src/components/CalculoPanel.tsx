import React, { useState, useEffect } from 'react'
import {
  Drawer,
  Card,
  Descriptions,
  Button,
  Table,
  Tag,
  Space,
  Alert,
  Spin,
  Typography,
  Modal,
  message,
} from 'antd'
import {
  CalculatorOutlined,
  ReloadOutlined,
  EyeOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { useAuth } from './AuthContext'
import { authFetch } from '../utils/authFetch'
import type { TableColumnsType } from 'antd'

const { Text } = Typography

const API_BASE_URL = (import.meta.env.VITE_BACKEND_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')

interface CalculoBreakdown {
  episodioId: string
  convenio: string | null
  grd: string | null
  precioBase: number
  ir: number
  subtotal: number
  ajustes: {
    ajustesTecnologia: number
    diasEspera: number
    outlierSuperior: number
    totalAjustes: number
  }
  totalFinal: number
  fuentes: {
    norma: string | null
    pricing: string | null
  }
}

interface CalculoVersion {
  id: string
  version: number
  totalFinal: number
  fecha: string
  usuario: string | null
  convenio: string | null
  grd: string | null
}

interface CalculoDetalle {
  id: string
  episodioId: string
  version: number
  breakdown: CalculoBreakdown
  totalFinal: number
  fechaReferencia: string | null
  createdAt: string
  usuario: string | null
  fuentes: {
    norma: { id: string; filename: string } | null
    pricing: { id: string; filename: string } | null
  }
}

interface CalculoPanelProps {
  visible: boolean
  episodioId: string | null
  onClose: () => void
}

const CalculoPanel: React.FC<CalculoPanelProps> = ({ visible, episodioId, onClose }) => {
  const { getAccessTokenSilently } = useAuth()
  const [recalculando, setRecalculando] = useState(false)
  const [ultimoCalculo, setUltimoCalculo] = useState<CalculoBreakdown | null>(null)
  const [versiones, setVersiones] = useState<CalculoVersion[]>([])
  const [loadingVersiones, setLoadingVersiones] = useState(false)
  const [detalleVisible, setDetalleVisible] = useState(false)
  const [detalleCalculo, setDetalleCalculo] = useState<CalculoDetalle | null>(null)
  const [loadingDetalle, setLoadingDetalle] = useState(false)

  const fetchUltimoCalculo = async () => {
    if (!episodioId) return

    setLoadingVersiones(true)
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/calculo/episodio/${episodioId}/versiones`,
        { method: 'GET' },
        getAccessTokenSilently,
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }))
        if (response.status === 401) {
          message.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.')
        } else {
          message.error(errorData.message || 'Error al cargar el historial de cálculos')
        }
        setVersiones([])
        setUltimoCalculo(null)
        return
      }

      const result = await response.json()
      if (result.success && result.data && result.data.length > 0) {
        const ultimaVersion = result.data[0]
        setVersiones(result.data)

        // Obtener detalle de la última versión
        const detalleResponse = await authFetch(
          `${API_BASE_URL}/api/calculo/version/${ultimaVersion.id}`,
          { method: 'GET' },
          getAccessTokenSilently,
        )
        
        if (!detalleResponse.ok) {
          console.warn('Error al obtener detalle del cálculo:', detalleResponse.status)
          // No mostramos error aquí porque ya tenemos las versiones
        } else {
          const detalleResult = await detalleResponse.json()
          if (detalleResult.success) {
            setUltimoCalculo(detalleResult.data.breakdown)
          }
        }
      } else {
        setVersiones([])
        setUltimoCalculo(null)
      }
    } catch (error) {
      console.error('Error al obtener versiones:', error)
      message.error('Error de conexión al cargar el historial de cálculos')
      setVersiones([])
      setUltimoCalculo(null)
    } finally {
      setLoadingVersiones(false)
    }
  }

  useEffect(() => {
    if (visible && episodioId) {
      fetchUltimoCalculo()
    }
  }, [visible, episodioId])

  const handleRecalcular = async () => {
    if (!episodioId) return

    setRecalculando(true)
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/calculo/episodio/${episodioId}/run`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        },
        getAccessTokenSilently,
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Error al recalcular')
      }

      const result = await response.json()
      if (result.success) {
        message.success('Cálculo completado exitosamente')
        setUltimoCalculo(result.data.breakdown)
        await fetchUltimoCalculo()
      } else {
        message.error(result.message || 'Error al recalcular')
      }
    } catch (error: any) {
      console.error('Error al recalcular:', error)
      const errorMessage = error?.message || 'Error al recalcular el episodio'
      message.error(errorMessage)
    } finally {
      setRecalculando(false)
    }
  }

  const handleVerDetalle = async (versionId: string) => {
    setLoadingDetalle(true)
    setDetalleVisible(true)
    try {
      const response = await authFetch(
        `${API_BASE_URL}/api/calculo/version/${versionId}`,
        { method: 'GET' },
        getAccessTokenSilently,
      )

      const result = await response.json()
      if (result.success) {
        setDetalleCalculo(result.data)
      } else {
        message.error('Error al cargar el detalle del cálculo')
      }
    } catch (error) {
      console.error('Error al obtener detalle:', error)
      message.error('Error al cargar el detalle del cálculo')
    } finally {
      setLoadingDetalle(false)
    }
  }

  const versionColumns: TableColumnsType<CalculoVersion> = [
    {
      title: 'Versión',
      dataIndex: 'version',
      key: 'version',
      width: 80,
    },
    {
      title: 'Total Final',
      dataIndex: 'totalFinal',
      key: 'totalFinal',
      render: (value: number) => `$${value.toLocaleString('es-CL')}`,
      width: 150,
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha',
      key: 'fecha',
      render: (fecha: string) => new Date(fecha).toLocaleString('es-CL'),
      width: 180,
    },
    {
      title: 'Usuario',
      dataIndex: 'usuario',
      key: 'usuario',
      render: (usuario: string | null) => usuario || 'N/A',
      width: 150,
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_: unknown, record: CalculoVersion) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleVerDetalle(record.id)}
        >
          Ver Detalle
        </Button>
      ),
      width: 120,
    },
  ]

  return (
    <>
      <Drawer
        title={
          <Space>
            <CalculatorOutlined />
            <span>Cálculo GRD-FONASA (V1)</span>
          </Space>
        }
        placement="right"
        onClose={onClose}
        open={visible}
        width={600}
      >
        {loadingVersiones ? (
          <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: '2rem' }} />
        ) : (
          <>
            {ultimoCalculo ? (
              <Card
                title="Último Cálculo"
                extra={
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={handleRecalcular}
                    loading={recalculando}
                  >
                    Recalcular
                  </Button>
                }
                style={{ marginBottom: '1rem' }}
              >
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="Convenio">
                    {ultimoCalculo.convenio || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="GRD">
                    {ultimoCalculo.grd || 'N/A'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Precio Base">
                    <Text strong>${ultimoCalculo.precioBase.toLocaleString('es-CL')}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="IR (Peso Relativo)">
                    <Text strong>{ultimoCalculo.ir.toFixed(2)}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Subtotal (Precio Base × IR)">
                    <Text strong style={{ fontSize: '14px' }}>
                      ${ultimoCalculo.subtotal.toLocaleString('es-CL')}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ajustes Adicionales">
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary">Ajustes por Tecnología:</Text>
                        <Text>
                          ${ultimoCalculo.ajustes?.ajustesTecnologia?.toLocaleString('es-CL') || '0'}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary">Días de Espera:</Text>
                        <Text>
                          ${ultimoCalculo.ajustes?.diasEspera?.toLocaleString('es-CL') || '0'}
                        </Text>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text type="secondary">Outlier Superior:</Text>
                        <Text>
                          ${ultimoCalculo.ajustes?.outlierSuperior?.toLocaleString('es-CL') || '0'}
                        </Text>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        borderTop: '1px solid #d9d9d9',
                        paddingTop: '4px',
                        marginTop: '4px'
                      }}>
                        <Text strong>Total Ajustes:</Text>
                        <Text strong>
                          ${(ultimoCalculo.ajustes?.totalAjustes || 0).toLocaleString('es-CL')}
                        </Text>
                      </div>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Fórmula del Cálculo">
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Subtotal + Total Ajustes = Total Final
                    </Text>
                    <div style={{ marginTop: '4px' }}>
                      <Text style={{ fontSize: '13px' }}>
                        ${ultimoCalculo.subtotal.toLocaleString('es-CL')} + ${(ultimoCalculo.ajustes?.totalAjustes || 0).toLocaleString('es-CL')} = 
                        <Text strong style={{ fontSize: '14px', marginLeft: '4px' }}>
                          ${ultimoCalculo.totalFinal.toLocaleString('es-CL')}
                        </Text>
                      </Text>
                    </div>
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Final">
                    <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                      ${ultimoCalculo.totalFinal.toLocaleString('es-CL')}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Fuentes">
                    <Space direction="vertical" size="small">
                      <div>
                        <Text type="secondary">Norma: </Text>
                        {ultimoCalculo.fuentes.norma ? (
                          <Tag color="blue">{ultimoCalculo.fuentes.norma}</Tag>
                        ) : (
                          <Tag color="default">N/A</Tag>
                        )}
                      </div>
                      <div>
                        <Text type="secondary">Pricing: </Text>
                        {ultimoCalculo.fuentes.pricing ? (
                          <Tag color="green">{ultimoCalculo.fuentes.pricing}</Tag>
                        ) : (
                          <Tag color="default">N/A</Tag>
                        )}
                      </div>
                    </Space>
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            ) : (
              <Alert
                message="Sin cálculos previos"
                description="Este episodio aún no tiene cálculos realizados. Haz clic en 'Recalcular' para generar el primer cálculo."
                type="info"
                showIcon
                icon={<ExclamationCircleOutlined />}
                style={{ marginBottom: '1rem' }}
                action={
                  <Button
                    type="primary"
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={handleRecalcular}
                    loading={recalculando}
                  >
                    Recalcular
                  </Button>
                }
              />
            )}

            <Card title="Historial de Versiones">
              <Table
                columns={versionColumns}
                dataSource={versiones}
                rowKey="id"
                pagination={{
                  pageSize: 5,
                  showSizeChanger: false,
                }}
                size="small"
              />
            </Card>
          </>
        )}
      </Drawer>

      {/* Modal para ver detalle del cálculo */}
      <Modal
        title={`Detalle del Cálculo - Versión ${detalleCalculo?.version || ''}`}
        open={detalleVisible}
        onCancel={() => {
          setDetalleVisible(false)
          setDetalleCalculo(null)
        }}
        footer={[
          <Button key="close" onClick={() => {
            setDetalleVisible(false)
            setDetalleCalculo(null)
          }}>
            Cerrar
          </Button>,
        ]}
        width={700}
      >
        {loadingDetalle ? (
          <Spin size="large" style={{ display: 'block', textAlign: 'center', marginTop: '2rem' }} />
        ) : detalleCalculo ? (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="Versión">
              {detalleCalculo.version}
            </Descriptions.Item>
            <Descriptions.Item label="Convenio">
              {detalleCalculo.breakdown.convenio || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="GRD">
              {detalleCalculo.breakdown.grd || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Precio Base">
              <Text strong>${detalleCalculo.breakdown.precioBase.toLocaleString('es-CL')}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="IR (Peso Relativo)">
              <Text strong>{detalleCalculo.breakdown.ir.toFixed(2)}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Subtotal (Precio Base × IR)">
              <Text strong style={{ fontSize: '14px' }}>
                ${detalleCalculo.breakdown.subtotal.toLocaleString('es-CL')}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Ajustes Adicionales">
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Ajustes por Tecnología:</Text>
                  <Text>
                    ${detalleCalculo.breakdown.ajustes?.ajustesTecnologia?.toLocaleString('es-CL') || '0'}
                  </Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Días de Espera:</Text>
                  <Text>
                    ${detalleCalculo.breakdown.ajustes?.diasEspera?.toLocaleString('es-CL') || '0'}
                  </Text>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text type="secondary">Outlier Superior:</Text>
                  <Text>
                    ${detalleCalculo.breakdown.ajustes?.outlierSuperior?.toLocaleString('es-CL') || '0'}
                  </Text>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  borderTop: '1px solid #d9d9d9',
                  paddingTop: '4px',
                  marginTop: '4px'
                }}>
                  <Text strong>Total Ajustes:</Text>
                  <Text strong>
                    ${(detalleCalculo.breakdown.ajustes?.totalAjustes || 0).toLocaleString('es-CL')}
                  </Text>
                </div>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Fórmula del Cálculo">
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Subtotal + Total Ajustes = Total Final
              </Text>
              <div style={{ marginTop: '4px' }}>
                <Text style={{ fontSize: '13px' }}>
                  ${detalleCalculo.breakdown.subtotal.toLocaleString('es-CL')} + ${(detalleCalculo.breakdown.ajustes?.totalAjustes || 0).toLocaleString('es-CL')} = 
                  <Text strong style={{ fontSize: '14px', marginLeft: '4px' }}>
                    ${detalleCalculo.breakdown.totalFinal.toLocaleString('es-CL')}
                  </Text>
                </Text>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Total Final">
              <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                ${detalleCalculo.breakdown.totalFinal.toLocaleString('es-CL')}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Fecha de Referencia">
              {detalleCalculo.fechaReferencia
                ? new Date(detalleCalculo.fechaReferencia).toLocaleString('es-CL')
                : 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Fecha de Cálculo">
              {new Date(detalleCalculo.createdAt).toLocaleString('es-CL')}
            </Descriptions.Item>
            <Descriptions.Item label="Usuario">
              {detalleCalculo.usuario || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Fuentes">
              <Space direction="vertical" size="small">
                <div>
                  <Text type="secondary">Norma: </Text>
                  {detalleCalculo.fuentes.norma ? (
                    <Tag color="blue">{detalleCalculo.fuentes.norma.filename}</Tag>
                  ) : (
                    <Tag color="default">N/A</Tag>
                  )}
                </div>
                <div>
                  <Text type="secondary">Pricing: </Text>
                  {detalleCalculo.fuentes.pricing ? (
                    <Tag color="green">{detalleCalculo.fuentes.pricing.filename}</Tag>
                  ) : (
                    <Tag color="default">N/A</Tag>
                  )}
                </div>
              </Space>
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Modal>
    </>
  )
}

export default CalculoPanel

