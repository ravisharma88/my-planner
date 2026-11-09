import { useEffect, useState } from 'react'
import { getCurrentUser, signOut, type CurrentUser } from './api/auth'
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

type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; user: CurrentUser }
  | { status: 'unauthenticated' }
  | { status: 'error'; message: string }

function App() {
  const [auth, setAuth] = useState<AuthState>({ status: 'loading' })
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [tab, setTab] = useState<Tab>('Overview')
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [signOutError, setSignOutError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getCurrentUser(controller.signal)
      .then((user) => {
        if (controller.signal.aborted) return
        if (user) setLoading(true)
        setAuth(user ? { status: 'authenticated', user } : { status: 'unauthenticated' })
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setAuth({ status: 'error', message: 'Could not check your sign-in status. Please try again.' })
        }
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (auth.status !== 'authenticated') return
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
  }, [reloadKey, auth.status])

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

  async function handleSignOut() {
    setSignOutError('')
    try {
      await signOut()
      setSelectedTripId(null)
      setWizardOpen(false)
      setAuth({ status: 'unauthenticated' })
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'Could not sign out.')
    }
  }

  if (auth.status === 'loading') {
    return <main className="auth-screen" role="status"><div className="auth-card"><span className="brand-mark"><Icon name="plane" size={20} /></span><p>Checking sign-in status…</p></div></main>
  }

  if (auth.status === 'unauthenticated') {
    return <main className="auth-screen">
      <section className="auth-card" aria-labelledby="auth-title">
        <span className="brand-mark"><Icon name="plane" size={20} /></span>
        <div className="eyebrow"><span className="eyebrow-line" /> YOUR NEXT ADVENTURE STARTS HERE</div>
        <h1 id="auth-title">Welcome to wayfarer<span>.</span></h1>
        <p>Sign in with Google to view and plan your trips.</p>
        <button className="google-sign-in" type="button" onClick={() => window.location.assign('/oauth2/authorization/google')}>
          <svg aria-hidden="true" viewBox="0 0 48 48" width="19" height="19"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94a11.05 11.05 0 0 1-4.8 7.24l7.73 5.99c4.51-4.17 7.11-10.31 7.11-17.7Z" /><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.55 2.56 10.78l7.97-6.19Z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.76l-7.73-5.99c-2.15 1.45-4.9 2.3-8.17 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" /></svg>
          Continue with Google
        </button>
      </section>
    </main>
  }

  if (auth.status === 'error') {
    return <main className="auth-screen">
      <section className="auth-card" aria-labelledby="auth-error-title">
        <span className="brand-mark"><Icon name="plane" size={20} /></span>
        <h1 id="auth-error-title">Sign-in unavailable</h1>
        <p role="alert">{auth.message}</p>
        <button className="google-sign-in" type="button" onClick={() => {
          setAuth({ status: 'loading' })
          getCurrentUser()
            .then((user) => {
              if (user) setLoading(true)
              setAuth(user ? { status: 'authenticated', user } : { status: 'unauthenticated' })
            })
            .catch(() => setAuth({ status: 'error', message: 'Could not check your sign-in status. Please try again.' }))
        }}>Try again</button>
      </section>
    </main>
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
          <button className="profile-button" type="button" onClick={() => void handleSignOut()}>
            <span className="avatar avatar-you">R</span>
            <span className="profile-copy"><strong>{auth.user.email}</strong><small>Sign out</small></span>
            <span className="profile-dots">↗</span>
          </button>
        </div>
      </aside>

      <main className={`main-area ${selectedTrip && tab !== 'Map' ? `weather-page weather-page-${getWeatherTheme(getMockWeather(selectedTrip))}` : ''}`}>
        {selectedTrip && tab !== 'Map' && <div className="weather-place-image" aria-hidden="true"><PlaceImage destination={selectedTrip.destination} className="place-photo" /></div>}
        <header className="topbar">
          <div className="breadcrumb">{selectedTrip ? <><button onClick={() => setSelectedTripId(null)}>{tab === 'Map' ? 'Map' : 'My trips'}</button><Icon name="chevron" size={14} /><span>{selectedTrip.destination}</span></> : <span>{tab}</span>}</div>
          <div className="topbar-right">
            {signOutError && <span className="auth-inline-error" role="alert">{signOutError}</span>}
            <span className="today-label">{formatDate(new Date().toISOString().slice(0, 10), { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span className="topbar-avatar" title={auth.user.email}>{auth.user.email.slice(0, 1).toUpperCase()}</span>
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
      <ChatAssistant onCreateTrip={createTripFromChat} onOpenTrip={openTrip} onSessionExpired={() => setAuth({ status: 'unauthenticated' })} />
    </div>
  )
}

export default App
