const BASE = '/api'

async function request(path, options = {}) {
  const { method = 'GET', body, params } = options
  let url = `${BASE}${path}`
  if (params) url += '?' + new URLSearchParams(params).toString()

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })

  const ct = res.headers.get('content-type') || ''
  if (ct.includes('text/csv')) {
    if (!res.ok) throw new Error('导出失败')
    return res.blob()
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.message || err.error || '请求失败')
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
  getCategories: () => request('/categories'),
  createCategory: (data) => request('/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
  getAuthStatus: () => request('/auth/status'),
  setupPassword: (password) => request('/auth/setup', { method: 'POST', body: { password } }),
  login: (password) => request('/auth/login', { method: 'POST', body: { password } }),
  exportCSV: () => request('/transactions/export'),
  importCSV: (rows) => request('/transactions/import', { method: 'POST', body: { rows } }),
  importCategories: (data) => request('/categories/import', { method: 'POST', body: data }),
  resetDB: () => request('/reset', { method: 'POST' }),
}
