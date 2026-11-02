import { useEffect, useState } from 'react'
import { Icon } from './components/Icon'
import { ExpensesPage, Overview, TripsPage } from './features/overview/DashboardPages'
import { TripDetail } from './features/trips/TripDetail'
import { TripWizard } from './features/trips/TripWizard'
import { storageKey, today } from './data/trips'
import type { Expense, JournalEntry, Tab, Trip } from './types/trip'
import { formatDate, getMockWeather, getWeatherTheme, readTrips } from './utils/trip'
import './App.css'

function App() {
  const [trips, setTrips] = useState<Trip[]>(readTrips)
  const [tab, setTab] = useState<Tab>('Overview')
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(trips))
  }, [trips])

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId)
  const upcomingTrips = trips.filter((trip) => trip.endDate >= today)
  const totalExpenses = trips.reduce((sum, trip) => sum + trip.expenses.reduce((total, expense) => total + expense.amount, 0), 0)

  function openTrip(id: string) {
    setSelectedTripId(id)
    setTab('My trips')
  }

  function createTrip(trip: Trip) {
    setTrips((current) => [trip, ...current])
    setWizardOpen(false)
    openTrip(trip.id)
  }

  function addExpense(tripId: string, expense: Expense) {
    setTrips((current) => current.map((trip) => trip.id === tripId ? { ...trip, expenses: [expense, ...trip.expenses] } : trip))
  }

  function addJournalEntry(tripId: string, entry: JournalEntry) {
    setTrips((current) => current.map((trip) => trip.id === tripId
      ? { ...trip, journalEntries: [entry, ...(trip.journalEntries ?? [])] }
      : trip))
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setTab('Overview'); setSelectedTripId(null) }}>
          <span className="brand-mark"><Icon name="plane" size={20} /></span>
          <span>wayfarer<span className="brand-dot">.</span></span>
        </a>
        <div className="side-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {(['Overview', 'My trips', 'Expenses'] as Tab[]).map((item) => (
            <button className={`nav-item ${tab === item && !selectedTrip ? 'active' : ''}`} key={item} onClick={() => { setTab(item); setSelectedTripId(null) }}>
              <Icon name={item === 'Overview' ? 'home' : item === 'My trips' ? 'trips' : 'wallet'} size={19} />
              <span>{item}</span>
              {item === 'My trips' && <span className="nav-count">{trips.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon"><Icon name="sparkle" size={18} /></div>
            <strong>Good trips, together.</strong>
            <p>One place for the plans, the people, and everything in between.</p>
          </div>
          <button className="profile-button" type="button">
            <span className="avatar avatar-you">R</span>
            <span className="profile-copy"><strong>Riley Parker</strong><small>Personal space</small></span>
            <span className="profile-dots">···</span>
          </button>
        </div>
      </aside>

      <main className={`main-area ${selectedTrip ? `weather-page weather-page-${getWeatherTheme(getMockWeather(selectedTrip))}` : ''}`}>
        <header className="topbar">
          <div className="breadcrumb">{selectedTrip ? <><button onClick={() => setSelectedTripId(null)}>My trips</button><Icon name="chevron" size={14} /><span>{selectedTrip.destination}</span></> : <span>{tab}</span>}</div>
          <div className="topbar-right">
            <span className="today-label">{formatDate(new Date().toISOString().slice(0, 10), { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span className="topbar-avatar">R</span>
          </div>
        </header>

        <div className="page-content">
          {selectedTrip ? (
            <TripDetail key={selectedTrip.id} trip={selectedTrip} onBack={() => setSelectedTripId(null)} onAddExpense={(expense) => addExpense(selectedTrip.id, expense)} onAddJournal={(entry) => addJournalEntry(selectedTrip.id, entry)} />
          ) : tab === 'Expenses' ? (
            <ExpensesPage trips={trips} onOpenTrip={openTrip} totalExpenses={totalExpenses} />
          ) : tab === 'My trips' ? (
            <TripsPage trips={trips} onOpenTrip={openTrip} onNewTrip={() => setWizardOpen(true)} />
          ) : (
            <Overview trips={trips} upcomingTrips={upcomingTrips} totalExpenses={totalExpenses} onOpenTrip={openTrip} onNewTrip={() => setWizardOpen(true)} />
          )}
        </div>
      </main>

      {wizardOpen && <TripWizard onClose={() => setWizardOpen(false)} onCreate={createTrip} />}
    </div>
  )
}

export default App
