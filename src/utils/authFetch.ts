import type { GetTokenSilentlyOptions } from '@auth0/auth0-react'

export async function authFetch(
  url: string,
  init: RequestInit = {},
  getAccessTokenSilently: (opts?: GetTokenSilentlyOptions) => Promise<string>,
) {
  const audience = window.__APP_CONFIG__?.auth0Audience
  if (!audience) {
    throw new Error('Auth0 audience is not initialised. Ensure bootstrap succeeded before calling authFetch.')
  }

  const token = await getAccessTokenSilently({
    authorizationParams: { audience },
  })
  const headers = new Headers(init.headers || {})
  headers.set('Authorization', `Bearer ${token}`)
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  return fetch(url, { ...init, headers })
}
