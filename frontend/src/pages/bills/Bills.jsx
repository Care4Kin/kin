import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'

export default function Bills() {
  const { circleId } = useAuth()
  const { data: bills, loading, error } = useFetch(
    () => api.getBills(circleId),
    [circleId]
  )

  if (!circleId || loading) return <p className="page-status">Loading bills…</p>
  if (error) return <p className="page-status page-status--error">{error}</p>

  const unpaid = bills.filter(b => !b.is_paid)
  const paid   = bills.filter(b => b.is_paid)

  return (
    <div className="page">
      <h1 className="page-title">Bills</h1>

      {unpaid.length > 0 && (
        <section className="bill-section">
          <h2 className="section-label">Coming Up</h2>
          {unpaid.map(b => <BillRow key={b.bill_id} bill={b} />)}
        </section>
      )}

      {paid.length > 0 && (
        <section className="bill-section">
          <h2 className="section-label">Paid</h2>
          {paid.map(b => <BillRow key={b.bill_id} bill={b} />)}
        </section>
      )}
    </div>
  )
}

function BillRow({ bill }) {
  const due = new Date(bill.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return (
    <div className={`bill-row ${bill.is_paid ? 'bill-row--paid' : ''}`}>
      <div className="bill-row-info">
        <span className="bill-row-name">{bill.name}</span>
        {bill.category && <span className="bill-row-category">{bill.category}</span>}
      </div>
      <div className="bill-row-meta">
        <span className="bill-row-amount">${Number(bill.amount).toFixed(2)}</span>
        <span className="bill-row-due">Due {due}</span>
        <span className={`bill-pill ${bill.is_paid ? 'bill-pill--paid' : 'bill-pill--unpaid'}`}>
          {bill.is_paid ? 'Paid' : 'Unpaid'}
        </span>
      </div>
    </div>
  )
}
