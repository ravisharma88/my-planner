import { useEffect, useState } from 'react'
import { Icon } from './components/Icon'
import { PlaceImage } from './components/PlaceImage'
import { ExpensesPage, Overview, TripsPage } from './features/overview/DashboardPages'
import { TripDetail } from './features/trips/TripDetail'
import { TripWizard } from './features/trips/TripWizard'
import { TripsMap } from './features/map/TripsMap'
import { ChatAssistant } from './features/chat/ChatAssistant'
import { getTrips, createTrip as saveTrip, createExpense, createJournalEntry } from './api/trips'
import { today } from './data/trips'
import type { Expense, JournalEntry, Tab, Trip, TripCreateRequest } from './types/trip'
import { formatDate, getMockWeather, getWeatherTheme } from './utils/trip'
import './App.css'

function App() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [tab, setTab] = useState<Tab>('Overview')
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    getTrips(controller.signal)
      .then(setTrips)
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setLoadError(error instanceof Error ? error.message : 'Unable to load trips.')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [reloadKey])

  const selectedTrip = trips.find((trip) => trip.id === selectedTripId)
  const upcomingTrips = trips.filter((trip) => trip.endDate >= today).sort((a, b) => a.startDate.localeCompare(b.startDate))
  const totalExpenses = trips.reduce((sum, trip) => sum + trip.expenses.reduce((total, expense) => total + expense.amount, 0), 0)

  function openTrip(id: string) {
    setSelectedTripId(id)
    setTab('My trips')
  }

  async function createTrip(trip: TripCreateRequest) {
    const savedTrip = await saveTrip(trip)
    setTrips((current) => [savedTrip, ...current])
    setWizardOpen(false)
    openTrip(savedTrip.id)
  }

  async function createTripFromChat(trip: TripCreateRequest) {
    const savedTrip = await saveTrip(trip)
    setTrips((current) => [savedTrip, ...current])
    return savedTrip
  }

  async function addExpense(tripId: string, expense: Omit<Expense, 'id'>) {
    const updatedTrip = await createExpense(tripId, expense)
    setTrips((current) => current.map((trip) => trip.id === tripId ? updatedTrip : trip))
  }

  async function addJournalEntry(tripId: string, entry: Omit<JournalEntry, 'id'>) {
    const updatedTrip = await createJournalEntry(tripId, entry)
    setTrips((current) => current.map((trip) => trip.id === tripId ? updatedTrip : trip))
  }

  function reloadTrips() {
    setLoading(true)
    setLoadError('')
    setReloadKey((key) => key + 1)
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
          {(['Overview', 'My trips', 'Expenses', 'Map'] as Tab[]).map((item) => (
            <button className={`nav-item ${tab === item ? 'active' : ''}`} key={item} onClick={() => { setTab(item); setSelectedTripId(null) }}>
              <Icon name={item === 'Overview' ? 'home' : item === 'My trips' ? 'trips' : item === 'Expenses' ? 'wallet' : 'globe'} size={19} />
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

      <main className={`main-area ${selectedTrip && tab !== 'Map' ? `weather-page weather-page-${getWeatherTheme(getMockWeather(selectedTrip))}` : ''}`}>
        {selectedTrip && tab !== 'Map' && <div className="weather-place-image" aria-hidden="true"><PlaceImage destination={selectedTrip.destination} className="place-photo" /></div>}
        <header className="topbar">
          <div className="breadcrumb">{selectedTrip ? <><button onClick={() => setSelectedTripId(null)}>{tab === 'Map' ? 'Map' : 'My trips'}</button><Icon name="chevron" size={14} /><span>{selectedTrip.destination}</span></> : <span>{tab}</span>}</div>
          <div className="topbar-right">
            <span className="today-label">{formatDate(new Date().toISOString().slice(0, 10), { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span className="topbar-avatar">R</span>
          </div>
        </header>

        <div className="page-content">
          {loading ? (
            <p role="status">Loading your trips…</p>
          ) : loadError ? (
            <div className="empty-card" role="alert">
              <strong>We couldn’t load your trips.</strong>
              <p>{loadError}</p>
              <button className="button button-primary" onClick={reloadTrips}>Try again</button>
            </div>
          ) : tab === 'Map' ? (
            <TripsMap trips={trips} onAddExpense={(tripId, expense) => addExpense(tripId, expense)} onAddJournal={(tripId, entry) => addJournalEntry(tripId, entry)} />
          ) : selectedTrip ? (
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
      <ChatAssistant onCreateTrip={createTripFromChat} onOpenTrip={openTrip} />
    </div>
  )
}

export default App
