import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntdApp, ConfigProvider } from 'antd'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import { Auth0Provider } from '@auth0/auth0-react'
import 'antd/dist/reset.css'
import './index.css'
import App from './App.tsx'

type Auth0Config = {
  domain: string
  clientId: string
  audience: string
}

type Auth0ProviderWithNavigateProps = {
  config: Auth0Config
  children: ReactNode
}

function Auth0ProviderWithNavigate({ config, children }: Auth0ProviderWithNavigateProps) {
  const navigate = useNavigate()

  return (
    <Auth0Provider
      domain={config.domain}
      clientId={config.clientId}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/login/callback`,
        audience: config.audience,
      }}
      onRedirectCallback={(appState) => {
        const target = appState?.returnTo ?? '/admin'
        navigate(target, { replace: true })
      }}
    >
      {children}
    </Auth0Provider>
  )
}

async function bootstrap() {
  const res = await fetch('/public/config')
  const cfg = await res.json()

  const normalizeDomain = (raw: string | undefined | null) => {
    const value = (raw ?? '').trim()
    if (!value) return ''
    try {
      const url = value.includes('://') ? new URL(value) : new URL(`https://${value}`)
      return url.hostname
    } catch (err) {
      return value.replace(/^https?:\/\//, '').replace(/\/+$/, '')
    }
  }

  const normalizeValue = (raw: string | undefined | null) => (raw ?? '').trim()

  const envDefaults = {
    domain: normalizeDomain(import.meta.env.VITE_AUTH0_DOMAIN),
    audience: normalizeValue(import.meta.env.VITE_AUTH0_AUDIENCE),
    clientId: normalizeValue(import.meta.env.VITE_AUTH0_CLIENT_ID),
  }

  let auth0Domain = normalizeDomain(cfg.auth0Domain)
  let auth0Audience = normalizeValue(cfg.auth0Audience)
  let auth0ClientId = normalizeValue(cfg.auth0ClientId)

  if (!auth0Domain || !auth0Audience || !auth0ClientId) {
    auth0Domain = auth0Domain || envDefaults.domain
    auth0Audience = auth0Audience || envDefaults.audience
    auth0ClientId = auth0ClientId || envDefaults.clientId
  }

  if (!auth0Domain || !auth0Audience || !auth0ClientId) {
    throw new Error('Auth0 configuration is incomplete. Check /public/config and .env values.')
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <ConfigProvider>
          <AntdApp>
            <Auth0ProviderWithNavigate
              config={{ domain: auth0Domain, clientId: auth0ClientId, audience: auth0Audience }}
            >
              <App />
            </Auth0ProviderWithNavigate>
          </AntdApp>
        </ConfigProvider>
      </BrowserRouter>
    </StrictMode>,
  )
}

bootstrap()
