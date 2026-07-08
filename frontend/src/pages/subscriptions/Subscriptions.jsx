import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'

export default function Subscriptions() {
  const { circleId } = useAuth()
  const { data: subs, loading, error } = useFetch(
    () => api.getSubscriptions(circleId),
    [circleId]
  )

  if (!circleId || loading) return <p className="page-status">Loading subscriptions…</p>
  if (error) return <p className="page-status page-status--error">{error}</p>

  const active   = subs.filter(s => s.is_active)
  const inactive = subs.filter(s => !s.is_active)
  const total    = active.reduce((sum, s) => sum + Number(s.monthly_cost || 0), 0)

  return (
    <div className="page">
      <h1 className="page-title">Subscriptions</h1>

      <div className="stat-banner">
        <span className="stat-banner-label">Monthly total</span>
        <span className="stat-banner-value">${total.toFixed(2)}</span>
      </div>

      <section>
        <h2 className="section-label">Active</h2>
        <div className="card-list">
          {active.map(s => <SubRow key={s.subscription_id} sub={s} />)}
        </div>
      </section>

      {inactive.length > 0 && (
        <section style={{ marginTop: '1.5rem' }}>
          <h2 className="section-label">Inactive</h2>
          <div className="card-list">
            {inactive.map(s => <SubRow key={s.subscription_id} sub={s} />)}
          </div>
        </section>
      )}
    </div>
  )
}

function SubRow({ sub }) {
  return (
    <div className={`bill-row ${!sub.is_active ? 'bill-row--paid' : ''}`}>
      <span className="bill-row-name">{sub.name}</span>
      <div className="bill-row-meta">
        <span className="bill-row-amount">${Number(sub.monthly_cost || 0).toFixed(2)}/mo</span>
        <span className={`bill-pill ${sub.is_active ? 'bill-pill--paid' : 'bill-pill--unpaid'}`}>
          {sub.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  )
}
