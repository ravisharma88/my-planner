export type Category = 'Flights' | 'Stay' | 'Food' | 'Transport' | 'Activities' | 'Shopping' | 'Other'
export type Expense = {
  id: string
  title: string
  category: Category
  amount: number
  paidBy: string
  splitWith: string[]
  date: string
}
export type JournalEntry = {
  id: string
  text: string
  date: string
}
export type Trip = {
  id: string
  destination: string
  startDate: string
  endDate: string
  people: string[]
  preferences: string[]
  notes: string
  expenses: Expense[]
  journalEntries?: JournalEntry[]
}
export type TripCreateRequest = Omit<Trip, 'id' | 'expenses' | 'journalEntries'>
export type MockWeather = {
  temperatureC: number
  precipitation: 'rain' | 'snow' | 'none'
}
export type Tab = 'Overview' | 'My trips' | 'Expenses'
export type DestinationSuggestion = {
  label: string
}
