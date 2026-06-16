import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { formatMoney } from '../lib/utils'
import { Wallet, Plus, X, Pencil } from 'lucide-react'
const typeLabels = { cash: '现金', bank: '银行卡', credit: '信用卡', investment: '投资', ewallet: '电子钱包' }
const typeEmojis = { cash: '💵', bank: '🏦', credit: '💳', investment: '📈', ewallet: '📱' }

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', type: 'cash', balance: '' })

  useEffect(() => { loadAccounts() }, [])

  async function loadAccounts() {
    try {
      const res = await api.getAccounts()
      setAccounts(res.data)
    } catch (err) {
      console.error('加载账户失败', err)
    }
  }

  function startEdit(account) {
    setEditing(account)
    setForm({ name: account.name, type: account.type, balance: (account.balance || 0).toFixed(2) })
    setShowForm(true)
  }

  function handleCancel() {
    setEditing(null)
    setForm({ name: '', type: 'cash', balance: '' })
    setShowForm(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name) return
    try {
      if (editing) {
        await api.updateAccount(editing.id, { name: form.name, type: form.type, balance: Math.round(Number(form.balance) * 100) / 100 || 0 })
      } else {
        await api.createAccount({ name: form.name, type: form.type, balance: Math.round(Number(form.balance) * 100) / 100 || 0 })
      }
    } catch (err) {
      alert('操作失败：' + err.message)
      return
    }
    setEditing(null)
    setForm({ name: '', type: 'cash', balance: '' })
    setShowForm(false)
    loadAccounts()
  }

  async function handleDelete(id) {
    if (!confirm('删除后不可恢复，确定删除？')) return
    try {
      await api.deleteAccount(id)
      loadAccounts()
    } catch (e) {
      alert(e.message)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between animate-in slide-up fill-both">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Wallet size={18} className="text-primary" />
          </div>
          <h1 className="text-lg font-bold">🏦 账户管理</h1>
        </div>
        <button onClick={showForm ? handleCancel : () => setShowForm(true)}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:brightness-110 transition-all active:scale-[0.97] shadow-sm flex items-center gap-1.5">
          <Plus size={14} />
          {showForm ? '取消' : '➕ 添加'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card-strong rounded-2xl p-5 space-y-3 animate-in slide-up fill-both">
          <p className="text-sm font-semibold">{editing ? '✏️ 编辑账户' : '➕ 添加账户'}</p>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="📝 账户名称" required
            className="w-full bg-muted rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all" />
          <div className="flex gap-3">
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="flex-1 bg-muted rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all">
              <option value="cash">💵 现金</option>
              <option value="bank">🏦 银行卡</option>
              <option value="ewallet">📱 电子钱包</option>
              <option value="credit">💳 信用卡</option>
              <option value="investment">📈 投资</option>
            </select>
            <input value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
              inputMode="decimal" placeholder={editing ? '💰 修改余额' : '💰 初始余额'}
              className="w-28 bg-muted rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all" />
          </div>
          <button type="submit"
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:brightness-110 transition-all active:scale-[0.97] shadow-sm">
            {editing ? '✅ 保存' : '✅ 创建'}
          </button>
        </form>
      )}

      <div className="space-y-2">
        {accounts.map((a, i) => (
          <div key={a.id}
            className="glass-card rounded-2xl px-4 py-3.5 flex items-center justify-between transition-all duration-200 hover:bg-accent/30 animate-in slide-up fill-both"
            style={{ animationDelay: `${i * 40}ms` }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                {typeEmojis[a.type] || '🏦'}
              </div>
                <div>
                  <p className="text-sm font-medium">{typeEmojis[a.type] || ''} {a.name}</p>
                  <p className="text-xs text-muted-foreground">{typeLabels[a.type] || a.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold tabular-nums"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  ¥{formatMoney(a.balance)}
                </span>
                <button onClick={() => startEdit(a)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                  <Pencil size={12} />
                </button>
                <button onClick={() => handleDelete(a.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                  <X size={12} />
                </button>
              </div>
            </div>
        ))}
        {!accounts.length && (
          <p className="text-sm py-8 text-center text-muted-foreground">🏦 暂无账户，点击上方添加</p>
        )}
      </div>
    </div>
  )
}
