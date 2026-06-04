export async function handleTransactions(c) {
  const db = c.env.cashflow
  const { id } = c.req.param()
  const method = c.req.method

  if (method === 'GET') {
    const { page = 1, limit = 50, type, account_id, category_id, start, end, search } = c.req.query()
    const offset = (Number(page) - 1) * Number(limit)

    let where = []
    let params = []

    if (type) { where.push('t.type = ?'); params.push(type) }
    if (account_id) { where.push('t.account_id = ?'); params.push(Number(account_id)) }
    if (category_id) { where.push('t.category_id = ?'); params.push(Number(category_id)) }
    if (start) { where.push('t.date >= ?'); params.push(start) }
    if (end) { where.push('t.date <= ?'); params.push(end) }
    if (search) { where.push('t.note LIKE ?'); params.push(`%${search}%`) }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''

    const countSql = `SELECT COUNT(*) as total FROM transactions t ${whereClause}`
    const total = (await db.prepare(countSql).bind(...params).first()).total

    const sql = `
      SELECT t.*, a.name as account_name, c.name as category_name, c.icon as category_icon
      FROM transactions t
      LEFT JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      ${whereClause}
      ORDER BY t.date DESC, t.id DESC
      LIMIT ? OFFSET ?
    `
    const rows = await db.prepare(sql).bind(...params, Number(limit), offset).all()

    return c.json({ data: rows.results, total, page: Number(page), limit: Number(limit) })
  }

  if (method === 'POST') {
    const body = await c.req.json()
    const { account_id, category_id, amount, type, date, note } = body
    const result = await db.prepare(
      'INSERT INTO transactions (account_id, category_id, amount, type, date, note) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(account_id, category_id || null, amount, type, date, note || '').run()

    const sign = type === 'income' ? '+' : '-'
    await db.prepare(`UPDATE accounts SET balance = balance ${sign} ? WHERE id = ?`).bind(amount, account_id).run()
    return c.json({ id: result.meta.last_row_id }, 201)
  }

  if (method === 'PUT') {
    const body = await c.req.json()
    const { account_id, category_id, amount, type, date, note } = body
    await db.prepare(
      'UPDATE transactions SET account_id=?, category_id=?, amount=?, type=?, date=?, note=? WHERE id=?'
    ).bind(account_id, category_id, amount, type, date, note, Number(id)).run()
    return c.json({ success: true })
  }

  if (method === 'DELETE') {
    const t = await db.prepare('SELECT * FROM transactions WHERE id = ?').bind(Number(id)).first()
    if (!t) return c.json({ error: 'not found' }, 404)

    const sign = t.type === 'income' ? '-' : '+'
    await db.prepare(`UPDATE accounts SET balance = balance ${sign} ? WHERE id = ?`).bind(t.amount, t.account_id).run()
    await db.prepare('DELETE FROM transactions WHERE id = ?').bind(Number(id)).run()
    return c.json({ success: true })
  }
}
