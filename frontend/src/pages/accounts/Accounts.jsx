import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'

const CATEGORY_LABELS = {
  bank: 'Bank',
  insurance: 'Insurance',
  healthcare: 'Healthcare',
  government: 'Government',
  pharmacy: 'Pharmacy',
  other: 'Other',
}

const emptyForm = { name: '', category: 'bank', notes: '' }

export default function Accounts() {
  const { circleId } = useAuth()
  const { data, loading, error } = useFetch(() => api.getAccounts(circleId), [circleId])
  const [accounts, setAccounts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formError, setFormError] = useState('')

  useEffect(() => { if (data) setAccounts(data) }, [data])

  if (!circleId || loading) return <p className="page-status">Loading accounts…</p>
  if (error) return <p className="page-status page-status--error">{error}</p>

  async function handleAdd(e) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) {
      setFormError('Please enter an account name')
      return
    }
    setSaving(true)
    try {
      const account = await api.createAccount(circleId, {
        name: form.name.trim(),
        category: form.category,
        notes: form.notes || null,
      })
      setAccounts(prev => [...prev, account])
      setForm(emptyForm)
      setShowForm(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdate(accountId, updates) {
    const updated = await api.updateAccount(circleId, accountId, updates)
    setAccounts(prev => prev.map(a => a.account_id === updated.account_id ? updated : a))
    setEditingId(null)
  }

  async function handleDelete(account) {
    await api.deleteAccount(circleId, account.account_id)
    setAccounts(prev => prev.filter(a => a.account_id !== account.account_id))
  }

  const grouped = accounts.reduce((acc, a) => {
    const key = a.category || 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  return (
    <div className="page">
      <h1 className="page-title">Important Accounts</h1>

      {showForm ? (
        <form className="inline-form" onSubmit={handleAdd}>
          <div className="field-group">
            <label htmlFor="acct-name">Account Name</label>
            <input id="acct-name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field-group">
            <label htmlFor="acct-category">Category</label>
            <select id="acct-category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <div className="field-group">
            <label htmlFor="acct-notes">Notes</label>
            <input id="acct-notes" placeholder="No passwords — just helpful reminders" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          {formError && <p className="auth-error">{formError}</p>}
          <div className="btn-row">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Account'}</button>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setFormError('') }}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="add-toggle" onClick={() => setShowForm(true)}>+ Add an account</button>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} style={{ marginBottom: '1.5rem' }}>
          <h2 className="section-label">{CATEGORY_LABELS[category] || category}</h2>
          <div className="card-list">
            {items.map(a => (
              editingId === a.account_id
                ? <AccountEditForm key={a.account_id} account={a} onSave={handleUpdate} onCancel={() => setEditingId(null)} />
                : (
                  <div key={a.account_id} className="info-card">
                    <span className="info-card-title">{a.name}</span>
                    {a.notes && <p className="info-card-note">{a.notes}</p>}
                    <div className="action-row">
                      <button className="action-btn" onClick={() => setEditingId(a.account_id)} title="Edit this account">
                        Edit
                      </button>
                      <button className="action-btn action-btn--danger" onClick={() => handleDelete(a)} title="Remove this account from the dashboard">
                        Delete
                      </button>
                    </div>
                  </div>
                )
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function AccountEditForm({ account, onSave, onCancel }) {
  const [form, setForm] = useState({ name: account.name, category: account.category || 'other', notes: account.notes || '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) {
      setFormError('Please enter an account name')
      return
    }
    setSaving(true)
    try {
      await onSave(account.account_id, { name: form.name.trim(), category: form.category, notes: form.notes || null })
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form className="inline-form" onSubmit={handleSubmit}>
      <div className="field-group">
        <label htmlFor={`edit-name-${account.account_id}`}>Account Name</label>
        <input id={`edit-name-${account.account_id}`} required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="field-group">
        <label htmlFor={`edit-category-${account.account_id}`}>Category</label>
        <select id={`edit-category-${account.account_id}`} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div className="field-group">
        <label htmlFor={`edit-notes-${account.account_id}`}>Notes</label>
        <input id={`edit-notes-${account.account_id}`} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      </div>
      {formError && <p className="auth-error">{formError}</p>}
      <div className="btn-row">
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
