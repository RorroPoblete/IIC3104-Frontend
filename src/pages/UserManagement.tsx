import React, { useEffect, useState } from 'react'
import { Card, Typography, Button, Row, Col, Table, Tag, Form, Input, Select, message, Modal, Popconfirm, Tooltip } from 'antd'
import { ArrowLeftOutlined, TeamOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import UCHeader from '../components/UCHeader'
import UCBreadcrumb from '../components/UCBreadcrumb'
import { useAuth } from '../components/AuthContext'
import { authFetch } from '../utils/authFetch'
import { apiUrl } from '../utils/apiConfig'

type ManagedUser = {
  id: string
  name: string
  email: string
  role: string
}

type UserPayload = Pick<ManagedUser, 'name' | 'email' | 'role'>

const USERS_API_BASE = apiUrl('/api/users')

const buildUsersUrl = (path = '') => {
  if (!path) return USERS_API_BASE
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${USERS_API_BASE}${normalizedPath}`
}

const UserManagementPage: React.FC = () => {
  const { user, appUser, logout, getAccessTokenSilently } = useAuth()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null)

  const roleColors: Record<string, string> = {
    Administrador: 'geekblue',
    Analista: 'green',
    Codificador: 'purple'
  }

  const roleOptions = [
    { label: 'Administrador', value: 'Administrador' },
    { label: 'Analista', value: 'Analista' },
    { label: 'Codificador', value: 'Codificador' }
  ]

  const loadUsers = async () => {
    setLoadingUsers(true)
    try {
      const res = await authFetch(buildUsersUrl(), { method: 'GET' }, getAccessTokenSilently)
      if (!res.ok) throw new Error('No se pudieron cargar los usuarios')
      const data: ManagedUser[] = await res.json()
      setManagedUsers(data)
    } catch (err) {
      console.error(err)
      message.error('No se pudieron cargar los usuarios')
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleAddUser = async (values: UserPayload) => {
    try {
      const res = await authFetch(
        buildUsersUrl(),
        {
          method: 'POST',
          body: JSON.stringify(values)
        },
        getAccessTokenSilently
      )
      if (!res.ok) throw new Error('No se pudo crear el usuario')
      const created: ManagedUser = await res.json()
      setManagedUsers((prev) => [...prev, created])
      form.resetFields()
      message.success('Usuario agregado correctamente')
    } catch (err) {
      console.error(err)
      message.error('No se pudo crear el usuario')
    }
  }

  const handleEditUser = (userToEdit: ManagedUser) => {
    setEditingUser(userToEdit)
    editForm.setFieldsValue(userToEdit)
  }

  const handleUpdateUser = async (values: UserPayload) => {
    if (!editingUser) return
    try {
      const res = await authFetch(
        buildUsersUrl(editingUser.id),
        {
          method: 'PUT',
          body: JSON.stringify(values)
        },
        getAccessTokenSilently
      )
      if (!res.ok) throw new Error('No se pudo actualizar el usuario')
      const updated: ManagedUser = await res.json()
      setManagedUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? updated : u))
      )
      setEditingUser(null)
      message.success('Usuario actualizado correctamente')
    } catch (err) {
      console.error(err)
      message.error('No se pudo actualizar el usuario')
    }
  }

  const handleDeleteUser = async (id: string) => {
    try {
      const res = await authFetch(
        buildUsersUrl(id),
        { method: 'DELETE' },
        getAccessTokenSilently
      )
      if (!res.ok) throw new Error('No se pudo eliminar el usuario')
      setManagedUsers((prev) => prev.filter((u) => u.id !== id))
      message.success('Usuario eliminado')
    } catch (err) {
      console.error(err)
      message.error('No se pudo eliminar el usuario')
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  return (
    <div className="admin-page">
      <UCHeader 
        showNavigation={false}
        showUserActions={true}
        showCodificationButton={false}
        onLogout={() => {
          logout()
          navigate('/login')
        }}
        userName={appUser?.email ?? user?.email}
      />

      <div className="admin-content">
        <UCBreadcrumb />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <Typography.Title level={2} style={{ marginBottom: 0 }}>
              Gestión de Usuarios
            </Typography.Title>
            <Typography.Paragraph style={{ marginTop: '0.25rem', color: 'var(--uc-gray-600)' }}>
              Administra los usuarios y roles del sistema.
            </Typography.Paragraph>
          </div>
          <Typography.Link onClick={() => navigate('/admin')} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowLeftOutlined />
            Volver al dashboard
          </Typography.Link>
        </div>

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={14}>
            <Card className="uc-card">
              <div className="uc-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Typography.Title level={4} style={{ marginBottom: '0.25rem' }}>
                    Usuarios activos
                  </Typography.Title>
                  <Typography.Text type="secondary">
                    {managedUsers.length} usuarios registrados
                  </Typography.Text>
                </div>
                <TeamOutlined style={{ fontSize: '1.5rem', color: 'var(--uc-primary-blue)' }} />
              </div>

              <Table
                dataSource={managedUsers}
                rowKey="id"
                loading={loadingUsers}
                pagination={{ pageSize: 5 }}
                columns={[
                  {
                    title: 'Nombre',
                    dataIndex: 'name',
                    key: 'name'
                  },
                  {
                    title: 'Correo',
                    dataIndex: 'email',
                    key: 'email'
                  },
                  {
                    title: 'Rol',
                    dataIndex: 'role',
                    key: 'role',
                    render: (role: string) => (
                      <Tag color={roleColors[role] || 'blue'} style={{ borderRadius: '999px' }}>
                        {role}
                      </Tag>
                    )
                  },
                  {
                    title: 'Acciones',
                    key: 'actions',
                    render: (_, record) => (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Tooltip title="Editar usuario">
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleEditUser(record)}
                          />
                        </Tooltip>
                        <Popconfirm
                          title="Eliminar usuario"
                          description="¿Estás seguro de eliminar este usuario?"
                          okText="Sí"
                          cancelText="No"
                          onConfirm={() => handleDeleteUser(record.id)}
                        >
                          <Tooltip title="Eliminar usuario">
                            <Button type="text" danger icon={<DeleteOutlined />} />
                          </Tooltip>
                        </Popconfirm>
                      </div>
                    )
                  }
                ]}
              />
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card className="uc-card" style={{ height: '100%' }}>
              <Typography.Title level={4} style={{ marginBottom: '1rem' }}>
                Agregar nuevo usuario
              </Typography.Title>
              <Form
                layout="vertical"
                form={form}
                onFinish={handleAddUser}
                initialValues={{ role: 'Codificador' }}
              >
                <Form.Item
                  name="name"
                  label="Nombre completo"
                  rules={[{ required: true, message: 'Ingresa el nombre del usuario' }]}
                >
                  <Input placeholder="Ej: María Pérez" />
                </Form.Item>
                <Form.Item
                  name="email"
                  label="Correo electrónico"
                  rules={[
                    { required: true, message: 'Ingresa el correo del usuario' },
                    { type: 'email', message: 'Ingresa un correo válido' }
                  ]}
                >
                  <Input placeholder="usuario@hospital.cl" />
                </Form.Item>
                <Form.Item
                  name="role"
                  label="Rol"
                  rules={[{ required: true, message: 'Selecciona el rol del usuario' }]}
                >
                  <Select options={roleOptions} placeholder="Selecciona un rol" />
                </Form.Item>
                <Button type="primary" htmlType="submit" block>
                  Agregar usuario
                </Button>
              </Form>
            </Card>
          </Col>
        </Row>
      </div>

      <Modal
        title="Editar usuario"
        open={!!editingUser}
        onCancel={() => setEditingUser(null)}
        okText="Guardar cambios"
        cancelText="Cancelar"
        onOk={() => editForm.submit()}
      >
        <Form
          layout="vertical"
          form={editForm}
          onFinish={handleUpdateUser}
        >
          <Form.Item
            name="name"
            label="Nombre completo"
            rules={[{ required: true, message: 'Ingresa el nombre del usuario' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Correo electrónico"
            rules={[
              { required: true, message: 'Ingresa el correo del usuario' },
              { type: 'email', message: 'Ingresa un correo válido' }
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="role"
            label="Rol"
            rules={[{ required: true, message: 'Selecciona el rol del usuario' }]}
          >
            <Select options={roleOptions} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default UserManagementPage
