export async function handleImport(c) {
  const db = c.env.cashflow
  const body = await c.req.json()
  const { rows } = body

  if (!rows || !rows.length) {
    return c.json({ error: 'no data' }, 400)
  }

  const stmt = db.prepare(
    'INSERT INTO transactions (account_id, category_id, amount, type, date, note) VALUES (?, ?, ?, ?, ?, ?)'
  )

  let imported = 0
  let errors = []

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    try {
      const account = row.account_id
        ? row.account_id
        : await resolveByName(db, 'accounts', row.account_name)

      const category = row.category_id
        ? row.category_id
        : await resolveByName(db, 'categories', row.category_name, row.type)

      if (!account) {
        errors.push({ row: i + 1, error: `账户 "${row.account_name}" 不存在` })
        continue
      }

      await stmt.bind(account, category, row.amount, row.type, row.date, row.note || '').run()

      const sign = row.type === 'income' ? '+' : '-'
      await db.prepare(`UPDATE accounts SET balance = balance ${sign} ? WHERE id = ?`).bind(row.amount, account).run()
      imported++
    } catch (e) {
      errors.push({ row: i + 1, error: e.message })
    }
  }

  return c.json({ imported, errors })
}

async function resolveByName(db, table, name, type) {
  if (!name) return null
  const row = await db.prepare(
    `SELECT id FROM ${table} WHERE name = ?${table === 'categories' ? ' AND type = ?' : ''}`
  ).bind(name, ...(table === 'categories' ? [type] : [])).first()
  return row ? row.id : null
}
