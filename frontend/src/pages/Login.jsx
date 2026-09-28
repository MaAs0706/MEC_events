import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../services/api'
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
      className: '',
      phone: ''
    })

  const [error, setError] =
    useState('')

  const navigateByRole = (role) => {

    switch (role) {

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

  const handleInputChange = (e) => {

    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))

  }

  /* SIGN IN */

  const handleSignIn = async (e) => {

    e.preventDefault()
    setError('')

    if (
      formData.email &&
      formData.password
    ) {

      try {
        const response = await api.post(
          '/auth/login',
          {
            email: formData.email,
            password: formData.password
          }
        )

        localStorage.setItem(
          'accessToken',
          response.data.access_token
        )

        localStorage.setItem(
          'userEmail',
          formData.email
        )

        localStorage.setItem(
          'userName',
          response.data.full_name
        )

        localStorage.setItem(
          'userRole',
          response.data.role
        )

        navigateByRole(response.data.role)
      }
      catch (err) {
        // Show the server's message for a rate-limit block (429);
        // otherwise treat it as bad credentials.
        if (err.response?.status === 429) {
          setError(
            err.response?.data?.detail ||
              'Too many attempts. Please try again in a few minutes.'
          )
        } else {
          setError('Invalid email or password')
        }
      }

    }

  }

  /* SIGN UP */

  const handleSignUp = async (e) => {

    e.preventDefault()
    setError('')

    if (
      formData.name &&
      formData.email &&
      formData.password
    ) {

      // Client-side mirror of the backend password policy.
      const password = formData.password
      const passwordValid =
        password.length >= 8 &&
        /[A-Za-z]/.test(password) &&
        /\d/.test(password)

      if (!passwordValid) {
        setError(
          'Password must be at least 8 characters with at least one letter and one number.'
        )
        return
      }

      try {
        await api.post(
          '/auth/register',
          {
            full_name: formData.name,
            email: formData.email,
            password: formData.password,
            class_name: formData.className,
            phone: formData.phone
          }
        )

        const response = await api.post(
          '/auth/login',
          {
            email: formData.email,
            password: formData.password
          }
        )

        localStorage.setItem(
          'accessToken',
          response.data.access_token
        )

        localStorage.setItem(
          'userEmail',
          formData.email
        )

        localStorage.setItem(
          'userName',
          response.data.full_name
        )

        localStorage.setItem(
          'userRole',
          response.data.role
        )

        navigateByRole(response.data.role)
      }
      catch {
        setError('Unable to create account')
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

          <p className="login-description">
            Sign in to discover events, manage requests, and stay connected to campus life.
          </p>

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

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}

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

                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => navigate('/forgot-password')}
                >
                  Forgot password?
                </button>

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
                  placeholder="Full name"
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

                <p className="form-hint">
                  Min 8 characters with at least one letter and one
                  number.
                </p>

              </div>

              <div className="form-group">

                <label>
                  Class
                </label>

                <input
                  type="text"
                  name="className"
                  placeholder="e.g. CSE 3rd Year"
                  value={formData.className}
                  onChange={
                    handleInputChange
                  }
                />

              </div>

              <div className="form-group">

                <label>
                  Phone
                </label>

                <input
                  type="tel"
                  name="phone"
                  placeholder="Contact number"
                  value={formData.phone}
                  onChange={
                    handleInputChange
                  }
                />

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
