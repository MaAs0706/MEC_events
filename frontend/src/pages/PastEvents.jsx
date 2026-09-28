import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import './PastEvents.css'

function PastEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/events/past')
      .then((response) => setEvents(response.data))
      .catch(() => setError('Past events are unavailable right now.'))
      .finally(() => setLoading(false))
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
