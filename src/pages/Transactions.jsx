import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'
import TransactionForm from '../components/TransactionForm'
import TransactionList from '../components/TransactionList'
import { ArrowRightLeft, Plus, Search } from 'lucide-react'

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(searchParams.get('add') === 'true')
  const [editing, setEditing] = useState(null)
  const [filters, setFilters] = useState({ type: '', account_id: '', search: '', page: 1 })
  const [total, setTotal] = useState(0)

  const loadData = useCallback(async () => {
    const [txRes, accRes] = await Promise.all([
      api.getTransactions(filters),
      api.getAccounts(),
    ])
    setTransactions(txRes.data)
    setTotal(txRes.total)
    setAccounts(accRes.data)
  }, [filters])

  useEffect(() => { loadData().finally(() => setLoading(false)) }, [loadData])

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowForm(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  function handleDone() {
    setShowForm(false)
    setEditing(null)
    loadData()
  }

  async function handleDelete(id) {
    if (!confirm('确定删除这笔记录？')) return
    await api.deleteTransaction(id)
    loadData()
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center justify-between animate-in slide-up fill-both">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <ArrowRightLeft size={18} className="text-primary" />
          </div>
          <h1 className="text-lg font-bold">💳 交易流水</h1>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(!showForm) }}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:brightness-110 transition-all active:scale-[0.97] shadow-sm flex items-center gap-1.5">
          <Plus size={14} />
          {showForm ? '收起' : '✏️ 记一笔'}
        </button>
      </div>

      {showForm && (
        <TransactionForm
          onDone={handleDone}
          initial={editing}
        />
      )}

      <div className="glass-card-flat rounded-2xl p-3 flex flex-wrap gap-2 items-center">
        <select value={filters.type} onChange={e => setFilters(f => ({ ...f, type: e.target.value, page: 1 }))}
          className="bg-muted rounded-lg px-3 py-1.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all">
          <option value="">📋 全部类型</option>
          <option value="expense">支出</option>
          <option value="income">收入</option>
        </select>
        <select value={filters.account_id} onChange={e => setFilters(f => ({ ...f, account_id: e.target.value, page: 1 }))}
          className="bg-muted rounded-lg px-3 py-1.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all">
          <option value="">🏦 全部账户</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <div className="relative flex-1 min-w-[120px]">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="🔍 搜索备注..." value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
            className="w-full bg-muted rounded-lg pl-7 pr-2.5 py-1.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all" />
        </div>
      </div>

      <TransactionList
        transactions={transactions}
        onEdit={(t) => { setEditing(t); setShowForm(true) }}
        onDelete={handleDelete}
        loading={loading}
      />

      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 animate-in slide-up fill-both">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setFilters(f => ({ ...f, page: i + 1 }))}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-all duration-200 ${
                filters.page === i + 1
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              }`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
