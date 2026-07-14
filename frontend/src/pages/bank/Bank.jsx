import { useState, useEffect, useCallback } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import CategoryPieChart from '../../components/CategoryPieChart'

export default function Bank() {
  const { circleId, user } = useAuth()
  const isElder = user?.role === 'elder'

  const [accounts, setAccounts] = useState([])
  const [spending, setSpending] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [linkToken, setLinkToken] = useState(null)
  const [connecting, setConnecting] = useState(false)

  const loadAll = useCallback(async () => {
    if (!circleId) return
    setLoading(true)
    setError('')
    try {
      const [acc, spend, subs] = await Promise.all([
        api.getPlaidAccounts(circleId),
        api.getPlaidSpending(circleId),
        api.getPlaidSubscriptions(circleId),
      ])
      setAccounts(acc)
      setSpending(spend)
      setSubscriptions(subs)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [circleId])

  useEffect(() => { loadAll() }, [loadAll])

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: async (public_token, metadata) => {
      setConnecting(true)
      try {
        await api.exchangePlaidToken(circleId, {
          public_token,
          institution_name: metadata.institution?.name || null,
        })
        setLinkToken(null)
        await loadAll()
      } catch (err) {
        setError(err.message)
      } finally {
        setConnecting(false)
      }
    },
    onExit: () => {
      setLinkToken(null)
      setConnecting(false)
    },
  })

  useEffect(() => {
    if (linkToken && ready) open()
  }, [linkToken, ready, open])

  async function handleConnect() {
    setError('')
    setConnecting(true)
    try {
      const { link_token } = await api.createPlaidLinkToken(circleId)
      setLinkToken(link_token)
    } catch (err) {
      setError(err.message)
      setConnecting(false)
    }
  }

  async function handleDisconnect(plaidItemId) {
    await api.removePlaidItem(circleId, plaidItemId)
    await loadAll()
  }

  if (!circleId || loading) return <p className="page-status">Loading bank info…</p>

  return (
    <div className="page">
      <h1 className="page-title">Connected Banks</h1>
      <p className="field-hint" style={{ marginBottom: '1.25rem' }}>
        Link a bank account to automatically see your spending broken down by category and catch recurring subscriptions — no need to enter bills by hand.
      </p>

      {error && <p className="auth-error" style={{ marginBottom: '1rem' }}>{error}</p>}

      {isElder && (
        <button className="add-toggle" onClick={handleConnect} disabled={connecting}>
          {connecting ? 'Connecting…' : '+ Connect a Bank'}
        </button>
      )}

      {accounts.length === 0 ? (
        <p className="page-status">No banks connected yet.</p>
      ) : (
        <>
          <section style={{ marginBottom: '1.5rem' }}>
            <h2 className="section-label">Linked Accounts</h2>
            <div className="card-list">
              {accounts.map(a => (
                <div key={a.account_id} className="info-card">
                  <div className="info-card-header">
                    <span className="info-card-title">{a.name} {a.mask ? `••${a.mask}` : ''}</span>
                    {isElder && (
                      <button className="action-btn action-btn--danger" onClick={() => handleDisconnect(a.plaid_item_id)} title="Disconnect this bank">
                        Disconnect
                      </button>
                    )}
                  </div>
                  <p className="info-card-note">
                    {a.institution_name || 'Bank'} · {a.subtype || a.type}
                    {a.current_balance != null && ` · $${Number(a.current_balance).toFixed(2)} available`}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {spending.length > 0 && (
            <CategoryPieChart
              entries={spending.map(s => ({ category: s.category, amount: s.amount }))}
              title="Bank Spending by Category"
            />
          )}

          <section style={{ marginTop: '1.5rem' }}>
            <h2 className="section-label">Detected Subscriptions</h2>
            {subscriptions.length === 0 ? (
              <p className="page-status">No recurring charges detected yet.</p>
            ) : (
              <div className="card-list">
                {subscriptions.map(s => (
                  <div key={s.merchant} className="info-card">
                    <div className="info-card-header">
                      <span className="info-card-title">{s.merchant}</span>
                      <span className="bill-row-amount">${s.average_amount.toFixed(2)}</span>
                    </div>
                    <p className="info-card-note">Seen {s.occurrences} times · last on {s.last_date}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
