import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'

export default function Notes() {
  const { circleId } = useAuth()
  const { data: notes, loading, error } = useFetch(
    () => api.getNotes(circleId),
    [circleId]
  )

  if (!circleId || loading) return <p className="page-status">Loading notes…</p>
  if (error) return <p className="page-status page-status--error">{error}</p>

  return (
    <div className="page">
      <h1 className="page-title">Shared Notes</h1>
      <div className="card-list">
        {notes.map(n => (
          <div key={n.note_id} className="info-card">
            <p className="info-card-note" style={{ fontSize: '1rem', color: 'var(--text)' }}>{n.content}</p>
            <span className="info-row-label" style={{ marginTop: '0.5rem', display: 'block' }}>
              {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
