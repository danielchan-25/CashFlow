import express from 'express'
import cors from 'cors'
import { getDB, getPasswordHash, setPassword, checkPassword } from './db.js'
import { getCategoryIcon } from '../src/data/categoryIcons.js'
import { categoriesData } from '../src/data/categories.js'

const app = express()
const PORT = process.env.PORT || 3002

app.use(cors())
app.use(express.json({ limit: '10mb' }))

// ---------- auth ----------

app.get('/api/auth/status', (req, res) => {
  const hash = getPasswordHash()
  res.json({ hasPassword: hash !== null })
})

app.post('/api/auth/setup', (req, res) => {
  const { password } = req.body
  if (!password || password.length < 1) return res.status(400).json({ error: '密码不能为空' })
  if (getPasswordHash()) return res.status(400).json({ error: '密码已设置' })
  setPassword(password)
  res.json({ success: true })
})

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body
  if (!password) return res.status(400).json({ error: '请输入密码' })
  if (checkPassword(password)) return res.json({ success: true })
  res.status(401).json({ error: '密码错误' })
})

// ---------- helpers ----------

function insertCategories(db, body) {
  const stmt = db.prepare('INSERT INTO categories (name, icon, type, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)')
  db.exec('BEGIN')
  try {
    let sort = 0
    function ins(items, type, parentId = null) {
      for (const [name, children] of Object.entries(items)) {
        const s = parentId === null ? sort++ : null
        const info = stmt.run(name, getCategoryIcon(name), type, parentId, s)
        const pid = Number(info.lastInsertRowid)
        if (Array.isArray(children)) {
          for (const child of children) {
            stmt.run(child, getCategoryIcon(child), type, pid, null)
          }
        } else {
          ins(children, type, pid)
        }
      }
    }
    if (body['支出']) ins(body['支出'], 'expense')
    if (body['收入']) ins(body['收入'], 'income')
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

// ---------- categories ----------

app.get('/api/categories', (req, res) => {
  const rows = getDB().prepare('SELECT * FROM categories ORDER BY type ASC, sort_order ASC, id ASC').all()
  res.json({ data: rows })
})

app.post('/api/categories', (req, res) => {
  const db = getDB()
  const { name, icon, type, parent_id } = req.body
  const n = String(name || '').trim()
  if (!n) return res.status(400).json({ error: 'invalid_name' })
  if (type !== 'income' && type !== 'expense') return res.status(400).json({ error: 'invalid_type' })
  const info = db.prepare('INSERT INTO categories (name, icon, type, parent_id) VALUES (?, ?, ?, ?)').run(n, icon || '📦', type, parent_id ? Number(parent_id) : null)
  res.status(201).json({ id: Number(info.lastInsertRowid) })
})

app.put('/api/categories/:id', (req, res) => {
  const db = getDB()
  const id = Number(req.params.id)
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'not found' })
  const b = req.body
  const name = b.name !== undefined ? String(b.name).trim() : existing.name
  const icon = b.icon !== undefined ? b.icon : existing.icon
  const parent_id = b.parent_id !== undefined ? (b.parent_id ? Number(b.parent_id) : null) : existing.parent_id
  if (!name) return res.status(400).json({ error: 'invalid_name' })
  db.prepare('UPDATE categories SET name=?, icon=?, parent_id=? WHERE id=?').run(name, icon, parent_id, id)
  res.json({ success: true })
})

app.delete('/api/categories/:id', (req, res) => {
  const db = getDB()
  const id = Number(req.params.id)
  if (db.prepare('SELECT COUNT(*) as cnt FROM categories WHERE parent_id = ?').get(id).cnt > 0)
    return res.status(400).json({ error: 'has_children', message: '请先删除子分类' })
  if (db.prepare('SELECT COUNT(*) as cnt FROM transactions WHERE category_id = ?').get(id).cnt > 0)
    return res.status(400).json({ error: 'has_transactions', message: '此分类下有交易记录，无法删除' })
  db.prepare('DELETE FROM categories WHERE id = ?').run(id)
  res.json({ success: true })
})

// ---------- categories import ----------

