import type { Expense, JournalEntry, Trip, TripCreateRequest } from '../types/trip'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string; detail?: string } | null
    throw new Error(body?.message ?? body?.detail ?? `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function getTrips(signal?: AbortSignal) {
  return request<Trip[]>('/trips', { signal })
}

export function createTrip(trip: TripCreateRequest) {
  return request<Trip>('/trips', { method: 'POST', body: JSON.stringify(trip) })
}

export function createExpense(tripId: string, expense: Omit<Expense, 'id'>) {
  return request<Trip>(`/trips/${encodeURIComponent(tripId)}/expenses`, {
    method: 'POST',
    body: JSON.stringify(expense),
  })
}

export function createJournalEntry(tripId: string, entry: Omit<JournalEntry, 'id'>) {
  return request<Trip>(`/trips/${encodeURIComponent(tripId)}/journal-entries`, {
    method: 'POST',
    body: JSON.stringify(entry),
  })
}
