const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getToken() {
  return localStorage.getItem('token')
}

async function request(method, path, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    const message = Array.isArray(err.detail)
      ? err.detail.map(d => d.msg.replace(/^Value error, /, '')).join('; ')
      : (err.detail || err.message || res.statusText)
    throw new Error(message)
  }

  return res.status === 204 ? null : res.json()
}

export const api = {
  // Auth
  register: (data) => request('POST', '/api/auth/register', data),
  login: (data) => request('POST', '/api/auth/login', data),
  logout: () => request('POST', '/api/auth/logout'),
  getSecurityQuestion: (email) => request('GET', `/api/auth/security-question?email=${encodeURIComponent(email)}`),
  resetPassword: (data) => request('POST', '/api/auth/reset-password', data),
  getMe: () => request('GET', '/api/auth/me'),
  updateProfile: (data) => request('PATCH', '/api/auth/me', data),
  changePassword: (data) => request('POST', '/api/auth/change-password', data),
  updateSecurityQuestion: (data) => request('PATCH', '/api/auth/security-question', data),
  sendPhoneCode: (phone) => request('POST', '/api/auth/phone/send-code', { phone }),
  verifyPhoneCode: (phone, code) => request('POST', '/api/auth/phone/verify-code', { phone, code }),
  googleAuth: (idToken) => request('POST', '/api/auth/google', { id_token: idToken }),
  googleComplete: (data) => request('POST', '/api/auth/google/complete', data),

  // Circles
  getMyCircle: () => request('GET', '/api/circles/mine'),
  createCircle: () => request('POST', '/api/circles'),
  getCircle: (circleId) => request('GET', `/api/circles/${circleId}`),
  addMember: (circleId, data) => request('POST', `/api/circles/${circleId}/members`, data),
  removeMember: (circleId, membershipId) => request('DELETE', `/api/circles/${circleId}/members/${membershipId}`),
  updateMemberPermissions: (circleId, membershipId, data) => request('PATCH', `/api/circles/${circleId}/members/${membershipId}`, data),
  cancelInvitation: (circleId, invitationId) => request('DELETE', `/api/circles/${circleId}/invitations/${invitationId}`),

  // Bills
  getBills: (circleId, params) => request('GET', `/api/circles/${circleId}/bills${params || ''}`),
  createBill: (circleId, data) => request('POST', `/api/circles/${circleId}/bills`, data),
  updateBill: (circleId, billId, data) => request('PATCH', `/api/circles/${circleId}/bills/${billId}`, data),
  deleteBill: (circleId, billId) => request('DELETE', `/api/circles/${circleId}/bills/${billId}`),

  // Subscriptions
  getSubscriptions: (circleId) => request('GET', `/api/circles/${circleId}/subscriptions`),
  createSubscription: (circleId, data) => request('POST', `/api/circles/${circleId}/subscriptions`, data),
  updateSubscription: (circleId, subId, data) => request('PATCH', `/api/circles/${circleId}/subscriptions/${subId}`, data),
  deleteSubscription: (circleId, subId) => request('DELETE', `/api/circles/${circleId}/subscriptions/${subId}`),

  // Prescriptions
  getPrescriptions: (circleId) => request('GET', `/api/circles/${circleId}/prescriptions`),
  createPrescription: (circleId, data) => request('POST', `/api/circles/${circleId}/prescriptions`, data),
  updatePrescription: (circleId, rxId, data) => request('PATCH', `/api/circles/${circleId}/prescriptions/${rxId}`, data),
  deletePrescription: (circleId, rxId) => request('DELETE', `/api/circles/${circleId}/prescriptions/${rxId}`),

  // Accounts
  getAccounts: (circleId) => request('GET', `/api/circles/${circleId}/accounts`),
  createAccount: (circleId, data) => request('POST', `/api/circles/${circleId}/accounts`, data),
  updateAccount: (circleId, accountId, data) => request('PATCH', `/api/circles/${circleId}/accounts/${accountId}`, data),
  deleteAccount: (circleId, accountId) => request('DELETE', `/api/circles/${circleId}/accounts/${accountId}`),

  // Flags
  getFlags: (circleId) => request('GET', `/api/circles/${circleId}/flags`),
  createFlag: (circleId, data) => request('POST', `/api/circles/${circleId}/flags`, data),
  updateFlag: (circleId, flagId, data) => request('PATCH', `/api/circles/${circleId}/flags/${flagId}`, data),
  deleteFlag: (circleId, flagId) => request('DELETE', `/api/circles/${circleId}/flags/${flagId}`),

  // Notes
  getNotes: (circleId) => request('GET', `/api/circles/${circleId}/notes`),
  createNote: (circleId, data) => request('POST', `/api/circles/${circleId}/notes`, data),
  deleteNote: (circleId, noteId) => request('DELETE', `/api/circles/${circleId}/notes/${noteId}`),

  // Appointments
  getAppointments: (circleId) => request('GET', `/api/circles/${circleId}/appointments`),
  createAppointment: (circleId, data) => request('POST', `/api/circles/${circleId}/appointments`, data),
  updateAppointment: (circleId, appointmentId, data) => request('PATCH', `/api/circles/${circleId}/appointments/${appointmentId}`, data),
  deleteAppointment: (circleId, appointmentId) => request('DELETE', `/api/circles/${circleId}/appointments/${appointmentId}`),

  // Bank (Plaid)
  createPlaidLinkToken: (circleId) => request('POST', `/api/circles/${circleId}/plaid/link-token`),
  exchangePlaidToken: (circleId, data) => request('POST', `/api/circles/${circleId}/plaid/exchange`, data),
  getPlaidAccounts: (circleId) => request('GET', `/api/circles/${circleId}/plaid/accounts`),
  getPlaidSpending: (circleId) => request('GET', `/api/circles/${circleId}/plaid/spending`),
  getPlaidSubscriptions: (circleId) => request('GET', `/api/circles/${circleId}/plaid/subscriptions`),
  removePlaidItem: (circleId, plaidItemId) => request('DELETE', `/api/circles/${circleId}/plaid/items/${plaidItemId}`),
}
