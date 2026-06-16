export async function handleAccounts(c) {
  const db = c.env.cashflow
  const { id } = c.req.param()
  const method = c.req.method

  if (method === 'GET') {
    const rows = await db.prepare('SELECT * FROM accounts ORDER BY sort_order ASC, id ASC').all()
    return c.json({ data: rows.results })
  }

  if (method === 'POST') {
    const { name, type, balance } = await c.req.json()
    const data = normalizeAccount({ name, type, balance })
    if (data.error) return c.json({ error: data.error }, 400)
    const result = await db.prepare(
      'INSERT INTO accounts (name, type, balance) VALUES (?, ?, ?)'
    ).bind(data.name, data.type, data.balance).run()
    return c.json({ id: result.meta.last_row_id }, 201)
  }

  if (method === 'PUT') {
    const { name, type, sort_order, balance } = await c.req.json()
    const data = normalizeAccount({ name, type, balance })
    if (data.error) return c.json({ error: data.error }, 400)
    await db.prepare(
      'UPDATE accounts SET name=?, type=?, sort_order=?, balance=? WHERE id=?'
    ).bind(data.name, data.type, Number(sort_order) || 0, data.balance, Number(id)).run()
    return c.json({ success: true })
  }

  if (method === 'DELETE') {
    const txnCount = await db.prepare('SELECT COUNT(*) as cnt FROM transactions WHERE account_id = ?').bind(Number(id)).first()
    if (txnCount.cnt > 0) {
      return c.json({ error: 'has_transactions', message: '此账户下有交易记录，无法删除' }, 400)
    }
    await db.prepare('DELETE FROM accounts WHERE id = ?').bind(Number(id)).run()
    return c.json({ success: true })
  }
}

function normalizeAccount(body) {
  const name = String(body.name || '').trim()
  const type = body.type || 'cash'
  const balance = Math.round(Number(body.balance || 0) * 100) / 100

  if (!name) return { error: 'invalid_name' }
  if (!['cash', 'bank', 'credit', 'investment', 'ewallet'].includes(type)) return { error: 'invalid_type' }
  if (!Number.isFinite(balance)) return { error: 'invalid_balance' }

  return { name, type, balance }
}
