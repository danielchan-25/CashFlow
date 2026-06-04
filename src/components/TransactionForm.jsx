import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { currentMonth } from '../lib/utils'
import { ArrowUpFromLine, ArrowDownToLine } from 'lucide-react'

export default function TransactionForm({ onDone, initial }) {
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(initial || {
    date: new Date().toISOString().slice(0, 7) + '-01',
    type: 'expense',
    amount: '',
    account_id: '',
    category_id: '',
    note: '',
  })

  useEffect(() => {
    api.getAccounts().then(r => setAccounts(r.data))
    api.getCategories().then(r => setCategories(r.data))
  }, [])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount || !form.account_id) return
    if (initial?.id) {
      await api.updateTransaction(initial.id, form)
    } else {
      await api.createTransaction(form)
    }
    onDone?.()
  }

  const filteredCategories = categories.filter(c => c.type === form.type)
  const inputClass = 'w-full bg-muted rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all duration-200'

  return (
    <form onSubmit={handleSubmit} className="glass-card-strong rounded-2xl p-5 space-y-3.5 animate-in slide-up fill-both" style={{ animationDelay: '50ms' }}>
      <div className="flex p-1 rounded-xl bg-muted">
        {['expense', 'income'].map(t => (
          <button key={t} type="button" onClick={() => set('type', t)}
            className={`flex-1 py-2 rounded-[10px] text-sm font-semibold flex items-center justify-center gap-1.5 transition-all duration-200 ${form.type === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
            {t === 'expense' ? <ArrowDownToLine size={14} /> : <ArrowUpFromLine size={14} />}
            {t === 'expense' ? '💸 支出' : '💰 收入'}
          </button>
        ))}
      </div>

      <input value={form.amount} onChange={e => set('amount', e.target.value)}
        type="number" step="0.01" placeholder="💰 金额"
        className={`${inputClass} text-lg font-bold tabular-nums`}
        style={{ fontFamily: 'JetBrains Mono, monospace' }} autoFocus />

      <div className="grid grid-cols-2 gap-3">
        <select value={form.account_id} onChange={e => set('account_id', e.target.value)}
          className={inputClass}>
          <option value="">🏦 选择账户</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <select value={form.category_id} onChange={e => set('category_id', e.target.value)}
          className={inputClass}>
          <option value="">🏷️ 选择分类</option>
          {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input value={form.date} onChange={e => set('date', e.target.value)}
          type="date" className={inputClass} />
        <input value={form.note} onChange={e => set('note', e.target.value)}
          placeholder="📝 备注" className={inputClass} />
      </div>

      <div className="flex gap-3 pt-1">
        {onDone && (
          <button type="button" onClick={onDone}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-muted text-muted-foreground hover:bg-accent transition-all active:scale-[0.97]">
            取消
          </button>
        )}
        <button type="submit"
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:brightness-110 transition-all active:scale-[0.97] shadow-sm">
          {initial?.id ? '✅ 更新' : '✅ 添加'}
        </button>
      </div>
    </form>
  )
}
