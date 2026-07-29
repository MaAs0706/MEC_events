import React, { useEffect, useState } from 'react'
import {useNavigate} from 'react-router-dom'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../services/api'
import {
  Search,
  Bell,
  User,
  LogOut
} from 'lucide-react'

import './StudentDashboard.css'

const hours = new Date().getHours()

let greeting

if (hours >= 5 && hours <= 12) {
  greeting = 'Good Morning'
} else if (hours >= 12 && hours <= 16) {
  greeting = 'Good Afternoon'
} else {
  greeting = 'Good Evening'
}

function StudentDashboard() {

  const navigate = useNavigate()
  const userName =
    localStorage.getItem('userName') ||
    'Student'

  /* STATES */

  const [joinedEvents, setJoinedEvents] =
    useState([])

  const [events, setEvents] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [selectedCategory, setSelectedCategory] =
    useState('All Categories')

  const [searchTerm, setSearchTerm] =
    useState('')

  useEffect(() => {

    const fetchEvents = async () => {

      try {
        const response =
          await api.get('/events')

        setEvents(response.data)

        const statusResults =
          await Promise.allSettled(
            response.data.map(
              event =>
                api.get(
                  `/events/${event.id}/registration-status`
                )
            )
          )

        const registeredIds =
          statusResults
            .map((result, index) =>
              result.status === 'fulfilled' &&
              result.value.data.registered
                ? response.data[index].id
                : null
            )
            .filter(Boolean)

        setJoinedEvents(registeredIds)
      }
      catch {
        setError('Unable to load events')
      }
      finally {
        setLoading(false)
      }

    }

    fetchEvents()

  }, [])

  /* FILTER EVENTS */

  const filteredEvents = events.filter(
    (event) => {

      const matchesCategory =
        selectedCategory === 'All Categories' ||
        event.category ===
          selectedCategory.toUpperCase()

      const matchesSearch =
        event.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase())

      return (
        matchesCategory &&
        matchesSearch
      )

    }
  )

  /* JOIN EVENT */

  const joinEvent = async (eventId) => {

    if (joinedEvents.includes(eventId)) {
      return
    }

    setError('')

    try {
      const response =
        await api.post(`/events/${eventId}/register`)

      setJoinedEvents((prev) => [
        ...prev,
        eventId
      ])

      setEvents((currentEvents) =>
        currentEvents.map((event) =>
          event.id === eventId
            ? response.data.event
            : event
        )
      )
    }
    catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
        'Unable to join event'
      )
    }

  }

  return (
    <div className="dashboard">

      {/* NAVBAR */}

      <nav className="navbar">

        <div className="logo">
          NEXUS.
        </div>

        <div className="search-box">

          <Search size={18} />

          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
          />

        </div>

        <div className="nav-right">

          <button
            className="icon-btn"
            title="Notifications"
          >
            <Bell size={18} />
          </button>

          <button
            className="profile-btn"
            onClick={() =>
              navigate('/profile')
            }
          >
            <User size={16} />
            Profile
          </button>

          <button
            className="icon-btn"
            onClick={() =>
              navigate('/')
            }
            title="Logout"
          >
            <LogOut size={18} />
          </button>

        </div>

      </nav>

      {/* HERO */}

      <section className="hero">

        {/* LEFT */}

        <div className="hero-left">

          <motion.p
            className="hero-tag"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            CAMPUS CULTURE • LIVE
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {greeting},
            <br />
            {userName}.
          </motion.h1>

          <motion.p
            className="hero-description"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Your campus is active tonight.
            Discover events, manage RSVPs,
            and keep track of everything
            happening around you.
          </motion.p>

          <motion.div
            className="hero-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >

            <button
              className="primary-btn"
              onClick={() => {
                document.querySelector('.events-area').scrollIntoView({ behavior: 'smooth' })
              }}
            >
              Explore Events
            </button>

            <button
              className="secondary-btn"
              onClick={() =>
                alert('Calendar feature coming soon')
              }
            >
              My Calendar
            </button>

          </motion.div>

          {/* QUICK ACTIONS */}

          <div className="quick-actions">

            <button
              onClick={() =>
                alert('Saved Events feature coming soon')
              }
            >
              Saved Events
            </button>

            <button
              onClick={() =>
                alert('My RSVPs: ' + joinedEvents.length + ' events joined')
              }
            >
              My RSVPs
            </button>

            <button
              onClick={() =>
                alert('Reminder feature coming soon')
              }
            >
              Create Reminder
            </button>

            <button
              onClick={() =>
                alert('Tickets feature coming soon')
              }
            >
              Tickets
            </button>

          </div>

        </div>

        {/* RIGHT */}

        <div className="hero-right">

          <div className="dashboard-panel">

            <div className="panel-section">

              <span className="panel-label">
                THIS WEEK
              </span>

              <h2>24</h2>

              <p>
                Events happening around campus
              </p>

            </div>

            <div className="panel-section">

              <span className="panel-label">
                YOUR RSVPS
              </span>

              <h2>
                {joinedEvents.length}
              </h2>

              <p>
                You joined events this week
              </p>

            </div>

            <div className="panel-section">

              <span className="panel-label">
                TRENDING
              </span>

              <h3>Tech events ↑</h3>

              <p>
                Most students are joining
                hackathons
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* DASHBOARD GRID */}

      <section className="dashboard-grid">

        {/* SIDEBAR */}

        <aside className="sidebar">

          <h3>Filters</h3>

          <div className="filter-group">

            <label>Category</label>

            <select
              value={selectedCategory}
              onChange={(e) =>
                setSelectedCategory(
                  e.target.value
                )
              }
            >

              <option>
                All Categories
              </option>

              <option>
                Tech
              </option>

              <option>
                Sports
              </option>

              <option>
                Cultural
              </option>

            </select>

          </div>

          <div className="filter-group">

            <label>Start Date</label>

            <input type="date" />

          </div>

          <div className="filter-group">

            <label>End Date</label>

            <input type="date" />

          </div>

          <button
            className="clear-btn"
            onClick={() => {

              setSelectedCategory(
                'All Categories'
              )

              setSearchTerm('')

            }}
          >
            Clear Filters
          </button>

        </aside>

        {/* EVENTS */}

        <main className="events-area">

          <div className="section-header">

            <h2>Trending Events</h2>

            <Link to="/">
              View All
            </Link>

          </div>

          {loading && (
            <div className="empty-state">
              <h3>Loading events...</h3>
            </div>
          )}

          {error && (
            <div className="empty-state">
              <h3>{error}</h3>
            </div>
          )}

          {!loading && !error && filteredEvents.length === 0 && (

            <div className="empty-state">

              <h3>No events found.</h3>

              <p>
                Try changing your filters
                or search query.
              </p>

            </div>

          )}

          <div className="events-grid">

            {filteredEvents.map((event) => (

              <Link
  to={`/events/${event.id}`}
  className="event-link"
>

  <motion.div
    className="event-card"
    key={event.id}
    whileHover={{ y: -4 }}
  >

                <div
                  className="event-image"
                  style={{
                    backgroundImage:
                      `url(${event.image})`
                  }}
                ></div>

                <div className="event-content">

                  <span className="badge">
                    {event.category}
                  </span>

                  <h3>{event.title}</h3>

                  <p>
                    {event.description}
                  </p>

                  <div className="event-meta">

                    <span>
                      {event.date}
                    </span>

                    <span>
                      {event.venue}
                    </span>

                  </div>

                  <button
                    className={`join-btn ${
                      joinedEvents.includes(
                        event.id
                      )
                        ? 'joined'
                        : ''
                    }`}
                    onClick={(clickEvent) => {
                      clickEvent.preventDefault()
                      joinEvent(event.id)
                    }}
                    disabled={
                      joinedEvents.includes(
                        event.id
                      )
                    }
                  >

                    {joinedEvents.includes(
                      event.id
                    )
                      ? 'Joined'
                      : 'Join Event'}

                  </button>

                </div>

              </motion.div>
              </Link>

            ))}

          </div>

        </main>

        {/* ACTIVITY */}

        <aside className="activity-sidebar">

          <div className="activity-card">

            <h3>Recent Activity</h3>

            {joinedEvents.length ? (
              joinedEvents.slice(0, 3).map(
                eventId => {
                  const joinedEvent =
                    events.find(
                      event =>
                        event.id === eventId
                    )

                  return (
                    <div
                      className="activity-item"
                      key={eventId}
                    >
                      <span className="activity-dot"></span>
                      {joinedEvent
                        ? `You joined ${joinedEvent.title}`
                        : 'You joined an event'}
                    </div>
                  )
                }
              )
            ) : (
              <div className="activity-item">
                <span className="activity-dot"></span>
                No recent activity yet.
              </div>
            )}

          </div>

          <div className="schedule-card">

            <h3>Upcoming Schedule</h3>

            {events.slice(0, 3).map(event => (
              <div
                className="schedule-item"
                key={event.id}
              >
                <span className="schedule-date">
                  {event.date}
                </span>

                <p>
                  {event.start_time || 'TBA'}
                  {' '}
                  —
                  {' '}
                  {event.title}
                </p>
              </div>
            ))}

            {!events.length && (
              <div className="schedule-item">
                <p>
                  No upcoming events yet.
                </p>
              </div>
            )}

          </div>

        </aside>

      </section>

    </div>
  )
}

export default StudentDashboard
