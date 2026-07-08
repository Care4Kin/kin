import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'

const TYPE_LABELS = { call: 'Phone Call', email: 'Email', text: 'Text', bill: 'Bill', other: 'Other' }

const emptyForm = { type: 'call', description: '', severity: 'low' }

export default function Flags() {
  const { circleId } = useAuth()
  const { data, loading, error } = useFetch(() => api.getFlags(circleId), [circleId])
  const [flags, setFlags] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (data) setFlags(data) }, [data])

  if (!circleId || loading) return <p className="page-status">Loading…</p>
  if (error) return <p className="page-status page-status--error">{error}</p>

  async function handleAdd(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const flag = await api.createFlag(circleId, form)
      setFlags(prev => [flag, ...prev])
      setForm(emptyForm)
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleResolve(flag) {
    const updated = await api.updateFlag(circleId, flag.flag_id, { is_resolved: !flag.is_resolved })
    setFlags(prev => prev.map(f => f.flag_id === updated.flag_id ? updated : f))
  }

  const open     = flags.filter(f => !f.is_resolved)
  const resolved = flags.filter(f => f.is_resolved)

  return (
    <div className="page">
      <h1 className="page-title">Suspicious Activity</h1>

      {showForm ? (
        <form className="inline-form" onSubmit={handleAdd}>
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
          <div className="btn-row">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Flag It'}</button>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="add-toggle" onClick={() => setShowForm(true)}>+ Flag something suspicious</button>
      )}

      {open.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h2 className="section-label">Needs Attention</h2>
          <div className="card-list">
            {open.map(f => <FlagCard key={f.flag_id} flag={f} onResolve={handleResolve} />)}
          </div>
        </section>
      )}

      {resolved.length > 0 && (
        <section>
          <h2 className="section-label">Resolved</h2>
          <div className="card-list">
            {resolved.map(f => <FlagCard key={f.flag_id} flag={f} onResolve={handleResolve} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function FlagCard({ flag, onResolve }) {
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
      </div>
    </div>
  )
}
