import { useState } from 'react'
import FormMessage from './FormMessage'

// Suspicious-looking bank transactions the AI flagged for a second look —
// same dismiss-or-add pattern as DetectedBankItems, but for Flags instead of
// bills/subscriptions, and showing the AI's risk read instead of "seen N times".
export default function DetectedFlagItems({ items, onAdd, onDismiss }) {
  const [addingKey, setAddingKey] = useState(null)
  const [dismissingKey, setDismissingKey] = useState(null)
  const [dismissedKeys, setDismissedKeys] = useState(new Set())
  const [error, setError] = useState('')

  const visible = items.filter(item => !dismissedKeys.has(item.source_key))
  if (visible.length === 0) return null

  const busy = key => addingKey === key || dismissingKey === key

  async function handleAdd(item) {
    setError('')
    setAddingKey(item.source_key)
    try {
      await onAdd(item)
      setDismissedKeys(prev => new Set(prev).add(item.source_key))
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
    <section className="mb-lg">
      <h2 className="section-label">AI-Detected From Your Bank</h2>
      <p className="field-hint mb-sm">Unusually large transactions the AI thinks are worth a second look — not a confirmed problem, just a heads-up.</p>
      <FormMessage variant="error" className="auth-error mb-sm">{error}</FormMessage>
      <div className="card-list">
        {visible.map(item => (
          <div key={item.source_key} className="info-card info-card--urgent">
            <div className="info-card-header">
              <span className="info-card-title">{item.merchant}</span>
              <span className={`badge ${item.risk_level === 'high' ? 'badge--warn' : 'badge--warn'}`}>
                {item.risk_level === 'high' ? 'High risk' : 'Medium risk'}
              </span>
            </div>
            <p className="info-card-note">${item.amount.toFixed(2)} on {item.date}</p>
            <div className="flag-ai-assessment">
              <span className="tip-label">AI risk read</span>
              <p>{item.explanation}</p>
              {item.suggested_action && <p className="flag-ai-action"><strong>Suggested next step:</strong> {item.suggested_action}</p>}
            </div>
            <div className="action-row">
              <button className="action-btn" disabled={busy(item.source_key)} onClick={() => handleAdd(item)}>
                {addingKey === item.source_key ? 'Flagging…' : 'Flag This'}
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
