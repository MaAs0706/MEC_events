
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import events from '../data/events'
import {
  Users,
  Building2,
  Activity,
  TrendingUp,
  Shield,
  Calendar,
  Bell,
  BarChart3,
  UserCheck,
  MapPin,
  ChevronRight
} from 'lucide-react'

import './AdminDashboard.css'

function AdminDashboard() {

  const [activeTab, setActiveTab] =
    useState('overview')

  const analytics = {
    activeUsers: 850,
    eventsToday: 24,
    pendingReviews: 7,
    venueUtilization: 78
  }

  const users = [
    {
      id: 1,
      name: 'John Doe',
      role: 'Student',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Jane Smith',
      role: 'Coordinator',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Mike Johnson',
      role: 'Approver',
      status: 'Active'
    }
  ]

  const venues = [
    {
      id: 1,
      name: 'Main Auditorium',
      capacity: 500,
      usage: '92%'
    },
    {
      id: 2,
      name: 'Tech Lab',
      capacity: 200,
      usage: '76%'
    },
    {
      id: 3,
      name: 'Sports Complex',
      capacity: 800,
      usage: '63%'
    }
  ]

  const categories = [
    {
      name: 'Tech',
      events: 12
    },
    {
      name: 'Sports',
      events: 5
    },
    {
      name: 'Cultural',
      events: 7
    }
  ]

  const activityFeed = [
    'AI Workshop approved',
    'Tech Lab reserved',
    'New coordinator registered',
    'Spring Sports Meet submitted',
    'Venue capacity updated'
  ]

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
                  92%
                </strong>

              </div>

              <div className="health-item">

                <span>
                  Active Venues
                </span>

                <strong>
                  12
                </strong>

              </div>

              <div className="health-item">

                <span>
                  Pending Reviews
                </span>

                <strong>
                  7
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

            {activityFeed.map(
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
            )}

          </div>

        </div>

      )}

      {/* USERS */}

      {activeTab === 'users' && (

        <section className="users-panel">

          <div className="user-stats">

            <div className="mini-card">

              <h3>700</h3>

              <span>
                Students
              </span>

            </div>

            <div className="mini-card">

              <h3>90</h3>

              <span>
                Coordinators
              </span>

            </div>

            <div className="mini-card">

              <h3>12</h3>

              <span>
                Approvers
              </span>

            </div>

            <div className="mini-card">

              <h3>4</h3>

              <span>
                Admins
              </span>

            </div>

          </div>

          <div className="users-table">

            {users.map(user => (

              <div
                key={user.id}
                className="user-row"
              >

                <div>
                  {user.name}
                </div>

                <div>
                  {user.role}
                </div>

                <div>
                  {user.status}
                </div>

                <ChevronRight
                  size={18}
                />

              </div>

            ))}

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

                  <span>
                    {venue.usage}
                  </span>

                </div>

              )
            )}

          </div>

          <div className="operations-card">

            <h3>
              Event Ecosystem
            </h3>

            {categories.map(
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
              92% approval rate
              this month.
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
              +14% compared to
              last month.
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
              3450 attendees
              across all events.
            </p>

          </div>

        </section>

      )}

    </div>

  )

}

export default AdminDashboard

