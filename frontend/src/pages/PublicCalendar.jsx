import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { isPublicCacheFresh, readPublicCache, writePublicCache } from '../services/publicCache'
import './PublicCalendar.css'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function localIsoDate(date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function monthName(date) {
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

function CalendarGrid({ monthDate, selectedDate, onSelectDate, dayContent, getDayClass }) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(firstWeekday).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)]

  return (
    <div className="public-calendar-grid" role="grid" aria-label={`${monthName(monthDate)} calendar`}>
      {DAY_NAMES.map((day) => <span key={day} className="public-calendar-weekday">{day}</span>)}
      {cells.map((day, index) => {
        if (!day) return <span className="public-calendar-empty" key={`empty-${index}`} />
        const date = new Date(year, month, day)
        const isoDate = localIsoDate(date)
        const isSelected = selectedDate === isoDate
        const isToday = localIsoDate(new Date()) === isoDate
        return (
          <button
            type="button"
            key={isoDate}
            onClick={() => onSelectDate(isoDate)}
            className={`public-calendar-day ${isSelected ? 'selected' : ''} ${isToday ? 'today' : ''} ${getDayClass?.(isoDate) || ''}`}
          >
            <span>{day}</span>
            {dayContent?.(isoDate)}
          </button>
        )
      })}
    </div>
  )
}

