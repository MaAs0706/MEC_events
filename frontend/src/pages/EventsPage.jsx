import React, { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { isPublicCacheFresh, readPublicCache, writePublicCache } from '../services/publicCache'
import './EventsPage.css'

const PUBLIC_EVENTS_CACHE_KEY = 'events'

function EventCard({ event }) {
  return (
    <Link to={`/events/${event.id}`} className="public-event-card">
      <div
        className={`public-event-image ${event.image ? '' : 'public-event-image-fallback'}`}
        style={event.image ? { backgroundImage: `url(${event.image})` } : undefined}
      />
      <div className="public-event-content">
        <span>{event.category}</span>
        <h2>{event.title}</h2>
        <p>{new Date(`${event.date}T00:00:00`).toLocaleDateString()} · {event.venue}</p>
      </div>
    </Link>
  )
}

function EventsPage() {
  const [searchParams] = useSearchParams()
  const [events, setEvents] = useState(() => readPublicCache(PUBLIC_EVENTS_CACHE_KEY)?.data || [])
  const [loading, setLoading] = useState(() => !readPublicCache(PUBLIC_EVENTS_CACHE_KEY))
  const [error, setError] = useState('')

  useEffect(() => {
    const cachedEvents = readPublicCache(PUBLIC_EVENTS_CACHE_KEY)
    if (cachedEvents) {
      setEvents(cachedEvents.data)
      setLoading(false)
      if (isPublicCacheFresh(cachedEvents)) return undefined
    }

    let active = true
    api.get('/events')
      .then((response) => {
        writePublicCache(PUBLIC_EVENTS_CACHE_KEY, response.data)
        if (active) setEvents(response.data)
      })
      .catch(() => !cachedEvents && active && setError('Events are unavailable right now. Please try again shortly.'))
      .finally(() => active && setLoading(false))

    return () => { active = false }
  }, [])

  const searchTerm = (searchParams.get('search') || '').trim().toLocaleLowerCase()

  const { upcoming, past } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const matchingEvents = events.filter((event) => {
      if (!searchTerm) return true
      return [event.title, event.category, event.venue, event.organizer, event.description]
        .filter(Boolean)
        .some((value) => value.toLocaleLowerCase().includes(searchTerm))
    })

    const sortedEvents = [...matchingEvents].sort(
      (first, second) => new Date(`${first.date}T00:00:00`) - new Date(`${second.date}T00:00:00`)
    )

    return {
      upcoming: sortedEvents.filter((event) => new Date(`${event.date}T00:00:00`) >= today),
      past: sortedEvents.filter((event) => new Date(`${event.date}T00:00:00`) < today).reverse(),
    }
  }, [events, searchTerm])

  return (
    <main className="public-events-page">
      <nav className="public-events-nav">
        <Link to="/" className="public-events-logo">NEXUS.</Link>
        <div>
          <Link to="/calendar" className="public-events-archive">Calendar</Link>
          <Link to="/events/past" className="public-events-archive">Past events</Link>
          <Link to="/login" className="public-events-join">Join NEXUS</Link>
        </div>
      </nav>

      <header className="public-events-header">
        <span>EXPLORE CAMPUS</span>
        <h1>Every event.<br />One place.</h1>
        <p>
          {searchTerm
            ? `Showing approved events matching “${searchParams.get('search').trim()}”.`
            : 'Browse what is coming up and revisit the events that brought campus together.'}
        </p>
      </header>

      {loading && <p className="public-events-state">Loading events…</p>}
      {!loading && error && <p className="public-events-state">{error}</p>}
      {!loading && !error && (
        <>
          <section className="public-events-section">
            <div className="public-events-section-heading">
              <span>HAPPENING NEXT</span>
              <h2>Upcoming events</h2>
            </div>
            {upcoming.length ? (
              <div className="public-events-grid">{upcoming.map((event) => <EventCard event={event} key={event.id} />)}</div>
            ) : <p className="public-events-state">{searchTerm ? 'No upcoming events match your search.' : 'No upcoming events have been published yet.'}</p>}
          </section>

          <section className="public-events-section public-events-archive-section">
            <div className="public-events-section-heading">
              <span>THE ARCHIVE</span>
              <h2>Past events</h2>
            </div>
            {past.length ? (
              <div className="public-events-grid">{past.map((event) => <EventCard event={event} key={event.id} />)}</div>
            ) : <p className="public-events-state">{searchTerm ? 'No past events match your search.' : 'No past events have been published yet.'}</p>}
          </section>
        </>
      )}
    </main>
  )
}

export default EventsPage
