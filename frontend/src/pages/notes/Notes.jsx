import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'

export default function Notes() {
  const { circleId, user } = useAuth()
  const { data, loading, error } = useFetch(() => api.getNotes(circleId), [circleId])
  const [notes, setNotes] = useState([])
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => { if (data) setNotes(data) }, [data])

  if (!circleId || loading) return <p className="page-status">Loading notes…</p>
  if (error) return <p className="page-status page-status--error">{error}</p>

  async function handleAdd(e) {
    e.preventDefault()
    setFormError('')
    if (!content.trim()) return
    setSaving(true)
    try {
      const note = await api.createNote(circleId, { content: content.trim() })
      setNotes(prev => [note, ...prev])
      setContent('')
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(note) {
    await api.deleteNote(circleId, note.note_id)
    setNotes(prev => prev.filter(n => n.note_id !== note.note_id))
  }

  return (
    <div className="page">
      <h1 className="page-title">Shared Notes</h1>

      <form className="inline-form" onSubmit={handleAdd}>
        <div className="field-group">
          <label htmlFor="note-content">Leave a message for your family</label>
          <input id="note-content" value={content} onChange={e => setContent(e.target.value)} placeholder="Type a note…" />
        </div>
        {formError && <p className="auth-error">{formError}</p>}
        <button type="submit" className="btn-primary" disabled={saving || !content.trim()}>{saving ? 'Posting…' : 'Post Note'}</button>
      </form>

      <div className="card-list">
        {notes.map(n => (
          <div key={n.note_id} className="info-card">
            <p className="info-card-note" style={{ fontSize: '1rem', color: 'var(--text)' }}>{n.content}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
              <span className="info-row-label">
                {n.author?.full_name || 'Unknown'} · {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {n.author?.user_id === user?.user_id && (
                <button className="action-btn action-btn--danger" onClick={() => handleDelete(n)} title="Delete your note">
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
