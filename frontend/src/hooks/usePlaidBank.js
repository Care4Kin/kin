import { useState, useEffect, useCallback } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { api } from '../services/api'

// Shared by every page that shows linked-bank data (Important Accounts, Bills,
// Subscriptions, Flags). Only Important Accounts actually calls connect()/disconnect() —
// the others just read accounts/spending/subscriptions. usePlaidLink is a no-op
// until linkToken is set, so pages that never connect don't load anything extra.
//
// includeFlags opts into the suspicious-transaction feed, which runs an AI risk
// check per candidate transaction and is much slower than everything else here.
// Only Flags.jsx passes this -- Bills/Subscriptions don't use that data, so they
// shouldn't pay for the extra API/LLM calls on every page load.
export function usePlaidBank(circleId, { includeFlags = false } = {}) {
  const [accounts, setAccounts] = useState([])
  const [spending, setSpending] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [detectedBills, setDetectedBills] = useState([])
  const [detectedFlags, setDetectedFlags] = useState([])
  const [flagsLoading, setFlagsLoading] = useState(includeFlags)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [linkToken, setLinkToken] = useState(null)
  const [connecting, setConnecting] = useState(false)

  const refresh = useCallback(async () => {
    if (!circleId) return
    setLoading(true)
    setError('')

    // Fired together, not awaited together: when requested, the flags feed
    // is much slower than the rest, so bundling it into the same Promise.all
    // would make everything else wait on it before showing anything.
    const mainBatch = Promise.all([
      api.getPlaidAccounts(circleId),
      api.getPlaidSpending(circleId),
      api.getPlaidSubscriptions(circleId),
      api.getPlaidDetectedBills(circleId),
    ]).then(([acc, spend, subs, bills]) => {
      setAccounts(acc)
      setSpending(spend)
      setSubscriptions(subs)
      setDetectedBills(bills)
    }).catch(err => setError(err.message)).finally(() => setLoading(false))

    if (!includeFlags) {
      await mainBatch
      return
    }

    setFlagsLoading(true)
    const flagsBatch = api.getPlaidDetectedFlags(circleId)
      .then(setDetectedFlags)
      // Silent on purpose: this is a nice-to-have suggestion feed, not core
      // bank data -- Flags page works fine without it.
      .catch(() => {})
      .finally(() => setFlagsLoading(false))

    await Promise.all([mainBatch, flagsBatch])
  }, [circleId, includeFlags])

  useEffect(() => { refresh() }, [refresh])

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
        await refresh()
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

  async function connect() {
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

  async function disconnect(plaidItemId) {
    setError('')
    try {
      await api.removePlaidItem(circleId, plaidItemId)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return { accounts, spending, subscriptions, detectedBills, detectedFlags, flagsLoading, loading, error, connecting, connect, disconnect, refresh }
}
