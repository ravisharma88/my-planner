import { initialTrips, mockWeatherByTrip, storageKey } from '../data/trips'
import type { MockWeather, Trip } from '../types/trip'

export function readTrips(): Trip[] {
  const stored = localStorage.getItem(storageKey)
  return stored ? JSON.parse(stored) as Trip[] : initialTrips
}

export function formatDate(date: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', options)
}

export function tripDuration(trip: Trip) {
  const start = new Date(`${trip.startDate}T12:00:00`).getTime()
  const end = new Date(`${trip.endDate}T12:00:00`).getTime()
  return Math.max(1, Math.round((end - start) / 86400000) + 1)
}

export function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function getMockWeather(trip: Trip): MockWeather {
  return mockWeatherByTrip[trip.id] ?? { temperatureC: 22, precipitation: 'none' }
}

export function getWeatherTheme(weather: MockWeather) {
  if (weather.precipitation === 'snow') return 'snow'
  if (weather.precipitation === 'rain') return 'rain'
  if (weather.temperatureC >= 25) return 'warm'
  if (weather.temperatureC <= 8) return 'cold'
  return 'clear'
}

export function balanceFor(trip: Trip, member: string) {
  return trip.expenses.reduce((balance, expense) => {
    if (!expense.splitWith.length) return balance
    const share = expense.amount / expense.splitWith.length
    return balance + (expense.paidBy === member ? expense.amount : 0) - (expense.splitWith.includes(member) ? share : 0)
  }, 0)
}
