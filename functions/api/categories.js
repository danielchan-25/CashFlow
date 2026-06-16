export async function handleCategories(c) {
  const db = c.env.cashflow
  const { id } = c.req.param()
  const method = c.req.method

  if (method === 'GET') {
    const rows = await db.prepare('SELECT * FROM categories ORDER BY type ASC, sort_order ASC, id ASC').all()
    return c.json({ data: rows.results })
  }

  if (method === 'POST') {
    const { name, icon, type, parent_id } = await c.req.json()
    const data = await normalizeCategory(db, { name, icon, type, parent_id })
    if (data.error) return c.json({ error: data.error }, 400)
    const result = await db.prepare(
      'INSERT INTO categories (name, icon, type, parent_id) VALUES (?, ?, ?, ?)'
    ).bind(data.name, data.icon, data.type, data.parentId).run()
    return c.json({ id: result.meta.last_row_id }, 201)
  }

  if (method === 'PUT') {
    const existing = await db.prepare('SELECT type FROM categories WHERE id = ?').bind(Number(id)).first()
    if (!existing) return c.json({ error: 'not found' }, 404)
    const { name, icon, parent_id } = await c.req.json()
    const data = await normalizeCategory(db, { name, icon, type: existing.type, parent_id }, Number(id))
    if (data.error) return c.json({ error: data.error }, 400)
    await db.prepare(
      'UPDATE categories SET name=?, icon=?, parent_id=? WHERE id=?'
    ).bind(data.name, data.icon, data.parentId, Number(id)).run()
    return c.json({ success: true })
  }

  if (method === 'DELETE') {
    const children = await db.prepare('SELECT COUNT(*) as cnt FROM categories WHERE parent_id = ?').bind(Number(id)).first()
    if (children.cnt > 0) {
      return c.json({ error: 'has_children', message: '请先删除子分类' }, 400)
    }
    const txnCount = await db.prepare('SELECT COUNT(*) as cnt FROM transactions WHERE category_id = ?').bind(Number(id)).first()
    if (txnCount.cnt > 0) {
      return c.json({ error: 'has_transactions', message: '此分类下有交易记录，无法删除' }, 400)
    }
    await db.prepare('DELETE FROM categories WHERE id = ?').bind(Number(id)).run()
    return c.json({ success: true })
  }
}

async function normalizeCategory(db, body, id = null) {
  const name = String(body.name || '').trim()
  const icon = String(body.icon || '📦').trim() || '📦'
  const type = body.type
  const parentId = body.parent_id ? Number(body.parent_id) : null

  if (!name) return { error: 'invalid_name' }
  if (type !== 'income' && type !== 'expense') return { error: 'invalid_type' }
  if (parentId !== null && (!Number.isInteger(parentId) || parentId <= 0)) return { error: 'invalid_parent' }
  if (id && parentId === id) return { error: 'invalid_parent' }

  if (parentId !== null) {
    const parent = await db.prepare('SELECT id, parent_id FROM categories WHERE id = ? AND type = ?').bind(parentId, type).first()
    if (!parent) return { error: 'parent_not_found' }
    if (id && await wouldCreateCycle(db, id, parentId)) return { error: 'invalid_parent' }
  }

  return { name, icon, type, parentId }
}

async function wouldCreateCycle(db, id, parentId) {
  let currentId = parentId
  const visited = new Set()

  for (let depth = 0; depth < 100 && currentId; depth++) {
    if (currentId === id) return true
    if (visited.has(currentId)) return true
    visited.add(currentId)

    const row = await db.prepare('SELECT parent_id FROM categories WHERE id = ?').bind(currentId).first()
    currentId = row?.parent_id
  }

  return false
}
