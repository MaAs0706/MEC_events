import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import './Login.css'

function Login() {

  const navigate = useNavigate()

  const [activeTab, setActiveTab] =
    useState('signin')

  const [formData, setFormData] =
    useState({
      email: '',
      password: '',
      name: '',
      role: 'student'
    })

  const handleInputChange = (e) => {

    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))

  }

  /* SIGN IN */

  const handleSignIn = (e) => {

    e.preventDefault()

    if (
      formData.email &&
      formData.password
    ) {

      localStorage.setItem(
        'userEmail',
        formData.email
      )

      localStorage.setItem(
        'userName',
        formData.name || 'User'
      )

      localStorage.setItem(
        'userRole',
        formData.role
      )

      /* ROLE BASED REDIRECT */

      switch (formData.role) {

        case 'student':

          navigate('/dashboard/student')
          break

        case 'coordinator':

          navigate('/dashboard/coordinator')
          break

        case 'approver':

          navigate('/dashboard/approver')
          break

        case 'admin':

          navigate('/dashboard/admin')
          break

        default:

          navigate('/dashboard/student')

      }

    }

  }

  /* SIGN UP */

  const handleSignUp = (e) => {

    e.preventDefault()

    if (
      formData.name &&
      formData.email &&
      formData.password
    ) {

      localStorage.setItem(
        'userEmail',
        formData.email
      )

      localStorage.setItem(
        'userName',
        formData.name
      )

      localStorage.setItem(
        'userRole',
        formData.role
      )

      /* ROLE BASED REDIRECT */

      switch (formData.role) {

        case 'student':

          navigate('/dashboard/student')
          break

        case 'coordinator':

          navigate('/dashboard/coordinator')
          break

        case 'approver':

          navigate('/dashboard/approver')
          break

        case 'admin':

          navigate('/dashboard/admin')
          break

        default:

          navigate('/dashboard/student')

      }

    }

  }

  return (

    <div className="login-container">

      {/* LEFT SIDE */}

      <div className="login-left">

        <motion.div
          initial={{
            opacity: 0,
            y: 30
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.5
          }}
        >

          <div className="login-badge">

            <span className="badge-dot"></span>

            CAMPUS CULTURE • LIVE

          </div>

          <h1>

            Campus life.
            <br />

            Live in
            <span> real time.</span>

          </h1>

          <p className="login-description">

            Discover hackathons,
            concerts, workshops,
            sports events and
            everything happening
            around your campus —
            all in one place.

          </p>

          <div className="live-feed">

            <div className="feed-item">

              <span className="feed-dot"></span>

              240 students browsing events

            </div>

            <div className="feed-item">

              <span className="feed-dot"></span>

              4 events starting tonight

            </div>

            <div className="feed-item">

              <span className="feed-dot"></span>

              Hackathon registrations
              closing soon

            </div>

          </div>

        </motion.div>

      </div>

      {/* RIGHT SIDE */}

      <div className="login-right">

        <motion.div
          className="login-box"
          initial={{
            opacity: 0,
            y: 24
          }}
          animate={{
            opacity: 1,
            y: 0
          }}
          transition={{
            duration: 0.5
          }}
        >

          {/* HEADER */}

          <div className="login-header">

            <Link
              to="/"
              className="login-logo"
            >
              NEXUS.
            </Link>

            <h2>
              Welcome back.
            </h2>

            <p>

              Sign in to discover
              what’s happening
              around your campus.

            </p>

          </div>

          {/* TABS */}

          <div className="login-tabs">

            <button
              className={`login-tab ${
                activeTab === 'signin'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setActiveTab('signin')
              }
            >
              Sign In
            </button>

            <button
              className={`login-tab ${
                activeTab === 'signup'
                  ? 'active'
                  : ''
              }`}
              onClick={() =>
                setActiveTab('signup')
              }
            >
              Sign Up
            </button>

          </div>

          {/* SIGN IN */}

          {activeTab === 'signin' && (

            <motion.form
              className="login-form"
              onSubmit={handleSignIn}
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}
            >

              <div className="form-group">

                <label>
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={
                    handleInputChange
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  I am a
                </label>

                <select
                  name="role"
                  value={formData.role}
                  onChange={
                    handleInputChange
                  }
                >

                  <option value="student">
                    Student
                  </option>


                  <option value="coordinator">
                    Event Coordinator
                  </option>

                  <option value="approver">
                    Approver
                  </option>

                  <option value="admin">
                    Administrator
                  </option>

                </select>

              </div>

              <div className="form-group">

                <label>
                  Password
                </label>

                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={
                    handleInputChange
                  }
                  required
                />

              </div>

              <button
                type="submit"
                className="btn-submit"
              >
                Sign In
              </button>

              <div className="form-footer">

                <p>

                  Don’t have an account?

                  <button
                    type="button"
                    onClick={() =>
                      setActiveTab('signup')
                    }
                    className="link"
                  >
                    Sign up
                  </button>

                </p>

                <a
                  href="#forgot"
                  className="forgot-link"
                >
                  Forgot password?
                </a>

              </div>

            </motion.form>

          )}

          {/* SIGN UP */}

          {activeTab === 'signup' && (

            <motion.form
              className="login-form"
              onSubmit={handleSignUp}
              initial={{
                opacity: 0
              }}
              animate={{
                opacity: 1
              }}
            >

              <div className="form-group">

                <label>
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={
                    handleInputChange
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Email Address
                </label>

                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={
                    handleInputChange
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  Password
                </label>

                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={
                    handleInputChange
                  }
                  required
                />

              </div>

              <div className="form-group">

                <label>
                  I am a
                </label>

                <select
                  name="role"
                  value={formData.role}
                  onChange={
                    handleInputChange
                  }
                >

                  <option value="student">
                    Student
                  </option>

                  <option value="coordinator">
                    Event Coordinator
                  </option>

                  <option value="approver">
                    Approver
                  </option>

                  <option value="admin">
                    Administrator
                  </option>

                </select>

              </div>

              <button
                type="submit"
                className="btn-submit"
              >
                Create Account
              </button>

            </motion.form>

          )}

        </motion.div>

      </div>

    </div>

  )
}

export default Login