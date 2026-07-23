import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useResourceList } from '../../hooks/useResourceList'
import InfoRow from '../../components/InfoRow'
import { daysUntil, DAY_CODES, DAY_LETTERS, DAY_NAMES, todayCode, getCurrentWeek } from '../../utils/date'
import FormMessage from '../../components/FormMessage'
import LoggedOutGate from '../../components/LoggedOutGate'
import NoCircleGate from '../../components/NoCircleGate'

const emptyForm = { medication_name: '', dosage: '', prescribing_doctor: '', pharmacy_name: '', pharmacy_phone: '', schedule_days: [], refill_date: '', notes: '' }

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
  const [takenWeek, setTakenWeek] = useState({})

  useEffect(() => {
    if (!circleId) return
    api.getPillsTakenWeek(circleId).then(rows => {
      const map = {}
      for (const { prescription_id, taken_date } of rows) {
        if (!map[prescription_id]) map[prescription_id] = new Set()
        map[prescription_id].add(taken_date)
      }
      setTakenWeek(map)
    }).catch(() => {})
  }, [circleId])

  if (authLoading) return null
  if (!user) return <LoggedOutGate title="Prescriptions" description="See upcoming refill dates so no one runs out of an important medication." />
  if (circleChecked && !circleId) return <NoCircleGate title="Prescriptions" />
  if (!circleId || loading) return <p className="page-status">Loading prescriptions…</p>
  if (error) return <FormMessage variant="error" className="page-status page-status--error">{error}</FormMessage>

  function toggleFormDay(code) {
    setForm(f => ({
      ...f,
      schedule_days: f.schedule_days.includes(code) ? f.schedule_days.filter(d => d !== code) : [...f.schedule_days, code],
    }))
  }

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
      pharmacy_phone: form.pharmacy_phone || null,
      schedule_days: form.schedule_days.length > 0 ? form.schedule_days.join(',') : null,
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
      pharmacy_phone: rx.pharmacy_phone || '',
      schedule_days: rx.schedule_days ? rx.schedule_days.split(',') : [],
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

  async function handleTogglePill(rx, dateStr) {
    setActionError('')
    const wasTaken = Boolean(takenWeek[rx.prescription_id]?.has(dateStr))
    setTakenWeek(prev => {
      const next = { ...prev, [rx.prescription_id]: new Set(prev[rx.prescription_id]) }
      wasTaken ? next[rx.prescription_id].delete(dateStr) : next[rx.prescription_id].add(dateStr)
      return next
    })
    try {
      if (wasTaken) await api.unmarkPillTaken(circleId, rx.prescription_id, dateStr)
      else await api.markPillTaken(circleId, rx.prescription_id, dateStr)
    } catch (err) {
      setActionError(err.message)
      setTakenWeek(prev => {
        const next = { ...prev, [rx.prescription_id]: new Set(prev[rx.prescription_id]) }
        wasTaken ? next[rx.prescription_id].add(dateStr) : next[rx.prescription_id].delete(dateStr)
        return next
      })
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
              <input id="rx-dosage" placeholder="10mg" value={form.dosage} onChange={e => setForm({ ...form, dosage: e.target.value })} />
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
            <label htmlFor="rx-pharmacy-phone">Pharmacy Phone Number</label>
            <input id="rx-pharmacy-phone" type="tel" placeholder="(555) 555-5555" value={form.pharmacy_phone} onChange={e => setForm({ ...form, pharmacy_phone: e.target.value })} />
          </div>
          <fieldset className="field-group">
            <legend>Which days do you take this?</legend>
            <div className="day-picker">
              {DAY_CODES.map(code => (
                <label key={code} className={`day-picker-option ${form.schedule_days.includes(code) ? 'day-picker-option--active' : ''}`}>
                  <input type="checkbox" checked={form.schedule_days.includes(code)} onChange={() => toggleFormDay(code)} />
                  {DAY_LETTERS[code]}
                </label>
              ))}
            </div>
            <button type="button" className="action-btn mt-md" onClick={() => setForm(f => ({ ...f, schedule_days: [...DAY_CODES] }))}>
              Every day
            </button>
            <p className="field-hint mt-md">Leave this blank if you don't want it tracked on the weekly pill checklist.</p>
          </fieldset>
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

      <WeeklyPillBoard rxs={rxs} takenWeek={takenWeek} onToggle={handleTogglePill} />

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

function WeeklyPillBoard({ rxs, takenWeek, onToggle }) {
  const scheduled = rxs.filter(rx => rx.is_active !== false && rx.schedule_days)
  if (scheduled.length === 0) return null

  const week = getCurrentWeek()
  const todayC = todayCode()
  const todayDate = week.find(d => d.code === todayC).date
  const scheduledToday = scheduled.filter(rx => rx.schedule_days.split(',').includes(todayC))

  return (
    <section className="mb-lg">
      <h2 className="section-label">This Week's Pills</h2>

      {scheduledToday.length > 0 && (
        <>
          <p className="field-hint mb-sm">Today is {DAY_NAMES[todayC]} — check off what you take.</p>
          <div className="info-card mb-md">
            <div className="permission-grid">
              {scheduledToday.map(rx => (
                <label key={rx.prescription_id} className="permission-item">
                  <input
                    type="checkbox"
                    checked={Boolean(takenWeek[rx.prescription_id]?.has(todayDate))}
                    onChange={() => onToggle(rx, todayDate)}
                  />
                  {rx.medication_name}{rx.dosage ? ` — ${rx.dosage}` : ''}
                </label>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="card-list">
        {scheduled.map(rx => {
          const days = rx.schedule_days.split(',')
          return (
            <div key={rx.prescription_id} className="info-card">
              <span className="info-card-title">{rx.medication_name}</span>
              <div className="pill-week-strip">
                {week.map(d => {
                  const isScheduled = days.includes(d.code)
                  const isTaken = Boolean(takenWeek[rx.prescription_id]?.has(d.date))
                  const isToday = d.code === todayC
                  const classes = [
                    'pill-week-day',
                    !isScheduled && 'pill-week-day--unscheduled',
                    isTaken && 'pill-week-day--taken',
                    isToday && 'pill-week-day--today',
                  ].filter(Boolean).join(' ')
                  return (
                    <span key={d.code} className={classes} title={`${DAY_NAMES[d.code]}${isScheduled ? (isTaken ? ' — taken' : ' — not taken yet') : ' — not scheduled'}`}>
                      {DAY_LETTERS[d.code]}
                    </span>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function RxCard({ rx, isCaregiver, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false)
  const refill = rx.refill_date
    ? new Date(rx.refill_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null
  const daysLeft = rx.refill_date ? daysUntil(rx.refill_date) : null
  const urgent = daysLeft !== null && daysLeft <= 10
  const scheduleLabel = rx.schedule_days
    ? (rx.schedule_days.split(',').length === 7 ? 'Every day' : rx.schedule_days.split(',').map(c => DAY_NAMES[c].slice(0, 3)).join(', '))
    : null
  const hasDetails = Boolean(rx.dosage || rx.prescribing_doctor || rx.pharmacy_name || rx.notes || scheduleLabel)
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
          {scheduleLabel && <InfoRow label="Schedule" value={scheduleLabel} />}
          {rx.prescribing_doctor && <InfoRow label="Doctor" value={rx.prescribing_doctor} />}
          {rx.pharmacy_name && <InfoRow label="Pharmacy" value={rx.pharmacy_name} />}
          {rx.pharmacy_phone && <InfoRow label="Pharmacy Phone" value={<a href={`tel:${rx.pharmacy_phone}`} className="phone-link">{rx.pharmacy_phone}</a>} />}
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
