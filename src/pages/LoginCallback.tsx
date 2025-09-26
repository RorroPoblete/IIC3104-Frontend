import { Spin } from 'antd'

const LoginCallback = () => {
  return (
    <div className="login-page">
      <div className="login-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <Spin size="large" tip="Validando sesión con Auth0…" />
      </div>
    </div>
  )
}

export default LoginCallback
