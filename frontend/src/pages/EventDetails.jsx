import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import './EventDetails.css'

import { events } from '../data/events'

function EventDetails() {

  const { id } = useParams()

  const [isRsvped, setIsRsvped] =
    useState(false)

  const role =
    localStorage.getItem('role')

  const event =
    events.find(
      event =>
        event.id === Number(id)
    )

  if (!event) {

    return (

      <div className="event-not-found">

        <h1>
          Event Not Found
        </h1>

        <Link to="/">
          Go Home
        </Link>

      </div>

    )

  }

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

  return (

    <div className="event-details-container">

      {/* NAVBAR */}

      <nav className="event-nav">

        <div className="nav-content">

          <Link
            to="/"
            className="logo"
          >
            NEXUS.
          </Link>

          <h2>
            Event Details
          </h2>

          <Link
            to={
              dashboardRoutes[role]
            }
            className="back-btn"
          >
            ← Back
          </Link>

        </div>

      </nav>

      {/* CONTENT */}

      <div className="event-details-content">

        <motion.div
          className="event-header"
          initial={{
            opacity: 0,
            y: -20
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
        >

          <div
            className="event-image-large"
          >
            {event.image}
          </div>

          <div
            className="event-header-info"
          >

            <h1>
              {event.title}
            </h1>

            <p
              className="event-organizer"
            >
              by {event.organizer}
            </p>

            <div
              className="event-tags"
            >

              {event.tags?.map(
                (
                  tag,
                  index
                ) => (

                  <span
                    key={index}
                    className="tag"
                  >
                    #{tag}
                  </span>

                )
              )}

            </div>

          </div>

        </motion.div>

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
                    {event.time}
                    {' - '}
                    {event.endTime}
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
                    setIsRsvped(
                      !isRsvped
                    )
                  }

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

            {/* APPROVER */}

            {role ===
              'approver' && (

              <div className="role-card">

                <h3>
                  Review Request
                </h3>

                <button
                  className="approve-btn"
                >
                  Approve
                </button>

                <button
                  className="reject-btn"
                >
                  Reject
                </button>

              </div>

            )}

            {/* ADMIN */}

            {role ===
              'admin' && (

              <div className="role-card">

                <h3>
                  Admin Controls
                </h3>

                <button
                  className="action-btn"
                >
                  Edit Event
                </button>

                <button
                  className="delete-btn"
                >
                  Delete Event
                </button>

              </div>

            )}

            <div
              className="contact-card"
            >

              <h3>
                Organizer
              </h3>

              <p>
                {event.organizer}
              </p>

              <p>
                {event.contact}
              </p>

            </div>

          </aside>

        </div>

      </div>

    </div>

  )

}

export default EventDetails