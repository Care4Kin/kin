import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'

const CATEGORY_LABELS = {
  bank: 'Bank',
  insurance: 'Insurance',
  healthcare: 'Healthcare',
  government: 'Government',
  pharmacy: 'Pharmacy',
  other: 'Other',
}

export default function Accounts() {
  const { circleId } = useAuth()
  const { data: accounts, loading, error } = useFetch(
    () => api.getAccounts(circleId),
    [circleId]
  )

  if (!circleId || loading) return <p className="page-status">Loading accounts…</p>
  if (error) return <p className="page-status page-status--error">{error}</p>

  const grouped = accounts.reduce((acc, a) => {
    const key = a.category || 'other'
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {})

  return (
    <div className="page">
      <h1 className="page-title">Important Accounts</h1>
      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} style={{ marginBottom: '1.5rem' }}>
          <h2 className="section-label">{CATEGORY_LABELS[category] || category}</h2>
          <div className="card-list">
            {items.map(a => (
              <div key={a.account_id} className="info-card">
                <span className="info-card-title">{a.name}</span>
                {a.notes && <p className="info-card-note">{a.notes}</p>}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
