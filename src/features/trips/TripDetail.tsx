import { useState, type FormEvent } from 'react'
import { Icon } from '../../components/Icon'
import { PlaceImage } from '../../components/PlaceImage'
import { today } from '../../data/trips'
import type { Category, Expense, JournalEntry, Trip } from '../../types/trip'
import { balanceFor, formatDate, getMockWeather, getWeatherTheme, money, tripDuration } from '../../utils/trip'

export function TripInsightPanel({ trip, total, isCompleted }: { trip: Trip; total: number; isCompleted: boolean }) {
  const categoryTotals = trip.expenses.reduce<Partial<Record<Category, number>>>((totals, expense) => {
    totals[expense.category] = (totals[expense.category] ?? 0) + expense.amount
    return totals
  }, {})
  const topCategory = Object.entries(categoryTotals).sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))[0]
  const ideas = [
    `Explore a local market or neighborhood walk in ${trip.destination.split(',')[0]}.`,
    trip.preferences.includes('Foodie')
      ? 'Save one evening for a relaxed, memorable local meal.'
      : 'Leave one afternoon open for an unplanned discovery.',
    trip.preferences.includes('Culture')
      ? 'Check opening days and reserve tickets for the cultural spots on your list.'
      : 'Check local events during your travel dates for something unexpected.',
  ]

  return <aside className={`trip-insight-panel ${isCompleted ? 'trip-recap-panel' : 'trip-suggestions-panel'}`}>
    {isCompleted ? <>
      <div className="trip-insight-heading"><span className="trip-insight-icon"><Icon name="receipt" size={17} /></span><div><span className="eyebrow"><span className="eyebrow-line" /> THE TRIP, REMEMBERED</span><h2>A little recap.</h2></div></div>
      <p className="trip-insight-intro">{trip.destination} · {tripDuration(trip)} days · {trip.people.length} {trip.people.length === 1 ? 'traveler' : 'travelers'}</p>
      <div className="trip-recap-stat"><span>Total tracked</span><strong>{money(total)}</strong></div>
      <div className="trip-recap-stat"><span>Per traveler</span><strong>{money(total / Math.max(1, trip.people.length))}</strong></div>
      <div className="trip-recap-stat"><span>Expenses logged</span><strong>{trip.expenses.length}</strong></div>
      {topCategory && <div className="trip-recap-category"><span>Biggest category</span><strong>{topCategory[0]} <span>{money(topCategory[1] ?? 0)}</span></strong></div>}
      {trip.notes && <div className="trip-memory"><span>A note from the trip</span><p>{trip.notes}</p></div>}
      {!trip.expenses.length && <p className="trip-insight-footnote">No expenses were recorded for this trip.</p>}
    </> : <>
      <div className="trip-insight-heading"><span className="trip-insight-icon"><Icon name="sparkle" size={17} /></span><div><span className="eyebrow"><span className="eyebrow-line" /> YOUR PLANNER</span><h2>Ideas for the trip.</h2></div></div>
      <p className="trip-insight-intro">A few starting points for {trip.destination.split(',')[0]}, shaped around your trip details.</p>
      <span className="trip-mock-label">SAMPLE SUGGESTIONS · AI COMING SOON</span>
      <ul className="trip-idea-list">{ideas.map((idea) => <li key={idea}><Icon name="sparkle" size={14} /><span>{idea}</span></li>)}</ul>
      <div className="trip-insight-context"><span>Based on your trip</span><p>{formatDate(trip.startDate, { month: 'short', day: 'numeric' })} – {formatDate(trip.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}</p>{trip.preferences.length > 0 && <p>{trip.preferences.join(' · ')}</p>}</div>
      <p className="trip-insight-footnote">Personalized suggestions will appear here once planner AI is connected.</p>
    </>}
  </aside>
}

