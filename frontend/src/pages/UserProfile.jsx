import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import './UserProfile.css'

function UserProfile() {
  const [activeTab, setActiveTab] = useState('profile')
  const [editMode, setEditMode] = useState(false)

  const [userData, setUserData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+91 9876543210',
    role: 'student',
    joinDate: '2026-01-15',
    bio: 'Passionate about technology and coding',
    department: 'Computer Science',
    semester: '2nd Year'
  })

  const [myRsvps, setMyRsvps] = useState([
    { id: 1, title: 'TechHack 2026', date: '2026-04-25', status: 'confirmed' },
    { id: 3, title: 'Football Finals', date: '2026-05-01', status: 'confirmed' },
  ])

  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    eventReminders: true,
    twoFactor: false,
    profileVisibility: 'public'
  })

  const handleSettingChange = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <div className="profile-container">
      {/* Navigation */}
      <nav className="profile-nav">
        <div className="nav-content">
          <Link to="/" className="logo">NEXUS.</Link>
          <h2>My Profile</h2>
          <Link to="/dashboard/student" className="back-btn">← Back</Link>
        </div>
      </nav>

      {/* Main Content */}
      <div className="profile-content">
        {/* Profile Header */}
        <motion.div 
          className="profile-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="avatar">👤</div>
          <div className="header-info">
            <h1>{userData.name}</h1>
            <p className="header-role">{userData.role.toUpperCase()}</p>
            <p className="header-email">{userData.email}</p>
            <button 
              className="btn-edit-profile"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`profile-tab ${activeTab === 'rsvps' ? 'active' : ''}`}
            onClick={() => setActiveTab('rsvps')}
          >
            My RSVPs
          </button>
          <button 
            className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <section className="profile-section">
              <div className="section-header">
                <h2>Profile Information</h2>
              </div>

              {editMode ? (
                <motion.form 
                  className="profile-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text"
                      value={userData.name}
                      onChange={(e) => setUserData({...userData, name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      type="email"
                      value={userData.email}
                      onChange={(e) => setUserData({...userData, email: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input 
                      type="tel"
                      value={userData.phone}
                      onChange={(e) => setUserData({...userData, phone: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Bio</label>
                    <textarea 
                      value={userData.bio}
                      onChange={(e) => setUserData({...userData, bio: e.target.value})}
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <input 
                      type="text"
                      value={userData.department}
                      onChange={(e) => setUserData({...userData, department: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Semester</label>
                    <input 
                      type="text"
                      value={userData.semester}
                      onChange={(e) => setUserData({...userData, semester: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="btn-save">Save Changes</button>
                </motion.form>
              ) : (
                <div className="profile-info">
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="info-label">Full Name</span>
                      <span className="info-value">{userData.name}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Email</span>
                      <span className="info-value">{userData.email}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Phone</span>
                      <span className="info-value">{userData.phone}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Role</span>
                      <span className="info-value">{userData.role}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Department</span>
                      <span className="info-value">{userData.department}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Semester</span>
                      <span className="info-value">{userData.semester}</span>
                    </div>
                    <div className="info-item full-width">
                      <span className="info-label">Bio</span>
                      <span className="info-value">{userData.bio}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Member Since</span>
                      <span className="info-value">{new Date(userData.joinDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* RSVPs Tab */}
          {activeTab === 'rsvps' && (
            <section className="rsvps-section">
              <div className="section-header">
                <h2>My RSVPs ({myRsvps.length})</h2>
              </div>

              {myRsvps.length === 0 ? (
                <div className="empty-state">
                  <p>No RSVPs yet</p>
                  <Link to="/dashboard/student" className="btn-explore">Explore Events</Link>
                </div>
              ) : (
                <div className="rsvps-list">
                  {myRsvps.map((rsvp, index) => (
                    <motion.div 
                      key={rsvp.id}
                      className="rsvp-card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="rsvp-info">
                        <h3>{rsvp.title}</h3>
                        <p>📅 {new Date(rsvp.date).toLocaleDateString()}</p>
                      </div>
                      <div className="rsvp-status">
                        <span className={`status-badge ${rsvp.status}`}>
                          {rsvp.status.toUpperCase()}
                        </span>
                      </div>
                      <button className="btn-view-event">View Event</button>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <section className="settings-section">
              <div className="section-header">
                <h2>Account Settings</h2>
              </div>

              <div className="settings-group">
                <h3>Notifications</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Email Notifications</h4>
                    <p>Receive event updates via email</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={() => handleSettingChange('emailNotifications')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>SMS Notifications</h4>
                    <p>Receive event updates via SMS</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox"
                      checked={settings.smsNotifications}
                      onChange={() => handleSettingChange('smsNotifications')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Event Reminders</h4>
                    <p>Get reminded before events start</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox"
                      checked={settings.eventReminders}
                      onChange={() => handleSettingChange('eventReminders')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="settings-group">
                <h3>Security</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Two-Factor Authentication</h4>
                    <p>Add an extra layer of security</p>
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox"
                      checked={settings.twoFactor}
                      onChange={() => handleSettingChange('twoFactor')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <button className="btn-change-password">Change Password</button>
              </div>

              <div className="settings-group">
                <h3>Privacy</h3>
                <div className="setting-item">
                  <div className="setting-info">
                    <h4>Profile Visibility</h4>
                    <p>Control who can see your profile</p>
                  </div>
                  <select value={settings.profileVisibility} onChange={(e) => setSettings({...settings, profileVisibility: e.target.value})}>
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              <div className="settings-group danger">
                <h3>Danger Zone</h3>
                <button className="btn-delete-account">Delete Account</button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfile