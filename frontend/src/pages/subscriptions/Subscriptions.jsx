import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'
import { usePlaidBank } from '../../hooks/usePlaidBank'

export default function Subscriptions() {
  const { circleId } = useAuth()
  const { data, loading, error } = useFetch(() => api.getSubscriptions(circleId), [circleId])
  const bank = usePlaidBank(circleId)
  const [subs, setSubs] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', monthly_cost: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => { if (data) setSubs(data) }, [data])

  if (!circleId || loading) return <p className="page-status">Loading subscriptions…</p>
  if (error) return <p className="page-status page-status--error">{error}</p>

  async function handleAdd(e) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) {
      setFormError('Please enter a subscription name')
      return
    }
    setSaving(true)
    try {
      const sub = await api.createSubscription(circleId, {
        name: form.name.trim(),
        monthly_cost: Number(form.monthly_cost),
      })
      setSubs(prev => [...prev, sub])
      setForm({ name: '', monthly_cost: '' })
      setShowForm(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(sub) {
    const updated = await api.updateSubscription(circleId, sub.subscription_id, { is_active: !sub.is_active })
    setSubs(prev => prev.map(s => s.subscription_id === updated.subscription_id ? updated : s))
  }

  async function handleDelete(sub) {
    await api.deleteSubscription(circleId, sub.subscription_id)
    setSubs(prev => prev.filter(s => s.subscription_id !== sub.subscription_id))
  }

  const active   = subs.filter(s => s.is_active)
  const inactive = subs.filter(s => !s.is_active)
  const total    = active.reduce((sum, s) => sum + Number(s.monthly_cost || 0), 0)

  return (
    <div className="page">
      <h1 className="page-title">Subscriptions</h1>

      <div className="stat-banner">
        <span className="stat-banner-label">Monthly total</span>
        <span className="stat-banner-value">${total.toFixed(2)}</span>
      </div>

      {showForm ? (
        <form className="inline-form" onSubmit={handleAdd}>
          <div className="field-group">
            <label htmlFor="sub-name">Subscription Name</label>
            <input id="sub-name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field-group">
            <label htmlFor="sub-cost">Monthly Cost</label>
            <input id="sub-cost" type="number" step="0.01" min="0" required value={form.monthly_cost} onChange={e => setForm({ ...form, monthly_cost: e.target.value })} />
          </div>
          {formError && <p className="auth-error">{formError}</p>}
          <div className="btn-row">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Subscription'}</button>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setFormError('') }}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="add-toggle" onClick={() => setShowForm(true)}>+ Add a subscription</button>
      )}

      <section>
        <h2 className="section-label">Active</h2>
        <div className="card-list">
          {active.map(s => <SubRow key={s.subscription_id} sub={s} onToggleActive={toggleActive} onDelete={handleDelete} />)}
        </div>
      </section>

      {inactive.length > 0 && (
        <section style={{ marginTop: '1.5rem' }}>
          <h2 className="section-label">Inactive</h2>
          <div className="card-list">
            {inactive.map(s => <SubRow key={s.subscription_id} sub={s} onToggleActive={toggleActive} onDelete={handleDelete} />)}
          </div>
        </section>
      )}

      {bank.subscriptions.length > 0 && (
        <section style={{ marginTop: '1.5rem' }}>
          <h2 className="section-label">Detected From Your Bank</h2>
          <p className="field-hint" style={{ marginBottom: '0.6rem' }}>
            Recurring charges we noticed on a connected bank account — not added to your list above automatically.
          </p>
          <div className="card-list">
            {bank.subscriptions.map(s => (
              <div key={s.merchant} className="info-card">
                <div className="info-card-header">
                  <span className="info-card-title">{s.merchant}</span>
                  <span className="bill-row-amount">${s.average_amount.toFixed(2)}</span>
                </div>
                <p className="info-card-note">Seen {s.occurrences} times · last on {s.last_date}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SubRow({ sub, onToggleActive, onDelete }) {
  return (
    <div className={`bill-row ${!sub.is_active ? 'bill-row--paid' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '0.75rem' }}>
        <span className="bill-row-name">{sub.name}</span>
        <div className="bill-row-meta">
          <span className="bill-row-amount">${Number(sub.monthly_cost || 0).toFixed(2)}/mo</span>
          <span className={`bill-pill ${sub.is_active ? 'bill-pill--paid' : 'bill-pill--unpaid'}`}>
            {sub.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <div className="action-row">
        <button className="action-btn" onClick={() => onToggleActive(sub)} title={sub.is_active ? 'Mark this subscription as inactive' : 'Mark this subscription as active'}>
          {sub.is_active ? 'Mark Inactive' : 'Mark Active'}
        </button>
        <button className="action-btn action-btn--danger" onClick={() => onDelete(sub)} title="Remove this subscription from the dashboard">
          Delete
        </button>
      </div>
    </div>
  )
}
