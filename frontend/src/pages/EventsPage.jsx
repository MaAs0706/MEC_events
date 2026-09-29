import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import './EventsPage.css'

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
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/events')
      .then((response) => setEvents(response.data))
      .catch(() => setError('Events are unavailable right now. Please try again shortly.'))
      .finally(() => setLoading(false))
  }, [])

  const { upcoming, past } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sortedEvents = [...events].sort(
      (first, second) => new Date(`${first.date}T00:00:00`) - new Date(`${second.date}T00:00:00`)
    )

    return {
      upcoming: sortedEvents.filter((event) => new Date(`${event.date}T00:00:00`) >= today),
      past: sortedEvents.filter((event) => new Date(`${event.date}T00:00:00`) < today).reverse(),
    }
  }, [events])

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
        <p>Browse what is coming up and revisit the events that brought campus together.</p>
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
            ) : <p className="public-events-state">No upcoming events have been published yet.</p>}
          </section>

          <section className="public-events-section public-events-archive-section">
            <div className="public-events-section-heading">
              <span>THE ARCHIVE</span>
              <h2>Past events</h2>
            </div>
            {past.length ? (
              <div className="public-events-grid">{past.map((event) => <EventCard event={event} key={event.id} />)}</div>
            ) : <p className="public-events-state">No past events have been published yet.</p>}
          </section>
        </>
      )}
    </main>
  )
}

export default EventsPage
