import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { today, formatMoney } from '../lib/utils'
import ReceiptToast from '../components/ReceiptToast'

const inputClass = 'w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all duration-200'

function buildTree(categories) {
  const map = {}
  const roots = []
  categories.forEach(c => { map[c.id] = { ...c, children: [] } })
  categories.forEach(c => {
    if (c.parent_id && map[c.parent_id]) {
      map[c.parent_id].children.push(map[c.id])
    } else if (!c.parent_id) {
      roots.push(map[c.id])
    }
  })
  return { map, roots }
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ type: 'expense', amount: '', account_id: '', category_id: '', date: today(), note: '' })
  const [catLevel1, setCatLevel1] = useState('')
  const [catLevel2, setCatLevel2] = useState('')
  const [toast, setToast] = useState(null)
  const [todayTxs, setTodayTxs] = useState([])

  async function loadTodayTxs() {
    const todayStr = today()
    const res = await api.getTransactions({ start: todayStr, end: todayStr, limit: 50 })
    setTodayTxs(res.data || [])
  }

  useEffect(() => {
    api.getAccounts().then(r => setAccounts(r.data))
    api.getCategories().then(r => setCategories(r.data))
    loadTodayTxs()
  }, [])

  const { map, roots } = buildTree(categories)
  const filteredRoots = roots.filter(c => c.type === form.type)

  const l1Options = filteredRoots
  const l2Options = catLevel1 ? map[Number(catLevel1)]?.children || [] : []
  const l3Options = catLevel2 ? map[Number(catLevel2)]?.children || [] : []

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function handleLevel1(e) {
    const val = e.target.value
    setCatLevel1(val)
    setCatLevel2('')
    const children = val ? map[Number(val)]?.children || [] : []
    if (children.length === 0) {
      set('category_id', val)
    } else {
      set('category_id', '')
    }
  }

  function handleLevel2(e) {
    const val = e.target.value
    setCatLevel2(val)
    const children = val ? map[Number(val)]?.children || [] : []
    if (children.length === 0) {
      set('category_id', val)
    } else {
      set('category_id', '')
    }
  }

  function handleLevel3(e) {
    set('category_id', e.target.value)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || !form.account_id || !form.category_id) return
    await api.createTransaction(form)
    const catName = categories.find(c => c.id === Number(form.category_id))?.name || ''
    const accName = accounts.find(a => a.id === Number(form.account_id))?.name || ''
    setToast({
      amount: Math.abs(Number(form.amount)),
      type: form.type,
      category: catName,
      account: accName,
    })
    setForm({ type: form.type, amount: '', account_id: '', category_id: '', date: today(), note: '' })
    setCatLevel1('')
    setCatLevel2('')
    loadTodayTxs()
    setTimeout(() => setToast(null), 2600)
  }

  return (
    <div className="max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="receipt-card rounded-2xl p-6 space-y-4 animate-in slide-up fill-both">
        <div className="text-center space-y-1.5 pt-1">
          <div className="text-lg font-bold tracking-tight">🧾 CashFlow</div>
          <div className="text-[11px] text-muted-foreground tracking-wide">
            {new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="receipt-dash" />

        <div className="flex p-1 rounded-xl bg-muted">
          {['expense', 'income'].map(t => (
            <button key={t} type="button" onClick={() => { set('type', t); setCatLevel1(''); setCatLevel2(''); set('category_id', '') }}
              className={`flex-1 py-2 rounded-[10px] text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${form.type === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t === 'expense' ? '💸 支出' : '💰 收入'}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-1.5">
          <span className="text-3xl font-bold text-muted-foreground/50">¥</span>
          <input value={form.amount} onChange={e => set('amount', e.target.value)}
            type="number" step="0.01" inputMode="decimal" placeholder="0.00"
            className="receipt-amount-input w-44 bg-transparent border-0 outline-none text-3xl font-bold tabular-nums text-center placeholder:text-muted-foreground/25"
            style={{ fontFamily: 'JetBrains Mono, monospace' }} autoFocus />
        </div>

        <div className="receipt-dash" />

        <select value={form.account_id} onChange={e => set('account_id', e.target.value)}
          className={inputClass}>
          <option value="">🏦 选择账户</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        <select value={catLevel1} onChange={handleLevel1} className={inputClass}>
          <option value="">📂 选择大类</option>
          {l1Options.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>

        {l2Options.length > 0 && (
          <select value={catLevel2} onChange={handleLevel2} className={inputClass}>
            <option value="">📁 选择中类</option>
            {l2Options.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        )}

        {l3Options.length > 0 && (
          <select value={form.category_id} onChange={handleLevel3} className={inputClass}>
            <option value="">📄 选择小类</option>
            {l3Options.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        )}

        <div className="receipt-dash" />

        <div className="grid grid-cols-2 gap-3">
          <input value={form.date} onChange={e => set('date', e.target.value)}
            type="date" className={inputClass} />
          <input value={form.note} onChange={e => set('note', e.target.value)}
            placeholder="📝 备注" className={inputClass} maxLength={50} />
        </div>

        <div className="receipt-cut" />

        <button type="submit" disabled={!form.amount || !form.account_id || !form.category_id}
          className="w-full py-3 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
          ✅ 记录
        </button>
      </form>

      {todayTxs.length > 0 && (
        <div className="mt-6 space-y-2 animate-in slide-up fill-both">
          <h2 className="text-sm font-semibold">📋 今日记录</h2>
          <div className="glass-card-flat rounded-2xl divide-y divide-border/40">
            {todayTxs.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm truncate">{tx.category_icon} {tx.category_name}</span>
                  {tx.note && <span className="text-xs text-muted-foreground truncate hidden sm:inline">— {tx.note}</span>}
                </div>
                <span className={`text-sm font-bold tabular-nums shrink-0 ml-3 ${tx.type === 'expense' ? 'text-red-500' : 'text-emerald-500'}`}>
                  {tx.type === 'expense' ? '-' : '+'}¥{formatMoney(Math.abs(tx.amount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {toast && <ReceiptToast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}
