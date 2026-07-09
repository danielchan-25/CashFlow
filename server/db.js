import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import crypto from 'crypto'
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
