import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import './LandingPage.css'
import events from '../data/events'

function LandingPage() {
  const featuredEvents = [
    {
      title: 'TechHack 2026',
      category: 'TECH',
      description: 'Build products with developers across campus.',
      date: '25 APR',
      venue: 'Main Auditorium',
      image:
        'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop'
    },
    {
      title: 'Spring Concert',
      category: 'CULTURE',
      description: 'Live performances from artists and bands.',
      date: '27 APR',
      venue: 'Open Grounds',
      image:
        'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200&auto=format&fit=crop'
    }
  ]

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
                  <div className="stat-number">120+</div>
                  <div className="stat-label">Events hosted</div>
                </motion.div>

                <motion.div
                  className="stat"
                  whileHover={{ y: -3 }}
                >
                  <div className="stat-number">24</div>
                  <div className="stat-label">Live now</div>
                </motion.div>

                <motion.div
                  className="stat"
                  whileHover={{ y: -3 }}
                >
                  <div className="stat-number">7</div>
                  <div className="stat-label">Categories</div>
                </motion.div>

                <motion.div
                  className="stat"
                  whileHover={{ y: -3 }}
                >
                  <div className="stat-number">∞</div>
                  <div className="stat-label">Stories made</div>
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
                  LIVE THIS WEEK
                </div>

                <div className="live-event">
                  <h4>TechHack 2026</h4>
                  <p>240 students attending</p>
                </div>

                <div className="live-event">
                  <h4>Spring Concert</h4>
                  <p>Starts in 2 hours</p>
                </div>

                <div className="live-event">
                  <h4>Football Finals</h4>
                  <p>Almost full</p>
                </div>

                <div className="live-event">
                  <h4>Startup Meetup</h4>
                  <p>Networking tonight</p>
                </div>

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

            {featuredEvents.map((event, index) => (
              <motion.div
                className="event-card"
                key={index}
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
                    <span>{event.date}</span>
                    <span>{event.venue}</span>
                  </div>

                </div>

              </motion.div>
            ))}

          </div>

        </div>

      </section>

    </div>
  )
}

export default LandingPage