import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../components/AuthContext'

const LoginCallback: React.FC = () => {
  const navigate = useNavigate()
  const { handleCallback } = useAuth()

  useEffect(() => {
    handleCallback()
    navigate('/admin', { replace: true })
  }, [handleCallback, navigate])

  return null
}

export default LoginCallback


