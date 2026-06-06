import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import './LandingPage.css'
import events from '../data/events'

function LandingPage() {
  const featuredEvents =
  events
    .filter(
      event =>
        event.status ===
        'approved'
    )
    .slice(0, 3)

    const liveEvents =
  events
    .filter(
      event =>
        event.status === 'approved'
    )
    .slice(0, 4)

    const totalEvents = events.length

const approvedEvents =
  events.filter(
    event =>
      event.status === 'approved'
  )

const totalCategories =
  new Set(
    events.map(
      event =>
        event.category
    )
  ).size

const totalRegistrations =
  events.reduce(
    (sum, event) =>
      sum + event.attendees,
    0
  )

  return (
    <div className="landing-wrapper">

      {/* NAVIGATION */}

      <nav className="landing-nav">
        <div className="nav-inner">

          <div className="logo">
            NEXUS.
          </div>

          <div className="nav-search">
            <input
              type="text"
              placeholder="Search hackathons, clubs, concerts..."
            />
          </div>

          <div className="nav-right">
            <Link to="/login" className="nav-signin">
              Sign in
            </Link>

            <Link to="/login" className="nav-join">
              Join NEXUS
            </Link>
          </div>

        </div>
      </nav>

      {/* HERO */}

      <section className="hero-section">
        <div className="hero-inner">

          <div className="hero-grid">

            {/* LEFT */}

            <div className="hero-left">

              <motion.div
                className="hero-badge"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <span className="badge-dot"></span>
                CAMPUS CULTURE • LIVE
              </motion.div>

              <motion.h1
                className="hero-title"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                Every event.
                <br />
                Every crowd.
                <br />
                <span className="accent-text">
                  One campus.
                </span>
              </motion.h1>

              <motion.p
                className="hero-description"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                Discover hackathons, concerts, workshops,
                game nights, meetups and everything
                happening around you — all in one place.
              </motion.p>

              <motion.div
                className="hero-buttons"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Link to="/login" className="btn-primary">
                  Explore Events
                </Link>

                <Link to="/login" className="btn-secondary">
                  Join NEXUS
                </Link>
              </motion.div>

                         <div className="hero-stats">

  <motion.div
    className="stat"
    whileHover={{ y: -3 }}
  >
    <div className="stat-number">
      {totalEvents}
    </div>

    <div className="stat-label">
      Events Hosted
    </div>
  </motion.div>

  <motion.div
    className="stat"
    whileHover={{ y: -3 }}
  >
    <div className="stat-number">
      {approvedEvents.length}
    </div>

    <div className="stat-label">
      Upcoming
    </div>
  </motion.div>

  <motion.div
    className="stat"
    whileHover={{ y: -3 }}
  >
    <div className="stat-number">
      {totalCategories}
    </div>

    <div className="stat-label">
      Categories
    </div>
  </motion.div>

  <motion.div
    className="stat"
    whileHover={{ y: -3 }}
  >
    <div className="stat-number">
      {totalRegistrations}
    </div>

    <div className="stat-label">
      Registrations
    </div>
  </motion.div>

</div>

            </div>

            {/* RIGHT */}

            <div className="hero-right">
<motion.div
  className="live-card"
  initial={{ opacity: 0, x: 30 }}
  animate={{ opacity: 1, x: 0 }}
>

  <div className="live-header">

    <span className="live-dot"></span>

     UPCOMING EVENTS

  </div>

  {liveEvents.map((event) => (

    <Link
      key={event.id}
      to={`/events/${event.id}`}
      className="live-event-link"
    >

      <div className="live-event">

        <h4>
          {event.title}
        </h4>

        <p>
          {new Date(event.date).toLocaleDateString()} {' • '} {event.venue}
        </p>

      </div>

    </Link>

  ))}

</motion.div>

            </div>

          </div>

        </div>
      </section>

      {/* FEATURED EVENTS */}

      <section className="featured-section">

        <div className="section-inner">

          <div className="section-heading">
            <span>TRENDING THIS WEEK</span>
            <h2>Featured events</h2>
          </div>

          <div className="events-grid">

            {featuredEvents.map((event) => (
              <Link
  to={`/events/${event.id}`}
  className="event-link"
  key={event.id}
>

  <motion.div
    className="event-card"
    whileHover={{ y: -6 }}
  >

    <div
      className="event-image"
      style={{
        backgroundImage: `url(${event.image})`
      }}
    ></div>

    <div className="event-content">

      <span className="event-category">
        {event.category}
      </span>

      <h3>{event.title}</h3>

      <p>{event.description}</p>

      <div className="event-meta">

        <span>
          {new Date(event.date).toLocaleDateString()}
        </span>

        <span>
          {event.venue}
        </span>

      </div>

    </div>

  </motion.div>

</Link>
            ))}

          </div>

        </div>

      </section>

    </div>
  )
}

export default LandingPage