app.post('/api/categories/import', (req, res) => {
  const db = getDB()

  // Read all transactions with their current categories, preserving import order
  const rows = db.prepare(`
    SELECT t.id, t.type as tx_type,
           c.name as cat_name, c.parent_id as cat_parent_id,
           p.name as parent_name
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN categories p ON c.parent_id = p.id
    ORDER BY t.id ASC
  `).all()

  // No data → just clear categories
  if (rows.length === 0) {
    db.prepare('DELETE FROM categories').run()
    return res.json({ success: true, rebuilt: false, message: '已清空所有分类' })
  }

  // Collect unique (type, parent_name, cat_name) preserving CSV import order
  const seen = new Set()
  const uniqueCats = []
  for (const r of rows) {
    if (!r.cat_name) continue
    const key = r.parent_name ? `${r.tx_type}:${r.parent_name}:${r.cat_name}` : `${r.tx_type}::${r.cat_name}`
    if (!seen.has(key)) {
      seen.add(key)
      uniqueCats.push({ type: r.tx_type, parentName: r.parent_name || '', childName: r.cat_name })
    }
  }

  // Assign distinct emojis
  const emojis = ['🍱','🚗','🏠','👕','📱','💊','🎮','📚','✈️','🎁','💄','🏋️','🐱','💼','🛒','🍜','☕','🎬','🎵','🐾','🍪','🍻','🧴','🚌','🚘','🏢','💡','🔑','🛋️','🏨','🎯','📋','📞','☁️','🎤','🖨️','🏥','💆','🧧','🏡','🎓','📖','🏕️','🔒','🌸','🐶','🔗','💉','🩺','💇','🍽️','🥡','🍳','🚇','🚄','🚕','⛽','🅿️','🔧','🛣️','🎫','🤖','🍎','🌐','🖥️','🍖','🪣','🛏️']
  let ei = 0
  function nextEmoji() { return emojis[ei++ % emojis.length] }

  // Detach transactions from old categories, then delete categories
  db.prepare('UPDATE transactions SET category_id = NULL').run()
  db.prepare('DELETE FROM categories').run()

  const insertCat = db.prepare('INSERT INTO categories (name, icon, type, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)')

  db.exec('BEGIN')
  try {
    const parentMap = {}   // "type:parentName" -> new id
    const childMap = {}    // "type:parentName:childName" -> new id or "type::childName" for top-level
    let sort = 0

    // Pass 1: Create parent categories (sorted by first occurrence in CSV)
    for (const cat of uniqueCats) {
      if (cat.parentName && !parentMap[`${cat.type}:${cat.parentName}`]) {
        const icon = nextEmoji()
        const info = insertCat.run(cat.parentName, icon, cat.type, null, sort++)
        parentMap[`${cat.type}:${cat.parentName}`] = Number(info.lastInsertRowid)
      }
    }

    // Pass 2: Create all categories (both top-level and children)
    for (const cat of uniqueCats) {
      if (cat.parentName) {
        const parentKey = `${cat.type}:${cat.parentName}`
        const childKey = `${cat.type}:${cat.parentName}:${cat.childName}`
        if (childMap[childKey]) continue
        const parentId = parentMap[parentKey]
        if (!parentId) continue // edge case: parent missing
        const icon = nextEmoji()
        const info = insertCat.run(cat.childName, icon, cat.type, parentId, null)
        childMap[childKey] = Number(info.lastInsertRowid)
      } else {
        const key = `${cat.type}::${cat.childName}`
        if (childMap[key]) continue
        // Skip if this name already exists as a parent (from Pass 1)
        if (parentMap[`${cat.type}:${cat.childName}`]) {
          childMap[key] = parentMap[`${cat.type}:${cat.childName}`]
          continue
        }
        const icon = nextEmoji()
        const info = insertCat.run(cat.childName, icon, cat.type, null, sort++)
        childMap[key] = Number(info.lastInsertRowid)
      }
    }

    // Update transaction category_ids to point to new categories
    const updateTx = db.prepare('UPDATE transactions SET category_id = ? WHERE id = ?')
    for (const r of rows) {
      if (!r.cat_name) {
        updateTx.run(null, r.id)
        continue
      }
      const key = r.parent_name ? `${r.tx_type}:${r.parent_name}:${r.cat_name}` : `${r.tx_type}::${r.cat_name}`
      updateTx.run(childMap[key] || null, r.id)
    }

    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    console.error('Rebuild categories error:', e)
    return res.status(500).json({ error: 'rebuild_error', message: e.message })
  }

  res.json({ success: true, rebuilt: true, count: uniqueCats.length })
})

// ---------- transactions ----------

