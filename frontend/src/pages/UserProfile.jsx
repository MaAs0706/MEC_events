import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../services/api'
import {
  User,
  CalendarDays,
  Shield,
  Trophy
} from 'lucide-react'

import './UserProfile.css'

function UserProfile() {

  const [activeTab, setActiveTab] =
    useState('profile')

  const [editMode, setEditMode] =
    useState(false)

  const [userData, setUserData] =
    useState({
      name: '',
      email: '',
      phone: '',
      role: '',
      joinDate: '',
      bio: '',
      department: '',
      semester: ''
    })

  const [myRsvps, setMyRsvps] =
    useState([])

  const [settings, setSettings] =
    useState({
      emailNotifications: true,
      smsNotifications: false,
      eventReminders: true,
      twoFactor: false,
      profileVisibility: 'public'
    })

  const handleSettingChange = (key) => {

    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))

  }

  useEffect(() => {

    const fetchProfile = async () => {

      try {
        const [
          profileResponse,
          registrationsResponse
        ] = await Promise.all([
          api.get('/auth/me'),
          api.get('/auth/me/registrations')
        ])

        setUserData((currentData) => ({
          ...currentData,
          name: profileResponse.data.name,
          email: profileResponse.data.email,
          role: profileResponse.data.role
        }))

        setMyRsvps(registrationsResponse.data)
      }
      catch {
        setUserData((currentData) => ({
          ...currentData,
          name:
            localStorage.getItem('userName') ||
            '',
          email:
            localStorage.getItem('userEmail') ||
            '',
          role:
            localStorage.getItem('userRole') ||
            ''
        }))
      }

    }

    fetchProfile()

  }, [])

  return (
    <div className="profile-page">

      {/* NAVBAR */}

      <nav className="profile-nav">

        <Link
          to="/"
          className="profile-logo"
        >
          NEXUS.
        </Link>

        <div className="nav-right">

          <Link
            to="/dashboard/student"
            className="back-btn"
          >
            Back to Dashboard
          </Link>

        </div>

      </nav>

      {/* MAIN */}

      <div className="profile-layout">

        {/* LEFT */}

        <div className="profile-main">

          {/* HEADER */}

          <motion.div
            className="profile-header"
            initial={{
              opacity: 0,
              y: 20
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
          >

            <div className="header-left">

              <div className="avatar">

                <div className="avatar-ring">
                  AM
                </div>

              </div>

              <div className="header-info">

                <p className="profile-tag">
                  STUDENT PROFILE
                </p>

                <h1>
                  {userData.name}
                </h1>

                <p className="header-email">
                  {userData.email}
                </p>

                <div className="profile-stats">

                  <div>

                    <h4>
                      {myRsvps.length}
                    </h4>

                    <span>RSVPs</span>

                  </div>

                  <div>

                    <h4>
                      {
                        myRsvps.filter(
                          event =>
                            event.status ===
                            'approved'
                        ).length
                      }
                    </h4>

                    <span>Events</span>

                  </div>

                  <div>

                    <h4>
                      {userData.role || '—'}
                    </h4>

                    <span>Role</span>

                  </div>

                </div>

              </div>

            </div>

            <button
              className="edit-btn"
              onClick={() =>
                setEditMode(!editMode)
              }
            >

              {editMode
                ? 'Cancel'
                : 'Edit Profile'}

            </button>

          </motion.div>

          {/* TABS */}

          <div className="profile-tabs">

            <button
              className={`profile-tab ${
                activeTab === 'profile'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setActiveTab('profile')
              }
            >
              <User size={16} />
              Profile
            </button>

            <button
              className={`profile-tab ${
                activeTab === 'rsvps'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setActiveTab('rsvps')
              }
            >
              <CalendarDays size={16} />
              My RSVPs
            </button>

            <button
              className={`profile-tab ${
                activeTab === 'settings'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setActiveTab('settings')
              }
            >
              <Shield size={16} />
              Settings
            </button>

          </div>

          {/* PROFILE TAB */}

          {activeTab === 'profile' && (

            <div className="content-card">

              <div className="card-header">

                <h2>
                  Profile Information
                </h2>

              </div>

              {editMode ? (

                <form className="profile-form">

                  <div className="form-group">

                    <label>
                      Full Name
                    </label>

                    <input
                      type="text"
                      value={userData.name}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          name:
                            e.target.value
                        })
                      }
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Email
                    </label>

                    <input
                      type="email"
                      value={userData.email}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          email:
                            e.target.value
                        })
                      }
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Phone
                    </label>

                    <input
                      type="text"
                      value={userData.phone}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          phone:
                            e.target.value
                        })
                      }
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Department
                    </label>

                    <input
                      type="text"
                      value={userData.department}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          department:
                            e.target.value
                        })
                      }
                    />

                  </div>

                  <div className="form-group">

                    <label>
                      Semester
                    </label>

                    <input
                      type="text"
                      value={userData.semester}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          semester:
                            e.target.value
                        })
                      }
                    />

                  </div>

                  <div className="form-group full-width">

                    <label>
                      Bio
                    </label>

                    <textarea
                      rows="4"
                      value={userData.bio}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          bio:
                            e.target.value
                        })
                      }
                    />

                  </div>

                  <button className="save-btn">
                    Save Changes
                  </button>

                </form>

              ) : (

                <div className="info-grid">

                  <div className="info-item">

                    <span className="info-label">
                      Full Name
                    </span>

                    <span className="info-value">
                      {userData.name}
                    </span>

                  </div>

                  <div className="info-item">

                    <span className="info-label">
                      Department
                    </span>

                    <span className="info-value">
                      {userData.department}
                    </span>

                  </div>

                  <div className="info-item">

                    <span className="info-label">
                      Email
                    </span>

                    <span className="info-value">
                      {userData.email}
                    </span>

                  </div>

                  <div className="info-item">

                    <span className="info-label">
                      Semester
                    </span>

                    <span className="info-value">
                      {userData.semester}
                    </span>

                  </div>

                  <div className="info-item full-width">

                    <span className="info-label">
                      Bio
                    </span>

                    <span className="info-value">
                      {userData.bio}
                    </span>

                  </div>

                </div>

              )}

            </div>

          )}

          {/* RSVPS */}

          {activeTab === 'rsvps' && (

            <div className="content-card">

              <div className="card-header">

                <h2>
                  My RSVPs
                </h2>

              </div>

              <div className="rsvp-list">

                {myRsvps.length ? myRsvps.map((rsvp) => (

                  <div
                    className="rsvp-card"
                    key={rsvp.id}
                  >

                    <div>

                      <h3>
                        {rsvp.title}
                      </h3>

                      <p>
                        {new Date(
                          rsvp.date
                        ).toLocaleDateString()}
                      </p>

                    </div>

                    <span className="status-badge">
                      CONFIRMED
                    </span>

                  </div>

                )) : (
                  <div className="rsvp-card">
                    <div>
                      <h3>
                        No registrations yet.
                      </h3>

                      <p>
                        Registered events will appear here after you join an approved event.
                      </p>
                    </div>
                  </div>
                )}

              </div>

            </div>

          )}

          {/* SETTINGS */}

          {activeTab === 'settings' && (

            <div className="content-card">

              <div className="card-header">

                <h2>
                  Settings
                </h2>

              </div>

              <div className="settings-group">

                <div className="setting-item">

                  <div>

                    <h4>
                      Email Notifications
                    </h4>

                    <p>
                      Receive event updates
                    </p>

                  </div>

                  <label className="toggle-switch">

                    <input
                      type="checkbox"
                      checked={
                        settings.emailNotifications
                      }
                      onChange={() =>
                        handleSettingChange(
                          'emailNotifications'
                        )
                      }
                    />

                    <span className="slider"></span>

                  </label>

                </div>

                <div className="setting-item">

                  <div>

                    <h4>
                      Event Reminders
                    </h4>

                    <p>
                      Get reminders before events
                    </p>

                  </div>

                  <label className="toggle-switch">

                    <input
                      type="checkbox"
                      checked={
                        settings.eventReminders
                      }
                      onChange={() =>
                        handleSettingChange(
                          'eventReminders'
                        )
                      }
                    />

                    <span className="slider"></span>

                  </label>

                </div>

              </div>

            </div>

          )}

        </div>

        {/* RIGHT SIDEBAR */}

        <aside className="profile-sidebar">

          <div className="sidebar-card">

            <h3>
              Recent Activity
            </h3>

            <div className="activity-item">

              <span className="activity-dot"></span>

              No recent activity yet.

            </div>

          </div>

          <div className="sidebar-card">

            <h3>
              Achievements
            </h3>

            <div className="achievement-item">

              <Trophy size={18} />

              Achievements will appear here once activity tracking is connected.

            </div>

          </div>

        </aside>

      </div>

    </div>
  )
}

export default UserProfile
