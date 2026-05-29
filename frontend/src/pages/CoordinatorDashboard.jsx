import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import {
  Calendar,
  Building2,
  FileText,
  Users,
  BarChart3,
  Download
} from 'lucide-react'

import './CoordinatorDashboard.css'

function CoordinatorDashboard() {

  const [activeTab, setActiveTab] =
    useState('calendar')

  const [selectedDate, setSelectedDate] =
    useState(24)

  const [selectedVenue, setSelectedVenue] =
    useState('Main Auditorium')

  const [showCreateForm, setShowCreateForm] =
    useState(false)

  const venues = [
    'Main Auditorium',
    'Seminar Hall',
    'Tech Lab',
    'Sports Complex'
  ]

  const bookedDates = {
    'Main Auditorium': [16, 22, 28],
    'Seminar Hall': [12, 18],
    'Tech Lab': [8, 14, 25],
    'Sports Complex': [20, 27]
  }

  const pendingDates = {
    'Main Auditorium': [24],
    'Seminar Hall': [26],
    'Tech Lab': [10],
    'Sports Complex': []
  }

  const [myEvents] =
    useState([
      {
        id: 1,
        title: 'TechHack 2026',
        status: 'approved',
        venue: 'Main Auditorium',
        attendees: 234,
        capacity: 500,
        permissionLetter: true
      },

      {
        id: 2,
        title: 'AI Workshop',
        status: 'pending',
        venue: 'Tech Lab',
        attendees: 120,
        capacity: 200,
        permissionLetter: false
      }
    ])

  const days =
    Array.from(
      { length: 30 },
      (_, i) => i + 1
    )

  return (

    <div className="coordinator-container">

      {/* NAVBAR */}

      <nav className="coordinator-nav">

        <div className="nav-content">

          <Link
            to="/"
            className="logo"
          >
            NEXUS.
          </Link>

          <div className="dashboard-title">

            <p>
              EVENT OPERATIONS CENTER
            </p>

          </div>

          <div className="nav-actions">

            <button
              className="user-menu"
            >
              {
                localStorage.getItem(
                  'userName'
                ) || 'Coordinator'
              }
            </button>

          </div>

        </div>

      </nav>

      {/* MAIN */}

      <div className="coordinator-content">

        {/* SIDEBAR */}

        <aside
          className="coordinator-sidebar"
        >

          <button
            className={`nav-tab ${
              activeTab === 'calendar'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab(
                'calendar'
              )
            }
          >
            <Calendar size={18}/>
            Calendar
          </button>

          <button
            className={`nav-tab ${
              activeTab === 'events'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab(
                'events'
              )
            }
          >
            <FileText size={18}/>
            My Events
          </button>

          <button
            className={`nav-tab ${
              activeTab === 'analytics'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab(
                'analytics'
              )
            }
          >
            <BarChart3 size={18}/>
            Analytics
          </button>

        </aside>

        {/* MAIN PANEL */}

        <main className="coordinator-main">

          {activeTab === 'calendar' && (

            <section
              className="calendar-section"
            >

              <div
                className="calendar-header"
              >

                <div>

                  <h1>
                    Shared Venue Calendar
                  </h1>

                  <p>
                    Check availability
                    before submitting an
                    event request.
                  </p>

                </div>

                <select
                  value={selectedVenue}
                  onChange={(e) =>
                    setSelectedVenue(
                      e.target.value
                    )
                  }
                  className="venue-selector"
                >

                  {venues.map(
                    venue => (

                      <option
                        key={venue}
                        value={venue}
                      >
                        {venue}
                      </option>

                    )
                  )}

                </select>

              </div>

              <div
                className="calendar-layout"
              >

                {/* CALENDAR */}

                <div
                  className="calendar-card"
                >

                  <h2>
                    April 2026
                  </h2>

                  <div
                    className="weekdays"
                  >

                    <span>MON</span>
                    <span>TUE</span>
                    <span>WED</span>
                    <span>THU</span>
                    <span>FRI</span>
                    <span>SAT</span>
                    <span>SUN</span>

                  </div>

                  <div
                    className="calendar-grid"
                  >

                    {days.map(day => {

                      let status =
                        'available'

                      if (
                        bookedDates[
                          selectedVenue
                        ]?.includes(day)
                      ) {
                        status =
                          'booked'
                      }

                      else if (
                        pendingDates[
                          selectedVenue
                        ]?.includes(day)
                      ) {
                        status =
                          'pending'
                      }

                      return (

                        <motion.div

                          key={day}

                          whileHover={{
                            scale: 1.05
                          }}

                          className={`calendar-day ${status}`}

                          onClick={() =>
                            setSelectedDate(
                              day
                            )
                          }
                        >

                          {day}

                        </motion.div>

                      )

                    })}

                  </div>

                  <div
                    className="calendar-legend"
                  >

                    <span>
                      🟢 Available
                    </span>

                    <span>
                      🟡 Pending
                    </span>

                    <span>
                      🔴 Booked
                    </span>

                  </div>

                </div>

                {/* DETAILS */}

                <div
                  className="date-panel"
                >

                  <h3>
                    Selected Date
                  </h3>

                  <h2>
                    April {selectedDate}
                  </h2>

                  <div
                    className="detail-row"
                  >

                    <Building2
                      size={16}
                    />

                    <span>
                      {
                        selectedVenue
                      }
                    </span>

                  </div>

                  <div
                    className="status-card"
                  >

                    <h4>
                      Availability
                    </h4>

                    <p>
                      Available for
                      booking
                    </p>

                  </div>

                  <button
                    className="btn-create"
                    onClick={() =>
                      setShowCreateForm(
                        !showCreateForm
                      )
                    }
                  >
                    Create Event Request
                  </button>

                </div>

              </div>

            </section>

          )}
          {activeTab === 'events' && (

            <section className="events-section">

              <div className="events-header">

                <h1>
                  My Events
                </h1>

                <p>
                  Track approvals,
                  registrations and
                  permission letters.
                </p>

              </div>

              <div className="event-cards">

                {myEvents.map(event => (

                  <motion.div

                    key={event.id}

                    className="event-card"

                    initial={{
                      opacity: 0,
                      y: 20
                    }}

                    animate={{
                      opacity: 1,
                      y: 0
                    }}

                  >

                    <div className="event-top">

                      <div>

                        <h2>
                          {event.title}
                        </h2>

                        <p>
                          {event.venue}
                        </p>

                      </div>

                      <span
                        className={`status-badge ${event.status}`}
                      >
                        {event.status}
                      </span>

                    </div>

                    {/* Workflow */}

                    <div className="workflow">

                      <div className="workflow-step done">
                        Submitted
                      </div>

                      <div className="workflow-step done">
                        Review
                      </div>

                      <div
                        className={`workflow-step ${
                          event.status === 'approved'
                            ? 'done'
                            : 'active'
                        }`}
                      >
                        Approval
                      </div>

                      <div
                        className={`workflow-step ${
                          event.permissionLetter
                            ? 'done'
                            : ''
                        }`}
                      >
                        Letter
                      </div>

                    </div>

                    {/* Registration */}

                    <div className="registration-card">

                      <div className="registration-header">

                        <span>
                          Registrations
                        </span>

                        <span>
                          {event.attendees}/
                          {event.capacity}
                        </span>

                      </div>

                      <div className="progress-bar">

                        <div
                          className="progress-fill"
                          style={{
                            width: `${
                              (event.attendees /
                                event.capacity) *
                              100
                            }%`
                          }}
                        />

                      </div>

                    </div>

                    {/* Permission Letter */}

                    {event.permissionLetter && (

                      <div className="permission-card">

                        <div>

                          <h4>
                            Permission Letter
                          </h4>

                          <p>
                            Generated &
                            Ready
                          </p>

                        </div>

                        <button className="download-btn">

                          <Download
                            size={16}
                          />

                          Download

                        </button>

                      </div>

                    )}

                  </motion.div>

                ))}

              </div>

            </section>

          )}

          {activeTab === 'analytics' && (

            <section className="analytics-section">

              <div className="analytics-header">

                <h1>
                  Analytics
                </h1>

                <p>
                  Overview of your
                  event performance.
                </p>

              </div>

              <div className="analytics-grid">

                <div className="analytics-card">

                  <FileText
                    size={26}
                  />

                  <h3>
                    Total Events
                  </h3>

                  <h2>
                    {myEvents.length}
                  </h2>

                </div>

                <div className="analytics-card">

                  <Users
                    size={26}
                  />

                  <h3>
                    Total Registrations
                  </h3>

                  <h2>

                    {
                      myEvents.reduce(
                        (
                          total,
                          event
                        ) =>
                          total +
                          event.attendees,
                        0
                      )
                    }

                  </h2>

                </div>

                <div className="analytics-card">

                  <Calendar
                    size={26}
                  />

                  <h3>
                    Pending Requests
                  </h3>

                  <h2>

                    {
                      myEvents.filter(
                        e =>
                          e.status ===
                          'pending'
                      ).length
                    }

                  </h2>

                </div>

                <div className="analytics-card">

                  <BarChart3
                    size={26}
                  />

                  <h3>
                    Approval Rate
                  </h3>

                  <h2>
                    87%
                  </h2>

                </div>

              </div>

            </section>

          )}

        </main>

      </div>

    </div>

  )

}

export default CoordinatorDashboard