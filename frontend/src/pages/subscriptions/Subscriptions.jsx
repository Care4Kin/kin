import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useResourceList } from '../../hooks/useResourceList'
import { usePlaidBank } from '../../hooks/usePlaidBank'
import DetectedBankItems from '../../components/DetectedBankItems'
import FormMessage from '../../components/FormMessage'
import LoggedOutGate from '../../components/LoggedOutGate'
import NoCircleGate from '../../components/NoCircleGate'
import { daysUntil } from '../../utils/date'

function needsReview(sub) {
  return !sub.last_reviewed_at || -daysUntil(sub.last_reviewed_at) > 90
}

export default function Subscriptions() {
  const { circleId, user, loading: authLoading, circleChecked } = useAuth()
  const isCaregiver = user?.role === 'caregiver'
  const { items: subs, setItems: setSubs, loading, error } = useResourceList(() => api.getSubscriptions(circleId), [circleId], !!circleId)
  const bank = usePlaidBank(circleId)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', monthly_cost: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [actionError, setActionError] = useState('')

  if (authLoading) return null
  if (!user) return <LoggedOutGate title="Subscriptions" description="Keep track of monthly services so nothing gets forgotten or overpaid." />
  if (circleChecked && !circleId) return <NoCircleGate title="Subscriptions" />
  if (!circleId || loading) return <p className="page-status">Loading subscriptions…</p>
  if (error) return <FormMessage variant="error" className="page-status page-status--error">{error}</FormMessage>

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) {
      setFormError('Please enter a subscription name')
      return
    }
    setSaving(true)
    const payload = { name: form.name.trim(), monthly_cost: Number(form.monthly_cost) }
    try {
      if (editingId) {
        const sub = await api.updateSubscription(circleId, editingId, payload)
        setSubs(prev => prev.map(s => s.subscription_id === sub.subscription_id ? sub : s))
      } else {
        const sub = await api.createSubscription(circleId, payload)
        setSubs(prev => [...prev, sub])
      }
      setForm({ name: '', monthly_cost: '' })
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleEditClick(sub) {
    setForm({ name: sub.name || '', monthly_cost: sub.monthly_cost != null ? String(sub.monthly_cost) : '' })
    setEditingId(sub.subscription_id)
    setFormError('')
    setShowForm(true)
  }

  async function toggleActive(sub) {
    setActionError('')
    try {
      const updated = await api.updateSubscription(circleId, sub.subscription_id, { is_active: !sub.is_active })
      setSubs(prev => prev.map(s => s.subscription_id === updated.subscription_id ? updated : s))
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleDelete(sub) {
    setActionError('')
    try {
      await api.deleteSubscription(circleId, sub.subscription_id)
      setSubs(prev => prev.filter(s => s.subscription_id !== sub.subscription_id))
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleAddDetected(item) {
    const sub = await api.createSubscription(circleId, {
      name: item.merchant,
      monthly_cost: item.average_amount,
      source_key: item.source_key,
    })
    setSubs(prev => [...prev, sub])
  }

  async function handleDismissDetected(item) {
    await api.dismissPlaidSuggestion(circleId, item.source_key)
  }

  async function handleMarkReviewed(sub) {
    setActionError('')
    try {
      const updated = await api.updateSubscription(circleId, sub.subscription_id, { last_reviewed_at: new Date().toISOString() })
      setSubs(prev => prev.map(s => s.subscription_id === updated.subscription_id ? updated : s))
    } catch (err) {
      setActionError(err.message)
    }
  }

  const active   = subs.filter(s => s.is_active)
  const inactive = subs.filter(s => !s.is_active)
  const total    = active.reduce((sum, s) => sum + Number(s.monthly_cost || 0), 0)
  const reviewCount = active.filter(needsReview).length

  return (
    <div className="page">
      <h1 className="page-title">Subscriptions</h1>
      <FormMessage variant="error" className="page-status page-status--error">{actionError}</FormMessage>

      <div className="stat-banner">
        <span className="stat-banner-label">Monthly total</span>
        <span className="stat-banner-value">${total.toFixed(2)}</span>
      </div>

      {isCaregiver && (
        <div className={`stat-banner ${reviewCount > 0 ? 'stat-banner--warn' : ''}`}>
          <span className="stat-banner-label">Haven't been reviewed in 90+ days</span>
          <span className="stat-banner-value">{reviewCount}</span>
        </div>
      )}

      {showForm ? (
        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="sub-name">Subscription Name</label>
            <input id="sub-name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field-group">
            <label htmlFor="sub-cost">Monthly Cost</label>
            <input id="sub-cost" type="number" step="0.01" min="0" required value={form.monthly_cost} onChange={e => setForm({ ...form, monthly_cost: e.target.value })} />
          </div>
          <FormMessage variant="error">{formError}</FormMessage>
          <div className="btn-row">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Subscription'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setFormError(''); setForm({ name: '', monthly_cost: '' }); setEditingId(null) }}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="add-toggle" aria-expanded={showForm} onClick={() => { setForm({ name: '', monthly_cost: '' }); setEditingId(null); setShowForm(true) }}>+ Add a subscription</button>
      )}

      <section>
        <h2 className="section-label">Active</h2>
        <div className="card-list">
          {active.map(s => <SubRow key={s.subscription_id} sub={s} isCaregiver={isCaregiver} onToggleActive={toggleActive} onDelete={handleDelete} onMarkReviewed={handleMarkReviewed} onEdit={handleEditClick} />)}
        </div>
      </section>

      {inactive.length > 0 && (
        <section className="mt-lg">
          <h2 className="section-label">Inactive</h2>
          <div className="card-list">
            {inactive.map(s => <SubRow key={s.subscription_id} sub={s} isCaregiver={isCaregiver} onToggleActive={toggleActive} onDelete={handleDelete} onMarkReviewed={handleMarkReviewed} onEdit={handleEditClick} />)}
          </div>
        </section>
      )}

      <DetectedBankItems
        items={bank.subscriptions}
        existingNames={new Set(subs.map(s => s.name.trim().toLowerCase()))}
        onAdd={handleAddDetected}
        onDismiss={handleDismissDetected}
        title="Detected From Your Bank"
        hint="Recurring charges we noticed on a connected bank account that look like subscriptions."
        className="mt-lg"
      />
    </div>
  )
}

function SubRow({ sub, isCaregiver, onToggleActive, onDelete, onMarkReviewed, onEdit }) {
  const stale = isCaregiver && sub.is_active && needsReview(sub)
  return (
    <div className={`bill-row row-stacked ${!sub.is_active ? 'bill-row--paid' : ''}`}>
      <div className="row-between">
        <span className="bill-row-name">{sub.name}</span>
        <div className="bill-row-meta">
          <span className="bill-row-amount">${Number(sub.monthly_cost || 0).toFixed(2)}/mo</span>
          <span className={`bill-pill ${sub.is_active ? 'bill-pill--paid' : 'bill-pill--unpaid'}`}>
            {sub.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      {stale && <span className="badge badge--warn">Needs review</span>}
      <div className="action-row">
        <button className="action-btn" onClick={() => onToggleActive(sub)} title={sub.is_active ? 'Mark this subscription as inactive' : 'Mark this subscription as active'}>
          {sub.is_active ? 'Mark Inactive' : 'Mark Active'}
        </button>
        <button className="action-btn" onClick={() => onEdit(sub)} title="Edit this subscription">
          Edit
        </button>
        {stale && (
          <button className="action-btn" onClick={() => onMarkReviewed(sub)} title="Mark this subscription as reviewed today">
            Mark Reviewed
          </button>
        )}
        <button className="action-btn action-btn--danger" onClick={() => onDelete(sub)} title="Remove this subscription from the dashboard">
          Delete
        </button>
      </div>
    </div>
  )
}
