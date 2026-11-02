import type { MockWeather, Trip } from '../types/trip'

export const storageKey = 'roam-planner-trips'
export const today = new Date().toISOString().slice(0, 10)
export const mockWeatherByTrip: Record<string, MockWeather> = {
  kyoto: { temperatureC: -2, precipitation: 'snow' },
  copenhagen: { temperatureC: 16, precipitation: 'rain' },
}
export const initialTrips: Trip[] = [
  {
    id: 'kyoto',
    destination: 'Kyoto, Japan',
    startDate: '2026-11-12',
    endDate: '2026-11-20',
    people: ['You', 'Alex', 'Jamie'],
    preferences: ['Culture', 'Foodie', 'Slow travel'],
    notes: 'A little bit of everything, with time to wander.',
    expenses: [
      { id: 'e1', title: 'Flights to Kyoto', category: 'Flights', amount: 1280, paidBy: 'You', splitWith: ['You', 'Alex', 'Jamie'], date: '2026-09-20' },
      { id: 'e2', title: 'Dinner at Gion Tanto', category: 'Food', amount: 96, paidBy: 'Alex', splitWith: ['You', 'Alex', 'Jamie'], date: '2026-11-13' },
      { id: 'e3', title: 'Train passes', category: 'Transport', amount: 210, paidBy: 'You', splitWith: ['You', 'Alex', 'Jamie'], date: '2026-11-12' },
    ],
  },
  {
    id: 'copenhagen',
    destination: 'Copenhagen, Denmark',
    startDate: '2026-07-04',
    endDate: '2026-07-09',
    people: ['You', 'Morgan'],
    preferences: ['Foodie', 'Design'],
    notes: '',
    expenses: [
      { id: 'e4', title: 'Canal-side dinner', category: 'Food', amount: 74, paidBy: 'Morgan', splitWith: ['You', 'Morgan'], date: '2026-07-05' },
      { id: 'e5', title: 'Museum tickets', category: 'Activities', amount: 38, paidBy: 'You', splitWith: ['You', 'Morgan'], date: '2026-07-06' },
    ],
  },
]
