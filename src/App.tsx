import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

type Category = 'Flights' | 'Stay' | 'Food' | 'Transport' | 'Activities' | 'Shopping' | 'Other'
type Expense = {
  id: string
  title: string
  category: Category
  amount: number
  paidBy: string
  splitWith: string[]
  date: string
}
type Trip = {
  id: string
  destination: string
  startDate: string
  endDate: string
  people: string[]
  preferences: string[]
  notes: string
  expenses: Expense[]
}
type Tab = 'Overview' | 'My trips' | 'Expenses'

const storageKey = 'roam-planner-trips'
const today = new Date().toISOString().slice(0, 10)
const initialTrips: Trip[] = [
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

const iconPaths: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5M5.5 9v11h13V9M9 20v-6h6v6',
  trips: 'M3 7.5 12 3l9 4.5-9 4.5-9-4.5ZM3 12l9 4.5 9-4.5M3 16.5 12 21l9-4.5M12 12v9',
  wallet: 'M4 6.5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h13M21 11h-5a2.5 2.5 0 0 0 0 5h5M16 13.5h.01',
  plus: 'M12 5v14M5 12h14',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5m6 6-6-6 6-6',
  calendar: 'M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Z',
  users: 'M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-7.5a4 4 0 0 1 0 7.75M20 21v-2a4 4 0 0 0-3-3.87',
  pin: 'M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0ZM12 10h.01',
  check: 'm5 12 4 4L19 6',
  close: 'M18 6 6 18M6 6l12 12',
  sparkle: 'm12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Zm7 12 .9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15Z',
  clock: 'M12 8v4l2.5 2.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  chevron: 'm9 18 6-6-6-6',
  plane: 'm3 11 18-8-8 18-2-8-8-2Zm8 2 5-5',
  fork: 'M6 3v6m0 0c0 2 3 2 3 0V3m-3 6v12m11-18v18m0-18c-4 4-4 9 0 10',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3Zm3 5h6m-6 4h6m-6 4h3',
  bed: 'M3 18V6m0 9h18v-4a2 2 0 0 0-2-2h-5v6m-11 0h18v4M7 9h.01',
}

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d={iconPaths[name] ?? iconPaths.sparkle} />
    </svg>
  )
}

function readTrips(): Trip[] {
  const stored = localStorage.getItem(storageKey)
  return stored ? JSON.parse(stored) as Trip[] : initialTrips
}

function formatDate(date: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', options)
}

