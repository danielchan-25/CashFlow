export async function handleExport(c) {
  const db = c.env.cashflow
  const { start, end } = c.req.query()

  let sql = `
    SELECT t.date, t.type, t.amount, a.name as account, c.name as category, c.icon, t.note
    FROM transactions t
    LEFT JOIN accounts a ON t.account_id = a.id
    LEFT JOIN categories c ON t.category_id = c.id
  `
  let params = []
  if (start && end) {
    sql += ' WHERE t.date >= ? AND t.date <= ?'
    params.push(start, end)
  }
  sql += ' ORDER BY t.date DESC, t.id DESC'

  const rows = await db.prepare(sql).bind(...params).all()

  const header = '日期,类型,金额,账户,分类,图标,备注\n'
  const csv = header + rows.results.map(r =>
    `${r.date},${r.type},${r.amount},${r.account || ''},${r.category || ''},${r.icon || ''},${(r.note || '').replace(/,/g, '，')}`
  ).join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="cashflow_${start || 'all'}_${end || 'all'}.csv"`,
    },
  })
}
