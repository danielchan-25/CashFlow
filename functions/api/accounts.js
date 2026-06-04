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
    const result = await db.prepare(
      'INSERT INTO accounts (name, type, balance) VALUES (?, ?, ?)'
    ).bind(name, type || 'cash', balance || 0).run()
    return c.json({ id: result.meta.last_row_id }, 201)
  }

  if (method === 'PUT') {
    const { name, type, sort_order, balance } = await c.req.json()
    await db.prepare(
      'UPDATE accounts SET name=?, type=?, sort_order=?, balance=? WHERE id=?'
    ).bind(name, type, sort_order || 0, balance !== undefined ? balance : 0, Number(id)).run()
    return c.json({ success: true })
  }

  if (method === 'DELETE') {
    await db.prepare('DELETE FROM accounts WHERE id = ?').bind(Number(id)).run()
    return c.json({ success: true })
  }
}
