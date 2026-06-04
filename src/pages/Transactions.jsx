import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import TransactionList from '../components/TransactionList'
import { formatMoney, currentMonth } from '../lib/utils'
import { Search, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85929E', '#73C6B6',
]

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ type: '', account_id: '', search: '', page: 1 })
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState(null)
  const [month, setMonth] = useState(currentMonth())

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
    api.getSummary(month).then(r => setSummary(r))
  }, [month])

  async function handleDelete(id) {
    if (!confirm('确定删除这笔记录？')) return
    await api.deleteTransaction(id)
    loadData()
  }

  const totalPages = Math.ceil(total / 50)

  const expenseData = summary?.expenseByCategory?.map(c => ({
    name: c.icon + ' ' + c.name,
    value: c.total,
  })) || []

  const incomeData = summary?.incomeByCategory?.map(c => ({
    name: c.icon + ' ' + c.name,
    value: c.total,
  })) || []

  function renderPie(data, title, total) {
    if (!data.length) return null
    return (
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold mb-2">{title}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%" cy="50%"
              innerRadius={45}
              outerRadius={85}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `¥${formatMoney(value)}`} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
        <p className="text-center text-xs text-muted-foreground mt-1">¥{formatMoney(total)}</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center gap-3 animate-in slide-up fill-both">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Search size={18} className="text-primary" />
        </div>
        <h1 className="text-lg font-bold">📊 概览</h1>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-3 gap-3 animate-in slide-up fill-both">
            <div className="glass-card rounded-2xl px-4 py-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                <TrendingDown size={18} className="text-red-500" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">本月支出</p>
                <p className="text-sm font-bold text-red-500 tabular-nums">¥{formatMoney(summary.expense)}</p>
              </div>
            </div>
            <div className="glass-card rounded-2xl px-4 py-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp size={18} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">本月收入</p>
                <p className="text-sm font-bold text-emerald-500 tabular-nums">¥{formatMoney(summary.income)}</p>
              </div>
            </div>
            <div className="glass-card rounded-2xl px-4 py-3.5 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${summary.balance >= 0 ? 'bg-primary/10' : 'bg-red-500/10'}`}>
                <Wallet size={18} className={summary.balance >= 0 ? 'text-primary' : 'text-red-500'} />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">净余额</p>
                <p className={`text-sm font-bold tabular-nums ${summary.balance >= 0 ? 'text-primary' : 'text-red-500'}`}>
                  {summary.balance >= 0 ? '+' : ''}¥{formatMoney(summary.balance)}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-4 animate-in slide-up fill-both">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">📈 分类统计</h2>
              <input type="month" value={month} onChange={e => setMonth(e.target.value)}
                className="bg-muted rounded-lg px-2.5 py-1 text-xs outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all" />
            </div>
            <div className="flex flex-col sm:flex-row gap-6">
              {renderPie(expenseData, '💸 支出分类', summary.expense)}
              {renderPie(incomeData, '💰 收入分类', summary.income)}
            </div>
          </div>
        </>
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
