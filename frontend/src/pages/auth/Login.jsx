import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login(form)
      login({ user_id: data.user_id, role: data.role }, data.token)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Log In</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-group">
            <label htmlFor="email">Username</label>
            <input
              id="email"
              name="email"
              type="text"
              autoComplete="username"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <Link to="/forgot-password" className="forgot-link">
            Forgot my password
          </Link>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Logging in…' : 'Log In'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register">Sign Up</Link>
        </p>
      </div>
    </div>
  )
}
