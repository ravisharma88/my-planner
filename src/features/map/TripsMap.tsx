import { useEffect, useMemo, useState } from 'react'
import { divIcon, type LatLngTuple } from 'leaflet'
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import { Icon } from '../../components/Icon'
import { getDestinationCoordinates, type DestinationCoordinates } from '../../api/places'
import { today } from '../../data/trips'
import type { Expense, JournalEntry, Trip } from '../../types/trip'
import { formatDate, money, tripDuration } from '../../utils/trip'
import { TripDetail } from '../trips/TripDetail'
import './map.css'

type LocatedTrip = {
  id: string
  destination: string
  coordinates: DestinationCoordinates | null
  lookupFailed: boolean
}

type TripMarkerGroup = {
  coordinates: LatLngTuple
  trips: Trip[]
}

function MapControls() {
  const map = useMap()
  return <div className="trip-map-zoom-controls" aria-label="Map zoom controls">
    <button type="button" aria-label="Zoom in" onClick={() => map.zoomIn()}>+</button>
    <button type="button" aria-label="Zoom out" onClick={() => map.zoomOut()}>−</button>
  </div>
}

function FitMapToTrips({ locations }: { locations: TripMarkerGroup[] }) {
  const map = useMap()
  const locationKey = locations.map(({ coordinates }) => coordinates.join(',')).join(';')

  useEffect(() => {
    if (locationKey) {
      const bounds = locationKey.split(';').map((pair) => pair.split(',').map(Number) as LatLngTuple)
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 5 })
    }
  }, [locationKey, map])

  return null
}

function tripMarkerIcon(group: TripMarkerGroup) {
  const completed = group.trips.filter((trip) => trip.endDate < today).length
  const upcoming = group.trips.length - completed
  const status = completed && upcoming ? 'mixed' : completed ? 'completed' : 'upcoming'
  const count = group.trips.length > 1 ? `<span class="trip-map-marker-count">${group.trips.length}</span>` : ''
  return divIcon({
    className: 'trip-map-marker',
    html: `<span class="trip-map-marker-pin trip-map-marker-${status}">${count}</span>`,
    iconSize: [32, 40],
    iconAnchor: [16, 38],
  })
}

