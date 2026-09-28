import React, { useEffect, useState } from 'react'
import {
  Link,
  useNavigate
} from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../services/api'
import { signOut } from '../services/auth'
import {
  User,
  CalendarDays,
  LogOut
} from 'lucide-react'

import './UserProfile.css'

function UserProfile() {

  const navigate = useNavigate()

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
      className: ''
    })

  const [myRsvps, setMyRsvps] =
    useState([])

  const [saveMessage, setSaveMessage] =
    useState('')

  const initials = userData.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'N'

  const handleSaveProfile = async (e) => {

    e.preventDefault()
    setSaveMessage('')

    try {
      const response = await api.patch(
        '/auth/me',
        {
          full_name: userData.name,
          email: userData.email,
          phone: userData.phone,
          class_name: userData.className
        }
      )

      localStorage.setItem(
        'userName',
        response.data.name
      )

      setUserData((currentData) => ({
        ...currentData,
        name: response.data.name,
        email: response.data.email,
        phone:
          response.data.phone || '',
        className:
          response.data.class_name || ''
      }))

      setEditMode(false)
      setSaveMessage('Profile updated')
    }
    catch {
      setSaveMessage('Unable to save profile')
    }

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
          role: profileResponse.data.role,
          className:
            profileResponse.data.class_name || '',
          phone:
            profileResponse.data.phone || ''
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

          <button
            className="signout-btn"
            onClick={() =>
              signOut(navigate)
            }
          >
            <LogOut size={16} />
            Sign out
          </button>

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
                  {initials}
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

                <form
                  className="profile-form"
                  onSubmit={handleSaveProfile}
                >

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
                      Class
                    </label>

                    <input
                      type="text"
                      value={userData.className}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          className:
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

                  {saveMessage && (
                    <p className="form-error">
                      {saveMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="save-btn"
                  >
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
                      Email
                    </span>

                    <span className="info-value">
                      {userData.email}
                    </span>

                  </div>

                  <div className="info-item">

                    <span className="info-label">
                      Class
                    </span>

                    <span className="info-value">
                      {userData.className || '—'}
                    </span>

                  </div>

                  <div className="info-item">

                    <span className="info-label">
                      Phone
                    </span>

                    <span className="info-value">
                      {userData.phone || '—'}
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

        </div>

      </div>

    </div>
  )
}

export default UserProfile
