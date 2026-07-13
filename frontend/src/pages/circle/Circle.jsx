import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { api } from '../../services/api'
import { useFetch } from '../../hooks/useFetch'

const PERMISSION_LABELS = {
  can_view_bills: 'Bills',
  can_view_prescriptions: 'Prescriptions',
  can_view_accounts: 'Accounts',
  can_view_flags: 'Suspicious Activity',
}

export default function Circle() {
  const { circleId, user } = useAuth()
  const { data, loading, error } = useFetch(() => api.getCircle(circleId), [circleId])
  const [circle, setCircle] = useState(null)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { if (data) setCircle(data) }, [data])

  if (!circleId || loading) return <p className="page-status">Loading your circle…</p>
  if (error) return <p className="page-status page-status--error">{error}</p>
  if (!circle) return null

  const isElder = user?.role === 'elder'

  async function handleInvite(e) {
    e.preventDefault()
    setInviteError('')
    if (!inviteEmail.trim()) {
      setInviteError('Please enter an email address')
      return
    }
    setSaving(true)
    try {
      await api.addMember(circleId, { caregiver_email: inviteEmail.trim() })
      const refreshed = await api.getCircle(circleId)
      setCircle(refreshed)
      setInviteEmail('')
      setShowInvite(false)
    } catch (err) {
      setInviteError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(membershipId) {
    await api.removeMember(circleId, membershipId)
    setCircle(prev => ({ ...prev, members: prev.members.filter(m => m.membership_id !== membershipId) }))
  }

  async function handleCancelInvite(invitationId) {
    await api.cancelInvitation(circleId, invitationId)
    setCircle(prev => ({
      ...prev,
      pending_invitations: prev.pending_invitations.filter(i => i.invitation_id !== invitationId),
    }))
  }

  async function handleTogglePermission(member, key) {
    const updated = await api.updateMemberPermissions(circleId, member.membership_id, {
      [key]: !member.permissions[key],
    })
    setCircle(prev => ({
      ...prev,
      members: prev.members.map(m => m.membership_id === member.membership_id ? { ...m, permissions: updated.permissions } : m),
    }))
  }

  return (
    <div className="page">
      <h1 className="page-title">My Circle</h1>

      <div className="info-card" style={{ marginBottom: '1.25rem' }}>
        <span className="info-card-title">{circle.elder.full_name}</span>
        <p className="info-card-note">The elder in this circle. Everyone below can only see what's checked off for them — never more.</p>
      </div>

      <h2 className="section-label">Family &amp; Caregivers</h2>
      <div className="card-list">
        {circle.members.length === 0 && <p className="page-status">No one else is in this circle yet.</p>}
        {circle.members.map(member => (
          <div key={member.membership_id} className="info-card">
            <div className="info-card-header">
              <span className="info-card-title">{member.full_name}</span>
              {isElder && (
                <button
                  className="action-btn action-btn--danger"
                  onClick={() => handleRemove(member.membership_id)}
                  title="Remove this person from your circle — they will lose access immediately"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="permission-grid">
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                <label key={key} className="permission-item">
                  <input
                    type="checkbox"
                    checked={member.permissions[key]}
                    disabled={!isElder}
                    onChange={() => handleTogglePermission(member, key)}
                  />
                  Can see {label}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {circle.pending_invitations?.length > 0 && (
        <section style={{ marginTop: '1.5rem' }}>
          <h2 className="section-label">Invited — Not Joined Yet</h2>
          <div className="card-list">
            {circle.pending_invitations.map(inv => (
              <div key={inv.invitation_id} className="info-card">
                <div className="info-card-header">
                  <span className="info-card-title">{inv.email}</span>
                  {isElder && (
                    <button
                      className="action-btn action-btn--danger"
                      onClick={() => handleCancelInvite(inv.invitation_id)}
                      title="Cancel this invitation"
                    >
                      Cancel
                    </button>
                  )}
                </div>
                <p className="info-card-note">Waiting for them to create an account with this email. They'll join automatically when they sign up.</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {isElder && (
        showInvite ? (
          <form className="inline-form" onSubmit={handleInvite} style={{ marginTop: '1.25rem' }}>
            <div className="field-group">
              <label htmlFor="invite-email">Invite by Email</label>
              <p className="field-hint">If they already use Kin, they'll be added right away. If not, we'll email them an invitation to sign up — and they'll join your circle automatically.</p>
              <input id="invite-email" type="email" required value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
            </div>
            {inviteError && <p className="auth-error">{inviteError}</p>}
            <div className="btn-row">
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Inviting…' : 'Send Invite'}</button>
              <button type="button" className="btn-secondary" onClick={() => { setShowInvite(false); setInviteError('') }}>Cancel</button>
            </div>
          </form>
        ) : (
          <button className="add-toggle" style={{ marginTop: '1.25rem' }} onClick={() => setShowInvite(true)}>
            + Invite a family member
          </button>
        )
      )}
    </div>
  )
}
