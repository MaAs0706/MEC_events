import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import './Login.css'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const token = params.get('token')

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setError('Use at least 8 characters, including a letter and a number.')
      return
    }
    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }
    setLoading(true)
    try {
      const response = await api.post('/auth/reset-password', { token, password })
      setMessage(response.data.message)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'This reset link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="recovery-page">
      <section className="recovery-card">
        <Link className="login-logo" to="/">NEXUS.</Link>
        <p className="recovery-kicker">ACCOUNT RECOVERY</p>
        <h1>Choose a new password</h1>
        {!token ? (
          <div className="recovery-success"><p>This reset link is incomplete or invalid.</p><Link className="recovery-back" to="/forgot-password">Request a new link</Link></div>
        ) : message ? (
          <div className="recovery-success"><p>{message}</p><Link className="recovery-back" to="/login">Sign in to NEXUS</Link></div>
        ) : (
          <form className="login-form" onSubmit={submit}>
            <p className="recovery-copy">Use at least 8 characters, including a letter and a number.</p>
            <div className="form-group"><label htmlFor="new-password">New password</label><input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
            <div className="form-group"><label htmlFor="confirm-password">Confirm new password</label><input id="confirm-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></div>
            {error && <p className="auth-error">{error}</p>}
            <button className="btn-submit" type="submit" disabled={loading}>{loading ? 'Resetting password…' : 'Reset password'}</button>
            <Link className="recovery-back" to="/login">Back to sign in</Link>
          </form>
        )}
      </section>
    </main>
  )
}
