import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'

export default function Bills() {
  const { circleId, user } = useAuth()
  const isCaregiver = user?.role === 'caregiver'
  const { data, loading, error } = useFetch(() => api.getBills(circleId), [circleId])
  const [bills, setBills] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', amount: '', due_date: '', category: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [editingId, setEditingId] = useState(null)

  useEffect(() => { if (data) setBills(data) }, [data])

  if (!circleId || loading) return <p className="page-status">Loading bills…</p>
  if (error) return <p className="page-status page-status--error">{error}</p>

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!form.name.trim()) {
      setFormError('Please enter a bill name')
      return
    }
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      amount: Number(form.amount),
      due_date: form.due_date,
      category: form.category.trim() || null,
    }
    try {
      if (editingId) {
        const bill = await api.updateBill(circleId, editingId, payload)
        setBills(prev => prev.map(b => b.bill_id === bill.bill_id ? bill : b))
      } else {
        const bill = await api.createBill(circleId, payload)
        setBills(prev => [...prev, bill])
      }
      setForm({ name: '', amount: '', due_date: '', category: '' })
      setEditingId(null)
      setShowForm(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleEditClick(bill) {
    setForm({
      name: bill.name || '',
      amount: bill.amount != null ? String(bill.amount) : '',
      due_date: bill.due_date || '',
      category: bill.category || '',
    })
    setEditingId(bill.bill_id)
    setFormError('')
    setShowForm(true)
  }

  async function togglePaid(bill) {
    const updated = await api.updateBill(circleId, bill.bill_id, { is_paid: !bill.is_paid })
    setBills(prev => prev.map(b => b.bill_id === updated.bill_id ? updated : b))
  }

  async function handleDelete(bill) {
    await api.deleteBill(circleId, bill.bill_id)
    setBills(prev => prev.filter(b => b.bill_id !== bill.bill_id))
  }

  const unpaid = bills.filter(b => !b.is_paid)
  const paid   = bills.filter(b => b.is_paid)

  return (
    <div className="page">
      <h1 className="page-title">Bills</h1>

      {showForm ? (
        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="bill-name">Bill Name</label>
            <input id="bill-name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="inline-form-row">
            <div className="field-group">
              <label htmlFor="bill-amount">Amount</label>
              <input id="bill-amount" type="number" step="0.01" min="0" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="field-group">
              <label htmlFor="bill-due">Due Date</label>
              <input id="bill-due" type="date" required value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <div className="field-group">
            <label htmlFor="bill-category">Category</label>
            <input id="bill-category" placeholder="utility, housing, healthcare…" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
          </div>
          {formError && <p className="auth-error">{formError}</p>}
          <div className="btn-row">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Bill'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setFormError(''); setForm({ name: '', amount: '', due_date: '', category: '' }); setEditingId(null) }}>Cancel</button>
          </div>
        </form>
      ) : (
        <button className="add-toggle" onClick={() => { setForm({ name: '', amount: '', due_date: '', category: '' }); setEditingId(null); setShowForm(true) }}>+ Add a bill</button>
      )}

      {isCaregiver && <CategoryPieChart bills={bills} />}

      {unpaid.length > 0 && (
        <section className="bill-section">
          <h2 className="section-label">Coming Up</h2>
          {unpaid.map(b => <BillRow key={b.bill_id} bill={b} onTogglePaid={togglePaid} onDelete={handleDelete} onEdit={handleEditClick} />)}
        </section>
      )}

      {paid.length > 0 && (
        <section className="bill-section">
          <h2 className="section-label">Paid</h2>
          {paid.map(b => <BillRow key={b.bill_id} bill={b} onTogglePaid={togglePaid} onDelete={handleDelete} onEdit={handleEditClick} />)}
        </section>
      )}
    </div>
  )
}

function BillRow({ bill, onTogglePaid, onDelete, onEdit }) {
  const due = new Date(bill.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return (
    <div className={`bill-row ${bill.is_paid ? 'bill-row--paid' : ''}`} style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '0.75rem' }}>
        <div className="bill-row-info">
          <span className="bill-row-name">{bill.name}</span>
          {bill.category && <span className="bill-row-category">{bill.category}</span>}
        </div>
        <div className="bill-row-meta">
          <span className="bill-row-amount">${Number(bill.amount || 0).toFixed(2)}</span>
          <span className="bill-row-due">Due {due}</span>
          <span className={`bill-pill ${bill.is_paid ? 'bill-pill--paid' : 'bill-pill--unpaid'}`}>
            {bill.is_paid ? 'Paid' : 'Unpaid'}
          </span>
        </div>
      </div>
      <div className="action-row">
        <button className="action-btn" onClick={() => onTogglePaid(bill)} title={bill.is_paid ? 'Mark this bill as unpaid' : 'Mark this bill as paid'}>
          {bill.is_paid ? 'Mark Unpaid' : 'Mark Paid'}
        </button>
        <button className="action-btn" onClick={() => onEdit(bill)} title="Edit this bill">
          Edit
        </button>
        <button className="action-btn action-btn--danger" onClick={() => onDelete(bill)} title="Remove this bill from the dashboard">
          Delete
        </button>
      </div>
    </div>
  )
}

