const CONTACTS = [
  { name: 'AARP Fraud Watch Network Helpline', phone: '1-877-908-3360', hours: 'Every day' },
  { name: 'Medicare', phone: '1-800-633-4227', hours: '24/7' },
  { name: 'Eldercare Locator', phone: '1-800-677-1116', hours: 'Weekdays' },
]

// Real, public support numbers — not AI-generated. Shown wherever someone
// might need to reach an actual person instead of using the app.
export default function HumanSupportCard({ className = '' }) {
  return (
    <div className={`info-card ${className}`}>
      <div className="info-card-header">
        <span className="info-card-title">Connect to a Human</span>
      </div>
      <p className="info-card-note">If you'd rather talk to a real person, these are free to call:</p>
      <div className="info-card-rows">
        {CONTACTS.map(c => (
          <div key={c.name} className="row-between">
            <span>
              {c.name}
              <span className="field-hint" style={{ display: 'block' }}>{c.hours}</span>
            </span>
            <a href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`} className="phone-link" title={`Call ${c.name}`}>
              {c.phone}
            </a>
          </div>
        ))}
      </div>
    </div>
  )
}
