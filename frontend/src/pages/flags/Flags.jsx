import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useResourceList } from '../../hooks/useResourceList'

const TYPE_LABELS = { call: 'Phone Call', email: 'Email', text: 'Text', bill: 'Bill', other: 'Other' }

const emptyForm = { type: 'call', description: '', severity: 'low' }

const FILTERS = [
  { value: 'all', label:'ALL' },
  { value: 'call', label: 'Phone Call' }, 
  { value: 'email', label: 'Email'},
  { value: 'text', label: 'Text' },
  { value: 'bill', label: 'Bill' },
  { value: 'open', label: 'Open Only'}
]

export default function Flags() {
  const [filter, setFilter] = useState('all')
  const { circleId } = useAuth()
  const { items: flags, setItems: setFlags, loading, error } = useResourceList(() => api.getFlags(circleId), [circleId], !!circleId)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [actionError, setActionError] = useState('')

  if (!circleId || loading) return <p className="page-status">Loading…</p>
  if (error) return <p className="page-status page-status--error">{error}</p>

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.description.trim()) {
      setFormError('Please describe what you noticed')
      return
    }
    setSaving(true)
    const payload = { ...form, description: form.description.trim() }
    try {
      if (editingId) {
        const flag = await api.updateFlag(circleId, editingId, payload)
        setFlags(prev => prev.map(f => f.flag_id === flag.flag_id ? flag : f))
      } else {
        const flag = await api.createFlag(circleId, payload)
        setFlags(prev => [flag, ...prev])
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

  function handleEditClick(flag) {
    setForm({ type: flag.type, description: flag.description, severity: flag.severity })
    setEditingId(flag.flag_id)
    setFormError('')
    setShowForm(true)
  }

  async function handleDelete(flag) {
    setActionError('')
    try {
      await api.deleteFlag(circleId, flag.flag_id)
      setFlags(prev => prev.filter(f => f.flag_id !== flag.flag_id))
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleResolve(flag) {
    setActionError('')
    try {
      const updated = await api.updateFlag(circleId, flag.flag_id, { is_resolved: !flag.is_resolved })
      setFlags(prev => prev.map(f => f.flag_id === updated.flag_id ? updated : f))
    } catch (err) {
      setActionError(err.message)
    }
  }

const visible = filter === 'all'
  ? flags
  : filter === 'open'
    ? flags.filter(f => !f.is_resolved)
    : flags.filter(f => f.type === filter)

  const open     = visible.filter(f => !f.is_resolved)
  const resolved = visible.filter(f => f.is_resolved)

  return (
    <div className="page">
      <h1 className="page-title">Suspicious Activity</h1>
      {actionError && <p className="page-status page-status--error">{actionError}</p>}

    <div className="filter-bar">
      {FILTERS.map(f => (
        <button
          key={f.value}
          className={`filter-btn ${filter === f.value ? 'filter-btn--active' : ''}`}
          onClick={() => setFilter(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>

      {showForm ? (
        <form className="inline-form" onSubmit={handleSubmit}>
          <p className="field-hint">If something feels like a scam, flag it here — your family will be able to see it and help you sort it out.</p>
          <div className="inline-form-row">
            <div className="field-group">
              <label htmlFor="flag-type">What happened?</label>
              <select id="flag-type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div className="field-group">
              <label htmlFor="flag-severity">How urgent?</label>
              <select id="flag-severity" value={form.severity} onChange={e => setForm({ ...form, severity: e.target.value })}>
                <option value="low">Not urgent</option>
                <option value="high">Urgent</option>
              </select>
            </div>
          </div>
          <div className="field-group">
            <label htmlFor="flag-description">What did you notice?</label>
            <input id="flag-description" required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          {formError && <p className="auth-error">{formError}</p>}
          <div className="btn-row">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Flag It'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setFormError(''); setForm(emptyForm); setEditingId(null) }}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="add-toggle" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true) }}>+ Flag something suspicious</button>
      )}

      {open.length > 0 && (
        <section className="mb-lg">
          <h2 className="section-label">Needs Attention</h2>
          <div className="card-list">
            {open.map(f => <FlagCard key={f.flag_id} flag={f} onResolve={handleResolve} onEdit={handleEditClick} onDelete={handleDelete} />)}
          </div>
        </section>
      )}

      {resolved.length > 0 && (
        <section>
          <h2 className="section-label">Resolved</h2>
          <div className="card-list">
            {resolved.map(f => <FlagCard key={f.flag_id} flag={f} onResolve={handleResolve} onEdit={handleEditClick} onDelete={handleDelete} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function FlagCard({ flag, onResolve, onEdit, onDelete }) {
  return (
    <div className={`info-card ${flag.severity === 'high' && !flag.is_resolved ? 'info-card--urgent' : ''}`}>
      <div className="info-card-header">
        <span className="info-card-title">{TYPE_LABELS[flag.type] || flag.type}</span>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {flag.severity === 'high' && <span className="badge badge--warn">High severity</span>}
          {flag.is_resolved && <span className="badge badge--ok">Resolved</span>}
        </div>
      </div>
      <p className="info-card-note">{flag.description}</p>
      <div className="action-row">
        <button className="action-btn" onClick={() => onResolve(flag)} title={flag.is_resolved ? 'Reopen this flag' : 'Mark this as resolved'}>
          {flag.is_resolved ? 'Reopen' : 'Mark Resolved'}
        </button>
        <button className="action-btn" onClick={() => onEdit(flag)} title="Edit this flag">
          Edit
        </button>
        <button className="action-btn action-btn--danger" onClick={() => onDelete(flag)} title="Delete this flag">
          Delete
        </button>
      </div>
    </div>
  )
}