// Validated categorical palette (dark-surface step, see dataviz skill) — fixed
// order so slice color stays stable as amounts change from render to render.
const CHART_COLORS = ['#3987e5', '#199e70', '#c98500', '#008300', '#9085e9', '#e66767', '#d55181']
const MAX_SLICES = 7

function CategoryPieChart({ bills }) {
  const totals = {}
  bills.forEach(b => {
    const cat = (b.category || '').trim().toLowerCase() || 'other'
    totals[cat] = (totals[cat] || 0) + Number(b.amount || 0)
  })

  let entries = Object.entries(totals).sort((a, b) => b[1] - a[1])
  if (entries.length > MAX_SLICES) {
    const top = entries.slice(0, MAX_SLICES - 1)
    const restTotal = entries.slice(MAX_SLICES - 1).reduce((sum, [, v]) => sum + v, 0)
    const otherIndex = top.findIndex(([category]) => category === 'other')
    if (otherIndex >= 0) {
      top[otherIndex] = ['other', top[otherIndex][1] + restTotal]
    } else {
      top.push(['other', restTotal])
    }
    entries = top
  }

  const grandTotal = entries.reduce((sum, [, v]) => sum + v, 0)
  if (grandTotal <= 0) return null

  let cursor = 0
  const slices = entries.map(([category, amount], i) => {
    const pct = (amount / grandTotal) * 100
    const slice = { category, amount, pct, start: cursor, end: cursor + pct, color: CHART_COLORS[i % CHART_COLORS.length] }
    cursor += pct
    return slice
  })

  const gradient = slices.map(s => `${s.color} ${s.start}% ${s.end}%`).join(', ')

  return (
    <div className="pie-chart-card">
      <h2 className="section-label">Spending by Category</h2>
      <div className="pie-chart-body">
        <div className="pie-chart-donut" style={{ background: `conic-gradient(${gradient})` }} role="img" aria-label={`Bill spending by category: ${slices.map(s => `${s.category} ${s.pct.toFixed(0)}%`).join(', ')}`}>
          <div className="pie-chart-hole">
            <span className="pie-chart-total">${grandTotal.toFixed(0)}</span>
            <span className="pie-chart-total-label">total</span>
          </div>
        </div>
        <ul className="pie-chart-legend">
          {slices.map(s => (
            <li key={s.category}>
              <span className="pie-chart-swatch" style={{ background: s.color }} aria-hidden="true" />
              <span className="pie-chart-legend-label">{s.category}</span>
              <span className="pie-chart-legend-value">${s.amount.toFixed(2)} ({s.pct.toFixed(0)}%)</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