function tripDuration(trip: Trip) {
  const start = new Date(`${trip.startDate}T12:00:00`).getTime()
  const end = new Date(`${trip.endDate}T12:00:00`).getTime()
  return Math.max(1, Math.round((end - start) / 86400000) + 1)
}

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function balanceFor(trip: Trip, member: string) {
  return trip.expenses.reduce((balance, expense) => {
    if (!expense.splitWith.length) return balance
    const share = expense.amount / expense.splitWith.length
    return balance + (expense.paidBy === member ? expense.amount : 0) - (expense.splitWith.includes(member) ? share : 0)
  }, 0)
}

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

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">{selectedTrip ? <><button onClick={() => setSelectedTripId(null)}>My trips</button><Icon name="chevron" size={14} /><span>{selectedTrip.destination}</span></> : <span>{tab}</span>}</div>
          <div className="topbar-right">
            <span className="today-label">{formatDate(new Date().toISOString().slice(0, 10), { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span className="topbar-avatar">R</span>
          </div>
        </header>

        <div className="page-content">
          {selectedTrip ? (
            <TripDetail trip={selectedTrip} onBack={() => setSelectedTripId(null)} onAddExpense={(expense) => addExpense(selectedTrip.id, expense)} />
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

function Overview({ trips, upcomingTrips, totalExpenses, onOpenTrip, onNewTrip }: {
  trips: Trip[]
  upcomingTrips: Trip[]
  totalExpenses: number
  onOpenTrip: (id: string) => void
  onNewTrip: () => void
}) {
  const nextTrip = upcomingTrips[0]
  const pastTrips = trips.filter((trip) => !upcomingTrips.some((upcoming) => upcoming.id === trip.id))
  return (
    <>
      <section className="welcome-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> YOUR TRAVEL SPACE</div>
          <h1>Make room for <em>somewhere new.</em></h1>
          <p className="welcome-subtitle">The best trips start with a little daydreaming.</p>
        </div>
        <button className="button button-primary new-trip-button" onClick={onNewTrip}><Icon name="plus" size={18} /> Plan a trip</button>
      </section>

      <section className="stats-grid" aria-label="Trip summary">
        <StatCard icon="trips" label="Trips planned" value={String(trips.length).padStart(2, '0')} detail="and counting" tone="lavender" />
        <StatCard icon="users" label="Travel buddies" value={String(new Set(trips.flatMap((trip) => trip.people)).size).padStart(2, '0')} detail="across your trips" tone="peach" />
        <StatCard icon="wallet" label="Trip expenses" value={money(totalExpenses)} detail="tracked together" tone="mint" />
      </section>

      {nextTrip && (
        <section className="next-trip-section">
          <div className="section-heading">
            <div><div className="eyebrow"><span className="eyebrow-line" /> UP NEXT</div><h2>Your next chapter</h2></div>
            <button className="text-link" onClick={() => onOpenTrip(nextTrip.id)}>View trip <Icon name="arrow" size={16} /></button>
          </div>
          <button className="feature-trip" onClick={() => onOpenTrip(nextTrip.id)}>
            <div className={`feature-photo ${nextTrip.id === 'kyoto' ? 'photo-kyoto' : 'photo-default'}`}>
              <span className="photo-kicker"><Icon name="sparkle" size={14} /> THE GOOD KIND OF GETTING LOST</span>
              <span className="photo-location"><Icon name="pin" size={16} /> {nextTrip.destination}</span>
            </div>
            <div className="feature-info">
              <div className="feature-date"><Icon name="calendar" size={16} /> {formatDate(nextTrip.startDate)} — {formatDate(nextTrip.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <h3>{nextTrip.destination.split(',')[0]} is calling<span>.</span></h3>
              <p>{tripDuration(nextTrip)} days to make it yours.</p>
              <div className="feature-bottom">
                <div className="avatar-stack">{nextTrip.people.slice(0, 4).map((person, index) => <span className={`avatar avatar-${index % 4}`} key={person}>{person.slice(0, 1)}</span>)}<span className="people-count">{nextTrip.people.length} going</span></div>
                <span className="round-arrow"><Icon name="arrow" size={17} /></span>
              </div>
            </div>
          </button>
        </section>
      )}

      <section className="past-trips-section">
        <div className="section-heading compact-heading">
          <div><div className="eyebrow"><span className="eyebrow-line" /> THE MEMORY BOOK</div><h2>Trips you’ve dreamed up</h2></div>
          <button className="text-link" onClick={() => onOpenTrip('')}>All trips <Icon name="arrow" size={16} /></button>
        </div>
        {pastTrips.length ? <div className="trip-card-grid">{pastTrips.slice(0, 3).map((trip, index) => <TripCard key={trip.id} trip={trip} index={index} onClick={() => onOpenTrip(trip.id)} />)}</div> : (
          <div className="empty-card"><span className="empty-icon"><Icon name="pin" size={20} /></span><strong>Your past trips will feel right at home here.</strong><p>Every adventure you plan will be easy to find.</p></div>
        )}
      </section>
    </>
  )
}

function StatCard({ icon, label, value, detail, tone }: { icon: string; label: string; value: string; detail: string; tone: string }) {
  return <div className="stat-card"><span className={`stat-icon ${tone}`}><Icon name={icon} size={18} /></span><div className="stat-copy"><span className="stat-label">{label}</span><div className="stat-value">{value}<small>{detail}</small></div></div></div>
}

function TripCard({ trip, index, onClick }: { trip: Trip; index: number; onClick: () => void }) {
  return (
    <button className="trip-card" onClick={onClick}>
      <span className={`trip-card-image trip-image-${index % 3}`}><span className="trip-image-tag">{trip.people.length} travelers</span></span>
      <span className="trip-card-body"><span className="trip-card-title">{trip.destination}</span><span className="trip-card-date">{formatDate(trip.startDate, { month: 'long', day: 'numeric' })} – {formatDate(trip.endDate, { month: 'long', day: 'numeric', year: 'numeric' })}</span><span className="trip-card-footer"><span>{tripDuration(trip)} days</span><span className="mini-avatar-row">{trip.people.slice(0, 3).map((person, i) => <i className={`avatar avatar-${i}`} key={person}>{person.slice(0, 1)}</i>)}</span><Icon name="arrow" size={16} /></span></span>
    </button>
  )
}

function TripsPage({ trips, onOpenTrip, onNewTrip }: { trips: Trip[]; onOpenTrip: (id: string) => void; onNewTrip: () => void }) {
  return <section className="inner-page"><div className="inner-page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR ADVENTURES</div><h1>All your trips, <em>in one place.</em></h1><p>Every plan, every person, every little detail.</p></div><button className="button button-primary" onClick={onNewTrip}><Icon name="plus" size={18} /> Plan a trip</button></div>{trips.length ? <div className="trip-card-grid trip-list-grid">{trips.map((trip, index) => <TripCard key={trip.id} trip={trip} index={index} onClick={() => onOpenTrip(trip.id)} />)}</div> : <div className="empty-card"><span className="empty-icon"><Icon name="pin" size={20} /></span><strong>Your next favorite place is waiting.</strong><p>Start with a destination and see where the planning takes you.</p><button className="button button-primary" onClick={onNewTrip}><Icon name="plus" size={18} /> Plan your first trip</button></div>}</section>
}

function ExpensesPage({ trips, onOpenTrip, totalExpenses }: { trips: Trip[]; onOpenTrip: (id: string) => void; totalExpenses: number }) {
  const expenses = trips.flatMap((trip) => trip.expenses.map((expense) => ({ ...expense, tripName: trip.destination, tripId: trip.id }))).sort((a, b) => b.date.localeCompare(a.date))
  return <section className="inner-page"><div className="inner-page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> THE SHARED TAB</div><h1>Money stuff, <em>made easy.</em></h1><p>See the little things add up, without the awkward math.</p></div></div><div className="expense-overview"><span className="stat-icon mint"><Icon name="wallet" size={18} /></span><div><span className="stat-label">Total across all trips</span><strong>{money(totalExpenses)}</strong></div><span className="expense-count">{expenses.length} expenses</span></div><div className="expense-list-card"><div className="list-header"><h2>Recent expenses</h2><span>Newest first</span></div>{expenses.length ? expenses.map((expense) => <button className="expense-row" key={expense.id} onClick={() => onOpenTrip(expense.tripId)}><span className={`expense-category-icon category-${expense.category.toLowerCase()}`}><Icon name={expense.category === 'Flights' ? 'plane' : expense.category === 'Stay' ? 'bed' : expense.category === 'Food' ? 'fork' : 'receipt'} size={17} /></span><span className="expense-row-copy"><strong>{expense.title}</strong><small>{expense.tripName} · Paid by {expense.paidBy}</small></span><span className="expense-row-date">{formatDate(expense.date, { month: 'short', day: 'numeric' })}</span><strong className="expense-amount">{money(expense.amount)}</strong><Icon name="chevron" size={16} /></button>) : <p className="empty-inline">Add an expense from any trip to start keeping track.</p>}</div></section>
}

function TripDetail({ trip, onBack, onAddExpense }: { trip: Trip; onBack: () => void; onAddExpense: (expense: Expense) => void }) {
  const [showForm, setShowForm] = useState(false)
  const [expenseError, setExpenseError] = useState('')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState<Category>('Food')
  const [paidBy, setPaidBy] = useState(trip.people[0] ?? 'You')
  const [splitWith, setSplitWith] = useState<string[]>(trip.people)
  const total = trip.expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const balances = trip.people.map((person) => ({ person, balance: balanceFor(trip, person) }))
  const sortedExpenses = [...trip.expenses].sort((a, b) => b.date.localeCompare(a.date))

  function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return
    if (!splitWith.length) {
      setExpenseError('Choose at least one traveler to split this expense with.')
      return
    }
    onAddExpense({ id: crypto.randomUUID(), title: title.trim(), category, amount: numericAmount, paidBy, splitWith, date: new Date().toISOString().slice(0, 10) })
    setTitle('')
    setAmount('')
    setExpenseError('')
    setShowForm(false)
  }

  return <section className="trip-detail-page">
    <button className="back-link" onClick={onBack}><Icon name="back" size={17} /> All trips</button>
    <div className="detail-hero"><div className="detail-photo"><span className="photo-kicker"><Icon name="sparkle" size={14} /> YOUR NEXT ADVENTURE</span></div><div className="detail-heading"><div className="eyebrow"><span className="eyebrow-line" /> {tripDuration(trip)} DAYS AWAY</div><h1>{trip.destination.split(',')[0]}<span className="title-period">.</span></h1><div className="detail-date"><Icon name="calendar" size={16} /> {formatDate(trip.startDate, { month: 'long', day: 'numeric' })} – {formatDate(trip.endDate, { month: 'long', day: 'numeric', year: 'numeric' })}</div><div className="detail-people">{trip.people.map((person, index) => <span className="person-chip" key={person}><i className={`avatar avatar-${index % 4}`}>{person.slice(0, 1)}</i>{person}</span>)}</div></div></div>

    <div className="detail-summary-grid">
      <div className="detail-summary-card"><span className="stat-label">Total trip expenses</span><strong>{money(total)}</strong><small>{trip.expenses.length} things paid for so far</small></div>
      <div className="detail-summary-card"><span className="stat-label">Trip preferences</span><div className="preference-list">{trip.preferences.length ? trip.preferences.map((preference) => <span className="preference-chip" key={preference}>{preference}</span>) : <span className="muted-copy">No preferences added yet</span>}</div>{trip.notes && <small className="trip-note">{trip.notes}</small>}</div>
    </div>

    <section className="detail-content-section"><div className="section-heading compact-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> EVERYONE’S SHARE</div><h2>Keeping it fair</h2></div></div><div className="balance-card"><div className="balance-intro"><span className="balance-icon"><Icon name="users" size={18} /></span><div><strong>Trip balances</strong><p>Paid in is green; a negative balance means they owe.</p></div></div><div className="balance-list">{balances.map(({ person, balance }, index) => <div className="balance-row" key={person}><span className={`avatar avatar-${index % 4}`}>{person.slice(0, 1)}</span><span className="balance-person">{person}</span><span className={`balance-value ${balance >= 0 ? 'positive' : 'negative'}`}>{balance >= 0 ? '+' : '−'}{money(Math.abs(balance))}</span></div>)}</div><div className="balance-footnote">Each shared expense is split evenly between selected travelers.</div></div></section>

    <section className="detail-content-section"><div className="section-heading compact-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> THE LITTLE DETAILS</div><h2>Trip expenses</h2></div><button className="button button-soft" onClick={() => { setShowForm(!showForm); setExpenseError('') }}><Icon name={showForm ? 'close' : 'plus'} size={17} /> {showForm ? 'Cancel' : 'Add expense'}</button></div>
      {showForm && <form className="add-expense-form" onSubmit={submitExpense}><div className="form-heading"><strong>Add a shared expense</strong><span>Everyone’s share is worked out for you.</span></div><div className="expense-fields"><label>What was it for?<input required placeholder="e.g. Dinner at the little place" value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Amount (USD)<input required type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label>Category<select value={category} onChange={(event) => setCategory(event.target.value as Category)}>{(['Flights', 'Stay', 'Food', 'Transport', 'Activities', 'Shopping', 'Other'] as Category[]).map((item) => <option key={item}>{item}</option>)}</select></label><label>Paid by<select value={paidBy} onChange={(event) => setPaidBy(event.target.value)}>{trip.people.map((person) => <option key={person}>{person}</option>)}</select></label></div>      <fieldset className="split-people"><legend>Split between</legend><div>{trip.people.map((person) => <label className="check-person" key={person}><input type="checkbox" checked={splitWith.includes(person)} onChange={() => { setExpenseError(''); setSplitWith((current) => current.includes(person) ? current.filter((name) => name !== person) : [...current, person]) }} /><span>{person}</span></label>)}</div></fieldset>{expenseError && <p className="form-error" role="alert">{expenseError}</p>}<button className="button button-primary" type="submit">Save expense <Icon name="arrow" size={16} /></button></form>}
      <div className="expense-list-card detail-expense-list">{sortedExpenses.length ? sortedExpenses.map((expense) => <div className="expense-row static-row" key={expense.id}><span className={`expense-category-icon category-${expense.category.toLowerCase()}`}><Icon name={expense.category === 'Flights' ? 'plane' : expense.category === 'Stay' ? 'bed' : expense.category === 'Food' ? 'fork' : 'receipt'} size={17} /></span><span className="expense-row-copy"><strong>{expense.title}</strong><small>{expense.category} · Paid by {expense.paidBy} · Split {expense.splitWith.length === trip.people.length ? 'evenly' : `with ${expense.splitWith.join(', ')}`}</small></span><span className="expense-row-date">{formatDate(expense.date, { month: 'short', day: 'numeric' })}</span><strong className="expense-amount">{money(expense.amount)}</strong></div>) : <p className="empty-inline">Nothing logged yet. Add the first expense when you’re ready.</p>}</div>
    </section>
  </section>
}

function TripWizard({ onClose, onCreate }: { onClose: () => void; onCreate: (trip: Trip) => void }) {
  const [step, setStep] = useState(0)
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [people, setPeople] = useState(['You'])
  const [newPerson, setNewPerson] = useState('')
  const [preferences, setPreferences] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const preferenceOptions = ['Culture', 'Foodie', 'Outdoors', 'Slow travel', 'Family-friendly', 'Budget-conscious', 'Nightlife', 'Design']
  const stepNames = ['Where & when', 'Who’s coming', 'The little details']
  function addPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = newPerson.trim()
    if (!name || people.some((person) => person.toLowerCase() === name.toLowerCase())) return
    setPeople((current) => [...current, name])
    setNewPerson('')
  }

  function nextStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setConfirmed(true)
    window.setTimeout(() => {
      setConfirmed(false)
      setStep((current) => Math.min(2, current + 1))
    }, 350)
  }

  function submitTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onCreate({ id: crypto.randomUUID(), destination: destination.trim(), startDate, endDate, people, preferences, notes: notes.trim(), expenses: [] })
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="wizard-modal" role="dialog" aria-modal="true" aria-labelledby="wizard-title">
      <header className="wizard-header"><a className="brand wizard-brand" href="#" onClick={(event) => event.preventDefault()}><span className="brand-mark"><Icon name="plane" size={18} /></span><span>wayfarer<span className="brand-dot">.</span></span></a><button className="icon-button" aria-label="Close planner" onClick={onClose}><Icon name="close" size={19} /></button></header>
      <div className="wizard-body">
        <div className="wizard-main">
          <div className="eyebrow"><span className="eyebrow-line" /> A LITTLE TRIP, A LOT OF POSSIBILITIES</div>
          <h2 id="wizard-title">{step === 0 ? <>First, <em>where to?</em></> : step === 1 ? <>Who’s in <em>your crew?</em></> : <>Make it feel <em>like yours.</em></>}</h2>
          <p className="wizard-subtitle">{step === 0 ? 'Pick a place and a time. You can always change the details later.' : step === 1 ? 'Good trips are even better with your favorite people.' : 'Tell us what you love. It helps shape a trip that feels like you.'}</p>
          <div className="wizard-steps">{stepNames.map((name, index) => <div className={`wizard-step ${index === step ? 'current' : index < step ? 'done' : ''}`} key={name}><span>{index < step ? <Icon name="check" size={14} /> : index + 1}</span><small>{name}</small></div>)}</div>
          {step < 2 ? <form className={`wizard-form step-${step}`} onSubmit={nextStep}>
            {step === 0 ? <>
              <label className="field-label">Where are you dreaming of?<span className="input-with-icon"><Icon name="pin" size={18} /><input required autoFocus placeholder="A city, a country, anywhere…" value={destination} onChange={(event) => setDestination(event.target.value)} /></span></label>
              <div className="date-fields"><label className="field-label">Leaving<input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label className="field-label">Coming back<input required type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label></div>
            </> : <>
              <div className="people-label"><div><strong>Your travelers</strong><span>Add the people you’ll be sharing this adventure with.</span></div><span className="traveler-count"><Icon name="users" size={15} /> {people.length}</span></div>
              <div className="traveler-list">{people.map((person, index) => <div className="traveler-row" key={person}><span className={`avatar avatar-${index % 4}`}>{person.slice(0, 1)}</span><span>{person}</span>{index === 0 ? <small>That’s you</small> : <button type="button" aria-label={`Remove ${person}`} className="remove-person" onClick={() => setPeople((current) => current.filter((name) => name !== person))}><Icon name="close" size={15} /></button>}</div>)}</div>
              <form className="add-person-row" onSubmit={addPerson}><input aria-label="Traveler name" placeholder="Add someone by name" value={newPerson} onChange={(event) => setNewPerson(event.target.value)} /><button type="submit" className="button button-soft"><Icon name="plus" size={16} /> Add</button></form>
            </>}
            <div className="wizard-actions"><button type="button" className="button button-quiet" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>Back</button><button className="button button-primary" type="submit">{confirmed ? <><Icon name="check" size={17} /> Noted</> : <>Confirm & continue <Icon name="arrow" size={16} /></>}</button></div>
          </form> : <form className="wizard-form preferences-form" onSubmit={submitTrip}>
            <fieldset className="preference-fieldset"><legend>What sounds like you?</legend><p>Pick as many as you like — or none at all.</p><div className="preference-options">{preferenceOptions.map((preference) => <button type="button" className={`preference-option ${preferences.includes(preference) ? 'selected' : ''}`} key={preference} onClick={() => setPreferences((current) => current.includes(preference) ? current.filter((item) => item !== preference) : [...current, preference])}>{preferences.includes(preference) && <Icon name="check" size={14} />}{preference}</button>)}</div></fieldset>
            <label className="field-label">Anything else on your mind?<textarea placeholder="A birthday dinner, a tiny hotel, absolutely no early mornings…" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
            <div className="wizard-actions"><button type="button" className="button button-quiet" onClick={() => setStep(1)}>Back</button><button className="button button-primary" type="submit">Create my trip <Icon name="arrow" size={16} /></button></div>
          </form>}
        </div>
        <aside className="wizard-aside">
          <div className="aside-card-top"><span className="aside-spark"><Icon name="sparkle" size={19} /></span><span>YOUR TRIP, TAKING SHAPE</span></div>
          <div className="aside-destination">{destination || 'Somewhere wonderful'}</div>
          <div className="aside-details"><span><Icon name="calendar" size={15} />{startDate ? `${formatDate(startDate)}${endDate ? ` – ${formatDate(endDate)}` : ''}` : 'The dates are yours to choose'}</span><span><Icon name="users" size={15} />{people.length} {people.length === 1 ? 'traveler' : 'travelers'}</span>{preferences.length > 0 && <span><Icon name="sparkle" size={15} />{preferences.slice(0, 3).join(' · ')}</span>}</div>
          <div className="aside-divider" />
          <div className={`planner-response ${confirmed ? 'response-confirmed' : ''}`}><span className="response-dot"><Icon name={confirmed ? 'check' : 'sparkle'} size={14} /></span><div><strong>{confirmed ? 'All noted!' : 'A note from your planner'}</strong><p>{confirmed ? 'Your answers are saved. Let’s keep shaping this trip.' : 'Your details will come together here, one little decision at a time.'}</p></div></div>
          <p className="response-footnote">Planner suggestions will appear here as you confirm each step.</p>
          <div className="aside-bottom-note"><span>✳</span> No wrong turns. Just your kind of trip.</div>
        </aside>
      </div>
    </section>
  </div>
}

export default App
