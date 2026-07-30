import React, { useEffect, useState } from 'react'
import {
  Link,
  useNavigate
} from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../services/api'
import { signOut } from '../services/auth'

import {
  Calendar,
  Building2,
  FileText,
  Users,
  BarChart3,
  Download,
  LogOut
} from 'lucide-react'

import './CoordinatorDashboard.css'

function CoordinatorDashboard() {

  const today = new Date()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] =
    useState('calendar')

  const [selectedDate, setSelectedDate] =
    useState(today.getDate())

  const [visibleMonth, setVisibleMonth] =
    useState(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    )

  const [selectedVenue, setSelectedVenue] =
    useState('Main Auditorium')

  const [showCreateForm, setShowCreateForm] =
    useState(false)

  const [myEvents, setMyEvents] =
    useState([])

  const [formError, setFormError] =
    useState('')

  const [attendeesByEvent, setAttendeesByEvent] =
    useState({})

  const [formData, setFormData] =
    useState({
      title: '',
      description: '',
      category: '',
      organizer: '',
      capacity: '',
      image: '',
      start_time: '',
      end_time: ''
    })

  const [venues, setVenues] =
    useState([
      'Main Auditorium',
      'Seminar Hall',
      'Tech Lab',
      'Sports Complex'
    ])

  const [availability, setAvailability] =
    useState([])

  const visibleYear =
    visibleMonth.getFullYear()

  const visibleMonthIndex =
    visibleMonth.getMonth()

  const monthLabel =
    visibleMonth.toLocaleDateString(
      'en-US',
      {
        month: 'long',
        year: 'numeric'
      }
    )

  const selectedDateObject =
    new Date(
      visibleYear,
      visibleMonthIndex,
      selectedDate
    )

  const selectedDateValue =
    `${selectedDateObject.getFullYear()}-${String(
      selectedDateObject.getMonth() + 1
    ).padStart(2, '0')}-${String(
      selectedDateObject.getDate()
    ).padStart(2, '0')}`

  const firstWeekdayOffset =
    (
      new Date(
        visibleYear,
        visibleMonthIndex,
        1
      ).getDay() + 6
    ) % 7

  const daysInMonth =
    new Date(
      visibleYear,
      visibleMonthIndex + 1,
      0
    ).getDate()

  const days =
    Array.from(
      { length: daysInMonth },
      (_, i) => i + 1
    )

  const goToPreviousMonth = () => {

    setVisibleMonth(
      new Date(
        visibleYear,
        visibleMonthIndex - 1,
        1
      )
    )
    setSelectedDate(1)

  }

  const goToNextMonth = () => {

    setVisibleMonth(
      new Date(
        visibleYear,
        visibleMonthIndex + 1,
        1
      )
    )
    setSelectedDate(1)

  }

  const goToToday = () => {

    const currentDate = new Date()

    setVisibleMonth(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      )
    )
    setSelectedDate(currentDate.getDate())

  }

  useEffect(() => {

    const fetchEvents = async () => {

      try {
        const response =
          await api.get('/events/manage')

        setMyEvents(response.data)
      }
      catch {
        setFormError('Unable to load your event requests')
      }

    }

    fetchEvents()

  }, [])

  useEffect(() => {

    const fetchVenues = async () => {

      try {
        const response =
          await api.get('/venues')

        if (response.data.length) {
          setVenues(
            response.data.map(
              venue => venue.name
            )
          )
        }
      }
      catch {
        setFormError('Unable to load venues')
      }

    }

    fetchVenues()

  }, [])

  useEffect(() => {

    const fetchAvailability = async () => {

      try {
        const response = await api.get(
          `/events/availability?date=${selectedDateValue}`
        )

        setAvailability(response.data)
      }
      catch {
        setAvailability([])
      }

    }

    fetchAvailability()

  }, [selectedDateValue, myEvents])

  const handleFormChange = (e) => {

    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))

  }

  const handleCreateEvent = async (e) => {

    e.preventDefault()
    setFormError('')

    try {
      const response = await api.post(
        '/events',
        {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          venue: selectedVenue,
          date: selectedDateValue,
          start_time: formData.start_time,
          end_time: formData.end_time,
          organizer: formData.organizer,
          capacity: Number(formData.capacity),
          image: formData.image
        }
      )

      setMyEvents((currentEvents) => [
        response.data,
        ...currentEvents
      ])

      setFormData({
        title: '',
        description: '',
        category: '',
        organizer: '',
        capacity: '',
        image: '',
        start_time: '',
        end_time: ''
      })

      setShowCreateForm(false)
      setActiveTab('events')
    }
    catch {
      setFormError('Unable to submit event request')
    }

  }

  const toggleAttendees = async (eventId) => {

    if (attendeesByEvent[eventId]) {
      setAttendeesByEvent((current) => ({
        ...current,
        [eventId]: null
      }))

      return
    }

    try {
      const response = await api.get(
        `/events/${eventId}/attendees`
      )

      setAttendeesByEvent((current) => ({
        ...current,
        [eventId]: response.data
      }))
    }
    catch {
      setFormError('Unable to load attendees')
    }

  }

  const selectedVenueAvailability =
    availability.find(
      item =>
        item.venue === selectedVenue
    )

  const selectedDateLoad =
    availability.reduce(
      (total, item) =>
        total + item.load,
      0
    ) / Math.max(availability.length, 1)

  const selectedDateStatus =
    selectedVenueAvailability?.bookings?.length
      ? 'pending'
      : 'available'

  const getDayLoad = (day) => {

    const dateObject =
      new Date(
        visibleYear,
        visibleMonthIndex,
        day
      )

    const date = `${dateObject.getFullYear()}-${String(
      dateObject.getMonth() + 1
    ).padStart(2, '0')}-${String(
      dateObject.getDate()
    ).padStart(2, '0')}`
    const dayEvents =
      myEvents.filter(
        event =>
          event.date === date &&
          ['pending', 'approved'].includes(
            event.status
          )
      )

    return Math.min(dayEvents.length / 4, 1)

  }
  return (

    <div className="coordinator-container">

      {/* NAVBAR */}

      <nav className="coordinator-nav">

        <div className="nav-content">

          <Link
            to="/"
            className="logo"
          >
            NEXUS.
          </Link>

          <div className="dashboard-title">

            <p>
              EVENT OPERATIONS CENTER
            </p>

          </div>

          <div className="nav-actions">

            <button
              className="user-menu"
            >
              {
                localStorage.getItem(
                  'userName'
                ) || 'Coordinator'
              }
            </button>

            <button
              className="signout-btn"
              onClick={() =>
                signOut(navigate)
              }
              title="Sign out"
            >
              <LogOut size={16} />
              Sign out
            </button>

          </div>

        </div>

      </nav>

      {/* MAIN */}

      <div className="coordinator-content">

        {/* SIDEBAR */}

        <aside
          className="coordinator-sidebar"
        >

          <button
            className={`nav-tab ${
              activeTab === 'calendar'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab(
                'calendar'
              )
            }
          >
            <Calendar size={18}/>
            Calendar
          </button>

          <button
            className={`nav-tab ${
              activeTab === 'events'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab(
                'events'
              )
            }
          >
            <FileText size={18}/>
            My Events
          </button>

          <button
            className={`nav-tab ${
              activeTab === 'analytics'
                ? 'active'
                : ''
            }`}
            onClick={() =>
              setActiveTab(
                'analytics'
              )
            }
          >
            <BarChart3 size={18}/>
            Analytics
          </button>

        </aside>

        {/* MAIN PANEL */}

        <main className="coordinator-main">

          {activeTab === 'calendar' && (

            <section
              className="calendar-section"
            >

              <div
                className="calendar-header"
              >

                <div>

                  <h1>
                    Shared Venue Calendar
                  </h1>

                  <p>
                    Check availability
                    before submitting an
                    event request.
                  </p>

                </div>

                <select
                  value={selectedVenue}
                  onChange={(e) =>
                    setSelectedVenue(
                      e.target.value
                    )
                  }
                  className="venue-selector"
                >

                  {venues.map(
                    venue => (

                      <option
                        key={venue}
                        value={venue}
                      >
                        {venue}
                      </option>

                    )
                  )}

                </select>

              </div>

              <div
                className="calendar-layout"
              >

                {/* CALENDAR */}

                <div
                  className="calendar-card"
                >

                  <div className="calendar-month-header">

                    <button
                      type="button"
                      onClick={goToPreviousMonth}
                    >
                      ‹
                    </button>

                    <div>

                      <h2>
                        {monthLabel}
                      </h2>

                      <span>
                        Selected:
                        {' '}
                        {selectedDateObject.toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          }
                        )}
                      </span>

                    </div>

                    <div className="calendar-month-actions">

                      <button
                        type="button"
                        onClick={goToToday}
                      >
                        Today
                      </button>

                      <button
                        type="button"
                        onClick={goToNextMonth}
                      >
                        ›
                      </button>

                    </div>

                  </div>

                  <div
                    className="weekdays"
                  >

                    <span>MON</span>
                    <span>TUE</span>
                    <span>WED</span>
                    <span>THU</span>
                    <span>FRI</span>
                    <span>SAT</span>
                    <span>SUN</span>

                  </div>

                  <div
                    className="calendar-grid"
                  >

                    {days.map(day => {

                      const load = getDayLoad(day)
                      const isToday =
                        visibleYear === today.getFullYear() &&
                        visibleMonthIndex === today.getMonth() &&
                        day === today.getDate()
                      const isSelected =
                        day === selectedDate

                      return (

                        <React.Fragment key={day}>

                        {day === 1 &&
                          Array.from(
                            {
                              length: firstWeekdayOffset
                            },
                            (_, index) => (
                              <div
                                key={`blank-${index}`}
                                className="calendar-empty"
                              />
                            )
                          )}

                        <motion.div

                          whileHover={{
                            scale: 1.05
                          }}

                          className={`calendar-day ${
                            isToday ? 'today' : ''
                          } ${
                            isSelected ? 'selected' : ''
                          }`}
                          style={{
                            background:
                              load > 0
                                ? `rgba(255, 49, 49, ${0.18 + load * 0.62})`
                                : undefined
                          }}

                          onClick={() =>
                            setSelectedDate(
                              day
                            )
                          }
                        >

                          {day}

                        </motion.div>

                        </React.Fragment>

                      )

                    })}

                  </div>

                  <div
                    className="calendar-legend"
                  >

                    <span>
                      Light red: lightly booked
                    </span>

                    <span>
                      Dark red: heavily booked
                    </span>

                    <span>
                      Click a date to inspect venues
                    </span>

                  </div>

                </div>

                {/* DETAILS */}

                <div
                  className="date-panel"
                >

                  <h3>
                    Selected Date
                  </h3>

                  <h2>
                    {selectedDateObject.toLocaleDateString(
                      'en-US',
                      {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      }
                    )}
                  </h2>

                  <div className="venue-availability-list">

                    {availability.map(item => (

                      <button
                        key={item.venue}
                        type="button"
                        className={`venue-slot-card ${
                          selectedVenue === item.venue
                            ? 'active'
                            : ''
                        }`}
                        onClick={() =>
                          setSelectedVenue(item.venue)
                        }
                      >

                        <div>
                          <strong>
                            {item.venue}
                          </strong>

                          <span>
                            Capacity {item.capacity}
                          </span>
                        </div>

                        <div
                          className="venue-load-bar"
                        >
                          <span
                            style={{
                              width: `${item.load * 100}%`
                            }}
                          />
                        </div>

                        {item.bookings.length ? (
                          <div className="booking-list">
                            {item.bookings.map(booking => (
                              <small key={booking.event_id}>
                                {booking.start_time} - {booking.end_time}
                                {' '}
                                {booking.title}
                              </small>
                            ))}
                          </div>
                        ) : (
                          <small>
                            Available all day
                          </small>
                        )}

                      </button>

                    ))}

                  </div>

                  <div
  className={`status-card ${selectedDateStatus}`}
>

  <h4>
    Availability
  </h4>

  <p>

    {selectedDateStatus === 'available' &&
      `Average load ${Math.round(selectedDateLoad * 100)}%. Selected venue is free so far.`}

    {selectedDateStatus === 'pending' &&
      `Average load ${Math.round(selectedDateLoad * 100)}%. Check booked slots before choosing time.`}

  </p>

</div>

                  <button
  className="btn-create"
  onClick={() =>
    setShowCreateForm(
      !showCreateForm
    )
  }
>

  Create Event Request

</button>

                </div>

              </div>

              {showCreateForm && (

                <form
                  className="event-request-form"
                  onSubmit={handleCreateEvent}
                >

                  <h2>
                    New Event Request
                  </h2>

                  {formError && (
                    <p className="form-error">
                      {formError}
                    </p>
                  )}

                  <div className="form-grid">

                    <input
                      name="title"
                      placeholder="Event title"
                      value={formData.title}
                      onChange={handleFormChange}
                      required
                    />

                    <input
                      name="category"
                      placeholder="Category"
                      value={formData.category}
                      onChange={handleFormChange}
                      required
                    />

                    <input
                      name="organizer"
                      placeholder="Club / organizer"
                      value={formData.organizer}
                      onChange={handleFormChange}
                      required
                    />

                    <input
                      name="capacity"
                      type="number"
                      min="1"
                      placeholder="Capacity"
                      value={formData.capacity}
                      onChange={handleFormChange}
                      required
                    />

                    <input
                      name="image"
                      placeholder="Image URL"
                      value={formData.image}
                      onChange={handleFormChange}
                      required
                    />

                    <input
                      name="start_time"
                      type="time"
                      value={formData.start_time}
                      onChange={handleFormChange}
                      required
                    />

                    <input
                      name="end_time"
                      type="time"
                      value={formData.end_time}
                      onChange={handleFormChange}
                      required
                    />

                    <input
                      value={`${selectedVenue} • April ${selectedDate}, 2026`}
                      disabled
                    />

                  </div>

                  <textarea
                    name="description"
                    placeholder="Event description"
                    value={formData.description}
                    onChange={handleFormChange}
                    required
                  />

                  <button
                    className="btn-create"
                    type="submit"
                  >
                    Submit for Approval
                  </button>

                </form>

              )}

            </section>

          )}
          {activeTab === 'events' && (

            <section className="events-section">

              <div className="events-header">

                <h1>
                  My Events
                </h1>

                <p>
                  Track approvals,
                  registrations and
                  permission letters.
                </p>

              </div>

              <div className="event-cards">

                {formError && (
                  <p className="form-error">
                    {formError}
                  </p>
                )}

                {myEvents.map(event => (

                  <div
                    key={event.id}
                    className="event-link"
                  >

                 <motion.div
                  className="event-card"
                 >
                    <div className="event-top">

                      <div>

                        <h2>
                          {event.title}
                        </h2>

                        <p>
                          {event.venue}
                          {event.start_time &&
                            event.end_time &&
                            ` • ${event.start_time}-${event.end_time}`}
                        </p>

                      </div>

                      <span
                        className={`status-badge ${event.status}`}
                      >
                        {event.status}
                      </span>

                    </div>

                    {/* Workflow */}

                    <div className="workflow">

                      <div className="workflow-step done">
                        Submitted
                      </div>

                      <div className="workflow-step done">
                        Review
                      </div>

                      <div
                        className={`workflow-step ${
                          event.status === 'approved'
                            ? 'done'
                            : 'active'
                        }`}
                      >
                        Approval
                      </div>

                      <div
                        className={`workflow-step ${
                          event.status === 'approved'
                            ? 'done'
                            : ''
                        }`}
                      >
                        Letter
                      </div>

                    </div>

                    {/* Registration */}

                    <div className="registration-card">

                      <div className="registration-header">

                        <span>
                          Registrations
                        </span>

                        <span>
                          {event.attendees}/
                          {event.capacity}
                        </span>

                      </div>

                      <div className="progress-bar">

                        <div
                          className="progress-fill"
                          style={{
                            width: `${
                              (event.attendees /
                                event.capacity) *
                              100
                            }%`
                          }}
                        />

                      </div>

                    </div>

                    <button
                      className="attendees-toggle"
                      type="button"
                      onClick={() =>
                        toggleAttendees(event.id)
                      }
                    >
                      {attendeesByEvent[event.id]
                        ? 'Hide attendees'
                        : 'View attendees'}
                    </button>

                    {attendeesByEvent[event.id] && (

                      <div className="attendees-list">

                        {attendeesByEvent[event.id].length ? (
                          attendeesByEvent[event.id].map(
                            attendee => (
                              <div key={attendee.id}>
                                <strong>
                                  {attendee.full_name}
                                </strong>

                                <span>
                                  {attendee.email}
                                </span>
                              </div>
                            )
                          )
                        ) : (
                          <p>
                            No registrations yet.
                          </p>
                        )}

                      </div>

                    )}

                    <Link
                      to={`/events/${event.id}`}
                      className="details-link"
                    >
                      View details
                    </Link>

                    {/* Permission Letter */}

                    {event.status === 'approved' && (

                      <div className="permission-card">

                        <div>

                          <h4>
                            Permission Letter
                          </h4>

                          <p>
                            Generated &
                            Ready
                          </p>

                        </div>

                        <button className="download-btn">

                          <Download
                            size={16}
                          />

                          Download

                        </button>

                      </div>

                    )}

                  </motion.div>
                  </div>

                ))}

              </div>

            </section>

          )}

          {activeTab === 'analytics' && (

            <section className="analytics-section">

              <div className="analytics-header">

                <h1>
                  Analytics
                </h1>

                <p>
                  Overview of your
                  event performance.
                </p>

              </div>

              <div className="analytics-grid">

                <div className="analytics-card">

                  <FileText
                    size={26}
                  />

                  <h3>
                    Total Events
                  </h3>

                  <h2>
                    {myEvents.length}
                  </h2>

                </div>

                <div className="analytics-card">

                  <Users
                    size={26}
                  />

                  <h3>
                    Total Registrations
                  </h3>

                  <h2>

                    {
                      myEvents.reduce(
                        (
                          total,
                          event
                        ) =>
                          total +
                          event.attendees,
                        0
                      )
                    }

                  </h2>

                </div>

                <div className="analytics-card">

                  <Calendar
                    size={26}
                  />

                  <h3>
                    Pending Requests
                  </h3>

                  <h2>

                    {
                      myEvents.filter(
                        e =>
                          e.status ===
                          'pending'
                      ).length
                    }

                  </h2>

                </div>

                <div className="analytics-card">

                  <BarChart3
                    size={26}
                  />

                  <h3>
                    Approval Rate
                  </h3>

                  <h2>
                    87%
                  </h2>

                </div>

              </div>

            </section>

          )}

        </main>

      </div>

    </div>

  )

}
 export default CoordinatorDashboard
