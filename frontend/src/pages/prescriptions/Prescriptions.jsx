import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'

export default function Prescriptions() {
  const { circleId } = useAuth()
  const { data: rxs, loading, error } = useFetch(
    () => api.getPrescriptions(circleId),
    [circleId]
  )

  if (!circleId || loading) return <p className="page-status">Loading prescriptions…</p>
  if (error) return <p className="page-status page-status--error">{error}</p>

  return (
    <div className="page">
      <h1 className="page-title">Prescriptions</h1>
      <div className="card-list">
        {rxs.map(rx => <RxCard key={rx.prescription_id} rx={rx} />)}
      </div>
    </div>
  )
}

function RxCard({ rx }) {
  const refill = rx.refill_date
    ? new Date(rx.refill_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
    : null
  const daysUntil = rx.refill_date
    ? Math.ceil((new Date(rx.refill_date) - new Date()) / 86400000)
    : null
  const urgent = daysUntil !== null && daysUntil <= 10

  return (
    <div className={`info-card ${urgent ? 'info-card--urgent' : ''}`}>
      <div className="info-card-header">
        <span className="info-card-title">{rx.medication_name}</span>
        {urgent && <span className="badge badge--warn">Refill soon</span>}
      </div>
      <div className="info-card-rows">
        {rx.dosage && <InfoRow label="Dosage" value={rx.dosage} />}
        {rx.prescribing_doctor && <InfoRow label="Doctor" value={rx.prescribing_doctor} />}
        {rx.pharmacy_name && <InfoRow label="Pharmacy" value={rx.pharmacy_name} />}
        {refill && <InfoRow label="Refill date" value={`${refill}${daysUntil !== null ? ` (${daysUntil} days)` : ''}`} />}
        {rx.notes && <InfoRow label="Notes" value={rx.notes} />}
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="info-row">
      <span className="info-row-label">{label}</span>
      <span className="info-row-value">{value}</span>
    </div>
  )
}