function TripSummaryModal({ trips, selectedIndex, onSelect, onClose, onViewDetails }: {
  trips: Trip[]
  selectedIndex: number
  onSelect: (index: number) => void
  onClose: () => void
  onViewDetails: (id: string) => void
}) {
  const trip = trips[selectedIndex]
  const total = trip.expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const isCompleted = trip.endDate < today

  return <div className="trip-map-modal-backdrop" onClick={onClose}>
    <section className="trip-map-summary-modal" role="dialog" aria-modal="true" aria-labelledby="trip-map-summary-title" onClick={(event) => event.stopPropagation()}>
      <button className="trip-map-modal-close" type="button" aria-label="Close trip summary" onClick={onClose}><Icon name="close" size={17} /></button>
      <span className={`trip-map-status ${isCompleted ? 'completed' : 'upcoming'}`}>{isCompleted ? 'COMPLETED TRIP' : 'UPCOMING TRIP'}</span>
      <h2 id="trip-map-summary-title">{trip.destination.split(',')[0]}<span>.</span></h2>
      <p className="trip-map-summary-location"><Icon name="pin" size={14} /> {trip.destination}</p>
      <div className="trip-map-summary-facts">
        <span><Icon name="calendar" size={15} />{formatDate(trip.startDate, { month: 'short', day: 'numeric' })} – {formatDate(trip.endDate, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
        <span><Icon name="users" size={15} />{trip.people.length} {trip.people.length === 1 ? 'traveler' : 'travelers'} · {tripDuration(trip)} days</span>
        <span><Icon name="receipt" size={15} />{money(total)} tracked expenses</span>
      </div>
      {trips.length > 1 && <div className="trip-map-modal-pagination">
        <button type="button" onClick={() => onSelect((selectedIndex + trips.length - 1) % trips.length)} aria-label="Previous trip">‹</button>
        <span>{selectedIndex + 1} of {trips.length} trips here</span>
        <button type="button" onClick={() => onSelect((selectedIndex + 1) % trips.length)} aria-label="Next trip">›</button>
      </div>}
      <button className="button button-primary trip-map-view-details" type="button" onClick={() => onViewDetails(trip.id)}>View trip details <Icon name="arrow" size={16} /></button>
    </section>
  </div>
}

export function TripsMap({ trips, onAddExpense, onAddJournal }: {
  trips: Trip[]
  onAddExpense: (tripId: string, expense: Omit<Expense, 'id'>) => Promise<void>
  onAddJournal: (tripId: string, entry: Omit<JournalEntry, 'id'>) => Promise<void>
}) {
  const [locatedTrips, setLocatedTrips] = useState<LocatedTrip[]>([])
  const [summary, setSummary] = useState<{ trips: Trip[]; selectedIndex: number } | null>(null)
  const [flyoutTripId, setFlyoutTripId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    Promise.all(trips.map(async (trip): Promise<LocatedTrip> => {
      try {
        return { id: trip.id, destination: trip.destination, coordinates: await getDestinationCoordinates(trip.destination), lookupFailed: false }
      } catch {
        return { id: trip.id, destination: trip.destination, coordinates: null, lookupFailed: true }
      }
    })).then((results) => {
      if (active) {
        setLocatedTrips((current) => current.length === results.length && results.every((result, index) => {
          const previous = current[index]
          return previous?.id === result.id && previous.destination === result.destination && previous.lookupFailed === result.lookupFailed && previous.coordinates?.latitude === result.coordinates?.latitude && previous.coordinates?.longitude === result.coordinates?.longitude
        }) ? current : results)
      }
    })

    return () => { active = false }
  }, [trips])

  const lookupPending = locatedTrips.length !== trips.length || locatedTrips.some((located, index) => located.id !== trips[index]?.id || located.destination !== trips[index]?.destination)

  const markerGroups = useMemo(() => {
    const groups = new Map<string, TripMarkerGroup>()
    const tripsById = new Map(trips.map((trip) => [trip.id, trip]))
    locatedTrips.forEach(({ id, coordinates }) => {
      if (!coordinates) return
      const trip = tripsById.get(id)
      if (!trip) return
      const key = `${coordinates.latitude.toFixed(4)},${coordinates.longitude.toFixed(4)}`
      const group = groups.get(key)
      if (group) group.trips.push(trip)
      else groups.set(key, { coordinates: [coordinates.latitude, coordinates.longitude], trips: [trip] })
    })
    return [...groups.values()]
  }, [locatedTrips, trips])

  const notLocated = locatedTrips.filter(({ coordinates }) => !coordinates)
  const lookupErrors = notLocated.filter(({ lookupFailed }) => lookupFailed)
  const noResults = notLocated.filter(({ lookupFailed }) => !lookupFailed)
  const flyoutTrip = trips.find((trip) => trip.id === flyoutTripId)

  return <section className="trip-map-page">
    <div className="trip-map-heading">
      <div><div className="eyebrow"><span className="eyebrow-line" /> YOUR TRAVEL FOOTPRINT</div><h1>Trips, <em>on the map.</em></h1><p>Every destination, all in one place. Select a pin to explore a trip.</p></div>
    </div>
    <div className="trip-map-legend" aria-label="Map marker legend">
      <span><i className="trip-map-legend-dot completed" /> Completed</span>
      <span><i className="trip-map-legend-dot upcoming" /> Upcoming</span>
      <strong>{markerGroups.reduce((count, group) => count + group.trips.length, 0)} destinations mapped</strong>
    </div>
    {(notLocated.length > 0 || lookupPending) && <div className="trip-map-lookup-message" role="status">
      <Icon name="pin" size={16} />
      <span>{lookupPending ? 'Locating trip destinations…' : `${notLocated.length} ${notLocated.length === 1 ? 'destination could' : 'destinations could'} not be placed on the map${lookupErrors.length ? ` (${lookupErrors.length} lookup ${lookupErrors.length === 1 ? 'error' : 'errors'}${noResults.length ? `, ${noResults.length} not found` : ''})` : ''}.`}</span>
    </div>}
    {lookupPending && locatedTrips.length === 0 && <p className="trip-map-loading" role="status">Finding your destinations…</p>}
    <div className="trip-map-canvas">
      <MapContainer center={[18, 0]} zoom={2} minZoom={2} maxZoom={18} scrollWheelZoom maxBounds={[[-85, -180], [85, 180]]} maxBoundsViscosity={1}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapControls />
        <FitMapToTrips locations={markerGroups} />
        {markerGroups.map((group) => <Marker key={`${group.coordinates[0]}-${group.coordinates[1]}`} position={group.coordinates} icon={tripMarkerIcon(group)} eventHandlers={{ click: () => setSummary({ trips: group.trips, selectedIndex: 0 }) }} />)}
      </MapContainer>
      {!trips.length && <div className="trip-map-empty"><span className="empty-icon"><Icon name="globe" size={20} /></span><strong>Your map is waiting for its first pin.</strong><p>Destinations from your trips will appear here.</p></div>}
      {summary && <TripSummaryModal trips={summary.trips} selectedIndex={summary.selectedIndex} onSelect={(selectedIndex) => setSummary({ ...summary, selectedIndex })} onClose={() => setSummary(null)} onViewDetails={(id) => { setSummary(null); setFlyoutTripId(id) }} />}
    </div>
    {flyoutTrip && <div className="trip-map-flyout-scrim" onClick={() => setFlyoutTripId(null)}>
      <aside className="trip-map-flyout" role="dialog" aria-modal="true" aria-label={`Details for ${flyoutTrip.destination}`} onClick={(event) => event.stopPropagation()}>
        <div className="trip-map-flyout-header"><span>TRIP DETAILS</span><button type="button" aria-label="Close trip details" onClick={() => setFlyoutTripId(null)}><Icon name="close" size={18} /></button></div>
        <div className="trip-map-flyout-content"><TripDetail key={flyoutTrip.id} trip={flyoutTrip} onBack={() => setFlyoutTripId(null)} onAddExpense={(expense) => onAddExpense(flyoutTrip.id, expense)} onAddJournal={(entry) => onAddJournal(flyoutTrip.id, entry)} backLabel="Back to map" /></div>
      </aside>
    </div>}
  </section>
}
