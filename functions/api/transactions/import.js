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
        ? Number(row.account_id)
        : await resolveByName(db, 'accounts', row.account_name)

      const category = row.category_id
        ? Number(row.category_id)
        : await resolveByName(db, 'categories', row.category_name, row.type)

      if (!account) {
        errors.push({ row: i + 1, error: `账户 "${row.account_name}" 不存在` })
        continue
      }

      const amount = Math.round(Number(row.amount) * 100) / 100
      const type = row.type
      const date = row.date
      const note = String(row.note || '').slice(0, 200)

      if (!Number.isFinite(amount) || amount <= 0) {
        errors.push({ row: i + 1, error: '金额无效' })
        continue
      }
      if (type !== 'income' && type !== 'expense') {
        errors.push({ row: i + 1, error: '类型必须是 income 或 expense' })
        continue
      }
      if (!isValidDate(date)) {
        errors.push({ row: i + 1, error: '日期无效' })
        continue
      }
      if (category) {
        const categoryExists = await db.prepare('SELECT id FROM categories WHERE id = ? AND type = ?').bind(category, type).first()
        if (!categoryExists) {
          errors.push({ row: i + 1, error: '分类不存在或类型不匹配' })
          continue
        }
      }

      await stmt.bind(account, category || null, amount, type, date, note).run()

      const sign = type === 'income' ? '+' : '-'
      await db.prepare(`UPDATE accounts SET balance = balance ${sign} ? WHERE id = ?`).bind(amount, account).run()
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

function isValidDate(date) {
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const parsed = new Date(`${date}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
}
