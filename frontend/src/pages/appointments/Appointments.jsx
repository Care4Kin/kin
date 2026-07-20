import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useResourceList } from '../../hooks/useResourceList'
import InfoRow from '../../components/InfoRow'
import FormMessage from '../../components/FormMessage'
import LoggedOutGate from '../../components/LoggedOutGate'
import NoCircleGate from '../../components/NoCircleGate'

const emptyForm = { title: '', date: '', time: '', location: '', notes: '' }

function todayStr() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function Appointments() {
  const { circleId, user, loading: authLoading, circleChecked } = useAuth()
  const isCaregiver = user?.role === 'caregiver'
  const { items: appointments, setItems: setAppointments, loading, error } = useResourceList(() => api.getAppointments(circleId), [circleId], !!circleId)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')

  if (authLoading) return null
  if (!user) return <LoggedOutGate title="Appointments" description="Keep track of upcoming visits and reminders so nothing gets missed." />
  if (circleChecked && !circleId) return <NoCircleGate title="Appointments" />
  if (!circleId || loading) return <p className="page-status">Loading appointments…</p>
  if (error) return <FormMessage variant="error" className="page-status page-status--error">{error}</FormMessage>

  async function handleAdd(e) {
    e.preventDefault()
    setFormError('')
    if (!form.title.trim() || !form.location.trim()) {
      setFormError('Please fill in the appointment name and location')
      return
    }
    setSaving(true)
    try {
      const appt = await api.createAppointment(circleId, {
        title: form.title.trim(),
        date: form.date,
        time: form.time,
        location: form.location.trim(),
        notes: form.notes || null,
      })
      setAppointments(prev => [...prev, appt].sort((a, b) => a.date.localeCompare(b.date)))
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(appt) {
    setActionError('')
    try {
      await api.deleteAppointment(circleId, appt.appointment_id)
      setAppointments(prev => prev.filter(a => a.appointment_id !== appt.appointment_id))
    } catch (err) {
      setActionError(err.message)
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Appointments</h1>
      <FormMessage variant="error" className="page-status page-status--error">{actionError}</FormMessage>

      {isCaregiver && <AppointmentSummary appointments={appointments} />}

      {showForm ? (
        <form className="inline-form" onSubmit={handleAdd}>
          <div className="field-group">
            <label htmlFor="appt-title">What's the appointment?</label>
            <input id="appt-title" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="inline-form-row">
            <div className="field-group">
              <label htmlFor="appt-date">Date</label>
              <input
                id="appt-date"
                type="date"
                required
                min={todayStr()}
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="field-group">
              <label htmlFor="appt-time">Time</label>
              <input id="appt-time" type="time" required value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
            </div>
          </div>
          <div className="field-group">
            <label htmlFor="appt-location">Location</label>
            <input id="appt-location" required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="field-group">
            <label htmlFor="appt-notes">Notes</label>
            <input id="appt-notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <FormMessage variant="error">{formError}</FormMessage>
          <div className="btn-row">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Appointment'}</button>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setFormError('') }}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="add-toggle" aria-expanded={showForm} onClick={() => setShowForm(true)}>+ Add an appointment</button>
      )}

      <div className="card-list">
        {appointments.length === 0 && <p className="page-status">No upcoming appointments yet.</p>}
        {appointments.map(a => <AppointmentCard key={a.appointment_id} appt={a} onDelete={handleDelete} />)}
      </div>
    </div>
  )
}

function AppointmentSummary({ appointments }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcoming = appointments
    .filter(a => new Date(a.date + 'T00:00:00') >= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  const next = upcoming[0]

  return (
    <div className="stat-banner">
      <span className="stat-banner-label">{upcoming.length} upcoming{next ? ` · next: ${next.title}` : ''}</span>
      <span className="stat-banner-value">
        {next ? new Date(next.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
      </span>
    </div>
  )
}

function AppointmentCard({ appt, onDelete }) {
  const date = new Date(appt.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const time = appt.time ? new Date(`2000-01-01T${appt.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null

  return (
    <div className="info-card">
      <div className="info-card-header">
        <span className="info-card-title">{appt.title}</span>
      </div>
      <div className="info-card-rows">
        <InfoRow label="When" value={`${date}${time ? ` at ${time}` : ''}`} />
        {appt.location && <InfoRow label="Where" value={appt.location} />}
        {appt.notes && <InfoRow label="Notes" value={appt.notes} />}
      </div>
      <div className="action-row">
        <button className="action-btn action-btn--danger" onClick={() => onDelete(appt)} title="Remove this appointment">
          Delete
        </button>
      </div>
    </div>
  )
}
