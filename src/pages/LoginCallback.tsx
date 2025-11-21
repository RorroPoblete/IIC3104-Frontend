import { Spin } from 'antd'

const LoginCallback = () => {
  return (
    <div className="login-page">
      <div className="login-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '1rem' }}>Validando sesión con Auth0…</div>
      </div>
    </div>
  )
}

export default LoginCallback
