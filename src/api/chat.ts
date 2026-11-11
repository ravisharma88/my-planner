export type ChatRequest = {
  conversationId?: string
  message: string
}

export type ChatResponse = {
  conversationId: string
  reply: string
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const csrfResponse = await fetch('/csrf', { credentials: 'include' })
  if (!csrfResponse.ok) throw new Error(`Could not get a CSRF token (${csrfResponse.status}).`)
  const { token } = await csrfResponse.json() as { token: string }
  if (!token) throw new Error('The server did not provide a CSRF token.')

  const response = await fetch('/api/chat', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-XSRF-TOKEN': token,
    },
    body: JSON.stringify({
      ...(request.conversationId ? { conversationId: request.conversationId } : {}),
      message: request.message,
    }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { detail?: string; message?: string } | null
    throw new Error(body?.detail ?? body?.message ?? `Chat request failed with status ${response.status}.`)
  }

  const result = await response.json() as ChatResponse
  if (!result.conversationId || !result.reply?.trim()) {
    throw new Error('The chat service returned an invalid response.')
  }
  return result
}
