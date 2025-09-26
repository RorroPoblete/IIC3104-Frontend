import { GetTokenSilentlyOptions } from '@auth0/auth0-react'

export async function authFetch(url: string, init: RequestInit = {}, getAccessTokenSilently: (opts?: GetTokenSilentlyOptions) => Promise<string>) {
  const token = await getAccessTokenSilently({
    authorizationParams: { audience: import.meta.env.VITE_AUTH0_AUDIENCE },
  })
  const headers = new Headers(init.headers || {})
  headers.set('Authorization', `Bearer ${token}`)
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }
  return fetch(url, { ...init, headers })
}


