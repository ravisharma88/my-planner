import type { TripCreateRequest } from '../types/trip'

export type ChatRequest = {
  message: string
}

export type ChatResponse = {
  message: string
  tripCreateRequest?: TripCreateRequest
}

type ChatResponsePayload = {
  message?: unknown
  response?: unknown
  reply?: unknown
  tripCreateRequest?: unknown
  action?: unknown
  trip?: unknown
}

function isTripCreateRequest(value: unknown): value is TripCreateRequest {
  if (!value || typeof value !== 'object') return false
  const trip = value as Record<string, unknown>
  return typeof trip.destination === 'string'
    && typeof trip.startDate === 'string'
    && typeof trip.endDate === 'string'
    && Array.isArray(trip.people)
    && trip.people.every((person) => typeof person === 'string')
    && Array.isArray(trip.preferences)
    && trip.preferences.every((preference) => typeof preference === 'string')
    && typeof trip.notes === 'string'
}

export async function sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
  const csrfResponse = await fetch('/csrf', { credentials: 'include' })
  if (csrfResponse.status === 401) throw new Error('unauthenticated')
  if (!csrfResponse.ok) throw new Error(`Could not get a CSRF token (${csrfResponse.status}).`)
  const { token } = await csrfResponse.json() as { token: string }

  const response = await fetch('/chat', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'text/plain',
      'X-XSRF-TOKEN': token,
    },
    body: request.message,
  })

  if (response.status === 401) throw new Error('unauthenticated')
  const responseText = await response.text()
  let payload: ChatResponsePayload | string
  try {
    payload = JSON.parse(responseText) as ChatResponsePayload
  } catch {
    payload = responseText
  }

  if (!response.ok) {
    const errorMessage = typeof payload === 'string'
      ? payload
      : [payload.message, payload.response, payload.reply].find((value): value is string => typeof value === 'string')
    throw new Error(errorMessage || `Chat request failed with status ${response.status}.`)
  }

  const message = typeof payload === 'string'
    ? payload
    : [payload.message, payload.response, payload.reply].find((value): value is string => typeof value === 'string')
  if (!message?.trim()) {
    throw new Error('The chat service returned an empty or unsupported response.')
  }

  const tripRequest = typeof payload === 'string'
    ? undefined
    : payload.tripCreateRequest ?? (payload.action === 'create_trip' ? payload.trip : undefined)

  return {
    message,
    ...(isTripCreateRequest(tripRequest) ? { tripCreateRequest: tripRequest } : {}),
  }
}
