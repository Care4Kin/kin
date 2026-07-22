import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'

const SECURITY_QUESTIONS = [
  "What was your first pet's name?",
  'What city were you born in?',
  "What is your mother's maiden name?",
  'What was the name of your first school?',
]

const DIGEST_FREQUENCIES = [
  { value: 'off', label: 'Off' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
]

export default function Settings() {
  const { user, circleId, logout } = useAuth()
  const navigate = useNavigate()
  const { data: me, loading, error } = useFetch(() => api.getMe(), [])

  if (loading) return <p className="page-status">Loading settings…</p>
  if (error) return <p className="page-status page-status--error">{error}</p>

  function handleSignOut() {
    logout()
    navigate('/login')
  }

  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>
      <ProfileSection me={me} />
      {user?.role === 'caregiver' && <DigestFrequencySection circleId={circleId} />}
      <PasswordSection />
      <SecurityQuestionSection me={me} />
      <button className="btn-secondary" style={{ width: '100%' }} onClick={handleSignOut}>Sign Out</button>
    </div>
  )
}

function DigestFrequencySection({ circleId }) {
  const { data, loading, error: loadError } = useFetch(() => api.getDigestFrequency(circleId), [circleId], !!circleId)
  const [frequency, setFrequency] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => { if (data) setFrequency(data.digest_frequency) }, [data])

  async function handleChange(e) {
    const next = e.target.value
    setFrequency(next)
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.updateDigestFrequency(circleId, next)
      setMessage('Saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading || frequency === null) return null
  if (loadError) return null

  return (
    <section className="inline-form">
      <h2 className="section-label">Email Updates</h2>
      <p className="field-hint">How often you'd like an AI-summarized email about bills, prescriptions, and anything flagged.</p>
      <div className="field-group">
        <label htmlFor="digest-frequency">Frequency</label>
        <select id="digest-frequency" value={frequency} onChange={handleChange} disabled={saving}>
          {DIGEST_FREQUENCIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </select>
      </div>
      {error && <p className="auth-error">{error}</p>}
      {message && <p className="field-hint settings-success">{message}</p>}
    </section>
  )
}

function ProfileSection({ me }) {
  const [form, setForm] = useState({ full_name: me.full_name, phone: me.phone || '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.updateProfile({ full_name: form.full_name, phone: form.phone })
      setMessage('Saved.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="inline-form">
      <h2 className="section-label">Profile</h2>
      <form onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="settings-name">Full Name</label>
          <input id="settings-name" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div className="field-group">
          <label htmlFor="settings-phone">Phone Number</label>
          <input id="settings-phone" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div className="field-group">
          <label>Email</label>
          <p className="field-hint">{me.email} (cannot be changed)</p>
        </div>
        {error && <p className="auth-error">{error}</p>}
        {message && <p className="field-hint settings-success">{message}</p>}
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Profile'}</button>
      </form>
    </section>
  )
}

function PasswordSection() {
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    if (form.new_password !== form.confirm_password) {
      setError('New passwords do not match')
      return
    }
    setSaving(true)
    try {
      await api.changePassword({ current_password: form.current_password, new_password: form.new_password })
      setMessage('Password updated.')
      setForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="inline-form">
      <h2 className="section-label">Change Password</h2>
      <form onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="current-password">Current Password</label>
          <input id="current-password" type="password" required value={form.current_password} onChange={e => setForm({ ...form, current_password: e.target.value })} />
        </div>
        <div className="field-group">
          <label htmlFor="new-password">New Password</label>
          <input id="new-password" type="password" required value={form.new_password} onChange={e => setForm({ ...form, new_password: e.target.value })} />
        </div>
        <div className="field-group">
          <label htmlFor="confirm-new-password">Re-enter New Password</label>
          <input id="confirm-new-password" type="password" required value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} />
        </div>
        {error && <p className="auth-error">{error}</p>}
        {message && <p className="field-hint settings-success">{message}</p>}
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Updating…' : 'Update Password'}</button>
      </form>
    </section>
  )
}

function SecurityQuestionSection({ me }) {
  const [form, setForm] = useState({ security_question: me.security_question || SECURITY_QUESTIONS[0], security_answer: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      await api.updateSecurityQuestion(form)
      setMessage('Security question updated.')
      setForm(f => ({ ...f, security_answer: '' }))
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="inline-form">
      <h2 className="section-label">Security Question</h2>
      <p className="field-hint">Used to reset your password if you forget it.</p>
      <form onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="settings-question">Question</label>
          <select id="settings-question" value={form.security_question} onChange={e => setForm({ ...form, security_question: e.target.value })}>
            {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        </div>
        <div className="field-group">
          <label htmlFor="settings-answer">New Answer</label>
          <input id="settings-answer" required value={form.security_answer} onChange={e => setForm({ ...form, security_answer: e.target.value })} />
        </div>
        {error && <p className="auth-error">{error}</p>}
        {message && <p className="field-hint settings-success">{message}</p>}
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Update Security Question'}</button>
      </form>
    </section>
  )
}
