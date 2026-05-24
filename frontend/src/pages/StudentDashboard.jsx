import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import './StudentDashboard.css'

function StudentDashboard() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [myRsvps, setMyRsvps] = useState([1, 3])

  const [allEvents] = useState([
    {
      id: 1,
      title: 'TechHack 2026',
      description: 'Build amazing projects in 24 hours',
      date: '2026-04-25',
      time: '09:00 AM',
      venue: 'Main Auditorium',
      attendees: 234,
      capacity: 500,
      category: 'tech',
      image: '🖥️'
    },
    {
      id: 2,
      title: 'Spring Concert',
      description: 'Music performance by campus artists',
      date: '2026-04-27',
      time: '06:00 PM',
      venue: 'Open Grounds',
      attendees: 450,
      capacity: 800,
      category: 'cultural',
      image: '🎵'
    },
    {
      id: 3,
      title: 'Football Finals',
      description: 'Inter-college football championship',
      date: '2026-05-01',
      time: '03:00 PM',
      venue: 'Sports Complex',
      attendees: 320,
      capacity: 600,
      category: 'sports',
      image: '⚽'
    },
    {
      id: 4,
      title: 'AI Workshop',
      description: 'Learn machine learning from industry experts',
      date: '2026-04-28',
      time: '02:00 PM',
      venue: 'Tech Lab',
      attendees: 120,
      capacity: 200,
      category: 'tech',
      image: '🤖'
    },
    {
      id: 5,
      title: 'Dance Showcase',
      description: 'Cultural dance performances from around the world',
      date: '2026-05-03',
      time: '07:00 PM',
      venue: 'Auditorium',
      attendees: 280,
      capacity: 400,
      category: 'cultural',
      image: '💃'
    },
    {
      id: 6,
      title: 'Coding Competition',
      description: 'Competitive programming challenge',
      date: '2026-05-05',
      time: '10:00 AM',
      venue: 'Computer Lab',
      attendees: 95,
      capacity: 150,
      category: 'tech',
      image: '💻'
    }
  ])

  const filteredEvents = allEvents.filter(event => {
    let matches = true
    
    if (selectedCategory !== 'all' && event.category !== selectedCategory) {
      matches = false
    }
    
    if (startDate && new Date(event.date) < new Date(startDate)) {
      matches = false
    }
    
    if (endDate && new Date(event.date) > new Date(endDate)) {
      matches = false
    }
    
    return matches
  })

  const handleRsvp = (eventId) => {
    if (myRsvps.includes(eventId)) {
      setMyRsvps(myRsvps.filter(id => id !== eventId))
    } else {
      setMyRsvps([...myRsvps, eventId])
    }
  }

  return (
    <div className="student-dashboard-container">
      {/* Navigation */}
      <nav className="student-nav">
        <div className="nav-content">
          <Link to="/" className="logo">NEXUS.</Link>
          <input type="text" className="search-bar" placeholder="Search events..." />
          <div className="nav-actions">
            <Link to="/profile" className="user-menu">👤 Profile</Link>
            <Link to="/" className="logout">Sign out</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="student-content">
        {/* Sidebar Filters */}
        <aside className="student-sidebar">
          <div className="filter-section">
            <h3>FILTER EVENTS</h3>
            
            <div className="filter-group">
              <label>Category</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="all">All Categories</option>
                <option value="tech">Tech</option>
                <option value="sports">Sports</option>
                <option value="cultural">Cultural</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Start Date</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label>End Date</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <button 
              className="btn-clear"
              onClick={() => {
                setSelectedCategory('all')
                setStartDate('')
                setEndDate('')
              }}
            >
              Clear Filters
            </button>
          </div>
        </aside>

        {/* Main Area */}
        <main className="student-main">
          {/* Featured Events Carousel */}
          <section className="featured-section">
            <h2>Featured Events</h2>
            <div className="carousel">
              {allEvents.slice(0, 3).map((event, index) => (
                <motion.div 
                  key={event.id}
                  className="carousel-card"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                >
                  <div className="carousel-image">{event.image}</div>
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                  <div className="carousel-meta">
                    <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                    <span>📍 {event.venue}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* All Events Section */}
          <section className="events-section">
            <h2>All Events ({filteredEvents.length})</h2>
            {filteredEvents.length === 0 ? (
              <div className="empty-state">
                <p>NOTHING HERE</p>
                <p className="empty-subtitle">No events match your filters.</p>
              </div>
            ) : (
              <div className="events-grid">
                {filteredEvents.map((event, index) => (
                  <motion.div 
                    key={event.id}
                    className="event-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <div className="event-image-bg">{event.image}</div>
                    <div className="event-content">
                      <div className="event-category">
                        <span className={`category-badge ${event.category}`}>
                          {event.category.toUpperCase()}
                        </span>
                      </div>
                      <h3>{event.title}</h3>
                      <p className="event-description">{event.description}</p>
                      <div className="event-meta">
                        <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                        <span>🕐 {event.time}</span>
                        <span>📍 {event.venue}</span>
                      </div>
                      <div className="attendance-bar">
                        <div 
                          className="attendance-fill"
                          style={{ width: `${(event.attendees / event.capacity) * 100}%` }}
                        />
                      </div>
                      <p className="attendance-text">{event.attendees}/{event.capacity} attending</p>
                      <div className="event-card-actions">
                        <Link to={`/event/${event.id}`} className="btn-view-details">
                          View Details
                        </Link>
                        <button 
                          className={`btn-rsvp ${myRsvps.includes(event.id) ? 'rsvped' : ''}`}
                          onClick={() => handleRsvp(event.id)}
                        >
                          {myRsvps.includes(event.id) ? '✓ RSVPED' : 'RSVP'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default StudentDashboard