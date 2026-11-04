import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Icon } from '../../components/Icon'
import type { DestinationSuggestion, TripCreateRequest } from '../../types/trip'
import { formatDate } from '../../utils/trip'

export function TripWizard({ onClose, onCreate }: { onClose: () => void; onCreate: (trip: TripCreateRequest) => Promise<void> }) {
  const [step, setStep] = useState(0)
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [people, setPeople] = useState(['You'])
  const [newPerson, setNewPerson] = useState('')
  const [preferences, setPreferences] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [destinationSuggestionsOpen, setDestinationSuggestionsOpen] = useState(false)
  const [activeDestinationSuggestion, setActiveDestinationSuggestion] = useState(-1)
  const [destinationSuggestions, setDestinationSuggestions] = useState<DestinationSuggestion[]>([])
  const [destinationSearchLoading, setDestinationSearchLoading] = useState(false)
  const [destinationSearchError, setDestinationSearchError] = useState(false)
  const [createError, setCreateError] = useState('')
  const [creating, setCreating] = useState(false)
  const preferenceOptions = ['Culture', 'Foodie', 'Outdoors', 'Slow travel', 'Family-friendly', 'Budget-conscious', 'Nightlife', 'Design']
  const stepNames = ['Where & when', 'Who’s coming', 'The little details']

  useEffect(() => {
    const query = destination.trim()
    if (!destinationSuggestionsOpen || query.length < 2) return

    const controller = new AbortController()
    const timer = window.setTimeout(() => {
      const url = new URL('https://photon.komoot.io/api/')
      url.searchParams.set('q', query)
      url.searchParams.set('limit', '6')
      url.searchParams.set('lang', 'en')

      fetch(url, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error(`Place search failed with status ${response.status}`)
          return response.json() as Promise<{ features: { properties: { name?: string; city?: string; state?: string; country?: string } }[] }>
        })
        .then(({ features }) => {
          if (controller.signal.aborted) return
          const suggestions = features.map(({ properties }) => {
            const name = properties.name || properties.city || properties.state || properties.country || 'Unknown place'
            const context = [properties.city, properties.state, properties.country]
              .filter((part): part is string => Boolean(part) && part !== name)
              .filter((part, index, parts) => parts.indexOf(part) === index)
            return { label: [name, ...context].join(', ') }
          })
          setDestinationSuggestions(suggestions)
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) return
          console.error('Unable to load destination suggestions.', error)
          setDestinationSearchError(true)
        })
        .finally(() => {
          if (!controller.signal.aborted) setDestinationSearchLoading(false)
        })
    }, 250)

    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [destination, destinationSuggestionsOpen])

  function selectDestination(value: string) {
    setDestination(value)
    setDestinationSuggestionsOpen(false)
    setActiveDestinationSuggestion(-1)
  }

  function handleDestinationKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!destinationSuggestionsOpen) return
    if (event.key === 'Escape') {
      setDestinationSuggestionsOpen(false)
      setActiveDestinationSuggestion(-1)
      return
    }
    if (destinationSuggestions.length === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveDestinationSuggestion((current) => (current + 1) % destinationSuggestions.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveDestinationSuggestion((current) => current <= 0 ? destinationSuggestions.length - 1 : current - 1)
    } else if (event.key === 'Enter' && activeDestinationSuggestion >= 0) {
      event.preventDefault()
      selectDestination(destinationSuggestions[activeDestinationSuggestion].label)
    }
  }

  function addPerson() {
    const name = newPerson.trim()
    if (!name || people.some((person) => person.toLowerCase() === name.toLowerCase())) return
    setPeople((current) => [...current, name])
    setNewPerson('')
  }

  function handlePersonKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      addPerson()
    }
  }

  function nextStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setConfirmed(true)
    window.setTimeout(() => {
      setConfirmed(false)
      setStep((current) => Math.min(2, current + 1))
    }, 350)
  }

  async function submitTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      await onCreate({ destination: destination.trim(), startDate, endDate, people, preferences, notes: notes.trim() })
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Unable to save this trip.')
    } finally {
      setCreating(false)
    }
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
              <label className="field-label">Where are you dreaming of?<span className="destination-field"><span className="input-with-icon"><Icon name="pin" size={18} /><input required autoFocus role="combobox" aria-autocomplete="list" aria-expanded={destinationSuggestionsOpen && destination.trim().length >= 2} aria-controls="destination-suggestions" aria-activedescendant={activeDestinationSuggestion >= 0 ? `destination-option-${activeDestinationSuggestion}` : undefined} placeholder="A city, a country, anywhere…" value={destination} onChange={(event) => { setDestination(event.target.value); setDestinationSuggestions([]); setDestinationSearchLoading(event.target.value.trim().length >= 2); setDestinationSearchError(false); setDestinationSuggestionsOpen(true); setActiveDestinationSuggestion(-1) }} onFocus={() => { setDestinationSuggestionsOpen(true); if (destination.trim().length >= 2) { setDestinationSuggestions([]); setDestinationSearchLoading(true); setDestinationSearchError(false) } }} onBlur={() => setDestinationSuggestionsOpen(false)} onKeyDown={handleDestinationKeyDown} /></span>{destinationSuggestionsOpen && destination.trim().length >= 2 && <div className="destination-suggestions"><div id="destination-suggestions" role="listbox">{destinationSuggestions.map((option, index) => <button type="button" role="option" aria-selected={index === activeDestinationSuggestion} id={`destination-option-${index}`} className={`destination-suggestion ${index === activeDestinationSuggestion ? 'active' : ''}`} key={`${option.label}-${index}`} onMouseDown={(event) => event.preventDefault()} onClick={() => selectDestination(option.label)}><Icon name="pin" size={14} />{option.label}</button>)}</div>{destinationSearchLoading && <div className="destination-search-status" role="status">Searching places…</div>}{!destinationSearchLoading && !destinationSearchError && destinationSuggestions.length === 0 && <div className="destination-search-status" role="status">No matching places found. You can enter it manually.</div>}{destinationSearchError && <div className="destination-search-status" role="status">Couldn’t load suggestions. You can still enter a destination.</div>}<div className="destination-attribution"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a> · Powered by Photon</div></div>}</span></label>
              <div className="date-fields"><label className="field-label">Leaving<input required type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label><label className="field-label">Coming back<input required type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label></div>
            </> : <>
              <div className="people-label"><div><strong>Your travelers</strong><span>Add the people you’ll be sharing this adventure with.</span></div><span className="traveler-count"><Icon name="users" size={15} /> {people.length}</span></div>
              <div className="traveler-list">{people.map((person, index) => <div className="traveler-row" key={person}><span className={`avatar avatar-${index % 4}`}>{person.slice(0, 1)}</span><span>{person}</span>{index === 0 ? <small>That’s you</small> : <button type="button" aria-label={`Remove ${person}`} className="remove-person" onClick={() => setPeople((current) => current.filter((name) => name !== person))}><Icon name="close" size={15} /></button>}</div>)}</div>
              <div className="add-person-row"><input aria-label="Traveler name" placeholder="Add someone by name" value={newPerson} onChange={(event) => setNewPerson(event.target.value)} onKeyDown={handlePersonKeyDown} /><button type="button" className="button button-soft" onClick={addPerson}><Icon name="plus" size={16} /> Add</button></div>
            </>}
            <div className="wizard-actions"><button type="button" className="button button-quiet" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}>Back</button><button className="button button-primary" type="submit">{confirmed ? <><Icon name="check" size={17} /> Noted</> : <>Confirm & continue <Icon name="arrow" size={16} /></>}</button></div>
          </form> : <form className="wizard-form preferences-form" onSubmit={submitTrip}>
            <fieldset className="preference-fieldset"><legend>What sounds like you?</legend><p>Pick as many as you like — or none at all.</p><div className="preference-options">{preferenceOptions.map((preference) => <button type="button" className={`preference-option ${preferences.includes(preference) ? 'selected' : ''}`} key={preference} onClick={() => setPreferences((current) => current.includes(preference) ? current.filter((item) => item !== preference) : [...current, preference])}>{preferences.includes(preference) && <Icon name="check" size={14} />}{preference}</button>)}</div></fieldset>
            <label className="field-label">Anything else on your mind?<textarea placeholder="A birthday dinner, a tiny hotel, absolutely no early mornings…" rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
            {createError && <p className="form-error" role="alert">Couldn’t save your trip: {createError}</p>}
            <div className="wizard-actions"><button type="button" className="button button-quiet" onClick={() => setStep(1)} disabled={creating}>Back</button><button className="button button-primary" type="submit" disabled={creating}>{creating ? 'Saving trip…' : <>Create my trip <Icon name="arrow" size={16} /></>}</button></div>
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