function PublicCalendar() {
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(localIsoDate(new Date()))
  const [events, setEvents] = useState(() => readPublicCache(`calendar-events:${monthKey(new Date())}`)?.data || [])
  const [venues, setVenues] = useState(() => readPublicCache('venues')?.data || [])
  const [selectedVenue, setSelectedVenue] = useState('')
  const [venueCalendar, setVenueCalendar] = useState({ days: [] })
  const [loading, setLoading] = useState(() => !readPublicCache(`calendar-events:${monthKey(new Date())}`))
  const [error, setError] = useState('')

  const visibleMonth = useMemo(() => {
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() + monthOffset)
    return date
  }, [monthOffset])
  const visibleMonthKey = monthKey(visibleMonth)

  useEffect(() => {
    let active = true
    const cacheKey = `calendar-events:${visibleMonthKey}`
    const cachedEvents = readPublicCache(cacheKey)

    if (cachedEvents) {
      setEvents(cachedEvents.data)
      setLoading(false)
      if (isPublicCacheFresh(cachedEvents)) return () => { active = false }
    } else {
      setLoading(true)
    }

    setError('')
    api.get(`/events/public-calendar?month=${visibleMonthKey}`)
      .then((response) => {
        writePublicCache(cacheKey, response.data)
        if (active) setEvents(response.data)
      })
      .catch(() => !cachedEvents && active && setError('The event calendar is unavailable right now. Please try again shortly.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [visibleMonthKey])

  useEffect(() => {
    let active = true
    const cachedVenues = readPublicCache('venues')

    if (cachedVenues) {
      setVenues(cachedVenues.data)
      setSelectedVenue((current) => current || cachedVenues.data[0]?.name || '')
      if (isPublicCacheFresh(cachedVenues)) return () => { active = false }
    }

    api.get('/venues')
      .then((response) => {
        if (!active) return
        writePublicCache('venues', response.data)
        setVenues(response.data)
        setSelectedVenue((current) => current || response.data[0]?.name || '')
      })
      .catch(() => active && setError('Venue information is unavailable right now.'))
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!selectedVenue) return
    let active = true
    const cacheKey = `venue-calendar:${selectedVenue}:${visibleMonthKey}`
    const cachedVenueCalendar = readPublicCache(cacheKey)

    if (cachedVenueCalendar) {
      setVenueCalendar(cachedVenueCalendar.data)
      if (isPublicCacheFresh(cachedVenueCalendar)) return () => { active = false }
    }

    api.get(`/events/public-venue-calendar?venue=${encodeURIComponent(selectedVenue)}&month=${visibleMonthKey}`)
      .then((response) => {
        writePublicCache(cacheKey, response.data)
        if (active) setVenueCalendar(response.data)
      })
      .catch(() => !cachedVenueCalendar && active && setVenueCalendar({ days: [] }))
    return () => { active = false }
  }, [selectedVenue, visibleMonthKey])

  const eventsByDate = useMemo(() => events.reduce((grouped, event) => {
    grouped[event.date] = [...(grouped[event.date] || []), event]
    return grouped
  }, {}), [events])
  const venueDaysByDate = useMemo(() => venueCalendar.days.reduce((grouped, day) => {
    grouped[day.date] = day
    return grouped
  }, {}), [venueCalendar.days])
  const selectedEvents = eventsByDate[selectedDate] || []
  const selectedVenueDay = venueDaysByDate[selectedDate]

  const selectMonth = (offset) => {
    setMonthOffset(offset)
    const date = new Date()
    date.setDate(1)
    date.setMonth(date.getMonth() + offset)
    setSelectedDate(localIsoDate(date))
  }

  return (
    <main className="public-calendar-page">
      <nav className="public-calendar-nav">
        <Link
          to="/"
          className="public-calendar-logo"
          aria-label="Back to NEXUS home"
        >
          <span className="public-calendar-back-arrow" aria-hidden="true">←</span>
          NEXUS.
        </Link>
        <div>
          <Link to="/events" className="public-calendar-nav-link">Explore events</Link>
          <Link to="/events/past" className="public-calendar-nav-link">Past events</Link>
          <Link to="/login" className="public-calendar-join">Join NEXUS</Link>
        </div>
      </nav>

      <header className="public-calendar-header">
        <span>CAMPUS SCHEDULE</span>
        <h1>Plan your<br />campus day.</h1>
        <p>Browse approved events and check when each campus venue is occupied.</p>
      </header>

      <div className="public-calendar-switcher" aria-label="Calendar month">
        {[0, 1].map((offset) => (
          <button key={offset} type="button" onClick={() => selectMonth(offset)} className={monthOffset === offset ? 'active' : ''}>
            {offset === 0 ? 'This month' : 'Next month'}
          </button>
        ))}
      </div>

      {error && <p className="public-calendar-state">{error}</p>}
      <section className="public-calendar-section">
        <div className="public-calendar-section-heading">
          <span>EVENT CALENDAR</span>
          <h2>{monthName(visibleMonth)}</h2>
          <p>Dates with a red marker have approved events. Select a date to see what is happening.</p>
        </div>
        <div className="public-calendar-layout">
          <article className="public-calendar-card">
            {loading ? <p className="public-calendar-state">Loading calendar…</p> : (
              <CalendarGrid
                monthDate={visibleMonth}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                getDayClass={(date) => eventsByDate[date]?.length ? 'has-events' : ''}
                dayContent={(date) => eventsByDate[date]?.length ? <i>{eventsByDate[date].length}</i> : null}
              />
            )}
            <p className="public-calendar-legend"><b /> Approved event scheduled</p>
          </article>
          <article className="public-calendar-details">
            <span>SELECTED DATE</span>
            <h3>{new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
            {selectedEvents.length ? selectedEvents.map((event) => (
              <Link className="public-calendar-event" to={`/events/${event.event_id}`} key={`${event.event_id}-${event.venue}-${event.start_time}`}>
                <strong>{event.title}</strong>
                <small>{event.start_time}–{event.end_time} · {event.venue}</small>
                <em>{event.category}</em>
              </Link>
            )) : <p className="public-calendar-empty-copy">No approved events are scheduled for this date.</p>}
          </article>
        </div>
      </section>

      <section className="public-calendar-section venue-calendar-section">
        <div className="public-calendar-section-heading venue-heading-row">
          <div><span>VENUE OCCUPATION</span><h2>When is a hall free?</h2></div>
          <label>Venue<select value={selectedVenue} onChange={(event) => setSelectedVenue(event.target.value)}>{venues.map((venue) => <option value={venue.name} key={venue.id}>{venue.name}</option>)}</select></label>
        </div>
        <div className="public-calendar-layout">
          <article className="public-calendar-card venue-calendar-card">
            <CalendarGrid
              monthDate={visibleMonth}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              getDayClass={(date) => venueDaysByDate[date] ? 'occupied' : ''}
              dayContent={(date) => venueDaysByDate[date] ? <i style={{ opacity: Math.max(.35, venueDaysByDate[date].load) }} /> : null}
            />
            <p className="public-calendar-legend"><b /> Lighter red: partly occupied · Darker red: more occupied</p>
          </article>
          <article className="public-calendar-details venue-details">
            <span>{selectedVenue || 'SELECT A VENUE'}</span>
            <h3>{selectedVenueDay ? `${Math.round(selectedVenueDay.load * 100)}% occupied` : 'Available all day'}</h3>
            <p className="public-calendar-date-label">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            {selectedVenueDay?.bookings?.length ? selectedVenueDay.bookings.map((booking) => (
              <Link className="public-calendar-event" to={`/events/${booking.event_id}`} key={`${booking.event_id}-${booking.start_time}`}>
                <strong>{booking.start_time}–{booking.end_time}</strong>
                <small>{booking.title}</small>
              </Link>
            )) : <p className="public-calendar-empty-copy">This venue has no approved event bookings on this date.</p>}
          </article>
        </div>
      </section>
    </main>
  )
}

export default PublicCalendar
