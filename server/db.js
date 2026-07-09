import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import crypto from 'crypto'
import { getCategoryIcon } from '../src/data/categoryIcons.js'
import { categoriesData } from '../src/data/categories.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, '..', 'cashflow.sqlite')

let db

export function getDB() {
  if (!db) {
    db = new DatabaseSync(DB_PATH)
    db.exec('PRAGMA journal_mode = WAL')
    db.exec('PRAGMA foreign_keys = ON')
    initSchema()
  }
  return db
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT '📦',
      type TEXT NOT NULL,
      parent_id INTEGER,
      sort_order INTEGER,
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER,
      category_id INTEGER,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      date TEXT NOT NULL,
      note TEXT DEFAULT '',
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `)

  // migration: remove accounts table
  db.exec('PRAGMA foreign_keys = OFF')
  db.exec('UPDATE transactions SET account_id = NULL')
  db.exec('DROP TABLE IF EXISTS accounts')
  db.exec('PRAGMA foreign_keys = ON')

  const row = db.prepare('SELECT COUNT(*) as cnt FROM categories').get()
  if (row.cnt === 0) seed()
}

function seed() {
  const insertCat = db.prepare(
    'INSERT INTO categories (name, icon, type, parent_id, sort_order) VALUES (?, ?, ?, ?, ?)'
  )

  db.exec('BEGIN')
  try {
    let sort = 0
    function insert(items, type, parentId = null) {
      for (const [name, children] of Object.entries(items)) {
        const parentSort = parentId === null ? sort++ : null
        const info = insertCat.run(name, getCategoryIcon(name), type, parentId, parentSort)
        const parentId2 = Number(info.lastInsertRowid)

        if (Array.isArray(children)) {
          for (const child of children) {
            insertCat.run(child, getCategoryIcon(child), type, parentId2, null)
          }
        } else {
          insert(children, type, parentId2)
        }
      }
    }

    if (categoriesData['支出']) insert(categoriesData['支出'], 'expense')
    if (categoriesData['收入']) insert(categoriesData['收入'], 'income')

    db.exec('COMMIT')
  } catch (e) {
    db.exec('ROLLBACK')
    throw e
  }
}

export function closeDB() {
  if (db) {
    db.close()
    db = null
  }
}

export function getPasswordHash() {
  const row = getDB().prepare("SELECT value FROM settings WHERE key = 'password_hash'").get()
  return row ? row.value : null
}

export function setPassword(plain) {
  const hash = crypto.createHash('sha256').update(plain).digest('hex')
  getDB().prepare("INSERT INTO settings (key, value) VALUES ('password_hash', ?) ON CONFLICT(key) DO UPDATE SET value = ?").run(hash, hash)
}

export function checkPassword(plain) {
  const stored = getPasswordHash()
  if (!stored) return true
  const hash = crypto.createHash('sha256').update(plain).digest('hex')
  return hash === stored
}
