export async function handleTransactions(c) {
  const db = c.env.cashflow
  const { id } = c.req.param()
  const method = c.req.method

  if (method === 'GET') {
    const { page = 1, limit = 50, type, account_id, category_id, start, end, search } = c.req.query()
    const pageNum = Math.max(1, Number(page) || 1)
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50))
    const offset = (pageNum - 1) * limitNum

    let where = []
    let params = []

    if (type) {
      if (!isValidType(type)) return c.json({ error: 'invalid_type' }, 400)
      where.push('t.type = ?'); params.push(type)
    }
    if (account_id) {
      const accountId = Number(account_id)
      if (!Number.isInteger(accountId) || accountId <= 0) return c.json({ error: 'invalid_account' }, 400)
      where.push('t.account_id = ?'); params.push(accountId)
    }
    if (category_id) {
      const categoryId = Number(category_id)
      if (!Number.isInteger(categoryId) || categoryId <= 0) return c.json({ error: 'invalid_category' }, 400)
      const allCats = await db.prepare('SELECT id, parent_id FROM categories').all()
      const ids = [categoryId]
      const visited = new Set()
      function collect(id) {
        if (visited.has(id) || ids.length > 100) return
        visited.add(id)
        for (const c of allCats.results) {
          if (c.parent_id === id) {
            ids.push(c.id)
            collect(c.id)
          }
        }
      }
      collect(categoryId)
      where.push(`t.category_id IN (${ids.map(() => '?').join(',')})`)
      params.push(...ids)
    }
    if (start) { where.push('t.date >= ?'); params.push(start) }
    if (end) { where.push('t.date <= ?'); params.push(end) }
    if (search) { where.push("t.note LIKE ? ESCAPE '\\'"); params.push(`%${search.replace(/[%_]/g, '\\$&')}%`) }

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
    const rows = await db.prepare(sql).bind(...params, limitNum, offset).all()

    return c.json({ data: rows.results, total, page: pageNum, limit: limitNum })
  }

  if (method === 'POST') {
    const body = await c.req.json()
    const data = await normalizeTransaction(c, db, body)
    if (data.error) return c.json({ error: data.error }, data.status)

    const result = await db.prepare(
      'INSERT INTO transactions (account_id, category_id, amount, type, date, note) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(data.accountId, data.categoryId, data.amount, data.type, data.date, data.note).run()

    const sign = data.type === 'income' ? '+' : '-'
    await db.prepare(`UPDATE accounts SET balance = balance ${sign} ? WHERE id = ?`).bind(data.amount, data.accountId).run()
    return c.json({ id: result.meta.last_row_id }, 201)
  }

  if (method === 'PUT') {
    const old = await db.prepare('SELECT * FROM transactions WHERE id = ?').bind(Number(id)).first()
    if (!old) return c.json({ error: 'not found' }, 404)

    const body = await c.req.json()
    const data = await normalizeTransaction(c, db, body)
    if (data.error) return c.json({ error: data.error }, data.status)

    const reverseSign = old.type === 'income' ? '-' : '+'
    await db.prepare(`UPDATE accounts SET balance = balance ${reverseSign} ? WHERE id = ?`).bind(old.amount, old.account_id).run()

    const applySign = data.type === 'income' ? '+' : '-'
    await db.prepare(`UPDATE accounts SET balance = balance ${applySign} ? WHERE id = ?`).bind(data.amount, data.accountId).run()

    await db.prepare(
      'UPDATE transactions SET account_id=?, category_id=?, amount=?, type=?, date=?, note=? WHERE id=?'
    ).bind(data.accountId, data.categoryId, data.amount, data.type, data.date, data.note, Number(id)).run()
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

function isValidType(type) {
  return type === 'income' || type === 'expense'
}

function isValidDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const parsed = new Date(`${date}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
}

async function normalizeTransaction(c, db, body) {
  const accountId = Number(body.account_id)
  const categoryId = body.category_id ? Number(body.category_id) : null
  const amount = Math.round(Number(body.amount) * 100) / 100
  const type = body.type
  const date = body.date
  const note = String(body.note || '').slice(0, 200)

  if (!Number.isInteger(accountId) || accountId <= 0) return { error: 'invalid_account', status: 400 }
  if (categoryId !== null && (!Number.isInteger(categoryId) || categoryId <= 0)) return { error: 'invalid_category', status: 400 }
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'invalid_amount', status: 400 }
  if (!isValidType(type)) return { error: 'invalid_type', status: 400 }
  if (!isValidDate(date)) return { error: 'invalid_date', status: 400 }

  const account = await db.prepare('SELECT id FROM accounts WHERE id = ?').bind(accountId).first()
  if (!account) return { error: 'account_not_found', status: 400 }

  if (categoryId !== null) {
    const category = await db.prepare('SELECT id FROM categories WHERE id = ? AND type = ?').bind(categoryId, type).first()
    if (!category) return { error: 'category_not_found', status: 400 }
  }

  return { accountId, categoryId, amount, type, date, note }
}