app.get('/api/transactions', (req, res) => {
  const db = getDB()
  const { type, category_id, search, start, end, page = '1', limit = '50' } = req.query
  let fromWhere = 'FROM transactions t LEFT JOIN categories c ON t.category_id = c.id WHERE 1=1'
  const params = []
  if (type) { fromWhere += ' AND t.type = ?'; params.push(type) }
  if (category_id) { fromWhere += ' AND t.category_id = ?'; params.push(Number(category_id)) }
  if (search) { fromWhere += ' AND t.note LIKE ?'; params.push(`%${search}%`) }
  if (start) { fromWhere += ' AND t.date >= ?'; params.push(start) }
  if (end) { fromWhere += ' AND t.date <= ?'; params.push(end) }
  const total = db.prepare('SELECT COUNT(*) as cnt ' + fromWhere).get(...params).cnt
  const p = Math.max(1, Number(page) || 1)
  const lmt = Math.min(500, Math.max(1, Number(limit) || 50))
  const data = db.prepare('SELECT t.*, c.name as category_name, c.icon as category_icon ' + fromWhere + ' ORDER BY t.date DESC, t.id DESC LIMIT ? OFFSET ?').all(...params, lmt, (p - 1) * lmt)
  res.json({ data, total })
})

app.post('/api/transactions', (req, res) => {
  const db = getDB()
  const { category_id, amount, type, date, note } = req.body
  if (type !== 'expense' && type !== 'income') return res.status(400).json({ error: 'invalid_type' })
  const a = Math.round(Number(amount) * 100) / 100
  const info = db.prepare('INSERT INTO transactions (category_id, amount, type, date, note) VALUES (?, ?, ?, ?, ?)')
    .run(category_id ? Number(category_id) : null, a, type, date || new Date().toISOString().slice(0, 10), (note || '').slice(0, 200))
  res.status(201).json({ id: Number(info.lastInsertRowid) })
})

app.put('/api/transactions/:id', (req, res) => {
  const db = getDB()
  const id = Number(req.params.id)
  const old = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id)
  if (!old) return res.status(404).json({ error: 'not found' })
  const b = req.body
  const amount = b.amount !== undefined ? Math.round(Number(b.amount) * 100) / 100 : old.amount
  const type = b.type !== undefined ? b.type : old.type
  const category_id = b.category_id !== undefined ? (b.category_id ? Number(b.category_id) : null) : old.category_id
  const date = b.date !== undefined ? b.date : old.date
  const note = b.note !== undefined ? (b.note || '').slice(0, 200) : old.note

  db.prepare('UPDATE transactions SET category_id=?, amount=?, type=?, date=?, note=? WHERE id=?')
    .run(category_id, amount, type, date, note, id)
  res.json({ success: true })
})

app.delete('/api/transactions/:id', (req, res) => {
  const db = getDB()
  const id = Number(req.params.id)
  db.prepare('DELETE FROM transactions WHERE id = ?').run(id)
  res.json({ success: true })
})

// ---------- transactions/export ----------

app.get('/api/transactions/export', (req, res) => {
  const db = getDB()
  const list = db.prepare('SELECT * FROM transactions ORDER BY date DESC, id DESC').all()

  const catMap = {}
  for (const c of db.prepare('SELECT * FROM categories').all()) catMap[c.id] = c

  const rows = list.map(t => {
    const c = t.category_id ? catMap[t.category_id] : null
    return [t.date, t.type === 'income' ? '收入' : '支出', t.amount.toFixed(2), c ? `${c.icon} ${c.name}` : '', t.note || '']
  })

  const csv = '\uFEFF' + ['日期', '类型', '金额', '分类', '备注'].join(',') + '\n' + rows.map(r =>
    r.map(v => v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v).join(',')
  ).join('\n')

  res.setHeader('Content-Type', 'text/csv;charset=utf-8')
  res.send(csv)
})

// ---------- transactions/import ----------

