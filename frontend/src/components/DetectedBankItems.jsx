import { useState } from 'react'
import FormMessage from './FormMessage'

// Shows recurring bank charges (detected bills or subscriptions) that aren't
// in the caller's real list yet, each with an Add button that turns it into
// a real entry, and a Not Now button that dismisses it for good. The backend
// already excludes anything added or dismissed before (keyed by the stable
// source_key, not the merchant name), so a rename or delete afterward won't
// bring it back — existingNames here is just a same-render safety net for
// something the user just added manually under a matching name.
export default function DetectedBankItems({ items, existingNames, onAdd, onDismiss, title, hint, className = '' }) {
  const [addingKey, setAddingKey] = useState(null)
  const [dismissingKey, setDismissingKey] = useState(null)
  const [dismissedKeys, setDismissedKeys] = useState(new Set())
  const [error, setError] = useState('')

  const addable = items.filter(item =>
    !existingNames.has(item.merchant.trim().toLowerCase()) && !dismissedKeys.has(item.source_key)
  )
  if (addable.length === 0) return null

  const busy = key => addingKey === key || dismissingKey === key

  async function handleAdd(item) {
    setError('')
    setAddingKey(item.source_key)
    try {
      await onAdd(item)
    } catch (err) {
      setError(err.message)
    } finally {
      setAddingKey(null)
    }
  }

  async function handleDismiss(item) {
    setError('')
    setDismissingKey(item.source_key)
    try {
      await onDismiss(item)
      setDismissedKeys(prev => new Set(prev).add(item.source_key))
    } catch (err) {
      setError(err.message)
    } finally {
      setDismissingKey(null)
    }
  }

  return (
    <section className={`mb-lg ${className}`}>
      <h2 className="section-label">{title}</h2>
      {hint && <p className="field-hint mb-sm">{hint}</p>}
      <FormMessage variant="error" className="auth-error mb-sm">{error}</FormMessage>
      <div className="card-list">
        {addable.map(item => (
          <div key={item.source_key} className="info-card">
            <div className="info-card-header">
              <span className="info-card-title">{item.merchant}</span>
              <span className="bill-row-amount">${item.average_amount.toFixed(2)}</span>
            </div>
            <p className="info-card-note">Seen {item.occurrences} times · last on {item.last_date}</p>
            <div className="action-row">
              <button className="action-btn" disabled={busy(item.source_key)} onClick={() => handleAdd(item)}>
                {addingKey === item.source_key ? 'Adding…' : '+ Add'}
              </button>
              <button className="action-btn" disabled={busy(item.source_key)} onClick={() => handleDismiss(item)} title="Don't suggest this again">
                {dismissingKey === item.source_key ? 'Dismissing…' : 'Not Now'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
