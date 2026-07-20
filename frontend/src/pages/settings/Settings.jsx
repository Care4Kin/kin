import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'
import FormMessage from '../../components/FormMessage'

const SECURITY_QUESTIONS = [
  "What was your first pet's name?",
  'What city were you born in?',
  "What is your mother's maiden name?",
  'What was the name of your first school?',
]

export default function Settings() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { data: me, loading, error } = useFetch(() => api.getMe(), [])

  if (loading) return <p className="page-status">Loading settings…</p>
  if (error) return <FormMessage variant="error" className="page-status page-status--error">{error}</FormMessage>

  function handleSignOut() {
    logout()
    navigate('/')
  }

  return (
    <div className="page">
      <h1 className="page-title">Settings</h1>
      <ProfileSection me={me} />
      <PasswordSection />
      <SecurityQuestionSection me={me} />
      <button className="btn-secondary" style={{ width: '100%' }} onClick={handleSignOut}>Sign Out</button>
    </div>
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
          <span className="field-group-label">Email</span>
          <p className="field-hint">{me.email} (cannot be changed)</p>
        </div>
        <FormMessage variant="error">{error}</FormMessage>
        <FormMessage variant="success">{message}</FormMessage>
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
        <FormMessage variant="error">{error}</FormMessage>
        <FormMessage variant="success">{message}</FormMessage>
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
        <FormMessage variant="error">{error}</FormMessage>
        <FormMessage variant="success">{message}</FormMessage>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Update Security Question'}</button>
      </form>
    </section>
  )
}
