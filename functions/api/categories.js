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
    const result = await db.prepare(
      'INSERT INTO categories (name, icon, type, parent_id) VALUES (?, ?, ?, ?)'
    ).bind(name, icon || '📦', type, parent_id || null).run()
    return c.json({ id: result.meta.last_row_id }, 201)
  }

  if (method === 'PUT') {
    const { name, icon, parent_id } = await c.req.json()
    await db.prepare(
      'UPDATE categories SET name=?, icon=?, parent_id=? WHERE id=?'
    ).bind(name, icon, parent_id || null, Number(id)).run()
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
