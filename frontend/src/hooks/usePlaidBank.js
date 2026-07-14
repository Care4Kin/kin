import { useState, useEffect, useCallback } from 'react'
import { usePlaidLink } from 'react-plaid-link'
import { api } from '../services/api'

// Shared by every page that shows linked-bank data (Important Accounts, Bills,
// Subscriptions). Only Important Accounts actually calls connect()/disconnect() —
// the others just read accounts/spending/subscriptions. usePlaidLink is a no-op
// until linkToken is set, so pages that never connect don't load anything extra.
export function usePlaidBank(circleId) {
  const [accounts, setAccounts] = useState([])
  const [spending, setSpending] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [linkToken, setLinkToken] = useState(null)
  const [connecting, setConnecting] = useState(false)

  const refresh = useCallback(async () => {
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

  return { accounts, spending, subscriptions, loading, error, connecting, connect, disconnect, refresh }
}
