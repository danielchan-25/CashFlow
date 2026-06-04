import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { today } from '../lib/utils'
import ReceiptToast from '../components/ReceiptToast'

const inputClass = 'w-full bg-muted rounded-xl px-4 py-3 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all duration-200'

export default function Dashboard() {
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({ type: 'expense', amount: '', account_id: '', category_id: '', date: today(), note: '' })
  const [toast, setToast] = useState(null)

  useEffect(() => {
    api.getAccounts().then(r => setAccounts(r.data))
    api.getCategories().then(r => setCategories(r.data))
  }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || !form.account_id) return
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
    setTimeout(() => setToast(null), 2600)
  }

  const filteredCategories = categories.filter(c => c.type === form.type)

  return (
    <div className="max-w-sm mx-auto">
      <form onSubmit={handleSubmit} className="receipt-card rounded-2xl p-6 space-y-4 animate-in slide-up fill-both">
        {/* Receipt Header */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="text-lg font-bold tracking-tight">🧾 CashFlow</div>
          <div className="text-[11px] text-muted-foreground tracking-wide">
            {new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        <div className="receipt-dash" />

        {/* Type Toggle */}
        <div className="flex p-1 rounded-xl bg-muted">
          {['expense', 'income'].map(t => (
            <button key={t} type="button" onClick={() => set('type', t)}
              className={`flex-1 py-2 rounded-[10px] text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${form.type === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t === 'expense' ? '💸 支出' : '💰 收入'}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-3xl font-bold text-muted-foreground/50">¥</span>
          <input value={form.amount} onChange={e => set('amount', e.target.value)}
            type="number" step="0.01" placeholder="0.00"
            className="receipt-amount-input w-44 bg-transparent border-0 outline-none text-3xl font-bold tabular-nums text-center placeholder:text-muted-foreground/25"
            style={{ fontFamily: 'JetBrains Mono, monospace' }} autoFocus />
        </div>

        <div className="receipt-dash" />

        {/* Account */}
        <select value={form.account_id} onChange={e => set('account_id', e.target.value)}
          className={inputClass}>
          <option value="">🏦 选择账户</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>

        {/* Category */}
        <select value={form.category_id} onChange={e => set('category_id', e.target.value)}
          className={inputClass}>
          <option value="">🏷️ 选择分类</option>
          {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>

        <div className="receipt-dash" />

        {/* Date & Note */}
        <div className="grid grid-cols-2 gap-3">
          <input value={form.date} onChange={e => set('date', e.target.value)}
            type="date" className={inputClass} />
          <input value={form.note} onChange={e => set('note', e.target.value)}
            placeholder="📝 备注" className={inputClass} maxLength={50} />
        </div>

        <div className="receipt-cut" />

        {/* Submit */}
        <button type="submit" disabled={!form.amount || !form.account_id}
          className="w-full py-3 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm">
          ✅ 记录
        </button>
      </form>

      {toast && <ReceiptToast {...toast} onClose={() => setToast(null)} />}
    </div>
  )
}
