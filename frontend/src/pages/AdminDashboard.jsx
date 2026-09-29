
import React, { useEffect, useState } from 'react'
import {
  Link,
  useNavigate
} from 'react-router-dom'
import api from '../services/api'
import { signOut } from '../services/auth'
import NotificationBell from '../components/NotificationBell'
import {
  Users,
  Building2,
  Activity,
  TrendingUp,
  Shield,
  Calendar,
  UserCheck,
  LogOut,
  FileText,
  RefreshCw,
  UsersRound,
  MousePointerClick,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'

import './AdminDashboard.css'

function AdminDashboard() {

  const navigate = useNavigate()
  const adminName = sessionStorage.getItem('userName') || 'Administrator'

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

  const [analytics, setAnalytics] = useState({
    traffic: { today_requests: 0, today_visitors: 0, active_visitors: 0, daily: [] },
    operations: {
      total_users: 0, total_venues: 0, events_today: 0,
      pending_reviews: 0, approval_rate: 0, total_registrations: 0,
      approved_events: 0, rejected_events: 0
    },
    reliability: { errors_last_14_days: 0, top_errors: [] }
  })

  const [analyticsError, setAnalyticsError] = useState('')
  const [analyticsRange, setAnalyticsRange] = useState(14)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)

  const [letterTemplate, setLetterTemplate] = useState({ college_name: '', signatory_name: '', signatory_title: '', reference_prefix: 'NEXUS', body_text: '', college_logo_url: '', club_logo_url: '', signature_url: '' })
  const [letterStatus, setLetterStatus] = useState('')
  const [letterSaving, setLetterSaving] = useState(false)

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

  const fetchAnalytics = async () => {
      setAnalyticsLoading(true)
      try {
        const response = await api.get('/analytics/admin-summary', { params: { days: analyticsRange } })
        setAnalytics(response.data)
        setAnalyticsError('')
      }
      catch {
        setAnalyticsError('Analytics could not be loaded.')
      }
      finally {
        setAnalyticsLoading(false)
      }
    }

  useEffect(() => {
    fetchAnalytics()
  }, [analyticsRange])

  const analyticsDaily = analytics.traffic.daily || []
  const totalPeriodVisitors = analyticsDaily.reduce((total, day) => total + day.visitors, 0)
  const totalPeriodRequests = analyticsDaily.reduce((total, day) => total + day.requests, 0)
  const maxDailyVisitors = Math.max(...analyticsDaily.map(day => day.visitors), 1)
  const chartScaleMax = maxDailyVisitors
  const chartTickValues = [...new Set([
    chartScaleMax,
    Math.ceil(chartScaleMax * 0.75),
    Math.ceil(chartScaleMax * 0.5),
    Math.ceil(chartScaleMax * 0.25),
    0
  ])]
  const peakDay = analyticsDaily.reduce(
    (peak, day) => day.visitors > peak.visitors ? day : peak,
    { date: '', visitors: 0, requests: 0 }
  )
  const chartPoints = analyticsDaily.map((day, index) => {
    const x = analyticsDaily.length > 1 ? (index / (analyticsDaily.length - 1)) * 100 : 50
    const y = 92 - (day.visitors / chartScaleMax) * 76
    return `${x},${y}`
  }).join(' ')
  const chartAreaPoints = chartPoints ? `0,100 ${chartPoints} 100,100` : ''
  const formattedAnalyticsDate = analytics.generated_at
    ? new Date(analytics.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '—'

  useEffect(() => {
    api.get('/letter-template').then(response => setLetterTemplate(response.data)).catch(() => setLetterStatus('Unable to load letter settings.'))
  }, [])

  const updateLetterField = (event) => setLetterTemplate(current => ({ ...current, [event.target.name]: event.target.value }))

  const saveLetterTemplate = async (event) => {
    event.preventDefault(); setLetterSaving(true); setLetterStatus('')
    try {
      const response = await api.patch('/letter-template', {
        college_name: letterTemplate.college_name,
        signatory_name: letterTemplate.signatory_name || null,
        signatory_title: letterTemplate.signatory_title || null,
        reference_prefix: letterTemplate.reference_prefix,
        body_text: letterTemplate.body_text || null
      })
      setLetterTemplate(response.data); setLetterStatus('Official letter settings saved.')
    } catch (error) { setLetterStatus(error.response?.data?.detail || 'Unable to save letter settings.') }
    finally { setLetterSaving(false) }
  }

  const uploadLetterAsset = async (asset, file) => {
    if (!file) return
    setLetterStatus('Uploading image…')
    const data = new FormData(); data.append('file', file)
    try {
      const response = await api.post(`/letter-template/assets/${asset}`, data)
      setLetterTemplate(response.data); setLetterStatus('Image uploaded. Save the text settings when ready.')
    } catch (error) { setLetterStatus(error.response?.data?.detail || 'Image upload failed.') }
  }

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
    catch (error) {
      setVenueError(
        error.response?.data?.detail ||
        'Unable to delete venue'
      )
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
    catch (error) {
      setVenueError(
        error.response?.data?.detail ||
        'Unable to update user role'
      )
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
    catch (error) {
      setVenueError(
        error.response?.data?.detail ||
        'Unable to delete user'
      )
    }

  }

  const handleStatusToggle = async (user) => {

    const nextActive = !user.is_active

    try {
      const response = await api.patch(
        `/users/${user.id}/status`,
        {
          is_active: nextActive
        }
      )

      setUsers(
        users.map(item =>
          item.id === user.id
            ? response.data
            : item
        )
      )
    }
    catch (error) {
      setVenueError(
        error.response?.data?.detail ||
        'Unable to update user status'
      )
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

          <NotificationBell />

          <button className="admin-user">

            <Shield size={16} />

            {adminName}

          </button>

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
              {analytics.operations.events_today}
            </h2>

          </div>

        </div>

        <div className="kpi-card">

          <Users size={20} />

          <div>

            <span>
              ACTIVE VISITORS
            </span>

            <h2>
              {analytics.traffic.active_visitors}
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
              {analytics.operations.pending_reviews}
            </h2>

          </div>

        </div>

        <div className="kpi-card">

          <Building2 size={20} />

          <div>

            <span>
              ACTIVE VENUES
            </span>

            <h2>
              {analytics.operations.total_venues}
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
            activeTab === 'events'
              ? 'active'
              : ''
          }
          onClick={() =>
            setActiveTab(
              'events'
            )
          }
        >
          Events
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

        <button
          className={activeTab === 'letter' ? 'active' : ''}
          onClick={() => setActiveTab('letter')}
        >
          <FileText size={15} />
          Letter Template
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
                  {analytics.operations.approval_rate}%
                </strong>

              </div>

              <div className="health-item">

                <span>
                  Active Venues
                </span>

                <strong>
                  {analytics.operations.total_venues}
                </strong>

              </div>

              <div className="health-item">

                <span>
                  Pending Reviews
                </span>

                <strong>
                  {analytics.operations.pending_reviews}
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
                  <button
                    className={[
                      'status-toggle',
                      user.is_active
                        ? 'is-active'
                        : 'is-inactive'
                    ].join(' ')}
                    onClick={() =>
                      handleStatusToggle(user)
                    }
                  >
                    {user.is_active
                      ? 'Active'
                      : 'Deactivated'}
                  </button>
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

      {activeTab === 'letter' && (
        <section className="letter-template-panel">
          <div className="letter-template-intro">
            <p>OFFICIAL DOCUMENT SETTINGS</p>
            <h2>Approved-event permission letter</h2>
            <span>Settings are captured when an event is approved, so later edits never change an existing letter.</span>
          </div>
          <form className="letter-template-form" onSubmit={saveLetterTemplate}>
            <div className="letter-text-settings">
              <label>College name<input name="college_name" value={letterTemplate.college_name || ''} onChange={updateLetterField} required /></label>
              <label>Reference prefix<input name="reference_prefix" value={letterTemplate.reference_prefix || ''} onChange={updateLetterField} required /></label>
              <label>Authorised signatory<input name="signatory_name" value={letterTemplate.signatory_name || ''} onChange={updateLetterField} placeholder="Principal / authorised officer" /></label>
              <label>Designation<input name="signatory_title" value={letterTemplate.signatory_title || ''} onChange={updateLetterField} placeholder="Principal" /></label>
              <label className="letter-body">Approval wording<textarea name="body_text" value={letterTemplate.body_text || ''} onChange={updateLetterField} placeholder="Leave blank for NEXUS's default wording. Variables: {{event_title}}, {{organizer}}, {{venue}}, {{event_date}}, {{start_time}}, {{end_time}}" /></label>
              <button type="submit" disabled={letterSaving}>{letterSaving ? 'Saving…' : 'Save letter settings'}</button>
              {letterStatus && <p className="letter-status">{letterStatus}</p>}
            </div>
            <div className="letter-assets">
              {[
                ['club-logo', 'Fallback club logo — top left', letterTemplate.club_logo_url],
                ['college-logo', 'College logo — top right', letterTemplate.college_logo_url],
                ['signature', 'Authorised signature', letterTemplate.signature_url]
              ].map(([asset, label, url]) => <label className="letter-asset" key={asset}>
                <span>{label}</span>
                {url ? <img src={url} alt="" /> : <div className="letter-asset-empty">No image uploaded</div>}
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => uploadLetterAsset(asset, event.target.files?.[0])} />
              </label>)}
            </div>
          </form>
        </section>
      )}

      {/* EVENTS */}

      {activeTab === 'events' && (

        <section className="admin-events-panel">

          <div className="admin-events-column">

            <div className="section-header">

              <h3>
                Pending Reviews
              </h3>

              <span>
                {pendingEvents.length}
              </span>

            </div>

            {pendingEvents.length ? pendingEvents.map(
              event => (

                <div
                  key={event.id}
                  className="admin-event-card pending"
                >

                  <div>

                    <span className="event-status">
                      {event.status}
                    </span>

                    <h3>
                      {event.title}
                    </h3>

                    <p>
                      {event.organizer}
                      {' • '}
                      {event.venue}
                    </p>

                    <small>
                      {new Date(event.date).toLocaleDateString()}
                      {event.start_time &&
                        ` • ${event.start_time}`}
                      {event.end_time &&
                        ` - ${event.end_time}`}
                    </small>

                  </div>

                  <Link
                    to={`/events/${event.id}`}
                    className="admin-event-link"
                  >
                    View Details
                  </Link>

                </div>

              )
            ) : (
              <div className="admin-empty-card">
                No pending reviews.
              </div>
            )}

          </div>

          <div className="admin-events-column">

            <div className="section-header">

              <h3>
                Approved Events
              </h3>

              <span>
                {approvedEvents.length}
              </span>

            </div>

            {approvedEvents.length ? approvedEvents.map(
              event => (

                <div
                  key={event.id}
                  className="admin-event-card approved"
                >

                  <div>

                    <span className="event-status">
                      {event.status}
                    </span>

                    <h3>
                      {event.title}
                    </h3>

                    <p>
                      {event.organizer}
                      {' • '}
                      {event.venue}
                    </p>

                    <small>
                      {new Date(event.date).toLocaleDateString()}
                      {' • '}
                      {event.attendees || 0}
                      /
                      {event.capacity}
                      {' '}
                      registrations
                    </small>

                  </div>

                  <Link
                    to={`/events/${event.id}`}
                    className="admin-event-link"
                  >
                    View Details
                  </Link>

                </div>

              )
            ) : (
              <div className="admin-empty-card">
                No approved events yet.
              </div>
            )}

          </div>

        </section>

      )}

      {/* ANALYTICS */}


      {activeTab === 'analytics' && (

        <section className="analytics-panel">

          <header className="analytics-hero">
            <div>
              <p>LIVE PLATFORM INTELLIGENCE</p>
              <h2>Command center</h2>
              <span>Privacy-preserving traffic, event operations and system reliability in one place.</span>
            </div>
            <div className="analytics-controls">
              <div className="analytics-range" aria-label="Analytics period">
                {[7, 14, 30].map((days) => (
                  <button
                    type="button"
                    className={analyticsRange === days ? 'active' : ''}
                    key={days}
                    onClick={() => setAnalyticsRange(days)}
                  >
                    {days}D
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="analytics-refresh"
                onClick={fetchAnalytics}
                disabled={analyticsLoading}
              >
                <RefreshCw size={15} className={analyticsLoading ? 'spinning' : ''} />
                {analyticsLoading ? 'Refreshing' : 'Refresh'}
              </button>
            </div>
          </header>

          <div className="analytics-live-strip">
            <span className="analytics-live-dot" />
            <strong>Live reporting</strong>
            <span>Last updated {formattedAnalyticsDate}</span>
            <span className="analytics-period-label">{analytics.period_days || analyticsRange}-day view</span>
          </div>

          {analyticsError && (
            <p className="analytics-error">{analyticsError}</p>
          )}

          <div className="analytics-kpi-grid">
            <article className="analytics-kpi-card traffic-kpi">
              <div className="analytics-kpi-icon"><UsersRound size={19} /></div>
              <p>Visitors today</p>
              <strong>{analytics.traffic.today_visitors}</strong>
              <span>{analytics.traffic.active_visitors} active in the last 5 minutes</span>
            </article>
            <article className="analytics-kpi-card request-kpi">
              <div className="analytics-kpi-icon"><MousePointerClick size={19} /></div>
              <p>API requests today</p>
              <strong>{analytics.traffic.today_requests}</strong>
              <span>{totalPeriodRequests} requests in this reporting period</span>
            </article>
            <article className="analytics-kpi-card approval-kpi">
              <div className="analytics-kpi-icon"><CheckCircle2 size={19} /></div>
              <p>Event approval rate</p>
              <strong>{analytics.operations.approval_rate}%</strong>
              <span>{analytics.operations.pending_reviews} request{analytics.operations.pending_reviews === 1 ? '' : 's'} waiting for review</span>
            </article>
            <article className="analytics-kpi-card reliability-kpi">
              <div className="analytics-kpi-icon"><AlertTriangle size={19} /></div>
              <p>Server errors</p>
              <strong>{analytics.reliability.errors_last_14_days}</strong>
              <span>Recorded in the last 14 days</span>
            </article>
          </div>

          <article className="analytics-trend-card">
            <div className="analytics-card-heading">
              <div>
                <p>VISITOR TREND</p>
                <h3>Daily visitor activity</h3>
              </div>
              <div className="analytics-trend-stat">
                <span>Period total</span>
                <strong>{totalPeriodVisitors}</strong>
              </div>
            </div>
            <div className="analytics-chart-area" aria-label="Daily visitor traffic chart">
              <div className="analytics-y-axis" aria-label="Visitor count scale">
                {chartTickValues.map((value) => {
                  const position = 92 - (value / chartScaleMax) * 76
                  return <span key={value} style={{ top: `${position}%` }}>{value}</span>
                })}
              </div>
              <div className="analytics-line-chart">
                <div className="analytics-chart-grid" aria-hidden="true">
                  {chartTickValues.map((value) => {
                    const position = 92 - (value / chartScaleMax) * 76
                    return <i key={value} style={{ top: `${position}%` }} />
                  })}
                </div>
                {chartPoints ? (
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`${analytics.period_days || analyticsRange} day visitor traffic`}>
                    <defs>
                      <linearGradient id="visitor-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#ff4848" stopOpacity=".42" />
                        <stop offset="100%" stopColor="#ff3131" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon points={chartAreaPoints} fill="url(#visitor-fill)" />
                    <polyline points={chartPoints} fill="none" stroke="#ff4b4b" strokeWidth="1.25" vectorEffect="non-scaling-stroke" />
                    {analyticsDaily.map((day, index) => {
                      const x = analyticsDaily.length > 1 ? (index / (analyticsDaily.length - 1)) * 100 : 50
                      const y = 92 - (day.visitors / chartScaleMax) * 76
                      return <circle key={day.date} cx={x} cy={y} r="1.7" fill="#fff" stroke="#ff3131" strokeWidth=".8" vectorEffect="non-scaling-stroke"><title>{`${day.date}: ${day.visitors} visitors, ${day.requests} requests`}</title></circle>
                    })}
                  </svg>
                ) : null}
              </div>
            </div>
            <div className="analytics-chart-labels" style={{ '--days': analyticsDaily.length || 1 }}>
              {analyticsDaily.map((day, index) => (
                <span key={day.date}>{analyticsDaily.length <= 7 || index === 0 || index === analyticsDaily.length - 1 || index % Math.ceil(analyticsDaily.length / 5) === 0 ? new Date(`${day.date}T00:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}</span>
              ))}
            </div>
          </article>

          <div className="analytics-detail-grid">
            <article className="analytics-operations-card">
              <div className="analytics-card-heading"><div><p>EVENT OPERATIONS</p><h3>Campus pulse</h3></div><Activity size={20} /></div>
              <div className="operations-metrics">
                <div><span>Registered</span><strong>{analytics.operations.total_registrations}</strong><small>across all events</small></div>
                <div><span>Approved</span><strong>{analytics.operations.approved_events}</strong><small>events published</small></div>
                <div><span>Venues</span><strong>{analytics.operations.total_venues}</strong><small>available to book</small></div>
                <div><span>Accounts</span><strong>{analytics.operations.total_users}</strong><small>on the platform</small></div>
              </div>
              <div className="analytics-peak-note"><TrendingUp size={16} /><span>{peakDay.visitors ? `Highest visitor activity: ${peakDay.visitors} on ${new Date(`${peakDay.date}T00:00:00`).toLocaleDateString([], { month: 'short', day: 'numeric' })}.` : 'Visitor activity will appear here as people use NEXUS.'}</span></div>
            </article>

            <article className="analytics-reliability-card">
              <div className="analytics-card-heading"><div><p>RELIABILITY</p><h3>System health</h3></div><Shield size={20} /></div>
              {analytics.reliability.top_errors.length ? (
                <ul className="error-list">
                  {analytics.reliability.top_errors.map((error) => (
                    <li key={`${error.path}-${error.status_code}`}>
                      <code>{error.status_code}</code><span>{error.path}</span><strong>{error.count}</strong>
                    </li>
                  ))}
                </ul>
              ) : <div className="healthy-state"><CheckCircle2 size={18} /><span>No server errors recorded in the last 14 days.</span></div>}
            </article>
          </div>

        </section>

      )}

    </div>

  )

}

export default AdminDashboard
