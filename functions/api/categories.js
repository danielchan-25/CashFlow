export async function handleCategories(c) {
  const db = c.env.cashflow
  const { id } = c.req.param()
  const method = c.req.method

  if (method === 'GET') {
    const rows = await db.prepare('SELECT * FROM categories ORDER BY type ASC, sort_order ASC, id ASC').all()
    return c.json({ data: rows.results })
  }

  if (method === 'POST') {
    const { name, icon, type } = await c.req.json()
    const result = await db.prepare(
      'INSERT INTO categories (name, icon, type) VALUES (?, ?, ?)'
    ).bind(name, icon || '📦', type).run()
    return c.json({ id: result.meta.last_row_id }, 201)
  }

  if (method === 'PUT') {
    const { name, icon, sort_order } = await c.req.json()
    await db.prepare(
      'UPDATE categories SET name=?, icon=?, sort_order=? WHERE id=?'
    ).bind(name, icon, sort_order || 0, Number(id)).run()
    return c.json({ success: true })
  }

  if (method === 'DELETE') {
    await db.prepare('DELETE FROM categories WHERE id = ?').bind(Number(id)).run()
    return c.json({ success: true })
  }
}
