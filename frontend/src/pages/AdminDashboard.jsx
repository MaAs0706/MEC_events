import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import './AdminDashboard.css'

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  const [users, setUsers] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'student', joinDate: '2026-01-15' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'coordinator', joinDate: '2026-02-10' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'approver', joinDate: '2026-03-05' },
    { id: 4, name: 'Alex Brown', email: 'alex@example.com', role: 'student', joinDate: '2026-03-20' },
  ])

  const [venues, setVenues] = useState([
    { id: 1, name: 'Main Auditorium', location: 'Building A', capacity: 500, available: true },
    { id: 2, name: 'Tech Lab', location: 'Building B', capacity: 200, available: true },
    { id: 3, name: 'Sports Complex', location: 'Grounds', capacity: 800, available: false },
  ])

  const [categories, setCategories] = useState([
    { id: 1, name: 'Tech', icon: '🖥️' },
    { id: 2, name: 'Sports', icon: '⚽' },
    { id: 3, name: 'Cultural', icon: '🎭' },
  ])

  const [analytics, setAnalytics] = useState({
    totalEvents: 24,
    totalUsers: 850,
    totalAttendees: 3450,
    approvalRate: 92,
  })

  const [showNewVenueForm, setShowNewVenueForm] = useState(false)
  const [newVenue, setNewVenue] = useState({ name: '', location: '', capacity: '' })

  const handleAddVenue = () => {
    if (newVenue.name && newVenue.location && newVenue.capacity) {
      setVenues([...venues, {
        id: venues.length + 1,
        name: newVenue.name,
        location: newVenue.location,
        capacity: parseInt(newVenue.capacity),
        available: true
      }])
      setNewVenue({ name: '', location: '', capacity: '' })
      setShowNewVenueForm(false)
    }
  }

  return (
    <div className="admin-container">
      {/* Navigation */}
      <nav className="admin-nav">
        <div className="nav-content">
          <Link to="/" className="logo">NEXUS.</Link>
          <h2>Administrator Dashboard</h2>
          <div className="nav-actions">
            <button className="user-menu">👤 Admin</button>
            <Link to="/" className="logout">Sign out</Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="admin-content">
        {/* Navigation Tabs */}
        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button 
            className={`admin-tab ${activeTab === 'venues' ? 'active' : ''}`}
            onClick={() => setActiveTab('venues')}
          >
            Venues
          </button>
          <button 
            className={`admin-tab ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Categories
          </button>
        </div>

        {/* Tab Content */}
        <div className="admin-tabs-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <section className="overview-section">
              <h2>System Overview</h2>
              <div className="analytics-grid">
                <div className="stat-card">
                  <h3>Total Events</h3>
                  <p className="stat-number">{analytics.totalEvents}</p>
                  <span className="stat-label">Active on campus</span>
                </div>
                <div className="stat-card">
                  <h3>Total Users</h3>
                  <p className="stat-number">{analytics.totalUsers}</p>
                  <span className="stat-label">Registered users</span>
                </div>
                <div className="stat-card">
                  <h3>Total Attendees</h3>
                  <p className="stat-number">{analytics.totalAttendees}</p>
                  <span className="stat-label">Across all events</span>
                </div>
                <div className="stat-card">
                  <h3>Approval Rate</h3>
                  <p className="stat-number">{analytics.approvalRate}%</p>
                  <span className="stat-label">Events approved</span>
                </div>
              </div>

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button className="action-btn">📊 Generate Report</button>
                  <button className="action-btn">🔄 Sync Database</button>
                  <button className="action-btn">🛠️ System Settings</button>
                  <button className="action-btn">📧 Send Notification</button>
                </div>
              </div>
            </section>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <section className="users-section">
              <h2>User Management ({users.length})</h2>
              <div className="users-table">
                <div className="table-header">
                  <div className="col-name">Name</div>
                  <div className="col-email">Email</div>
                  <div className="col-role">Role</div>
                  <div className="col-date">Join Date</div>
                  <div className="col-actions">Actions</div>
                </div>
                {users.map((user) => (
                  <motion.div 
                    key={user.id}
                    className="table-row"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="col-name">{user.name}</div>
                    <div className="col-email">{user.email}</div>
                    <div className="col-role">
                      <span className={`role-badge ${user.role}`}>{user.role}</span>
                    </div>
                    <div className="col-date">{new Date(user.joinDate).toLocaleDateString()}</div>
                    <div className="col-actions">
                      <button className="btn-small">Edit</button>
                      <button className="btn-small danger">Delete</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Venues Tab */}
          {activeTab === 'venues' && (
            <section className="venues-section">
              <div className="venues-header">
                <h2>Venue Management ({venues.length})</h2>
                <button 
                  className="btn-add"
                  onClick={() => setShowNewVenueForm(!showNewVenueForm)}
                >
                  {showNewVenueForm ? '✕ Cancel' : '+ Add Venue'}
                </button>
              </div>

              {showNewVenueForm && (
                <motion.div 
                  className="venue-form"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h3>Add New Venue</h3>
                  <div className="form-group">
                    <label>Venue Name</label>
                    <input
                      type="text"
                      placeholder="Enter venue name"
                      value={newVenue.name}
                      onChange={(e) => setNewVenue({ ...newVenue, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Location</label>
                    <input
                      type="text"
                      placeholder="Enter location"
                      value={newVenue.location}
                      onChange={(e) => setNewVenue({ ...newVenue, location: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Capacity</label>
                    <input
                      type="number"
                      placeholder="Enter capacity"
                      value={newVenue.capacity}
                      onChange={(e) => setNewVenue({ ...newVenue, capacity: e.target.value })}
                    />
                  </div>
                  <button className="btn-submit" onClick={handleAddVenue}>Add Venue</button>
                </motion.div>
              )}

              <div className="venues-grid">
                {venues.map((venue) => (
                  <motion.div 
                    key={venue.id}
                    className="venue-card"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <h3>{venue.name}</h3>
                    <p className="venue-location">📍 {venue.location}</p>
                    <p className="venue-capacity">👥 {venue.capacity} capacity</p>
                    <div className="venue-status">
                      <span className={`status-indicator ${venue.available ? 'available' : 'unavailable'}`}>
                        {venue.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="venue-actions">
                      <button className="btn-small">Edit</button>
                      <button className="btn-small danger">Delete</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <section className="categories-section">
              <h2>Event Categories ({categories.length})</h2>
              <div className="categories-grid">
                {categories.map((category) => (
                  <motion.div 
                    key={category.id}
                    className="category-card"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="category-icon">{category.icon}</div>
                    <h3>{category.name}</h3>
                    <div className="category-actions">
                      <button className="btn-small">Edit</button>
                      <button className="btn-small danger">Delete</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard