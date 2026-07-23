import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useResourceList } from '../../hooks/useResourceList'
import { usePlaidBank } from '../../hooks/usePlaidBank'
import CategoryPieChart from '../../components/CategoryPieChart'
import FormMessage from '../../components/FormMessage'
import LoggedOutGate from '../../components/LoggedOutGate'
import NoCircleGate from '../../components/NoCircleGate'

const CATEGORY_LABELS = {
  bank: 'Bank',
  insurance: 'Insurance',
  healthcare: 'Healthcare',
  government: 'Government',
  pharmacy: 'Pharmacy',
  other: 'Other',
}

// Plaid's own account `type` field — separate from the manual-account
// `category` above, since linked accounts aren't user-categorized.
const PLAID_TYPE_LABELS = {
  depository: 'Checking & Savings',
  credit: 'Credit Cards',
  loan: 'Loans',
  investment: 'Investments',
  other: 'Other',
}

function bankAccountLabel(a) {
  return `${a.name}${a.mask ? ` ••${a.mask}` : ''}`
}

function bankBalance(a) {
  return a.current_balance != null ? Number(a.current_balance) : 0
}

const emptyForm = { name: '', category: 'bank', notes: '' }

export default function Accounts() {
  const { circleId, user, loading: authLoading, circleChecked } = useAuth()
  const isElder = user?.role === 'elder'
  const isCaregiver = user?.role === 'caregiver'
  const { items: accounts, setItems: setAccounts, loading, error } = useResourceList(() => api.getAccounts(circleId), [circleId], !!circleId)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')

  const bank = usePlaidBank(circleId)

  if (authLoading) return null
  if (!user) return <LoggedOutGate title="Important Accounts" description="Keep bank, insurance, healthcare, and other key accounts in one place — no passwords, just helpful reminders." />
  if (circleChecked && !circleId) return <NoCircleGate title="Important Accounts" />
  if (!circleId || loading) return <p className="page-status">Loading accounts…</p>
  if (error) return <FormMessage variant="error" className="page-status page-status--error">{error}</FormMessage>

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
    setActionError('')
    try {
      await api.deleteAccount(circleId, account.account_id)
      setAccounts(prev => prev.filter(a => a.account_id !== account.account_id))
    } catch (err) {
      setActionError(err.message)
    }
  }

  const grouped = accounts.reduce((acc, a) => {
    const key = a.category || 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  const bankGrouped = bank.accounts.reduce((acc, a) => {
    const key = a.type || 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  const bankOverallEntries = Object.entries(bankGrouped).map(([type, items]) => ({
    category: PLAID_TYPE_LABELS[type] || type,
    amount: items.reduce((sum, a) => sum + bankBalance(a), 0),
  }))
  const bankTotal = bank.accounts.reduce((sum, a) => sum + bankBalance(a), 0)

  return (
    <div className="page">
      <h1 className="page-title">Important Accounts</h1>
      <FormMessage variant="error" className="page-status page-status--error">{actionError}</FormMessage>

      <section className="mb-lg">
        <h2 className="section-label">Linked Bank Accounts</h2>
        <p className="field-hint mb-sm">
          Connect a real bank to see balances here automatically, plus spending by category on Bills and detected recurring charges on Subscriptions.
        </p>

        <FormMessage variant="error" className="auth-error mb-sm">{bank.error}</FormMessage>

        {isElder && (
          <button className="add-toggle" onClick={bank.connect} disabled={bank.connecting}>
            {bank.connecting ? 'Connecting…' : '+ Connect a Bank'}
          </button>
        )}

        {bank.accounts.length === 0 ? (
          <p className="page-status">No banks connected yet.</p>
        ) : isCaregiver ? (
          <>
            {Object.keys(bankGrouped).length > 1 && (
              <CategoryPieChart entries={bankOverallEntries} title="Balance by Account Type" />
            )}

            {Object.entries(bankGrouped).map(([type, items]) => (
              <div key={type} className="mb-md">
                <h3 className="section-label">{PLAID_TYPE_LABELS[type] || type}</h3>

                {items.length > 1 && (
                  <CategoryPieChart
                    entries={items.map(a => ({ category: bankAccountLabel(a), amount: bankBalance(a) }))}
                    title={`${PLAID_TYPE_LABELS[type] || type} Breakdown`}
                  />
                )}

                <div className="card-list">
                  {items.map(a => <BankAccountCard key={a.account_id} account={a} isElder={isElder} onDisconnect={bank.disconnect} />)}
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="stat-banner mb-md">
              <span className="stat-banner-label">Total balance</span>
              <span className="stat-banner-value">${bankTotal.toFixed(2)}</span>
            </div>
            <div className="card-list">
              {bank.accounts.map(a => <BankAccountCard key={a.account_id} account={a} isElder={isElder} onDisconnect={bank.disconnect} />)}
            </div>
          </>
        )}
      </section>

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
          <FormMessage variant="error">{formError}</FormMessage>
          <div className="btn-row">
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Account'}</button>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setFormError('') }}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="add-toggle" aria-expanded={showForm} onClick={() => setShowForm(true)}>+ Add an account</button>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mb-lg">
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

function BankAccountCard({ account: a, isElder, onDisconnect }) {
  return (
    <div className="info-card">
      <div className="info-card-header">
        <span className="info-card-title">{bankAccountLabel(a)}</span>
        {isElder && (
          <button className="action-btn action-btn--danger" onClick={() => onDisconnect(a.plaid_item_id)} title="Disconnect this bank">
            Disconnect
          </button>
        )}
      </div>
      <p className="info-card-note">
        {a.institution_name || 'Bank'} · {a.subtype || a.type}
        {a.current_balance != null && ` · $${Number(a.current_balance).toFixed(2)} available`}
      </p>
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
      <FormMessage variant="error">{formError}</FormMessage>
      <div className="btn-row">
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}
