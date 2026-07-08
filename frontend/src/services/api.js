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
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message)
  }

  return res.status === 204 ? null : res.json()
}

export const api = {
  // Auth
  register: (data) => request('POST', '/api/auth/register', data),
  login: (data) => request('POST', '/api/auth/login', data),
  logout: () => request('POST', '/api/auth/logout'),

  // Circles
  getMyCircle: () => request('GET', '/api/circles/mine'),
  createCircle: () => request('POST', '/api/circles'),
  getCircle: (circleId) => request('GET', `/api/circles/${circleId}`),
  addMember: (circleId, data) => request('POST', `/api/circles/${circleId}/members`, data),
  removeMember: (circleId, membershipId) => request('DELETE', `/api/circles/${circleId}/members/${membershipId}`),
  updateMemberPermissions: (circleId, membershipId, data) => request('PATCH', `/api/circles/${circleId}/members/${membershipId}`, data),

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

  // Notes
  getNotes: (circleId) => request('GET', `/api/circles/${circleId}/notes`),
  createNote: (circleId, data) => request('POST', `/api/circles/${circleId}/notes`, data),
  deleteNote: (circleId, noteId) => request('DELETE', `/api/circles/${circleId}/notes/${noteId}`),
}
