import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  Calendar,
  MapPin,
  Clock3,
  Bell,
  LogOut,
  User,
  TrendingUp
} from 'lucide-react'

import './StudentDashboard.css'

function StudentDashboard() {
  const [selectedCategory, setSelectedCategory] = useState('all')

  const events = [
    {
      id: 1,
      title: 'TechHack 2026',
      description: 'Build amazing projects in 24 hours with developers across campus.',
      date: '25 Apr 2026',
      time: '09:00 AM',
      venue: 'Main Auditorium',
      attendees: 234,
      category: 'tech',
      image:
        'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id: 2,
      title: 'Spring Concert',
      description: 'Experience music performances by talented campus artists.',
      date: '27 Apr 2026',
      time: '06:00 PM',
      venue: 'Open Grounds',
      attendees: 450,
      category: 'cultural',
      image:
        'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=1200&auto=format&fit=crop'
    },
    {
      id: 3,
      title: 'Football Finals',
      description: 'Inter-college football championship with top teams.',
      date: '01 May 2026',
      time: '03:00 PM',
      venue: 'Sports Complex',
      attendees: 320,
      category: 'sports',
      image:
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=1200&auto=format&fit=crop'
    }
  ]

  return (
    <div className="dashboard">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">NEXUS.</div>

        <div className="search-box">
          <Search size={18} />
          <input type="text" placeholder="Search events..." />
        </div>

        <div className="nav-right">
          <button className="icon-btn">
            <Bell size={18} />
          </button>

          <button className="profile-btn">
            <User size={16} />
            Profile
          </button>

          <button className="logout-btn">
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-left">
          <p className="hero-tag">WELCOME BACK</p>

          <h1>
            Discover Amazing
            <br />
            Campus Events
          </h1>

          <p className="hero-description">
            Join hackathons, concerts, workshops and competitions happening
            around your campus.
          </p>

          <div className="hero-buttons">
            <button className="primary-btn">Explore Events</button>
            <button className="secondary-btn">My RSVPs</button>
          </div>
        </div>

        <div className="hero-right">
          <div className="stat-card">
            <TrendingUp size={20} />
            <h2>24</h2>
            <p>Upcoming Events</p>
          </div>

          <div className="stat-card">
            <Calendar size={20} />
            <h2>8</h2>
            <p>Events Joined</p>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="content-wrapper">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <h3>Filters</h3>

          <div className="filter-group">
            <label>Category</label>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="tech">Tech</option>
              <option value="sports">Sports</option>
              <option value="cultural">Cultural</option>
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

          <button className="clear-btn">Clear Filters</button>
        </aside>

        {/* EVENTS */}
        <main className="main-content">
          <div className="section-header">
            <h2>Trending Events</h2>
            <Link to="/">View All</Link>
          </div>

          <div className="events-grid">
            {events.map((event, index) => (
              <motion.div
                className="event-card"
                key={event.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <div
                  className="event-image"
                  style={{
                    backgroundImage: `url(${event.image})`
                  }}
                >
                  <div className="overlay" />
                </div>

                <div className="event-content">
                  <span className={`badge ${event.category}`}>
                    {event.category}
                  </span>

                  <h3>{event.title}</h3>

                  <p>{event.description}</p>

                  <div className="event-meta">
                    <div>
                      <Calendar size={14} />
                      {event.date}
                    </div>

                    <div>
                      <Clock3 size={14} />
                      {event.time}
                    </div>

                    <div>
                      <MapPin size={14} />
                      {event.venue}
                    </div>
                  </div>

                  <div className="card-footer">
                    <span>{event.attendees}+ attending</span>

                    <button className="join-btn">Join Event</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

export default StudentDashboard