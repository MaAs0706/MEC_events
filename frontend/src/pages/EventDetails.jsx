import React, { useEffect, useState } from 'react'
import {
  Link,
  useNavigate,
  useParams
} from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../services/api'
import './EventDetails.css'

function EventDetails() {

  const { id } = useParams()
  const navigate = useNavigate()

  const [isRsvped, setIsRsvped] =
    useState(false)

  const [event, setEvent] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [registrationMessage, setRegistrationMessage] =
    useState('')

  const [reviewMessage, setReviewMessage] =
    useState('')

  const [rejectionReason, setRejectionReason] =
    useState('')

  const role =
    localStorage.getItem('userRole')

  const dashboardRoutes = {

    student:
      '/dashboard/student',

    coordinator:
      '/dashboard/coordinator',

    approver:
      '/dashboard/approver',

    admin:
      '/dashboard/admin'

  }

  useEffect(() => {

    const fetchEvent = async () => {

      try {
        const response =
          await api.get(`/events/${id}`)

        setEvent(response.data)

        if (role === 'student') {
          const statusResponse =
            await api.get(
              `/events/${id}/registration-status`
            )

          setIsRsvped(statusResponse.data.registered)
        }
      }
      catch {
        setEvent(null)
      }
      finally {
        setLoading(false)
      }

    }

    fetchEvent()

  }, [id, role])

  const handleRegister = async () => {

    setRegistrationMessage('')

    try {
      const response =
        await api.post(`/events/${id}/register`)

      setEvent(response.data.event)
      setIsRsvped(true)
      setRegistrationMessage('Registration confirmed')
    }
    catch (error) {
      setRegistrationMessage(
        error.response?.data?.detail ||
        'Unable to register for this event'
      )
    }

  }

  const handleApprove = async () => {

    setReviewMessage('')

    try {
      const response =
        await api.patch(`/events/${id}/approve`)

      setEvent(response.data)
      setReviewMessage('Event approved successfully')
    }
    catch (error) {
      setReviewMessage(
        error.response?.data?.detail ||
        'Unable to approve event'
      )
    }

  }

  const handleReject = async () => {

    setReviewMessage('')

    if (!rejectionReason.trim()) {
      setReviewMessage(
        'Please add a rejection reason before rejecting.'
      )
      return
    }

    try {
      const response =
        await api.patch(
          `/events/${id}/reject`,
          {
            rejection_reason: rejectionReason
          }
        )

      setEvent(response.data)
      setRejectionReason('')
      setReviewMessage('Event rejected successfully')
    }
    catch (error) {
      setReviewMessage(
        error.response?.data?.detail ||
        'Unable to reject event'
      )
    }

  }

  const goBackToDashboard = () => {

    navigate(
      dashboardRoutes[role] || '/'
    )

  }

  const goBack = () => {

    if (role) {
      goBackToDashboard()
    }
    else {
      navigate('/')
    }

  }

  if (loading) {

    return (
      <div className="event-loader-page">

        <Link to="/" className="state-back-link">
          ← Back
        </Link>

        <div className="nexus-loader">

          <div className="loader-mark">
            N
          </div>

          <p>NEXUS</p>

          <div className="loader-bar">
            <span />
          </div>

          <small>Fetching event...</small>

        </div>

        <div className="event-skeleton" aria-hidden="true">

          <div className="skeleton-hero" />

          <div className="skeleton-body">

            <div className="skeleton-line w40" />
            <div className="skeleton-line w90" />
            <div className="skeleton-line w75" />

            <div className="skeleton-block" />

            <div className="skeleton-line w50" />
            <div className="skeleton-line w80" />

          </div>

        </div>

      </div>
    )

  }

  if (!event) {

    return (

      <div className="event-state-page">

        <Link to="/" className="state-back-link">
          ← Back
        </Link>

        <h1>
          Event Not Found
        </h1>

        <Link to="/" className="state-action-link">
          Go Home
        </Link>

      </div>

    )

  }

  return (

    <div className="event-details-container">

      {/* HERO */}

<section className="event-hero">

  <div className="hero-background">

    {event.image ? (
      <img
        src={event.image}
        alt={event.title}
        onError={(e) => {
          e.target.style.display = 'none'
        }}
      />
    ) : (
      <div className="hero-placeholder" />
    )}

  </div>

  <div className="hero-overlay">

    <div className="hero-left">

      <span className="hero-category">
        {event.category}
      </span>

      <h1>
        {event.title}
      </h1>

      <p className="hero-organizer">
        Organized by {event.organizer}
      </p>

      <div className="hero-meta">

        <div className="hero-meta-item">
          <span>📅</span>
          <div>
            <small>Date</small>
            <strong>
              {new Date(event.date)
                .toLocaleDateString()}
            </strong>
          </div>
        </div>

        <div className="hero-meta-item">
          <span>🕐</span>
          <div>
            <small>Time</small>
            <strong>
              {event.start_time && event.end_time
                ? `${event.start_time} - ${event.end_time}`
                : 'Time TBA'}
            </strong>
          </div>
        </div>

        <div className="hero-meta-item">
          <span>📍</span>
          <div>
            <small>Venue</small>
            <strong>
              {event.venue}
            </strong>
          </div>
        </div>

      </div>

    </div>

    <div className="hero-right">

      <div className="hero-status-card">

        <div
          className={`status-pill ${event.status}`}
        >
          {event.status}
        </div>

        <h3>
          Registrations
        </h3>

        <div className="registration-count">
          {event.attendees}
          <span>
            /{event.capacity}
          </span>
        </div>

        {role === 'student' && (

          <button
            className="hero-action-btn"
            onClick={handleRegister}
            disabled={isRsvped}
          >

            {isRsvped
              ? "✓ Registered"
              : "Register Now"}

          </button>

        )}

        {registrationMessage && (
          <p className="registration-message">
            {registrationMessage}
          </p>
        )}

        {role === 'coordinator' && (

          <button
            className="hero-action-btn"
          >
            Download Letter
          </button>

        )}

        {['approver', 'admin'].includes(role) &&
          event.status === 'pending' && (

          <div className="approver-actions">

            <button
              className="approve-btn"
              onClick={handleApprove}
            >
              Approve
            </button>

            <button
              className="reject-btn"
              onClick={handleReject}
            >
              Reject
            </button>

          </div>

        )}

        {['approver', 'admin'].includes(role) &&
          event.status === 'pending' && (

          <textarea
            className="review-textarea"
            placeholder="Reason for rejection..."
            value={rejectionReason}
            onChange={(e) =>
              setRejectionReason(e.target.value)
            }
          />

        )}

        {reviewMessage && (
          <p className="registration-message">
            {reviewMessage}
          </p>
        )}

        <button
          className="action-btn subtle"
          onClick={goBack}
        >
          ← Back
        </button>

      </div>

    </div>

  </div>

</section>

        <div
          className="event-details-grid"
        >

          {/* MAIN */}

          <main
            className="event-main"
          >

            <section
              className="description-section"
            >

              <h2>
                About This Event
              </h2>

              <p>
                {
                  event.description
                }
              </p>

            </section>

            <section
              className="details-section"
            >

              <h2>
                Event Details
              </h2>

              <div
                className="details-grid"
              >

                <div
                  className="detail-item"
                >
                  <span className="detail-label">
                    📅 DATE
                  </span>

                  <span className="detail-value">

                    {
                      new Date(
                        event.date
                      )
                      .toLocaleDateString()
                    }

                  </span>
                </div>

                <div
                  className="detail-item"
                >

                  <span className="detail-label">
                    🕐 TIME
                  </span>

                  <span className="detail-value">
                    {event.start_time && event.end_time
                      ? `${event.start_time} - ${event.end_time}`
                      : 'Time TBA'}
                  </span>

                </div>

                <div
                  className="detail-item"
                >

                  <span className="detail-label">
                    📍 VENUE
                  </span>

                  <span className="detail-value">
                    {event.venue}
                  </span>

                </div>

                <div
                  className="detail-item"
                >

                  <span className="detail-label">
                    👥 CAPACITY
                  </span>

                  <span className="detail-value">

                    {event.attendees}/
                    {event.capacity}

                  </span>

                </div>

              </div>

            </section>

            {event.requirements && (

              <section
                className="requirements-section"
              >

                <h2>
                  Requirements
                </h2>

                <ul
                  className="requirements-list"
                >

                  {event.requirements.map(
                    (
                      req,
                      index
                    ) => (

                      <li
                        key={index}
                      >
                        ✓ {req}
                      </li>

                    )
                  )}

                </ul>

              </section>

            )}

            {event.agenda && (

              <section
                className="agenda-section"
              >

                <h2>
                  Event Schedule
                </h2>

                <div
                  className="timeline"
                >

                  {event.agenda.map(
                    (
                      item,
                      index
                    ) => (

                      <motion.div

                        key={index}

                        className="timeline-item"

                        initial={{
                          opacity: 0,
                          x: -20
                        }}

                        animate={{
                          opacity: 1,
                          x: 0
                        }}

                        transition={{
                          delay:
                            index *
                            0.05
                        }}

                      >

                        <div className="timeline-time">
                          {item.time}
                        </div>

                        <div className="timeline-event">
                          {item.event}
                        </div>

                      </motion.div>

                    )
                  )}

                </div>

              </section>

            )}

          </main>

          {/* SIDEBAR */}

          <aside
            className="event-sidebar"
          >

            {/* STUDENT */}

            {role ===
              'student' && (

              <div className="role-card">

                <h3>
                  Interested?
                </h3>

                <button

                  className={`btn-rsvp-large ${
                    isRsvped
                      ? 'rsvped'
                      : ''
                  }`}

                  onClick={() =>
                    handleRegister()
                  }
                  disabled={isRsvped}

                >

                  {isRsvped
                    ? "✓ YOU'RE GOING"
                    : 'REGISTER'}

                </button>

              </div>

            )}

            {/* COORDINATOR */}

            {role ===
              'coordinator' && (

              <div className="role-card">

                <h3>
                  Event Management
                </h3>

                <p>
                  Status:
                  {' '}
                  {event.status}
                </p>

                <p>
                  Registrations:
                  {' '}
                  {event.attendees}
                  /
                  {event.capacity}
                </p>

                <button
                  className="action-btn"
                >
                  Download Permission Letter
                </button>

              </div>

            )}

             <div
                 className="contact-card"
             >

  <div
    className={`status-badge ${event.status}`}
  >
    {event.status.toUpperCase()}
  </div>

  <h3>
    Organizer
  </h3>

  <p>
    {event.organizer}
  </p>

  <p>
    {event.contact}
  </p>

  <hr />

  <div className="approval-info">

    <span>
      Approved By
    </span>

    <strong>
      {event.status === 'approved' && event.approved_by_name
        ? event.approved_by_name
        : 'Not approved yet'}
    </strong>

  </div>

</div>
            
          </aside>

        </div>

      </div>

    

  )

}

export default EventDetails
