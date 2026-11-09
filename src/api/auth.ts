export type CurrentUser = {
  email: string
}

type CsrfResponse = {
  token: string
}

async function getCsrfToken() {
  const response = await fetch('/csrf', { credentials: 'include' })
  if (!response.ok) {
    throw new Error(`Could not get a CSRF token (${response.status}).`)
  }
  const { token } = await response.json() as CsrfResponse
  if (!token) throw new Error('The server did not provide a CSRF token.')
  return token
}

export async function getCurrentUser(signal?: AbortSignal): Promise<CurrentUser | null> {
  const response = await fetch('/api/me', { credentials: 'include', signal })
  if (response.status === 401) return null
  if (!response.ok) throw new Error(`Could not check sign-in status (${response.status}).`)
  return response.json() as Promise<CurrentUser>
}

export async function signOut() {
  const token = await getCsrfToken()
  const response = await fetch('/logout', {
    method: 'POST',
    credentials: 'include',
    headers: { 'X-XSRF-TOKEN': token },
  })

  if (!response.ok && response.status !== 401) {
    throw new Error(`Could not sign out (${response.status}).`)
  }
}
