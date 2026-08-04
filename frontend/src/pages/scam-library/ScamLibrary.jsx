import InfoRow from '../../components/InfoRow'

// General scam-safety guidance based on common patterns widely reported by
// organizations like the FTC and AARP — written here as plain-language
// reference content, not a live feed from any external source.
const SCAMS = [
  {
    name: 'Grandparent Scam',
    looksLike: "A call or text claiming to be a grandchild in trouble — an accident, arrest, or stranded trip — begging for money right now and asking you to keep it secret.",
    doInstead: "Hang up and call that family member directly using a number you already have. Real emergencies don't require secrecy or gift cards.",
  },
  {
    name: 'Tech Support Scam',
    looksLike: "A pop-up, call, or email says your computer has a virus and offers to 'fix it' if you give them remote access or pay a fee.",
    doInstead: "Never give a stranger remote access to your computer. Close the pop-up, and if you're worried, call the computer or software company using a number from their real website.",
  },
  {
    name: 'Gift Card Scam',
    looksLike: "Anyone — a caller claiming to be the IRS, a utility company, or even a relative — asking you to pay a debt or fee using gift cards.",
    doInstead: "No real government agency, utility, or business ever accepts gift cards as payment. This is always a scam — hang up.",
  },
  {
    name: 'Phishing Email or Text',
    looksLike: "A message claiming to be from your bank, Medicare, or a delivery company, with an urgent link asking you to 'verify' your information.",
    doInstead: "Don't click the link. Go to the company's website directly by typing the address yourself, or call the number on your card or statement.",
  },
  {
    name: 'Medicare / Health Insurance Scam',
    looksLike: "A caller offers a free medical device or asks to 'confirm' your Medicare number over the phone.",
    doInstead: "Medicare will never call you asking for your number. Hang up and call Medicare directly at 1-800-633-4227 if you're unsure.",
  },
  {
    name: 'Romance Scam',
    looksLike: "Someone you've only met online professes love quickly, then eventually asks for money for an emergency, travel, or an investment.",
    doInstead: "Never send money to someone you haven't met in person. Talk to a family member before sending anything.",
  },
]

export default function ScamLibrary() {
  return (
    <div className="page">
      <h1 className="page-title">Scam Reference Library</h1>
      <p className="page-description">
        General safety information about common scam patterns, written in plain language — not a live data feed, just what to watch for and what to do.
      </p>

      <div className="card-list">
        {SCAMS.map(s => (
          <div key={s.name} className="info-card">
            <div className="info-card-header">
              <span className="info-card-title">{s.name}</span>
            </div>
            <div className="info-card-rows">
              <InfoRow label="What it looks like" value={s.looksLike} />
              <InfoRow label="What to do" value={s.doInstead} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
