import { useState } from 'react'
import { api } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'
import FormMessage from '../../components/FormMessage'

export default function Feedback() {
  const { data, loading, error } = useFetch(() => api.getFeedback(), [])
  const [messages, setMessages] = useState(null)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [sendError, setSendError] = useState('')

  const list = messages ?? data ?? []

  if (loading) return <p className="page-status">Loading…</p>
  if (error) return <FormMessage variant="error" className="page-status page-status--error">{error}</FormMessage>

  async function handleSubmit(e) {
    e.preventDefault()
    setSendError('')
    if (!content.trim()) {
      setSendError('Please write something first')
      return
    }
    setSaving(true)
    try {
      const message = await api.sendFeedback(content.trim())
      setMessages([...(messages ?? data ?? []), message])
      setContent('')
    } catch (err) {
      setSendError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">Feedback</h1>
      <p className="page-description">
        Be as descriptive as you can in your message. If something isn't working, tell us exactly which
        part or feature it's about. If it's a suggestion, explain why it would help — and how it might be
        useful to other Kin users, not just you. This goes straight to the Kin team, privately; no one else
        in your family circle can see it.
      </p>

      {list.length > 0 && (
        <div className="card-list mb-lg">
          {list.map(m => (
            <div key={m.message_id} className="info-card">
              <p className="info-card-note" style={{ color: 'var(--text)' }}>{m.content}</p>
              <span className="info-row-label" style={{ marginTop: '0.25rem' }}>
                {new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          ))}
        </div>
      )}

      <form className="inline-form" onSubmit={handleSubmit}>
        <div className="field-group">
          <label htmlFor="feedback-content">Send a message</label>
          <textarea
            id="feedback-content"
            rows={5}
            placeholder="What's on your mind?"
            value={content}
            onChange={e => setContent(e.target.value)}
          />
        </div>
        <FormMessage variant="error">{sendError}</FormMessage>
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Sending…' : 'Send'}</button>
      </form>
    </div>
  )
}
