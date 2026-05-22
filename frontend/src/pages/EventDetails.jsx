import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import './EventDetails.css'

function EventDetails() {
  const { id } = useParams()
  const [isRsvped, setIsRsvped] = useState(false)

  const event = {
    id: 1,
    title: 'TechHack 2026',
    description: 'Build amazing projects in 24 hours with your team. Join hundreds of developers, designers, and students for an intense coding marathon. Win prizes, network with industry professionals, and showcase your skills!',
    date: '2026-04-25',
    time: '09:00 AM',
    endTime: '09:00 AM (Next day)',
    venue: 'Main Auditorium, Building A',
    attendees: 234,
    capacity: 500,
    category: 'tech',
    image: '🖥️',
    organizer: 'Tech Club',
    contact: 'techclub@college.edu',
    tags: ['coding', 'hackathon', '24-hour', 'prizes'],
    requirements: [
      'Laptop and charger',
      'Valid college ID',
      'Willingness to code',
      'Team registration (3-5 members)'
    ],
    agenda: [
      { time: '9:00 AM', event: 'Registration & Breakfast' },
      { time: '10:00 AM', event: 'Opening Ceremony & Problem Statement' },
      { time: '10:30 AM', event: 'Coding Starts' },
      { time: '1:00 PM', event: 'Lunch Break' },
      { time: '9:00 AM (Day 2)', event: 'Coding Ends' },
      { time: '9:30 AM', event: 'Project Presentations' },
      { time: '11:00 AM', event: 'Winners Announcement' },
      { time: '12:00 PM', event: 'Closing & Refreshments' }
    ],
    attendeesList: [
      { name: 'John Doe', role: 'Student' },
      { name: 'Jane Smith', role: 'Student' },
      { name: 'Mike Johnson', role: 'Mentor' },
      { name: 'Sarah Williams', role: 'Student' },
      { name: 'Alex Brown', role: 'Student' },
      { name: '+ 229 more attending'  }
    ]
  }

  return (
    <div className="event-details-container">
      {/* Navigation */}
      <nav className="event-nav">
        <div className="nav-content">
          <Link to="/" className="logo">NEXUS.</Link>
          <h2>Event Details</h2>
          <Link to="/dashboard/student" className="back-btn">← Back</Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="event-details-content">
        <motion.div 
          className="event-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="event-image-large">{event.image}</div>
          <div className="event-header-info">
            <h1>{event.title}</h1>
            <p className="event-organizer">by {event.organizer}</p>
            <div className="event-tags">
              {event.tags.map((tag, index) => (
                <span key={index} className="tag">#{tag}</span>
              ))}
            </div>
          </div>
        </motion.div>

        <div className="event-details-grid">
          {/* Main Content */}
          <main className="event-main">
            <section className="description-section">
              <h2>About This Event</h2>
              <p>{event.description}</p>
            </section>

            <section className="details-section">
              <h2>Event Details</h2>
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">📅 DATE</span>
                  <span className="detail-value">{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">🕐 TIME</span>
                  <span className="detail-value">{event.time} - {event.endTime}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">📍 VENUE</span>
                  <span className="detail-value">{event.venue}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">👥 CAPACITY</span>
                  <span className="detail-value">{event.attendees}/{event.capacity}</span>
                </div>
              </div>
            </section>

            <section className="requirements-section">
              <h2>What to Bring</h2>
              <ul className="requirements-list">
                {event.requirements.map((req, index) => (
                  <li key={index}>✓ {req}</li>
                ))}
              </ul>
            </section>

            <section className="agenda-section">
              <h2>Event Schedule</h2>
              <div className="timeline">
                {event.agenda.map((item, index) => (
                  <motion.div 
                    key={index}
                    className="timeline-item"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="timeline-time">{item.time}</div>
                    <div className="timeline-event">{item.event}</div>
                  </motion.div>
                ))}
              </div>
            </section>

            <section className="attendees-section">
              <h2>Attendees ({event.attendees})</h2>
              <div className="attendees-grid">
                {event.attendeesList.map((attendee, index) => (
                  <div key={index} className="attendee-card">
                    <div className="attendee-avatar">👤</div>
                    <div className="attendee-info">
                      <p className="attendee-name">{attendee.name}</p>
                      <p className="attendee-role">{attendee.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>

          {/* Sidebar */}
          <aside className="event-sidebar">
            <motion.div 
              className="rsvp-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h3>Interested?</h3>
              <button 
                className={`btn-rsvp-large ${isRsvped ? 'rsvped' : ''}`}
                onClick={() => setIsRsvped(!isRsvped)}
              >
                {isRsvped ? '✓ YOU\'RE GOING' : 'RSVP NOW'}
              </button>
              
              <div className="event-stats">
                <div className="stat">
                  <strong>{event.attendees}</strong>
                  <span>Already Going</span>
                </div>
                <div className="stat">
                  <strong>{event.capacity - event.attendees}</strong>
                  <span>Spots Left</span>
                </div>
              </div>

              <div className="attendance-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${(event.attendees / event.capacity) * 100}%` }}
                  />
                </div>
                <p className="progress-text">{Math.round((event.attendees / event.capacity) * 100)}% Full</p>
              </div>
            </motion.div>

            <motion.div 
              className="contact-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h3>Questions?</h3>
              <div className="contact-info">
                <p><strong>Organizer:</strong> {event.organizer}</p>
                <p><strong>Email:</strong> <a href={`mailto:${event.contact}`}>{event.contact}</a></p>
              </div>
            </motion.div>

            <motion.div 
              className="share-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3>Share Event</h3>
              <div className="share-buttons">
                <button className="share-btn">📱 Whatsapp</button>
                <button className="share-btn">📧 Email</button>
                <button className="share-btn">🔗 Copy Link</button>
              </div>
            </motion.div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default EventDetails