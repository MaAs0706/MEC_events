import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Mail, Phone, Users } from 'lucide-react'
import api from '../services/api'
import './EventAttendees.css'

function EventAttendees() {
  const { id } = useParams()
  const [event, setEvent] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([api.get(`/events/${id}`), api.get(`/events/${id}/attendees`)])
      .then(([eventResponse, attendeesResponse]) => {
        setEvent(eventResponse.data)
        setAttendees(attendeesResponse.data)
      })
      .catch((requestError) => {
        setError(requestError.response?.data?.detail || 'Unable to load the attendee list.')
      })
      .finally(() => setLoading(false))
  }, [id])

  return (
    <main className="attendees-page">
      <nav className="attendees-nav">
        <Link to="/dashboard/coordinator" className="attendees-logo">NEXUS.</Link>
        <Link to="/dashboard/coordinator" className="attendees-back">← Back to my events</Link>
      </nav>

      {loading && <p className="attendees-state">Loading attendee list…</p>}
      {!loading && error && <p className="attendees-state">{error}</p>}
      {!loading && !error && event && (
        <>
          <header className="attendees-header">
            <span><Users size={14} /> EVENT REGISTRATIONS</span>
            <h1>{event.title}</h1>
            <p>{event.attendees} of {event.capacity} places registered · {event.venue}</p>
          </header>

          <section className="attendees-table-wrap">
            <div className="attendees-table-heading">
              <h2>Participants</h2>
              <span>{attendees.length} registered</span>
            </div>

            {attendees.length ? (
              <div className="attendees-table" role="table" aria-label="Event attendees">
                <div className="attendees-row attendees-row-labels" role="row">
                  <span>#</span><span>Student</span><span>Class / year</span><span>Contact</span>
                </div>
                {attendees.map((attendee, index) => (
                  <div className="attendees-row" role="row" key={attendee.id}>
                    <span className="attendee-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="attendee-name">{attendee.full_name}</span>
                    <span>{attendee.class_name || 'Not provided'}</span>
                    <span className="attendee-contact">
                      <a href={`mailto:${attendee.email}`}><Mail size={14} />{attendee.email}</a>
                      {attendee.phone && <a href={`tel:${attendee.phone}`}><Phone size={14} />{attendee.phone}</a>}
                    </span>
                  </div>
                ))}
              </div>
            ) : <p className="attendees-empty">No students have registered for this event yet.</p>}
          </section>
        </>
      )}
    </main>
  )
}

export default EventAttendees
