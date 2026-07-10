import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'

const emptyForm = { title: '', date: '', time: '', location: '', notes: '' }

function todayStr() {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default function Appointments() {
  const { circleId } = useAuth()
  const { data, loading, error } = useFetch(() => api.getAppointments(circleId), [circleId])
  const [appointments, setAppointments] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => { if (data) setAppointments(data) }, [data])

  if (!circleId || loading) return <p className="page-status">Loading appointments…</p>
  if (error) return <p className="page-status page-status--error">{error}</p>

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
    await api.deleteAppointment(circleId, appt.appointment_id)
    setAppointments(prev => prev.filter(a => a.appointment_id !== appt.appointment_id))
  }

  return (
    <div className="page">
      <h1 className="page-title">Appointments</h1>

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
          {formError && <p className="auth-error">{formError}</p>}
          <div className="btn-row">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Appointment'}</button>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setFormError('') }}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="add-toggle" onClick={() => setShowForm(true)}>+ Add an appointment</button>
      )}

      <div className="card-list">
        {appointments.length === 0 && <p className="page-status">No upcoming appointments yet.</p>}
        {appointments.map(a => <AppointmentCard key={a.appointment_id} appt={a} onDelete={handleDelete} />)}
      </div>
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

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-row-label">{label}</span>
      <span className="info-row-value">{value}</span>
    </div>
  )
}
