import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
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

  /* STATES */

  const [joinedEvents, setJoinedEvents] =
    useState([])

  const [selectedCategory, setSelectedCategory] =
    useState('All Categories')

  const [searchTerm, setSearchTerm] =
    useState('')

  /* EVENTS */

  const events = [
    {
      id: 1,
      title: 'TechHack 2026',
      category: 'TECH',
      description:
        'Build products with developers across campus.',
      date: '25 APR',
      venue: 'Main Auditorium',
      image:
        'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop'
    },

    {
      id: 2,
      title: 'Spring Concert',
      category: 'CULTURAL',
      description:
        'Live performances from artists and bands.',
      date: '27 APR',
      venue: 'Open Grounds',
      image:
        'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200&auto=format&fit=crop'
    },

    {
      id: 3,
      title: 'Football Finals',
      category: 'SPORTS',
      description:
        'Inter-college football championship.',
      date: '01 MAY',
      venue: 'Sports Complex',
      image:
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop'
    }
  ]

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

  const toggleJoinEvent = (eventId) => {

    setJoinedEvents((prev) => {

      if (prev.includes(eventId)) {
        return prev.filter(
          (id) => id !== eventId
        )
      }

      return [...prev, eventId]

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
            onClick={() =>
              alert('Notifications clicked')
            }
          >
            <Bell size={18} />
          </button>

          <button
            className="profile-btn"
            onClick={() =>
              alert('Profile clicked')
            }
          >
            <User size={16} />
            Profile
          </button>

          <button
            className="icon-btn"
            onClick={() =>
              alert('Logout clicked')
            }
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
            Aswanth.
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
              onClick={() =>
                alert('Explore Events clicked')
              }
            >
              Explore Events
            </button>

            <button
              className="secondary-btn"
              onClick={() =>
                alert('Calendar clicked')
              }
            >
              My Calendar
            </button>

          </motion.div>

          {/* QUICK ACTIONS */}

          <div className="quick-actions">

            <button
              onClick={() =>
                alert('Saved Events clicked')
              }
            >
              Saved Events
            </button>

            <button
              onClick={() =>
                alert('My RSVPs clicked')
              }
            >
              My RSVPs
            </button>

            <button
              onClick={() =>
                alert('Reminder created')
              }
            >
              Create Reminder
            </button>

            <button
              onClick={() =>
                alert('Tickets clicked')
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

          {filteredEvents.length === 0 && (

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
                    onClick={() =>
                      toggleJoinEvent(event.id)
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

            ))}

          </div>

        </main>

        {/* ACTIVITY */}

        <aside className="activity-sidebar">

          <div className="activity-card">

            <h3>Recent Activity</h3>

            <div className="activity-item">
              <span className="activity-dot"></span>
              You joined TechHack 2026
            </div>

            <div className="activity-item">
              <span className="activity-dot"></span>
              Spring Concert starts tomorrow
            </div>

            <div className="activity-item">
              <span className="activity-dot"></span>
              3 new tech events added
            </div>

          </div>

          <div className="schedule-card">

            <h3>Upcoming Schedule</h3>

            <div className="schedule-item">

              <span className="schedule-date">
                TODAY
              </span>

              <p>
                6PM — Spring Concert
              </p>

            </div>

            <div className="schedule-item">

              <span className="schedule-date">
                TOMORROW
              </span>

              <p>
                9AM — AI Workshop
              </p>

            </div>

            <div className="schedule-item">

              <span className="schedule-date">
                FRIDAY
              </span>

              <p>
                Hackathon registration closes
              </p>

            </div>

          </div>

        </aside>

      </section>

    </div>
  )
}

export default StudentDashboard