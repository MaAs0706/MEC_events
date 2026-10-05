import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { isPublicCacheFresh, readPublicCache, writePublicCache } from '../services/publicCache'
import './PastEvents.css'

const PAST_EVENTS_CACHE_KEY = 'past-events'

function PastEvents() {
  const [events, setEvents] = useState(() => readPublicCache(PAST_EVENTS_CACHE_KEY)?.data || [])
  const [loading, setLoading] = useState(() => !readPublicCache(PAST_EVENTS_CACHE_KEY))
  const [error, setError] = useState('')

  useEffect(() => {
    const cachedEvents = readPublicCache(PAST_EVENTS_CACHE_KEY)
    if (cachedEvents) {
      setEvents(cachedEvents.data)
      setLoading(false)
      if (isPublicCacheFresh(cachedEvents)) return undefined
    }

    let active = true
    api.get('/events/past')
      .then((response) => {
        writePublicCache(PAST_EVENTS_CACHE_KEY, response.data)
        if (active) setEvents(response.data)
      })
      .catch(() => !cachedEvents && active && setError('Past events are unavailable right now.'))
      .finally(() => active && setLoading(false))

    return () => { active = false }
  }, [])

  return (
    <main className="past-events-page">
      <nav className="past-events-nav">
        <Link to="/" className="past-events-logo">NEXUS.</Link>
        <Link to="/" className="past-events-back">← Back to home</Link>
      </nav>

      <header className="past-events-header">
        <span>THE ARCHIVE</span>
        <h1>Past events</h1>
        <p>Moments, communities and campus stories that have already happened.</p>
      </header>

      {loading && <p className="past-events-state">Loading the archive…</p>}
      {!loading && error && <p className="past-events-state">{error}</p>}
      {!loading && !error && events.length === 0 && (
        <p className="past-events-state">No past events have been published yet.</p>
      )}

      <section className="past-events-grid">
        {events.map((event) => (
          <Link key={event.id} to={`/events/${event.id}`} className="past-event-card">
            <div
              className="past-event-image"
              style={event.image ? { backgroundImage: `url(${event.image})` } : undefined}
            />
            <div className="past-event-content">
              <span>{event.category}</span>
              <h2>{event.title}</h2>
              <p>{new Date(`${event.date}T00:00:00`).toLocaleDateString()} · {event.venue}</p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  )
}

export default PastEvents
