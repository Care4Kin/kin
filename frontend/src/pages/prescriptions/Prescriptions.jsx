import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'

const emptyForm = { medication_name: '', dosage: '', prescribing_doctor: '', pharmacy_name: '', refill_date: '', notes: '' }

export default function Prescriptions() {
  const { circleId, user } = useAuth()
  const isCaregiver = user?.role === 'caregiver'
  const { data, loading, error } = useFetch(() => api.getPrescriptions(circleId), [circleId])
  const [rxs, setRxs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => { if (data) setRxs(data) }, [data])

  if (!circleId || loading) return <p className="page-status">Loading prescriptions…</p>
  if (error) return <p className="page-status page-status--error">{error}</p>

  async function handleAdd(e) {
    e.preventDefault()
    setFormError('')
    if (!form.medication_name.trim()) {
      setFormError('Please enter a medication name')
      return
    }
    setSaving(true)
    try {
      const rx = await api.createPrescription(circleId, {
        medication_name: form.medication_name.trim(),
        dosage: form.dosage || null,
        prescribing_doctor: form.prescribing_doctor || null,
        pharmacy_name: form.pharmacy_name || null,
        refill_date: form.refill_date || null,
        notes: form.notes || null,
      })
      setRxs(prev => [...prev, rx])
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(rx) {
    await api.deletePrescription(circleId, rx.prescription_id)
    setRxs(prev => prev.filter(r => r.prescription_id !== rx.prescription_id))
  }

  return (
    <div className="page">
      <h1 className="page-title">Prescriptions</h1>

      {showForm ? (
        <form className="inline-form" onSubmit={handleAdd}>
          <div className="field-group">
            <label htmlFor="rx-name">Medication Name</label>
            <input id="rx-name" required value={form.medication_name} onChange={e => setForm({ ...form, medication_name: e.target.value })} />
          </div>
          <div className="inline-form-row">
            <div className="field-group">
              <label htmlFor="rx-dosage">Dosage</label>
              <input id="rx-dosage" placeholder="10mg once daily" value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} />
            </div>
            <div className="field-group">
              <label htmlFor="rx-refill">Refill Date</label>
              <input id="rx-refill" type="date" value={form.refill_date} onChange={e => setForm({ ...form, refill_date: e.target.value })} />
            </div>
          </div>
          <div className="inline-form-row">
            <div className="field-group">
              <label htmlFor="rx-doctor">Prescribing Doctor</label>
              <input id="rx-doctor" value={form.prescribing_doctor} onChange={e => setForm({ ...form, prescribing_doctor: e.target.value })} />
            </div>
            <div className="field-group">
              <label htmlFor="rx-pharmacy">Pharmacy</label>
              <input id="rx-pharmacy" value={form.pharmacy_name} onChange={e => setForm({ ...form, pharmacy_name: e.target.value })} />
            </div>
          </div>
          <div className="field-group">
            <label htmlFor="rx-notes">Notes</label>
            <input id="rx-notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          {formError && <p className="auth-error">{formError}</p>}
          <div className="btn-row">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Prescription'}</button>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setFormError('') }}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="add-toggle" onClick={() => setShowForm(true)}>+ Add a prescription</button>
      )}

      {isCaregiver && <PrescriptionSummary rxs={rxs} />}

      <div className="card-list">
        {rxs.map(rx => <RxCard key={rx.prescription_id} rx={rx} onDelete={handleDelete} />)}
      </div>
    </div>
  )
}

function PrescriptionSummary({ rxs }) {
  const active = rxs.filter(rx => rx.is_active !== false)
  const urgent = active.filter(rx => {
    if (!rx.refill_date) return false
    const days = Math.ceil((new Date(rx.refill_date) - new Date()) / 86400000)
    return days <= 10
  })

  return (
    <div className="stat-banner">
      <span className="stat-banner-label">{active.length} active · {urgent.length} due soon</span>
      <span className="stat-banner-value">{urgent.length > 0 ? '⚠' : '✓'}</span>
    </div>
  )
}

function RxCard({ rx, onDelete }) {
  const refill = rx.refill_date
    ? new Date(rx.refill_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null
  const daysUntil = rx.refill_date
    ? Math.ceil((new Date(rx.refill_date) - new Date()) / 86400000)
    : null
  const urgent = daysUntil !== null && daysUntil <= 10

  return (
    <div className={`info-card ${urgent ? 'info-card--urgent' : ''}`}>
      <div className="info-card-header">
        <span className="info-card-title">{rx.medication_name}</span>
        {urgent && <span className="badge badge--warn">Refill soon</span>}
      </div>
      <div className="info-card-rows">
        {rx.dosage && <InfoRow label="Dosage" value={rx.dosage} />}
        {rx.prescribing_doctor && <InfoRow label="Doctor" value={rx.prescribing_doctor} />}
        {rx.pharmacy_name && <InfoRow label="Pharmacy" value={rx.pharmacy_name} />}
        {refill && <InfoRow label="Refill date" value={`${refill}${daysUntil !== null ? ` (${daysUntil} days)` : ''}`} />}
        {rx.notes && <InfoRow label="Notes" value={rx.notes} />}
      </div>
      <div className="action-row">
        <button className="action-btn action-btn--danger" onClick={() => onDelete(rx)} title="Remove this prescription from the dashboard">
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
