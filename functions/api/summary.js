export async function handleSummary(c) {
  const db = c.env.cashflow
  const { month, daily } = c.req.query()

  if (!month) {
    const now = new Date()
    const m = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    return daily ? handleDaily(c, db, m) : handleMonth(c, db, m)
  }
  return daily ? handleDaily(c, db, month) : handleMonth(c, db, month)
}

async function handleMonth(c, db, month) {
  const start = `${month}-01`
  const end = `${month}-31`

  const summary = await db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expense
    FROM transactions WHERE date >= ? AND date <= ?
  `).bind(start, end).first()

  const accounts = await db.prepare(
    'SELECT id, name, type, balance FROM accounts ORDER BY sort_order ASC'
  ).all()

  const trend = await db.prepare(`
    SELECT substr(date, 1, 7) as month,
      COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expense
    FROM transactions
    WHERE date >= date('now', '-12 months')
    GROUP BY substr(date, 1, 7)
    ORDER BY month ASC
  `).all()

  const expenseByCategory = await db.prepare(`
    SELECT c.id, c.name, c.icon, SUM(t.amount) as total, COUNT(*) as count
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ?
    GROUP BY c.id
    ORDER BY total DESC
  `).bind(start, end).all()

  const incomeByCategory = await db.prepare(`
    SELECT c.id, c.name, c.icon, SUM(t.amount) as total, COUNT(*) as count
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.type = 'income' AND t.date >= ? AND t.date <= ?
    GROUP BY c.id
    ORDER BY total DESC
  `).bind(start, end).all()

  return c.json({
    income: summary.income,
    expense: summary.expense,
    balance: summary.income - summary.expense,
    accounts: accounts.results,
    trend: trend.results,
    expenseByCategory: expenseByCategory.results,
    incomeByCategory: incomeByCategory.results,
  })
}

async function handleDaily(c, db, month) {
  const start = `${month}-01`
  const end = `${month}-31`

  const rows = await db.prepare(`
    SELECT date,
      COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) as income,
      COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expense
    FROM transactions
    WHERE date >= ? AND date <= ?
    GROUP BY date
    ORDER BY date ASC
  `).bind(start, end).all()

  return c.json({ daily: rows.results })
}
