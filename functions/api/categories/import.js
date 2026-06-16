export async function handleCategoriesImport(c) {
  const db = c.env.cashflow
  const body = await c.req.json()

  await db.prepare('DELETE FROM transactions').run()
  await db.prepare('DELETE FROM categories').run()

  async function insertCategories(items, type, parentId = null) {
    let sort = 0
    for (const [name, children] of Object.entries(items)) {
      const { meta } = await db.prepare(
        'INSERT INTO categories (name, icon, type, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)'
      ).bind(name, '📦', type, parentId, sort++).run()

      if (Array.isArray(children)) {
        for (const child of children) {
          await db.prepare(
            'INSERT INTO categories (name, icon, type, parent_id) VALUES (?, ?, ?, ?)'
          ).bind(child, '📦', type, meta.last_row_id).run()
        }
      } else {
        await insertCategories(children, type, meta.last_row_id)
      }
    }
  }

  if (body['支出']) await insertCategories(body['支出'], 'expense')
  if (body['收入']) await insertCategories(body['收入'], 'income')

  return c.json({ success: true })
}
