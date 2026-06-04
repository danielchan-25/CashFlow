const BASE = '/api'

function getPassword() {
  return localStorage.getItem('cashflow_password') || ''
}

async function request(path, options = {}) {
  const { method = 'GET', body, params } = options
  let url = `${BASE}${path}`
  if (params) {
    const qs = new URLSearchParams(params).toString()
    url += '?' + qs
  }

  const headers = { 'Content-Type': 'application/json' }
  const pw = getPassword()
  if (pw) headers['Authorization'] = `Bearer ${pw}`

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('text/csv')) {
    if (!res.ok) throw new Error('导出失败')
    return res.blob()
  }

  if (res.status === 401) {
    throw new Error('unauthorized')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || '请求失败')
  }

  return res.json()
}

function qs(params) { return { params } }

export const api = {
  getSummary: (month) => request(`/summary${month ? '?month=' + month : ''}`),
  getDailySummary: (month) => request(`/summary?month=${month}&daily=true`),
  getTransactions: (filters) => request('/transactions', qs(filters)),
  createTransaction: (data) => request('/transactions', { method: 'POST', body: data }),
  updateTransaction: (id, data) => request(`/transactions/${id}`, { method: 'PUT', body: data }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),
  getAccounts: () => request('/accounts'),
  createAccount: (data) => request('/accounts', { method: 'POST', body: data }),
  updateAccount: (id, data) => request(`/accounts/${id}`, { method: 'PUT', body: data }),
  deleteAccount: (id) => request(`/accounts/${id}`, { method: 'DELETE' }),
  getCategories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
  exportCSV: (params) => request('/transactions/export', qs(params)),
  importCSV: (rows) => request('/transactions/import', { method: 'POST', body: { rows } }),
}
