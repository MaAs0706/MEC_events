
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import {
  Users,
  Building2,
  Activity,
  TrendingUp,
  Shield,
  Calendar,
  BarChart3,
  UserCheck
} from 'lucide-react'

import './AdminDashboard.css'

function AdminDashboard() {

  const [activeTab, setActiveTab] =
    useState('overview')

  const [venues, setVenues] =
    useState([])

  const [venueForm, setVenueForm] =
    useState({
      name: '',
      capacity: ''
    })

  const [venueError, setVenueError] =
    useState('')

  const [approvedEvents, setApprovedEvents] =
    useState([])

  const [pendingEvents, setPendingEvents] =
    useState([])

  const [users, setUsers] =
    useState([])

  const [userForm, setUserForm] =
    useState({
      full_name: '',
      email: '',
      password: '',
      role: 'coordinator'
    })

  const allEvents = [
    ...approvedEvents,
    ...pendingEvents
  ]

  const analytics = {
    activeUsers: users.length,
    eventsToday: allEvents.filter(
      event =>
        event.date ===
        new Date().toISOString().slice(0, 10)
    ).length,
    pendingReviews: pendingEvents.length,
    approvalRate: allEvents.length
      ? Math.round(
        approvedEvents.length / allEvents.length * 100
      )
      : 0,
    totalAttendees: allEvents.reduce(
      (total, event) =>
        total + (event.attendees || 0),
      0
    ),
    venueUtilization: venues.length
      ? Math.round(
        allEvents.filter(
          event =>
            ['pending', 'approved'].includes(
              event.status
            )
        ).length / venues.length * 100
      )
      : 0
  }

  const categories =
    Object.entries(
      allEvents.reduce(
        (counts, event) => ({
          ...counts,
          [event.category]:
            (counts[event.category] || 0) + 1
        }),
        {}
      )
    ).map(
      ([name, eventCount]) => ({
        name,
        events: eventCount
      })
    )

  const activityFeed =
    allEvents
      .slice(0, 5)
      .map(
        event =>
          `${event.title} is ${event.status}`
      )

  useEffect(() => {

    const fetchVenues = async () => {

      try {
        const response =
          await api.get('/venues')

        setVenues(response.data)
      }
      catch {
        setVenueError('Unable to load venues')
      }

    }

    fetchVenues()

  }, [])

  useEffect(() => {

    const fetchUsers = async () => {

      try {
        const response =
          await api.get('/users')

        setUsers(response.data)
      }
      catch {
        setVenueError('Unable to load users')
      }

    }

    fetchUsers()

  }, [])

  useEffect(() => {

    const fetchEvents = async () => {

      try {
        const [
          approvedResponse,
          pendingResponse
        ] = await Promise.all([
          api.get('/events'),
          api.get('/events/pending')
        ])

        setApprovedEvents(approvedResponse.data)
        setPendingEvents(pendingResponse.data)
      }
      catch {
        setVenueError('Unable to load admin dashboard data')
      }

    }

    fetchEvents()

  }, [])

  const handleVenueFormChange = (e) => {

    const { name, value } = e.target

    setVenueForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }))

  }

  const handleUserFormChange = (e) => {

    const { name, value } = e.target

    setUserForm((currentForm) => ({
      ...currentForm,
      [name]: value
    }))

  }

  const handleCreateUser = async (e) => {

    e.preventDefault()
    setVenueError('')

    try {
      const response = await api.post(
        '/users',
        userForm
      )

      setUsers([
        response.data,
        ...users
      ])

      setUserForm({
        full_name: '',
        email: '',
        password: '',
        role: 'coordinator'
      })
    }
    catch {
      setVenueError('Unable to create user')
    }

  }

  const handleCreateVenue = async (e) => {

    e.preventDefault()
    setVenueError('')

    try {
      const response = await api.post(
        '/venues',
        {
          name: venueForm.name,
          capacity: Number(venueForm.capacity)
        }
      )

      setVenues([
        ...venues,
        response.data
      ])

      setVenueForm({
        name: '',
        capacity: ''
      })
    }
    catch {
      setVenueError('Unable to create venue')
    }

  }

  const handleDeleteVenue = async (venueId) => {

    setVenueError('')

    try {
      await api.delete(`/venues/${venueId}`)

      setVenues(
        venues.filter(
          venue => venue.id !== venueId
        )
      )
    }
    catch {
      setVenueError('Unable to delete venue')
    }

  }

  const handleRoleChange = async (
    userId,
    role
  ) => {

    try {
      const response = await api.patch(
        `/users/${userId}/role`,
        {
          role
        }
      )

      setUsers(
        users.map(user =>
          user.id === userId
            ? response.data
            : user
        )
      )
    }
    catch {
      setVenueError('Unable to update user role')
    }

  }

  const handleDeleteUser = async (userId) => {

    try {
      await api.delete(`/users/${userId}`)

      setUsers(
        users.filter(
          user => user.id !== userId
        )
      )
    }
    catch {
      setVenueError('Unable to delete user')
    }

  }

  return (

    <div className="admin-dashboard">

      {/* NAV */}

      <nav className="admin-nav">

        <div className="nav-left">

          <Link
            to="/"
            className="admin-logo"
          >
            NEXUS.
          </Link>

          <span className="nav-divider"></span>

          <p>
            SYSTEM COMMAND CENTER
          </p>

        </div>

        <div className="nav-right">

          <button className="admin-user">

            <Shield size={16} />

            Administrator

          </button>

        </div>

      </nav>

      {/* HERO */}

      <section className="admin-hero">

        <div>

          <p className="hero-label">
            PLATFORM GOVERNANCE
          </p>

          <h1>
            Campus Operations Overview
          </h1>

          <p className="hero-description">
            Monitor platform health,
            users, venues, approvals
            and ecosystem growth.
          </p>

        </div>

      </section>

      {/* KPI */}

      <section className="kpi-grid">

        <div className="kpi-card">

          <Calendar size={20} />

          <div>

            <span>
              EVENTS TODAY
            </span>

            <h2>
              {analytics.eventsToday}
            </h2>

          </div>

        </div>

        <div className="kpi-card">

          <Users size={20} />

          <div>

            <span>
              ACTIVE USERS
            </span>

            <h2>
              {analytics.activeUsers}
            </h2>

          </div>

        </div>

        <div className="kpi-card">

          <UserCheck size={20} />

          <div>

            <span>
              PENDING REVIEWS
            </span>

            <h2>
              {analytics.pendingReviews}
            </h2>

          </div>

        </div>

        <div className="kpi-card">

          <Building2 size={20} />

          <div>

            <span>
              VENUE UTILIZATION
            </span>

            <h2>
              {analytics.venueUtilization}%
            </h2>

          </div>

        </div>

      </section>

      {/* TABS */}

      <section className="admin-tabs">

        <button
          className={
            activeTab === 'overview'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveTab(
              'overview'
            )
          }
        >
          Overview
        </button>

        <button
          className={
            activeTab === 'users'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveTab(
              'users'
            )
          }
        >
          Users
        </button>

        <button
          className={
            activeTab === 'operations'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveTab(
              'operations'
            )
          }
        >
          Operations
        </button>

        <button
          className={
            activeTab === 'analytics'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveTab(
              'analytics'
            )
          }
        >
          Analytics
        </button>

      </section>

      {/* OVERVIEW */}

      {activeTab === 'overview' && (

        <div className="overview-layout">

          <div className="platform-health">

            <div className="section-header">

              <h3>
                Platform Health
              </h3>

            </div>

            <div className="health-list">

              <div className="health-item">

                <span>
                  System Status
                </span>

                <strong>
                  Operational
                </strong>

              </div>

              <div className="health-item">

                <span>
                  Approval Rate
                </span>

                <strong>
                  {approvedEvents.length || allEvents.length
                    ? `${Math.round(
                      approvedEvents.length /
                      Math.max(allEvents.length, 1) *
                      100
                    )}%`
                    : '0%'}
                </strong>

              </div>

              <div className="health-item">

                <span>
                  Active Venues
                </span>

                <strong>
                  {venues.length}
                </strong>

              </div>

              <div className="health-item">

                <span>
                  Pending Reviews
                </span>

                <strong>
                  {pendingEvents.length}
                </strong>

              </div>

            </div>

          </div>

          <div className="activity-feed">

            <div className="section-header">

              <h3>
                System Activity
              </h3>

            </div>

            {activityFeed.length ? activityFeed.map(
              (
                item,
                index
              ) => (

                <div
                  key={index}
                  className="activity-item"
                >

                  <span className="activity-dot"></span>

                  {item}

                </div>

              )
            ) : (
              <div className="activity-item">
                No recent activity.
              </div>
            )}

          </div>

        </div>

      )}

      {/* USERS */}

      {activeTab === 'users' && (

        <section className="users-panel">

          <form
            className="admin-create-form"
            onSubmit={handleCreateUser}
          >

            <div>

              <h3>
                Create Platform Account
              </h3>

              <p>
                Add coordinators, approvers,
                admins, or students directly
                from the admin dashboard.
              </p>

            </div>

            <input
              name="full_name"
              placeholder="Full name"
              value={userForm.full_name}
              onChange={handleUserFormChange}
              required
            />

            <input
              name="email"
              type="email"
              placeholder="Email"
              value={userForm.email}
              onChange={handleUserFormChange}
              required
            />

            <input
              name="password"
              type="password"
              placeholder="Temporary password"
              value={userForm.password}
              onChange={handleUserFormChange}
              required
            />

            <select
              name="role"
              value={userForm.role}
              onChange={handleUserFormChange}
            >
              <option value="coordinator">
                coordinator
              </option>
              <option value="approver">
                approver
              </option>
              <option value="admin">
                admin
              </option>
              <option value="student">
                student
              </option>
            </select>

            <button type="submit">
              Create Account
            </button>

          </form>

          {venueError && (
            <p className="venue-error">
              {venueError}
            </p>
          )}

          <div className="user-stats">

            <div className="mini-card">

              <h3>
                {
                  users.filter(
                    user =>
                      user.role === 'student'
                  ).length
                }
              </h3>

              <span>
                Students
              </span>

            </div>

            <div className="mini-card">

              <h3>
                {
                  users.filter(
                    user =>
                      user.role === 'coordinator'
                  ).length
                }
              </h3>

              <span>
                Coordinators
              </span>

            </div>

            <div className="mini-card">

              <h3>
                {
                  users.filter(
                    user =>
                      user.role === 'approver'
                  ).length
                }
              </h3>

              <span>
                Approvers
              </span>

            </div>

            <div className="mini-card">

              <h3>
                {
                  users.filter(
                    user =>
                      user.role === 'admin'
                  ).length
                }
              </h3>

              <span>
                Admins
              </span>

            </div>

          </div>

          <div className="users-table">

            {users.length ? users.map(user => (

              <div
                key={user.id}
                className="user-row"
              >

                <div>
                  {user.full_name}
                  <span>
                    {user.email}
                  </span>
                </div>

                <div>
                  <select
                    value={user.role}
                    onChange={(event) =>
                      handleRoleChange(
                        user.id,
                        event.target.value
                      )
                    }
                  >
                    <option value="student">
                      student
                    </option>
                    <option value="coordinator">
                      coordinator
                    </option>
                    <option value="approver">
                      approver
                    </option>
                    <option value="admin">
                      admin
                    </option>
                  </select>
                </div>

                <div>
                  Active
                </div>

                <button
                  className="venue-delete"
                  onClick={() =>
                    handleDeleteUser(user.id)
                  }
                >
                  Remove
                </button>

              </div>

            )) : (
              <div className="user-row">
                <div>
                  No users found yet.
                </div>
              </div>
            )}

          </div>

        </section>

      )}

      {/* OPERATIONS */}

      {activeTab === 'operations' && (

        <section className="operations-grid">

          <div className="operations-card">

            <h3>
              Venue Management
            </h3>

            <form
              className="venue-form"
              onSubmit={handleCreateVenue}
            >

              {venueError && (
                <p className="venue-error">
                  {venueError}
                </p>
              )}

              <input
                name="name"
                placeholder="Venue name"
                value={venueForm.name}
                onChange={handleVenueFormChange}
                required
              />

              <input
                name="capacity"
                type="number"
                min="1"
                placeholder="Capacity"
                value={venueForm.capacity}
                onChange={handleVenueFormChange}
                required
              />

              <button type="submit">
                Add Venue
              </button>

            </form>

            {venues.map(
              venue => (

                <div
                  key={venue.id}
                  className="venue-row"
                >

                  <div>

                    <strong>
                      {venue.name}
                    </strong>

                    <span>
                      {venue.capacity}
                      {' '}
                      capacity
                    </span>

                  </div>

                  <button
                    className="venue-delete"
                    onClick={() =>
                      handleDeleteVenue(venue.id)
                    }
                  >
                    Remove
                  </button>

                </div>

              )
            )}

          </div>

          <div className="operations-card">

            <h3>
              Event Ecosystem
            </h3>

            {categories.length ? categories.map(
              category => (

                <div
                  key={
                    category.name
                  }
                  className="venue-row"
                >

                  <span>
                    {category.name}
                  </span>

                  <strong>
                    {
                      category.events
                    }
                  </strong>

                </div>

              )
            ) : (
              <div className="venue-row">
                <span>
                  No event categories yet
                </span>
              </div>
            )}

          </div>

        </section>

      )}

      {/* ANALYTICS */}

      {activeTab === 'analytics' && (

        <section className="analytics-panel">

          <div className="analytics-card">

            <BarChart3
              size={24}
            />

            <h3>
              Approval Trend
            </h3>

            <p>
              {analytics.approvalRate}%
              {' '}
              approval rate across
              submitted events.
            </p>

          </div>

          <div className="analytics-card">

            <TrendingUp
              size={24}
            />

            <h3>
              User Growth
            </h3>

            <p>
              {users.length}
              {' '}
              platform accounts
              currently exist.
            </p>

          </div>

          <div className="analytics-card">

            <Activity
              size={24}
            />

            <h3>
              Attendance
            </h3>

            <p>
              {analytics.totalAttendees}
              {' '}
              attendees across
              tracked events.
            </p>

          </div>

        </section>

      )}

    </div>

  )

}

export default AdminDashboard
