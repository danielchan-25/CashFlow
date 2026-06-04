import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import TransactionList from '../components/TransactionList'
import TransactionForm from '../components/TransactionForm'
import { formatMoney, currentMonth } from '../lib/utils'
import { Search, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8C471', '#82E0AA', '#F1948A', '#85929E', '#73C6B6',
]

function buildCategoryMap(categories) {
  const map = {}
  categories.forEach(c => { map[c.id] = { ...c } })
  return map
}

function findRoot(catId, catMap) {
  let current = catMap[catId]
  while (current && current.parent_id && catMap[current.parent_id]) {
    current = catMap[current.parent_id]
  }
  return current
}

function aggregateByRoot(data, catMap) {
  const rootMap = {}
  data.forEach(item => {
    const root = findRoot(item.id, catMap)
    const rootId = root ? root.id : item.id
    const rootName = root ? root.name : item.name
    const rootIcon = root ? root.icon : item.icon
    const key = String(rootId)
    if (!rootMap[key]) {
      rootMap[key] = { name: rootIcon + ' ' + rootName, value: 0 }
    }
    rootMap[key].value += item.total
  })
  return Object.values(rootMap).sort((a, b) => b.value - a.value)
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ type: '', account_id: '', category_id: '', search: '', page: 1 })
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState(null)
  const [month, setMonth] = useState(currentMonth())
  const [catLevel1, setCatLevel1] = useState('')
  const [catLevel2, setCatLevel2] = useState('')
  const [editing, setEditing] = useState(null)

  const loadData = useCallback(async () => {
    const [txRes, accRes] = await Promise.all([
      api.getTransactions(filters),
      api.getAccounts(),
    ])
    setTransactions(txRes.data)
    setTotal(txRes.total)
    setAccounts(accRes.data)
  }, [filters])

  useEffect(() => {
    loadData().finally(() => setLoading(false))
    api.getCategories().then(r => setCategories(r.data))
  }, [loadData])

  useEffect(() => {
    api.getSummary(month).then(r => setSummary(r))
  }, [month])

  async function handleDelete(id) {
    if (!confirm('确定删除这笔记录？')) return
    await api.deleteTransaction(id)
    loadData()
  }

  function handleEdit(tx) {
    setEditing(tx)
  }

  function handleEditDone() {
    setEditing(null)
    loadData()
    api.getSummary(month).then(r => setSummary(r))
  }

  const catMap = buildCategoryMap(categories)

  const filteredCats = categories.filter(c => !filters.type || c.type === filters.type)
  const catChildren = {}
  const roots = []
  filteredCats.forEach(c => {
    if (c.parent_id) {
      if (!catChildren[c.parent_id]) catChildren[c.parent_id] = []
      catChildren[c.parent_id].push(c)
    } else {
      roots.push(c)
    }
  })
  roots.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const l1Options = roots
  const l2Options = catLevel1 ? catChildren[Number(catLevel1)] || [] : []
  const l3Options = catLevel2 ? catChildren[Number(catLevel2)] || [] : []

  const totalPages = Math.ceil(total / 50)

  const expensePieData = aggregateByRoot(summary?.expenseByCategory || [], catMap)
  const incomePieData = aggregateByRoot(summary?.incomeByCategory || [], catMap)

  function handleTypeChange(e) {
    const val = e.target.value
    setFilters(f => ({ ...f, type: val, category_id: '', page: 1 }))
    setCatLevel1('')
    setCatLevel2('')
  }

  function handleLevel1(e) {
    const val = e.target.value
    setCatLevel1(val)
    setCatLevel2('')
    const children = val ? catChildren[Number(val)] || [] : []
    setFilters(f => ({ ...f, category_id: children.length === 0 ? val : '', page: 1 }))
  }

  function handleLevel2(e) {
    const val = e.target.value
    setCatLevel2(val)
    const children = val ? catChildren[Number(val)] || [] : []
    setFilters(f => ({ ...f, category_id: children.length === 0 ? val : '', page: 1 }))
  }

  function handleLevel3(e) {
    setFilters(f => ({ ...f, category_id: e.target.value, page: 1 }))
  }

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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in slide-up fill-both">
            <div className="glass-card rounded-2xl px-4 py-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                <TrendingDown size={18} className="text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">本月支出</p>
                <p className="text-sm font-bold text-red-500 tabular-nums truncate">¥{formatMoney(summary.expense)}</p>
              </div>
            </div>
            <div className="glass-card rounded-2xl px-4 py-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <TrendingUp size={18} className="text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">本月收入</p>
                <p className="text-sm font-bold text-emerald-500 tabular-nums truncate">¥{formatMoney(summary.income)}</p>
              </div>
            </div>
            <div className="glass-card rounded-2xl px-4 py-3.5 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${summary.balance >= 0 ? 'bg-primary/10' : 'bg-red-500/10'}`}>
                <Wallet size={18} className={summary.balance >= 0 ? 'text-primary' : 'text-red-500'} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-muted-foreground">净余额</p>
                <p className={`text-sm font-bold tabular-nums truncate ${summary.balance >= 0 ? 'text-primary' : 'text-red-500'}`}>
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
              {renderPie(expensePieData, '💸 支出分类', summary.expense)}
              {renderPie(incomePieData, '💰 收入分类', summary.income)}
            </div>
          </div>
        </>
      )}

      <div className="glass-card-flat rounded-2xl p-3 flex flex-wrap gap-2 items-center">
        <select value={filters.type} onChange={handleTypeChange}
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

      {filters.type && categories.length > 0 && (
        <div className="glass-card-flat rounded-2xl p-3 flex flex-wrap gap-2 items-center">
          <select value={catLevel1} onChange={handleLevel1}
            className="bg-muted rounded-lg px-3 py-1.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all">
            <option value="">📂 全部大类</option>
            {l1Options.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
          {l2Options.length > 0 && (
            <select value={catLevel2} onChange={handleLevel2}
              className="bg-muted rounded-lg px-3 py-1.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all">
              <option value="">📁 全部中类</option>
              {l2Options.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          )}
          {l3Options.length > 0 && (
            <select value={filters.category_id} onChange={handleLevel3}
              className="bg-muted rounded-lg px-3 py-1.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all">
              <option value="">📄 全部小类</option>
              {l3Options.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          )}
        </div>
      )}

      {editing && (
        <TransactionForm
          key={editing.id}
          initial={editing}
          onDone={handleEditDone}
        />
      )}

      <TransactionList
        transactions={transactions}
        onEdit={handleEdit}
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
