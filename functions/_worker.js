import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { handleTransactions } from './api/transactions'
import { handleAccounts } from './api/accounts'
import { handleCategories } from './api/categories'
import { handleSummary } from './api/summary'
import { handleExport } from './api/transactions/export'
import { handleImport } from './api/transactions/import'

const app = new Hono()

app.use('*', cors({ origin: '*' }))

app.use('/api/*', async (c, next) => {
  const password = c.env.PASSWORD
  if (password) {
    const auth = c.req.header('Authorization')
    if (auth !== `Bearer ${password}`) {
      return c.json({ error: 'unauthorized' }, 401)
    }
  }
  await next()
})

app.get('/api/summary', handleSummary)
app.get('/api/transactions', handleTransactions)
app.post('/api/transactions', handleTransactions)
app.put('/api/transactions/:id', handleTransactions)
app.delete('/api/transactions/:id', handleTransactions)
app.get('/api/transactions/export', handleExport)
app.post('/api/transactions/import', handleImport)
app.get('/api/accounts', handleAccounts)
app.post('/api/accounts', handleAccounts)
app.put('/api/accounts/:id', handleAccounts)
app.delete('/api/accounts/:id', handleAccounts)
app.get('/api/categories', handleCategories)
app.post('/api/categories', handleCategories)
app.put('/api/categories/:id', handleCategories)
app.delete('/api/categories/:id', handleCategories)

app.all('/*', async (c) => {
  const env = c.env
  if (env.ASSETS && env.ASSETS.fetch) {
    const res = await env.ASSETS.fetch(c.req.raw)
    if (res.status === 404 && c.req.method === 'GET') {
      const url = new URL(c.req.url)
      return await env.ASSETS.fetch(new Request(`${url.origin}/`, c.req.raw))
    }
    return res
  }
  return c.text('Not Found', 404)
})

export default app
