import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'

const TYPE_LABELS = { call: 'Phone Call', email: 'Email', text: 'Text', bill: 'Bill', other: 'Other' }

export default function Flags() {
  const { circleId } = useAuth()
  const { data: flags, loading, error } = useFetch(
    () => api.getFlags(circleId),
    [circleId]
  )

  if (!circleId || loading) return <p className="page-status">Loading…</p>
  if (error) return <p className="page-status page-status--error">{error}</p>

  const open     = flags.filter(f => !f.is_resolved)
  const resolved = flags.filter(f => f.is_resolved)

  return (
    <div className="page">
      <h1 className="page-title">Suspicious Activity</h1>

      {open.length > 0 && (
        <section style={{ marginBottom: '1.5rem' }}>
          <h2 className="section-label">Needs Attention</h2>
          <div className="card-list">
            {open.map(f => <FlagCard key={f.flag_id} flag={f} />)}
          </div>
        </section>
      )}

      {resolved.length > 0 && (
        <section>
          <h2 className="section-label">Resolved</h2>
          <div className="card-list">
            {resolved.map(f => <FlagCard key={f.flag_id} flag={f} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function FlagCard({ flag }) {
  return (
    <div className={`info-card ${flag.severity === 'high' && !flag.is_resolved ? 'info-card--urgent' : ''}`}>
      <div className="info-card-header">
        <span className="info-card-title">{TYPE_LABELS[flag.type] || flag.type}</span>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {flag.severity === 'high' && <span className="badge badge--warn">High severity</span>}
          {flag.is_resolved && <span className="badge badge--ok">Resolved</span>}
        </div>
      </div>
      <p className="info-card-note">{flag.description}</p>
    </div>
  )
}
