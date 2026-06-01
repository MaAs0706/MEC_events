import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {events} from '../data/events'
import {
  ShieldCheck,
  Clock3,
  CheckCircle2,
  XCircle
} from 'lucide-react'

import './ApproverDashboard.css'

function ApproverDashboard() {

  const [activeTab, setActiveTab] =
    useState('pending')

  const [selectedEvent, setSelectedEvent] =
    useState(null)

  const [feedbackText, setFeedbackText] =
    useState('')

  const [pendingEvents, setPendingEvents] =
    useState([
      {
        id: 1,
        title: 'AI Workshop',
        coordinator: 'John Doe',
        date: '2026-04-28',
        venue: 'Tech Lab',
        capacity: 200,
        priority: 'HIGH',
        description:
          'Learn machine learning basics with hands-on coding.',
        image:
          'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1200&auto=format&fit=crop'
      },

      {
        id: 2,
        title: 'Spring Sports Meet',
        coordinator: 'Jane Smith',
        date: '2026-05-01',
        venue: 'Sports Complex',
        capacity: 500,
        priority: 'MEDIUM',
        description:
          'Inter-college sports championship.',
        image:
          'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1200&auto=format&fit=crop'
      }
    ])

  const [approvedEvents, setApprovedEvents] =
    useState([])

  const [rejectedEvents, setRejectedEvents] =
    useState([])

  const handleApprove = (eventId) => {

    const event = pendingEvents.find(
      (e) => e.id === eventId
    )

    if (event) {

      setApprovedEvents([
        ...approvedEvents,
        {
          ...event,
          status: 'approved'
        }
      ])

      setPendingEvents(
        pendingEvents.filter(
          (e) => e.id !== eventId
        )
      )

      setSelectedEvent(null)

    }

  }

  const handleReject = (eventId) => {

    const event = pendingEvents.find(
      (e) => e.id === eventId
    )

    if (
      event &&
      feedbackText.trim()
    ) {

      setRejectedEvents([
        ...rejectedEvents,
        {
          ...event,
          status: 'rejected',
          feedback: feedbackText
        }
      ])

      setPendingEvents(
        pendingEvents.filter(
          (e) => e.id !== eventId
        )
      )

      setFeedbackText('')
      setSelectedEvent(null)

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

                      <h3>
                        {event.title}
                      </h3>

                      <p className="coordinator">
                        by {event.coordinator}
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

                <span className="inspection-tag">
                  UNDER REVIEW
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
                      Coordinator
                    </span>

                    <strong>
                      {
                        selectedEvent.coordinator
                      }
                    </strong>

                  </div>

                  <div>
                    <span>
                      Venue
                    </span>

                    <strong>
                      {
                        selectedEvent.venue
                      }
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

