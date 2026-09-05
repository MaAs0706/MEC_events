import React, { useEffect, useState } from 'react'
import {useNavigate} from 'react-router-dom'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../services/api'
import { signOut } from '../services/auth'
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

  const [startDate, setStartDate] =
    useState('')

  const [endDate, setEndDate] =
    useState('')

  const [viewMode, setViewMode] =
    useState('all')

  const [statusMessage, setStatusMessage] =
    useState('')

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const approvedUpcomingEvents =
    events
      .filter(event => {
        const eventDate = new Date(event.date)
        eventDate.setHours(0, 0, 0, 0)

        return eventDate >= todayStart
      })
      .sort(
        (firstEvent, secondEvent) =>
          new Date(firstEvent.date) -
          new Date(secondEvent.date)
      )

  const joinedEventDetails =
    approvedUpcomingEvents.filter(
      event =>
        joinedEvents.includes(event.id)
    )

  const categoryOptions = [
    'All Categories',
    ...new Set(
      events
        .map(event => event.category)
        .filter(Boolean)
    )
  ]

  const weekEnd = new Date(todayStart)
  weekEnd.setDate(weekEnd.getDate() + 7)

  const eventsThisWeek =
    approvedUpcomingEvents.filter(event => {
      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)

      return (
        eventDate >= todayStart &&
        eventDate <= weekEnd
      )
    })

  const topCategory =
    approvedUpcomingEvents.reduce(
      (currentTop, event) => {
        const count =
          approvedUpcomingEvents.filter(
            item =>
              item.category === event.category
          ).length

        return count > currentTop.count
          ? {
            name: event.category,
            count
          }
          : currentTop
      },
      {
        name: 'No category yet',
        count: 0
      }
    )

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

  const filteredEvents = approvedUpcomingEvents.filter(
    (event) => {

      const matchesCategory =
        selectedCategory === 'All Categories' ||
        event.category === selectedCategory

      const matchesSearch =
        event.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase())

      const eventDate = new Date(event.date)
      eventDate.setHours(0, 0, 0, 0)

      const matchesStartDate =
        !startDate ||
        eventDate >= new Date(startDate)

      const matchesEndDate =
        !endDate ||
        eventDate <= new Date(endDate)

      const matchesViewMode =
        viewMode === 'all' ||
        joinedEvents.includes(event.id)

      return (
        matchesCategory &&
        matchesSearch &&
        matchesStartDate &&
        matchesEndDate &&
        matchesViewMode
      )

    }
  )

  /* JOIN EVENT */

  const joinEvent = async (eventId) => {

    if (joinedEvents.includes(eventId)) {
      return
    }

    setError('')
    setStatusMessage('')

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

      setStatusMessage('Registration confirmed')
    }
    catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
        'Unable to join event'
      )
    }

  }

  const scrollToEvents = () => {

    document
      .querySelector('.events-area')
      ?.scrollIntoView({
        behavior: 'smooth'
      })

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
            onClick={() => {
              document
                .querySelector('.activity-sidebar')
                ?.scrollIntoView({
                  behavior: 'smooth'
                })
            }}
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
              signOut(navigate)
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
              onClick={scrollToEvents}
            >
              Explore Events
            </button>

            <button
              className="secondary-btn"
              onClick={() => {
                setViewMode('rsvps')
                scrollToEvents()
              }}
            >
              My Schedule
            </button>

          </motion.div>

          {/* QUICK ACTIONS */}

          <div className="quick-actions">

            <button
              onClick={() => {
                setViewMode('all')
                setStartDate('')
                setEndDate('')
                scrollToEvents()
              }}
            >
              Browse All
            </button>

            <button
              onClick={() => {
                setViewMode('rsvps')
                scrollToEvents()
              }}
            >
              My RSVPs
            </button>

            <button
              onClick={() => {
                const todayValue =
                  new Date().toISOString().slice(0, 10)

                setStartDate(todayValue)
                setEndDate('')
                setViewMode('all')
                scrollToEvents()
              }}
            >
              From Today
            </button>

            <button
              onClick={() =>
                navigate('/profile')
              }
            >
              Profile
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

              <h2>
                {eventsThisWeek.length}
              </h2>

              <p>
                Events happening this week
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
                Upcoming events you joined
              </p>

            </div>

            <div className="panel-section">

              <span className="panel-label">
                TRENDING
              </span>

              <h3>
                {topCategory.name}
                {topCategory.count
                  ? ' ↑'
                  : ''}
              </h3>

              <p>
                Most active upcoming category
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

              {categoryOptions.map(category => (

                <option key={category}>
                  {category}
                </option>

              ))}

            </select>

          </div>

          <div className="filter-group">

            <label>Start Date</label>

            <input
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(e.target.value)
              }
            />

          </div>

          <div className="filter-group">

            <label>End Date</label>

            <input
              type="date"
              value={endDate}
              onChange={(e) =>
                setEndDate(e.target.value)
              }
            />

          </div>

          <button
            className="clear-btn"
            onClick={() => {

              setSelectedCategory(
                'All Categories'
              )

              setSearchTerm('')

              setStartDate('')

              setEndDate('')

              setViewMode('all')

            }}
          >
            Clear Filters
          </button>

        </aside>

        {/* EVENTS */}

        <main className="events-area">

          <div className="section-header">

            <h2>
              {viewMode === 'rsvps'
                ? 'My RSVPs'
                : 'Upcoming Events'}
            </h2>

            {viewMode === 'rsvps' ? (
              <button
                className="section-action"
                onClick={() =>
                  setViewMode('all')
                }
              >
                View All
              </button>
            ) : (
              <button
                className="section-action"
                onClick={() =>
                  setViewMode('rsvps')
                }
              >
                My RSVPs
              </button>
            )}

          </div>

          {statusMessage && (
            <div className="success-state">
              {statusMessage}
            </div>
          )}

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
  key={event.id}
>

  <motion.div
    className="event-card"
    whileHover={{ y: -4 }}
  >

                <div
                  className={`event-image ${event.image ? '' : 'event-image-fallback'}`}
                  style={{
                    backgroundImage: event.image
                      ? `url(${event.image})`
                      : 'none'
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
                      {new Date(
                        event.date
                      ).toLocaleDateString()}
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
                      : 'RSVP / Join'}

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

            {joinedEventDetails.length ? (
              joinedEventDetails.slice(0, 3).map(
                joinedEvent => {

                  return (
                    <div
                      className="activity-item"
                      key={joinedEvent.id}
                    >
                      <span className="activity-dot"></span>
                      {`You joined ${joinedEvent.title}`}
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

            {joinedEventDetails.slice(0, 3).map(event => (
              <div
                className="schedule-item"
                key={event.id}
              >
                <span className="schedule-date">
                  {new Date(
                    event.date
                  ).toLocaleDateString()}
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

            {!joinedEventDetails.length && (
              <div className="schedule-item">
                <p>
                  Your joined events will appear here.
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