export function TripDetail({ trip, onBack, onAddExpense, onAddJournal, backLabel = 'All trips' }: { trip: Trip; onBack: () => void; onAddExpense: (expense: Omit<Expense, 'id'>) => Promise<void>; onAddJournal: (entry: Omit<JournalEntry, 'id'>) => Promise<void>; backLabel?: string }) {
  const [activeTab, setActiveTab] = useState<'planning' | 'expenses' | 'journal'>('planning')
  const [showForm, setShowForm] = useState(false)
  const [expenseError, setExpenseError] = useState('')
  const [journalError, setJournalError] = useState('')
  const [savingExpense, setSavingExpense] = useState(false)
  const [savingJournal, setSavingJournal] = useState(false)
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [journalText, setJournalText] = useState('')
  const [category, setCategory] = useState<Category>('Food')
  const [paidBy, setPaidBy] = useState(trip.people[0] ?? 'You')
  const [splitWith, setSplitWith] = useState<string[]>(trip.people)
  const total = trip.expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const isCompleted = trip.endDate < today
  const weather = getMockWeather(trip)
  const weatherTheme = getWeatherTheme(weather)
  const weatherLabel = weather.precipitation === 'snow' ? 'Snow' : weather.precipitation === 'rain' ? 'Rain' : weather.temperatureC >= 25 ? 'Sunny' : weather.temperatureC <= 8 ? 'Cold' : 'Clear'
  const balances = trip.people.map((person) => ({ person, balance: balanceFor(trip, person) }))
  const sortedExpenses = [...trip.expenses].sort((a, b) => b.date.localeCompare(a.date))

  async function submitExpense(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const numericAmount = Number(amount)
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return
    if (!splitWith.length) {
      setExpenseError('Choose at least one traveler to split this expense with.')
      return
    }
    setSavingExpense(true)
    setExpenseError('')
    try {
      await onAddExpense({ title: title.trim(), category, amount: numericAmount, paidBy, splitWith, date: new Date().toISOString().slice(0, 10) })
      setTitle('')
      setAmount('')
      setShowForm(false)
    } catch (error) {
      setExpenseError(error instanceof Error ? error.message : 'Unable to save this expense.')
    } finally {
      setSavingExpense(false)
    }
  }

  async function submitJournalEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const text = journalText.trim()
    if (!text) return
    setSavingJournal(true)
    setJournalError('')
    try {
      await onAddJournal({ text, date: new Date().toISOString().slice(0, 10) })
      setJournalText('')
    } catch (error) {
      setJournalError(error instanceof Error ? error.message : 'Unable to save this journal entry.')
    } finally {
      setSavingJournal(false)
    }
  }

  return <section className="trip-detail-page">
    <button className="back-link" onClick={onBack}><Icon name="back" size={17} /> {backLabel}</button>
    <div className={`detail-hero weather-${weatherTheme}`}><div className="detail-photo"><PlaceImage destination={trip.destination} className="place-photo" /><span className="photo-kicker"><Icon name={isCompleted ? 'check' : 'sparkle'} size={14} /> {isCompleted ? 'A TRIP TO REMEMBER' : 'YOUR NEXT ADVENTURE'}</span><span className="weather-badge"><Icon name="clock" size={14} /> {weatherLabel} · {weather.temperatureC}°C <small>MOCK</small></span></div><div className="detail-heading"><div className="eyebrow"><span className="eyebrow-line" /> {tripDuration(trip)} DAY TRIP</div><h1>{trip.destination.split(',')[0]}<span className="title-period">.</span></h1><div className="detail-date"><Icon name="calendar" size={16} /> {formatDate(trip.startDate, { month: 'long', day: 'numeric' })} – {formatDate(trip.endDate, { month: 'long', day: 'numeric', year: 'numeric' })}</div><div className="detail-people">{trip.people.map((person, index) => <span className="person-chip" key={person}><i className={`avatar avatar-${index % 4}`}>{person.slice(0, 1)}</i>{person}</span>)}</div></div></div>

    <div className="trip-tabs" role="tablist" aria-label="Trip sections">
      <button id="trip-tab-planning" className={`trip-tab ${activeTab === 'planning' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'planning'} aria-controls="trip-panel-planning" onClick={() => setActiveTab('planning')}><Icon name="sparkle" size={16} /> Planning</button>
      <button id="trip-tab-expenses" className={`trip-tab ${activeTab === 'expenses' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'expenses'} aria-controls="trip-panel-expenses" onClick={() => setActiveTab('expenses')}><Icon name="wallet" size={16} /> Expenses <span className="trip-tab-count">{trip.expenses.length}</span></button>
      <button id="trip-tab-journal" className={`trip-tab ${activeTab === 'journal' ? 'active' : ''}`} role="tab" aria-selected={activeTab === 'journal'} aria-controls="trip-panel-journal" onClick={() => setActiveTab('journal')}><Icon name="receipt" size={16} /> Journal <span className="trip-tab-count">{trip.journalEntries?.length ?? 0}</span></button>
    </div>

    {activeTab === 'planning' && <div className="trip-detail-layout" id="trip-panel-planning" role="tabpanel" aria-labelledby="trip-tab-planning">
      <div className="trip-detail-main">
        <div className="detail-summary-grid">
          <div className="detail-summary-card"><span className="stat-label">Total trip expenses</span><strong>{money(total)}</strong><small>{trip.expenses.length} things paid for so far</small></div>
          <div className="detail-summary-card"><span className="stat-label">Trip preferences</span><div className="preference-list">{trip.preferences.length ? trip.preferences.map((preference) => <span className="preference-chip" key={preference}>{preference}</span>) : <span className="muted-copy">No preferences added yet</span>}</div>{trip.notes && <small className="trip-note">{trip.notes}</small>}</div>
        </div>
        <section className="detail-content-section"><div className="section-heading compact-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> THE PLAN</div><h2>{isCompleted ? 'Trip details' : 'Make it your own'}</h2></div></div><div className="planning-card"><div><span className="stat-label">Destination</span><strong>{trip.destination}</strong></div><div><span className="stat-label">Dates</span><strong>{formatDate(trip.startDate, { month: 'long', day: 'numeric' })} – {formatDate(trip.endDate, { month: 'long', day: 'numeric', year: 'numeric' })}</strong></div><div><span className="stat-label">Travelers</span><strong>{trip.people.join(', ')}</strong></div>{trip.notes && <div><span className="stat-label">Trip notes</span><p>{trip.notes}</p></div>}</div></section>
      </div>
      <TripInsightPanel trip={trip} total={total} isCompleted={isCompleted} />
    </div>}

    {activeTab === 'expenses' && <div className="trip-tab-content" id="trip-panel-expenses" role="tabpanel" aria-labelledby="trip-tab-expenses">
      <section className="detail-content-section"><div className="section-heading compact-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> EVERYONE’S SHARE</div><h2>Keeping it fair</h2></div></div><div className="balance-card"><div className="balance-intro"><span className="balance-icon"><Icon name="users" size={18} /></span><div><strong>Trip balances</strong><p>Paid in is green; a negative balance means they owe.</p></div></div><div className="balance-list">{balances.map(({ person, balance }, index) => <div className="balance-row" key={person}><span className={`avatar avatar-${index % 4}`}>{person.slice(0, 1)}</span><span className="balance-person">{person}</span><span className={`balance-value ${balance >= 0 ? 'positive' : 'negative'}`}>{balance >= 0 ? '+' : '−'}{money(Math.abs(balance))}</span></div>)}</div><div className="balance-footnote">Each shared expense is split evenly between selected travelers.</div></div></section>
      <section className="detail-content-section"><div className="section-heading compact-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> THE LITTLE DETAILS</div><h2>Trip expenses</h2></div><button className="button button-soft" onClick={() => { setShowForm(!showForm); setExpenseError('') }}><Icon name={showForm ? 'close' : 'plus'} size={17} /> {showForm ? 'Cancel' : 'Add expense'}</button></div>
        {showForm && <form className="add-expense-form" onSubmit={submitExpense}><div className="form-heading"><strong>Add a shared expense</strong><span>Everyone’s share is worked out for you.</span></div><div className="expense-fields"><label>What was it for?<input required placeholder="e.g. Dinner at the little place" value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Amount (USD)<input required type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label>Category<select value={category} onChange={(event) => setCategory(event.target.value as Category)}>{(['Flights', 'Stay', 'Food', 'Transport', 'Activities', 'Shopping', 'Other'] as Category[]).map((item) => <option key={item}>{item}</option>)}</select></label><label>Paid by<select value={paidBy} onChange={(event) => setPaidBy(event.target.value)}>{trip.people.map((person) => <option key={person}>{person}</option>)}</select></label></div><fieldset className="split-people"><legend>Split between</legend><div>{trip.people.map((person) => <label className="check-person" key={person}><input type="checkbox" checked={splitWith.includes(person)} onChange={() => { setExpenseError(''); setSplitWith((current) => current.includes(person) ? current.filter((name) => name !== person) : [...current, person]) }} /><span>{person}</span></label>)}</div></fieldset>{expenseError && <p className="form-error" role="alert">{expenseError}</p>}<button className="button button-primary" type="submit" disabled={savingExpense}>{savingExpense ? 'Saving…' : <>Save expense <Icon name="arrow" size={16} /></>}</button></form>}
        <div className="expense-list-card detail-expense-list">{sortedExpenses.length ? sortedExpenses.map((expense) => <div className="expense-row static-row" key={expense.id}><span className={`expense-category-icon category-${expense.category.toLowerCase()}`}><Icon name={expense.category === 'Flights' ? 'plane' : expense.category === 'Stay' ? 'bed' : expense.category === 'Food' ? 'fork' : 'receipt'} size={17} /></span><span className="expense-row-copy"><strong>{expense.title}</strong><small>{expense.category} · Paid by {expense.paidBy} · Split {expense.splitWith.length === trip.people.length ? 'evenly' : `with ${expense.splitWith.join(', ')}`}</small></span><span className="expense-row-date">{formatDate(expense.date, { month: 'short', day: 'numeric' })}</span><strong className="expense-amount">{money(expense.amount)}</strong></div>) : <p className="empty-inline">Nothing logged yet. Add the first expense when you’re ready.</p>}</div>
      </section>
    </div>}

    {activeTab === 'journal' && <section className="trip-tab-content journal-tab-content" id="trip-panel-journal" role="tabpanel" aria-labelledby="trip-tab-journal">
      <div className="section-heading compact-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> LITTLE MOMENTS, KEPT</div><h2>Trip journal</h2><p>Save the stories, highlights, and small details you’ll want to remember.</p></div></div>
      <form className="journal-form" onSubmit={submitJournalEntry}><label className="field-label" htmlFor="journal-entry">Add a journal entry<textarea id="journal-entry" required rows={4} placeholder="What do you want to remember about this trip?" value={journalText} onChange={(event) => setJournalText(event.target.value)} /></label>{journalError && <p className="form-error" role="alert">{journalError}</p>}<button className="button button-primary" type="submit" disabled={savingJournal}>{savingJournal ? 'Saving…' : <><Icon name="plus" size={16} /> Save memory</>}</button></form>
      {trip.journalEntries?.length ? <div className="journal-entry-list">{trip.journalEntries.map((entry) => <article className="journal-entry" key={entry.id}><span className="journal-entry-date"><Icon name="calendar" size={14} /> {formatDate(entry.date, { month: 'long', day: 'numeric', year: 'numeric' })}</span><p>{entry.text}</p></article>)}</div> : <div className="journal-empty"><span className="empty-icon"><Icon name="sparkle" size={20} /></span><strong>Your trip stories start here.</strong><p>Capture a favorite meal, a funny detour, or a moment you don’t want to forget.</p></div>}
    </section>}
  </section>
}
