import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useResourceList } from '../../hooks/useResourceList'
import InfoRow from '../../components/InfoRow'
import { daysUntil } from '../../utils/date'
import FormMessage from '../../components/FormMessage'
import LoggedOutGate from '../../components/LoggedOutGate'
import NoCircleGate from '../../components/NoCircleGate'

const emptyForm = { medication_name: '', dosage: '', prescribing_doctor: '', pharmacy_name: '', refill_date: '', notes: '' }

export default function Prescriptions() {
  const { circleId, user, loading: authLoading, circleChecked } = useAuth()
  const isCaregiver = user?.role === 'caregiver'
  const { items: rxs, setItems: setRxs, loading, error } = useResourceList(() => api.getPrescriptions(circleId), [circleId], !!circleId)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [actionError, setActionError] = useState('')

  if (authLoading) return null
  if (!user) return <LoggedOutGate title="Prescriptions" description="See upcoming refill dates so no one runs out of an important medication." />
  if (circleChecked && !circleId) return <NoCircleGate title="Prescriptions" />
  if (!circleId || loading) return <p className="page-status">Loading prescriptions…</p>
  if (error) return <FormMessage variant="error" className="page-status page-status--error">{error}</FormMessage>

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.medication_name.trim()) {
      setFormError('Please enter a medication name')
      return
    }
    setSaving(true)
    const payload = {
      medication_name: form.medication_name.trim(),
      dosage: form.dosage || null,
      prescribing_doctor: form.prescribing_doctor || null,
      pharmacy_name: form.pharmacy_name || null,
      refill_date: form.refill_date || null,
      notes: form.notes || null,
    }
    try {
      if (editingId) {
        const rx = await api.updatePrescription(circleId, editingId, payload)
        setRxs(prev => prev.map(r => r.prescription_id === rx.prescription_id ? rx : r))
      } else {
        const rx = await api.createPrescription(circleId, payload)
        setRxs(prev => [...prev, rx])
      }
      setForm(emptyForm)
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleEditClick(rx) {
    setForm({
      medication_name: rx.medication_name || '',
      dosage: rx.dosage || '',
      prescribing_doctor: rx.prescribing_doctor || '',
      pharmacy_name: rx.pharmacy_name || '',
      refill_date: rx.refill_date || '',
      notes: rx.notes || '',
    })
    setEditingId(rx.prescription_id)
    setFormError('')
    setShowForm(true)
  }

  async function handleDelete(rx) {
    setActionError('')
    try {
      await api.deletePrescription(circleId, rx.prescription_id)
      setRxs(prev => prev.filter(r => r.prescription_id !== rx.prescription_id))
    } catch (err) {
      setActionError(err.message)
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Prescriptions</h1>
      <FormMessage variant="error" className="page-status page-status--error">{actionError}</FormMessage>

      {showForm ? (
        <form className="inline-form" onSubmit={handleSubmit}>
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
          <FormMessage variant="error">{formError}</FormMessage>
          <div className="btn-row">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Prescription'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setFormError(''); setForm(emptyForm); setEditingId(null) }}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="add-toggle" aria-expanded={showForm} onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}>+ Add a prescription</button>
      )}

      {isCaregiver && <PrescriptionSummary rxs={rxs} />}

      <div className="card-list">
        {rxs.map(rx => <RxCard key={rx.prescription_id} rx={rx} isCaregiver={isCaregiver} onDelete={handleDelete} onEdit={handleEditClick} />)}
      </div>
    </div>
  )
}

function PrescriptionSummary({ rxs }) {
  const active = rxs.filter(rx => rx.is_active !== false)
  const urgent = active.filter(rx => rx.refill_date && daysUntil(rx.refill_date) <= 10)

  return (
    <div className="stat-banner">
      <span className="stat-banner-label">{active.length} active · {urgent.length} due soon</span>
      <span className="stat-banner-value" aria-hidden="true">{urgent.length > 0 ? '⚠' : '✓'}</span>
    </div>
  )
}

function RxCard({ rx, isCaregiver, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false)
  const refill = rx.refill_date
    ? new Date(rx.refill_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null
  const daysLeft = rx.refill_date ? daysUntil(rx.refill_date) : null
  const urgent = daysLeft !== null && daysLeft <= 10
  const hasDetails = Boolean(rx.dosage || rx.prescribing_doctor || rx.pharmacy_name || rx.notes)
  const showDetails = isCaregiver || expanded

  return (
    <div className={`info-card ${urgent ? 'info-card--urgent' : ''}`}>
      <div className="info-card-header">
        <span className="info-card-title">{rx.medication_name}</span>
        {urgent && <span className="badge badge--warn">Refill soon</span>}
      </div>
      {refill && (
        <p className="info-card-note">
          {urgent ? 'Refill needed: ' : 'Next refill: '}{refill}{daysLeft !== null ? ` (${daysLeft} days)` : ''}
        </p>
      )}
      {showDetails && (
        <div className="info-card-rows">
          {rx.dosage && <InfoRow label="Dosage" value={rx.dosage} />}
          {rx.prescribing_doctor && <InfoRow label="Doctor" value={rx.prescribing_doctor} />}
          {rx.pharmacy_name && <InfoRow label="Pharmacy" value={rx.pharmacy_name} />}
          {rx.notes && <InfoRow label="Notes" value={rx.notes} />}
        </div>
      )}
      <div className="action-row">
        {!isCaregiver && hasDetails && (
          <button className="action-btn" aria-expanded={expanded} onClick={() => setExpanded(e => !e)}>
            {expanded ? 'Hide details' : 'Show details'}
          </button>
        )}
        <button className="action-btn" onClick={() => onEdit(rx)} title="Edit this prescription">
          Edit
        </button>
        <button className="action-btn action-btn--danger" onClick={() => onDelete(rx)} title="Remove this prescription from the dashboard">
          Delete
        </button>
      </div>
    </div>
  )
}
