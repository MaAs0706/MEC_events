import React, { useEffect, useState } from 'react'
import {
  Link,
  useNavigate
} from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../services/api'
import { signOut } from '../services/auth'
import {
  ShieldCheck,
  Clock3,
  CheckCircle2,
  XCircle,
  LogOut
} from 'lucide-react'

import './ApproverDashboard.css'

function ApproverDashboard() {

  const navigate = useNavigate()

  const [activeTab, setActiveTab] =
    useState('pending')

  const [selectedEvent, setSelectedEvent] =
    useState(null)

  const [feedbackText, setFeedbackText] =
    useState('')

  const [error, setError] =
    useState('')

  const [pendingEvents, setPendingEvents] =
  useState([])

  const [approvedEvents, setApprovedEvents] =
  useState([])

const [rejectedEvents, setRejectedEvents] =
  useState([])

  useEffect(() => {

    const fetchReviewEvents = async () => {

      try {
        const [
          pendingResponse,
          approvedResponse
        ] = await Promise.all([
          api.get('/events/pending'),
          api.get('/events')
        ])

        setPendingEvents(pendingResponse.data)
        setApprovedEvents(approvedResponse.data)
      }
      catch {
        setError('Unable to load review queue')
      }

    }

    fetchReviewEvents()

  }, [])

  const handleApprove = async (eventId) => {

    const event = pendingEvents.find(
      (e) => e.id === eventId
    )

    if (event) {

      try {
        const response = await api.patch(
          `/events/${eventId}/approve`
        )

        setApprovedEvents([
          response.data,
          ...approvedEvents
        ])

        setPendingEvents(
          pendingEvents.filter(
            (e) => e.id !== eventId
          )
        )

      setSelectedEvent(null)
      }
      catch {
        setError('Unable to approve event')
      }

    }

  }
  

  const handleReject = async (eventId) => {

    const event = pendingEvents.find(
      (e) => e.id === eventId
    )

    if (
      event &&
      feedbackText.trim()
    ) {

      try {
        const response = await api.patch(
          `/events/${eventId}/reject`,
          {
            rejection_reason: feedbackText
          }
        )

        setRejectedEvents([
          {
            ...response.data,
            feedback: response.data.rejection_reason
          },
          ...rejectedEvents
        ])

        setPendingEvents(
          pendingEvents.filter(
            (e) => e.id !== eventId
          )
        )

      setFeedbackText('')
      setSelectedEvent(null)
      }
      catch {
        setError('Unable to reject event')
      }

    }

  }

  return (
    

    <div className="approver-container">

      {/* NAV */}

      <nav className="approver-nav">

        <div className="nav-left">

          <Link
            to="/"
            className="logo"
          >
            NEXUS.
          </Link>

          <span className="nav-divider"></span>

          <p>
            MODERATION CENTER
          </p>

        </div>

        <div className="nav-right">

          <button className="approver-user">
            Approver
          </button>

          <button
            className="signout-btn"
            onClick={() =>
              signOut(navigate)
            }
          >
            <LogOut size={16} />
            Sign out
          </button>

        </div>

      </nav>

      {/* HERO */}

      <section className="approver-hero">

        <div>

          <p className="hero-label">
            EVENT REVIEW SYSTEM
          </p>

          <h1>
            Event Approval Queue
          </h1>

        </div>

        <div className="hero-stats">

          <div className="hero-stat">

            <Clock3 size={18} />

            <div>

              <span>PENDING</span>

              <h2>
                {pendingEvents.length}
              </h2>

            </div>

          </div>

          <div className="hero-stat">

            <CheckCircle2 size={18} />

            <div>

              <span>APPROVED</span>

              <h2>
                {approvedEvents.length}
              </h2>

            </div>

          </div>

          <div className="hero-stat">

            <XCircle size={18} />

            <div>

              <span>REJECTED</span>

              <h2>
                {rejectedEvents.length}
              </h2>

            </div>

          </div>

        </div>

      </section>

      {/* MAIN */}

      <div className="approver-layout">

        {/* LEFT */}

        <aside className="review-sidebar">

          <button
            className={`review-tab ${
              activeTab === 'pending'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab('pending')
            }
          >
            Pending Queue
          </button>

          <button
            className={`review-tab ${
              activeTab === 'approved'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab('approved')
            }
          >
            Approved
          </button>

          <button
            className={`review-tab ${
              activeTab === 'rejected'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab('rejected')
            }
          >
            Rejected
          </button>

        </aside>

        {/* CENTER */}

        <main className="review-main">

          {error && (
            <p className="review-error">
              {error}
            </p>
          )}

          {activeTab === 'pending' && (

            <div className="review-grid">

              {pendingEvents.map(
                (event, index) => (

                  <motion.div
                    key={event.id}
                    className={`review-card ${
                      selectedEvent?.id ===
                      event.id
                        ? 'selected'
                        : ''
                    }`}
                    initial={{
                      opacity: 0,
                      y: 20
                    }}
                    animate={{
                      opacity: 1,
                      y: 0
                    }}
                    transition={{
                      delay: index * 0.08
                    }}
                    onClick={() =>
                      setSelectedEvent(event)
                    }
                  >

                    <div
                      className="event-image"
                      style={{
                        backgroundImage:
                          `url(${event.image})`
                      }}
                    >

                      <div className="image-overlay"></div>

                    </div>

                    <div className="review-content">

                      <div className="review-top">

                        <span className="priority">
                          {event.priority}
                        </span>

                        <span className="capacity">
                          {event.capacity} Seats
                        </span>

                      </div>

                      <Link to={`/events/${event.id}`} className="event-title-link">
                        <h3>
                          {event.title}
                        </h3>
                      </Link>

                      <p className="coordinator">
                        by {event.organizer}
                      </p>
                      

                      <div className="review-meta">

                        <span>
                          {event.venue}
                        </span>

                        <span>
                          {
                            new Date(
                              event.date
                            ).toLocaleDateString()
                          }
                        </span>

                      </div>

                    </div>

                  </motion.div>

                )
              )}

            </div>

          )}
          {activeTab === 'approved' && (

    <div className="review-grid">

      {approvedEvents.map(
        (event, index) => (

          <motion.div
            key={event.id}
            className={`review-card ${
              selectedEvent?.id ===
              event.id
                ? 'selected'
                : ''
              }`}
              onClick={() =>
                setSelectedEvent(event)
            }
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
          >

            <div className="review-content">

              <span className="approved-badge">
                APPROVED
              </span>

              <h3>
                {event.title}
              </h3>

              <p>
                {event.organizer}
              </p>

            </div>

          </motion.div>

        )
      )}

    </div>

  )}

  {/* REJECTED */}

  {activeTab === 'rejected' && (

    <div className="review-grid">

      {rejectedEvents.map(
        (event, index) => (

          <motion.div
            key={event.id}
            className={`review-card ${
              selectedEvent?.id ===
              event.id
                ? 'selected'
                : ''
              }`}
              onClick={() =>
                setSelectedEvent(event)
            }
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
          >

            <div className="review-content">

              <span className="rejected-badge">
                REJECTED
              </span>

              <h3>
                {event.title}
              </h3>

              <p>
                {event.organizer}
              </p>

            </div>

          </motion.div>

        )
      )}

    </div>

  )}

        </main>

        {/* RIGHT PANEL */}

        <aside className="inspection-panel">
          

          {selectedEvent ? (

            <div className="inspection-card">

              <div
                className="inspection-image"
                style={{
                  backgroundImage:
                    `url(${selectedEvent.image})`
                }}
              ></div>

              <div className="inspection-content">

                <span
                  className={`inspection-tag ${
                    selectedEvent.status

                  }`}
                >
                  {selectedEvent.status?.toUpperCase()}
                </span>

                <h2>
                  {selectedEvent.title}
                </h2>

                <p>
                  {
                    selectedEvent.description
                  }
                </p>

                <div className="inspection-details">

  <div>
    <span>
      Organizer
    </span>

    <strong>
      {selectedEvent.organizer}
    </strong>
  </div>

  <div>
    <span>
      Venue
    </span>

    <strong>
      {selectedEvent.venue}
    </strong>
  </div>

  <div>
    <span>
      Date
    </span>

    <strong>
      {selectedEvent.date}
    </strong>
  </div>

  <div>
    <span>
      Capacity
    </span>

    <strong>
      {selectedEvent.capacity}
    </strong>
  </div>

</div>
                <textarea
                  placeholder="Add rejection feedback..."
                  value={feedbackText}
                  onChange={(e) =>
                    setFeedbackText(
                      e.target.value
                    )
                  }
                />

                <div className="inspection-actions">
                  <Link
                     to={`/events/${selectedEvent.id}`}
                     className="details-btn"
                  >
                     View Full Details →
                   </Link>

                  <button
                    className="approve-btn"
                    onClick={() =>
                      handleApprove(
                        selectedEvent.id
                      )
                    }
                  >
                    Approve
                  </button>

                  <button
                    className="reject-btn"
                    onClick={() =>
                      handleReject(
                        selectedEvent.id
                      )
                    }
                  >
                    Reject
                  </button>

                </div>

              </div>

            </div>

          ) : (

            <div className="empty-inspection">

              <ShieldCheck size={48} />

              <h3>
                Select an event
              </h3>

              <p>
                Choose an event from the
                moderation queue to begin
                review.
              </p>

            </div>

          )}

        </aside>

      </div>

    </div>

  )
}

export default ApproverDashboard
