import { useState } from 'react'
import FormMessage from './FormMessage'

// Shows recurring bank charges (detected bills or subscriptions) that
// aren't in the caller's real list yet, each with an Add button that turns
// it into a real entry. Once added, it's filtered out by existingNames on
// the next render — no separate "already added" state to track.
export default function DetectedBankItems({ items, existingNames, onAdd, title, hint, className = '' }) {
  const [addingKey, setAddingKey] = useState(null)
  const [error, setError] = useState('')

  const addable = items.filter(item => !existingNames.has(item.merchant.trim().toLowerCase()))
  if (addable.length === 0) return null

  async function handleAdd(item) {
    setError('')
    setAddingKey(item.merchant)
    try {
      await onAdd(item)
    } catch (err) {
      setError(err.message)
    } finally {
      setAddingKey(null)
    }
  }

  return (
    <section className={`mb-lg ${className}`}>
      <h2 className="section-label">{title}</h2>
      {hint && <p className="field-hint mb-sm">{hint}</p>}
      <FormMessage variant="error" className="auth-error mb-sm">{error}</FormMessage>
      <div className="card-list">
        {addable.map(item => (
          <div key={item.merchant} className="info-card">
            <div className="info-card-header">
              <span className="info-card-title">{item.merchant}</span>
              <span className="bill-row-amount">${item.average_amount.toFixed(2)}</span>
            </div>
            <p className="info-card-note">Seen {item.occurrences} times · last on {item.last_date}</p>
            <div className="action-row">
              <button className="action-btn" disabled={addingKey === item.merchant} onClick={() => handleAdd(item)}>
                {addingKey === item.merchant ? 'Adding…' : '+ Add'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
