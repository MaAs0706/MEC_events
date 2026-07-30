
import { Link } from 'react-router-dom'
import {
  motion,
  useAnimation
} from 'framer-motion'
import './LandingPage.css'
import React, { useEffect, useState } from 'react'
import api from '../services/api'

function LandingPage() {
  const [events, setEvents] = useState([])
 const [loading, setLoading] = useState(true)
  const [gateOpen, setGateOpen] = useState(false)
  const [gateRemoved, setGateRemoved] = useState(
    () =>
      sessionStorage.getItem(
        'nexusGateOpened'
      ) === 'true'
  )
  const gateControls = useAnimation()
  const leftDoorControls = useAnimation()
  const rightDoorControls = useAnimation()
  const logoControls = useAnimation()
  const doorDetailControls = useAnimation()
  const contentControls = useAnimation()

  const openGate = async () => {

    if (gateOpen) {
      return
    }

    setGateOpen(true)

    await Promise.all([
      logoControls.start({
        opacity: 0,
        scale: 0.92,
        transition: {
          duration: 0.35,
          ease: 'easeOut'
        }
      }),
      doorDetailControls.start({
        opacity: 1,
        transition: {
          duration: 0.35,
          ease: 'easeOut'
        }
      })
    ])

    await Promise.all([
      leftDoorControls.start({
        x: '-112%',
        rotateY: -18,
        transition: {
          duration: 1.05,
          ease: [0.76, 0, 0.24, 1]
        }
      }),
      rightDoorControls.start({
        x: '112%',
        rotateY: 18,
        transition: {
          duration: 1.05,
          ease: [0.76, 0, 0.24, 1]
        }
      }),
      contentControls.start({
        opacity: 1,
        scale: 1,
        transition: {
          duration: 1,
          ease: 'easeOut',
          delay: 0.25
        }
      })
    ])

    await gateControls.start({
      opacity: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    })

    setGateRemoved(true)
    sessionStorage.setItem(
      'nexusGateOpened',
      'true'
    )

  }

  const resetGate = () => {

    sessionStorage.removeItem(
      'nexusGateOpened'
    )

    window.scrollTo({
      top: 0,
      behavior: 'instant'
    })

    gateControls.set({
      opacity: 1
    })

    leftDoorControls.set({
      x: '0%',
      rotateY: 0,
      opacity: 1
    })

    rightDoorControls.set({
      x: '0%',
      rotateY: 0,
      opacity: 1
    })

    logoControls.set({
      opacity: 1,
      scale: 1
    })

    doorDetailControls.set({
      opacity: 0
    })

    contentControls.set({
      opacity: 0.2,
      scale: 0.985
    })

    setGateOpen(false)
    setGateRemoved(false)

  }

 useEffect(() => {

  const fetchEvents = async () => {

    try {

      const response =
        await api.get('/events')

      setEvents(response.data)

    } catch (error) {

      console.error(
        'Error fetching events:',
        error
      )

    } finally {

      setLoading(false)

    }

  }

  fetchEvents()

}, [])

useEffect(() => {

  if (gateRemoved) {
    document.body.style.overflow = ''
    contentControls.set({
      opacity: 1,
      scale: 1
    })
    return
  }

  document.body.style.overflow = 'hidden'

  const handleWheel = (event) => {
    if (event.deltaY > 4) {
      event.preventDefault()
      openGate()
    }
  }

  let touchStartY = 0

  const handleTouchStart = (event) => {
    touchStartY = event.touches[0].clientY
  }

  const handleTouchMove = (event) => {
    const currentY = event.touches[0].clientY

    if (touchStartY - currentY > 12) {
      event.preventDefault()
      openGate()
    }
  }

  window.addEventListener(
    'wheel',
    handleWheel,
    {
      passive: false
    }
  )

  window.addEventListener(
    'touchstart',
    handleTouchStart,
    {
      passive: true
    }
  )

  window.addEventListener(
    'touchmove',
    handleTouchMove,
    {
      passive: false
    }
  )

  return () => {
    document.body.style.overflow = ''
    window.removeEventListener('wheel', handleWheel)
    window.removeEventListener('touchstart', handleTouchStart)
    window.removeEventListener('touchmove', handleTouchMove)
  }

}, [gateRemoved, gateOpen])
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

  if (loading) {
  return (
    <div className="loading-screen">
      Loading Events...
    </div>
  )
}

  return (
    <div className="landing-wrapper">

      {!gateRemoved && (
      <motion.section
        className="nexus-gate"
        animate={gateControls}
      >

        <motion.div
          className="gate-logo"
          animate={logoControls}
          initial={{
            opacity: 1,
            scale: 1
          }}
        >
          NEXUS.
        </motion.div>

        <motion.div
          className="door-panel door-left"
          animate={leftDoorControls}
          initial={{
            x: '0%',
            rotateY: 0,
            opacity: 1
          }}
        />

        <motion.div
          className="door-panel door-right"
          animate={rightDoorControls}
          initial={{
            x: '0%',
            rotateY: 0,
            opacity: 1
          }}
        />

        <motion.div
          className="door-frame"
          animate={doorDetailControls}
          initial={{
            opacity: 0
          }}
        >

          <span className="door-edge door-edge-left"></span>
          <span className="door-edge door-edge-right"></span>
          <span className="door-glow"></span>

        </motion.div>

        <motion.p
          className="gate-hint"
          animate={{
            opacity: gateOpen ? 0 : 1
          }}
          transition={{
            duration: 0.25
          }}
        >
          Scroll to enter campus
        </motion.p>

      </motion.section>
      )}

      <motion.div
        className="landing-content"
        animate={contentControls}
        initial={
          gateRemoved
            ? {
              opacity: 1,
              scale: 1
            }
            : {
              opacity: 0.2,
              scale: 0.985
            }
        }
      >

      {/* NAVIGATION */}

      <nav className="landing-nav">
        <div className="nav-inner">

          <button
            className="logo logo-button"
            onClick={resetGate}
            type="button"
          >
            NEXUS.
          </button>

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

            <motion.div
              className="hero-left"
              initial={{
                opacity: 0,
                y: 40
              }}
              whileInView={{
                opacity: 1,
                y: 0
              }}
              viewport={{
                once: true,
                amount: 0.35
              }}
              transition={{
                duration: 0.7
              }}
            >

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

            </motion.div>

            {/* RIGHT */}

            <motion.div
              className="hero-right"
              initial={{
                opacity: 0,
                y: 50,
                scale: 0.96
              }}
              whileInView={{
                opacity: 1,
                y: 0,
                scale: 1
              }}
              viewport={{
                once: true,
                amount: 0.3
              }}
              transition={{
                duration: 0.8,
                delay: 0.1
              }}
            >
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

            </motion.div>

          </div>

        </div>
      </section>

      {/* FEATURED EVENTS */}

      <section className="featured-section">

        <div className="section-inner">

          <motion.div
            className="section-heading"
            initial={{
              opacity: 0,
              y: 35
            }}
            whileInView={{
              opacity: 1,
              y: 0
            }}
            viewport={{
              once: true,
              amount: 0.5
            }}
          >
            <span>TRENDING THIS WEEK</span>
            <h2>Featured events</h2>
          </motion.div>

          <div className="events-grid">

            {featuredEvents.map((event) => (
              <Link
  to={`/events/${event.id}`}
  className="event-link"
  key={event.id}
>

  <motion.div
    className="event-card"
    initial={{
      opacity: 0,
      y: 36
    }}
    whileInView={{
      opacity: 1,
      y: 0
    }}
    viewport={{
      once: true,
      amount: 0.25
    }}
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

      </motion.div>

    </div>
  )
}

export default LandingPage
