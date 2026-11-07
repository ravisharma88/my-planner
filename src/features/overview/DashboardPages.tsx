import { Icon } from '../../components/Icon'
import { PlaceImage } from '../../components/PlaceImage'
import type { Trip } from '../../types/trip'
import { formatDate, money, tripDuration } from '../../utils/trip'

export function Overview({ trips, upcomingTrips, totalExpenses, onOpenTrip, onNewTrip }: {
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
            <div className="feature-photo">
              <PlaceImage destination={nextTrip.destination} className="place-photo" />
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
        {pastTrips.length ? <div className="trip-card-grid">{pastTrips.slice(0, 3).map((trip) => <TripCard key={trip.id} trip={trip} onClick={() => onOpenTrip(trip.id)} />)}</div> : (
          <div className="empty-card"><span className="empty-icon"><Icon name="pin" size={20} /></span><strong>Your past trips will feel right at home here.</strong><p>Every adventure you plan will be easy to find.</p></div>
        )}
      </section>
    </>
  )
}

export function StatCard({ icon, label, value, detail, tone }: { icon: string; label: string; value: string; detail: string; tone: string }) {
  return <div className="stat-card"><span className={`stat-icon ${tone}`}><Icon name={icon} size={18} /></span><div className="stat-copy"><span className="stat-label">{label}</span><div className="stat-value">{value}<small>{detail}</small></div></div></div>
}

export function TripCard({ trip, onClick }: { trip: Trip; onClick: () => void }) {
  return (
    <button className="trip-card" onClick={onClick}>
      <span className="trip-card-image"><PlaceImage destination={trip.destination} className="place-photo" /><span className="trip-image-tag">{trip.people.length} travelers</span></span>
      <span className="trip-card-body"><span className="trip-card-title">{trip.destination}</span><span className="trip-card-date">{formatDate(trip.startDate, { month: 'long', day: 'numeric' })} – {formatDate(trip.endDate, { month: 'long', day: 'numeric', year: 'numeric' })}</span><span className="trip-card-footer"><span>{tripDuration(trip)} days</span><span className="mini-avatar-row">{trip.people.slice(0, 3).map((person, i) => <i className={`avatar avatar-${i}`} key={person}>{person.slice(0, 1)}</i>)}</span><Icon name="arrow" size={16} /></span></span>
    </button>
  )
}

export function TripsPage({ trips, onOpenTrip, onNewTrip }: { trips: Trip[]; onOpenTrip: (id: string) => void; onNewTrip: () => void }) {
  return <section className="inner-page"><div className="inner-page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR ADVENTURES</div><h1>All your trips, <em>in one place.</em></h1><p>Every plan, every person, every little detail.</p></div><button className="button button-primary" onClick={onNewTrip}><Icon name="plus" size={18} /> Plan a trip</button></div>{trips.length ? <div className="trip-card-grid trip-list-grid">{trips.map((trip) => <TripCard key={trip.id} trip={trip} onClick={() => onOpenTrip(trip.id)} />)}</div> : <div className="empty-card"><span className="empty-icon"><Icon name="pin" size={20} /></span><strong>Your next favorite place is waiting.</strong><p>Start with a destination and see where the planning takes you.</p><button className="button button-primary" onClick={onNewTrip}><Icon name="plus" size={18} /> Plan your first trip</button></div>}</section>
}

export function ExpensesPage({ trips, onOpenTrip, totalExpenses }: { trips: Trip[]; onOpenTrip: (id: string) => void; totalExpenses: number }) {
  const expenses = trips.flatMap((trip) => trip.expenses.map((expense) => ({ ...expense, tripName: trip.destination, tripId: trip.id }))).sort((a, b) => b.date.localeCompare(a.date))
  return <section className="inner-page"><div className="inner-page-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> THE SHARED TAB</div><h1>Money stuff, <em>made easy.</em></h1><p>See the little things add up, without the awkward math.</p></div></div><div className="expense-overview"><span className="stat-icon mint"><Icon name="wallet" size={18} /></span><div><span className="stat-label">Total across all trips</span><strong>{money(totalExpenses)}</strong></div><span className="expense-count">{expenses.length} expenses</span></div><div className="expense-list-card"><div className="list-header"><h2>Recent expenses</h2><span>Newest first</span></div>{expenses.length ? expenses.map((expense) => <button className="expense-row" key={expense.id} onClick={() => onOpenTrip(expense.tripId)}><span className={`expense-category-icon category-${expense.category.toLowerCase()}`}><Icon name={expense.category === 'Flights' ? 'plane' : expense.category === 'Stay' ? 'bed' : expense.category === 'Food' ? 'fork' : 'receipt'} size={17} /></span><span className="expense-row-copy"><strong>{expense.title}</strong><small>{expense.tripName} · Paid by {expense.paidBy}</small></span><span className="expense-row-date">{formatDate(expense.date, { month: 'short', day: 'numeric' })}</span><strong className="expense-amount">{money(expense.amount)}</strong><Icon name="chevron" size={16} /></button>) : <p className="empty-inline">Add an expense from any trip to start keeping track.</p>}</div></section>
}
