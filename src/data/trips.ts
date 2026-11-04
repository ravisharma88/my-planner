import type { MockWeather } from '../types/trip'

export const today = new Date().toISOString().slice(0, 10)
export const mockWeatherByTrip: Record<string, MockWeather> = {}
