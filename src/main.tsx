import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { App as AntdApp, ConfigProvider } from 'antd'
import { HashRouter, useNavigate } from 'react-router-dom'
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

const PLACEHOLDER_TOKENS = [
  'your_auth0_domain',
  'your_auth0_audience',
  'your_auth0_client_id',
  'tu_client_id_spa',
  'dev-xxxxx.us.auth0.com',
]

const isPlaceholder = (value: string) => {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return true
  return PLACEHOLDER_TOKENS.some((token) => normalized.includes(token))
}

const normalizeDomain = (raw: string) => {
  const value = raw.trim()
  if (!value) return ''
  try {
    const url = value.includes('://') ? new URL(value) : new URL(`https://${value}`)
    return url.hostname
  } catch (err) {
    return value.replace(/^https?:\/\//, '').replace(/\/+$/, '')
  }
}

const normalizeValue = (raw: string) => raw.trim()

type ResolveConfigOpts = {
  primaryRaw?: string | null
  primaryLabel: string
  fallbackRaw?: string | null
  fallbackLabel: string
  normalize: (value: string) => string
}

const resolveConfigValue = ({ primaryRaw, primaryLabel, fallbackRaw, fallbackLabel, normalize }: ResolveConfigOpts) => {
  const candidates = [
    { raw: primaryRaw, label: primaryLabel },
    { raw: fallbackRaw, label: fallbackLabel },
  ]

  for (const candidate of candidates) {
    const trimmed = (candidate.raw ?? '').trim()
    if (!trimmed) {
      continue
    }
    if (isPlaceholder(trimmed)) {
      throw new Error(`[config] ${candidate.label} still uses placeholder value`)
    }
    const normalized = normalize(trimmed)
    if (!normalized.trim()) {
      continue
    }
    if (isPlaceholder(normalized)) {
      throw new Error(`[config] ${candidate.label} resolved to placeholder value after normalization`)
    }
    return normalized
  }

  throw new Error(`[config] Missing ${primaryLabel} or ${fallbackLabel}`)
}

function Auth0ProviderWithNavigate({ config, children }: Auth0ProviderWithNavigateProps) {
  const navigate = useNavigate()
  const redirectUri = `${window.location.origin}/#/login/callback`

  return (
    <Auth0Provider
      domain={config.domain}
      clientId={config.clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: config.audience,
        scope: 'openid profile email',
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
  const rawBackendBaseUrl = (import.meta.env.VITE_BACKEND_BASE_URL ?? '').trim()
  const backendBaseUrl = rawBackendBaseUrl.replace(/\/+$/, '')
  const configUrl = backendBaseUrl ? `${backendBaseUrl}/public/config` : '/public/config'

  let backendConfig: Partial<Record<'auth0Domain' | 'auth0Audience' | 'auth0ClientId', string>> = {}

  try {
    const res = await fetch(configUrl)
    if (res.ok) {
      backendConfig = await res.json()
    }
  } catch (err) {
    console.warn(`[config] Could not load ${configUrl}, falling back to environment variables.`, err)
  }

  const auth0Domain = resolveConfigValue({
    primaryRaw: backendConfig.auth0Domain,
    primaryLabel: `${configUrl}.auth0Domain`,
    fallbackRaw: import.meta.env.VITE_AUTH0_DOMAIN,
    fallbackLabel: 'VITE_AUTH0_DOMAIN',
    normalize: normalizeDomain,
  })
  const auth0Audience = resolveConfigValue({
    primaryRaw: backendConfig.auth0Audience,
    primaryLabel: `${configUrl}.auth0Audience`,
    fallbackRaw: import.meta.env.VITE_AUTH0_AUDIENCE,
    fallbackLabel: 'VITE_AUTH0_AUDIENCE',
    normalize: normalizeValue,
  })
  const auth0ClientId = resolveConfigValue({
    primaryRaw: backendConfig.auth0ClientId,
    primaryLabel: `${configUrl}.auth0ClientId`,
    fallbackRaw: import.meta.env.VITE_AUTH0_CLIENT_ID,
    fallbackLabel: 'VITE_AUTH0_CLIENT_ID',
    normalize: normalizeValue,
  })

  window.__APP_CONFIG__ = {
    auth0Domain,
    auth0Audience,
    auth0ClientId,
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <HashRouter>
        <ConfigProvider>
          <AntdApp>
            <Auth0ProviderWithNavigate
              config={{ domain: auth0Domain, clientId: auth0ClientId, audience: auth0Audience }}
            >
              <App />
            </Auth0ProviderWithNavigate>
          </AntdApp>
        </ConfigProvider>
      </HashRouter>
    </StrictMode>,
  )
}

bootstrap()