app.post('/api/transactions/import', (req, res) => {
  const db = getDB()
  const { rows } = req.body
  if (!rows?.length) return res.status(400).json({ error: 'no data' })

  const allCats = db.prepare('SELECT id, name, parent_id, type FROM categories').all()
  const catsByNameType = {}
  for (const c of allCats) catsByNameType[`${c.type}:${c.name}`] = c
  for (const c of allCats) {
    if (c.parent_id) {
      const parent = allCats.find(p => p.id === c.parent_id)
      if (parent) catsByNameType[`${c.type}:${parent.name}:${c.name}`] = c
    }
  }

  const insertStmt = db.prepare('INSERT INTO transactions (category_id, amount, type, date, note) VALUES (?, ?, ?, ?, ?)')

  let imported = 0
  const errors = []

  db.exec('BEGIN')
  db.exec('DELETE FROM transactions')
  try {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      let type = row.type
      if (type === '支出') type = 'expense'
      else if (type === '收入') type = 'income'

      let amount = Math.round(Number(String(row.amount).replace(/,/g, '')) * 100) / 100
      if (amount < 0) {
        if (!type || type === 'income') type = 'expense'
        amount = Math.abs(amount)
      }
      if (!type || (type !== 'income' && type !== 'expense')) {
        if (amount > 0) type = 'income'
        else { errors.push({ row: i + 1, error: '无法推断类型' }); continue }
      }

      let categoryId = null
      if (row.category_id) {
        categoryId = Number(row.category_id)
      } else {
        const name = row.category_name || ''
        const parentName = row.category_parent || ''
        if (parentName && name) { const cat = catsByNameType[`${type}:${parentName}:${name}`]; if (cat) categoryId = cat.id }
        if (!categoryId && name) { const cat = catsByNameType[`${type}:${name}`]; if (cat) categoryId = cat.id }
        if (!categoryId && parentName) { const cat = catsByNameType[`${type}:${parentName}`]; if (cat) categoryId = cat.id }
        // Auto-create unmatched categories so imported data isn't all "未分类"
        if (!categoryId) {
          if (parentName && name) {
            // Ensure parent exists
            let parentCat = catsByNameType[`${type}:${parentName}`]
            if (!parentCat) {
              const pi = db.prepare('INSERT INTO categories (name, icon, type, parent_id) VALUES (?, ?, ?, NULL)').run(parentName, '📦', type)
              const pid = Number(pi.lastInsertRowid)
              parentCat = { id: pid, name: parentName, type, parent_id: null }
              catsByNameType[`${type}:${parentName}`] = parentCat
            }
            // Create child under parent
            const ci = db.prepare('INSERT INTO categories (name, icon, type, parent_id) VALUES (?, ?, ?, ?)').run(name, '📦', type, parentCat.id)
            categoryId = Number(ci.lastInsertRowid)
            catsByNameType[`${type}:${name}`] = { id: categoryId, name, type, parent_id: parentCat.id }
            catsByNameType[`${type}:${parentName}:${name}`] = catsByNameType[`${type}:${name}`]
          } else {
            const catName = name || parentName
            if (catName) {
              const ci = db.prepare('INSERT INTO categories (name, icon, type, parent_id) VALUES (?, ?, ?, NULL)').run(catName, '📦', type)
              categoryId = Number(ci.lastInsertRowid)
              catsByNameType[`${type}:${catName}`] = { id: categoryId, name: catName, type, parent_id: null }
            }
          }
        }
      }

      if (!Number.isFinite(amount) || amount <= 0) { errors.push({ row: i + 1, error: '金额无效' }); continue }
      const date = (row.date || '').split(' ')[0]
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) { errors.push({ row: i + 1, error: '日期无效' }); continue }

      insertStmt.run(categoryId || null, amount, type, date, String(row.note || '').slice(0, 200))
      imported++
    }
    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    console.error('Import error:', e)
    return res.status(500).json({ error: 'import_error', message: e.message || String(e) })
  }
  res.json({ imported, errors })
})

// ---------- summary ----------

app.get('/api/summary', (req, res) => {
  const db = getDB()
  const { month, daily } = req.query
  const m = month || new Date().toISOString().slice(0, 7)
  const start = m + '-01'
  const d = new Date(m + '-01')
  d.setMonth(d.getMonth() + 1)
  d.setDate(0)
  const end = d.toISOString().slice(0, 10)

  if (daily === 'true') {
    const rows = db.prepare(`SELECT date, SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income, SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense FROM transactions WHERE date >= ? AND date <= ? GROUP BY date ORDER BY date ASC`).all(start, end)
    return res.json(rows)
  }

  const summary = db.prepare(`SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount ELSE 0 END), 0) as income, COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) as expense FROM transactions WHERE date >= ? AND date <= ?`).get(start, end)

  const expenseByCategory = db.prepare(`SELECT c.id, c.name, c.icon, SUM(t.amount) as total, COUNT(*) as count FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.type = 'expense' AND t.date >= ? AND t.date <= ? GROUP BY c.id ORDER BY total DESC`).all(start, end)

  const incomeByCategory = db.prepare(`SELECT c.id, c.name, c.icon, SUM(t.amount) as total, COUNT(*) as count FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.type = 'income' AND t.date >= ? AND t.date <= ? GROUP BY c.id ORDER BY total DESC`).all(start, end)

  res.json({ ...summary, expenseByCategory, incomeByCategory })
})

// ---------- reset ----------

app.post('/api/reset', (req, res) => {
  const db = getDB()
  db.prepare('DELETE FROM transactions').run()
  db.prepare('DELETE FROM categories').run()
  insertCategories(db, categoriesData)
  res.json({ success: true, message: '已重置为初始状态' })
})

// ---------- global error handler ----------

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'internal_error', message: err.message || String(err) })
})

// ---------- start ----------

app.listen(PORT, () => {
  console.log(`✓ CashFlow 服务已启动: http://localhost:${PORT}`)
  console.log(`✓ 数据库文件: cashflow.sqlite`)
})
