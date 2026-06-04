import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { formatMoney, currentMonth } from '../lib/utils'
import { LayoutDashboard, Wallet, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react'
import CalendarView from '../components/CalendarView'

export default function Dashboard() {
  const [month, setMonth] = useState(currentMonth)
  const [summary, setSummary] = useState(null)
  const [daily, setDaily] = useState([])
  const [topAccounts, setTopAccounts] = useState([])
  const [topCategories, setTopCategories] = useState([])
  const [recent, setRecent] = useState([])

  const loadData = useCallback(async (m) => {
    const startDate = `${m}-01`
    const endDate = `${m}-31`
    const [summaryRes, accountsRes, transactionsRes, dailyRes] = await Promise.all([
      api.getSummary(m),
      api.getAccounts(),
      api.getTransactions({ start: startDate, end: endDate, limit: 5 }),
      api.getDailySummary(m),
    ])
    setSummary(summaryRes)
    setTopAccounts(
      accountsRes.data.sort((a, b) => b.balance - a.balance).slice(0, 4)
    )
    setRecent(transactionsRes.data)
    setDaily(dailyRes.daily || [])
    setTopCategories((summaryRes.topCategories || []).slice(0, 5))
  }, [])

  useEffect(() => {
    loadData(month)
  }, [month, loadData])

  function handleMonthChange(newMonth) {
    setMonth(newMonth)
  }

  const i = Number(summary?.income) || 0
  const e = Number(summary?.expense) || 0
  const maxCat = topCategories[0]?.total || 1

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3 animate-in slide-up fill-both">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <LayoutDashboard size={18} className="text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold">📊 概览</h1>
          <p className="text-xs text-muted-foreground">{summary?.month || month}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-card rounded-2xl p-4 animate-in slide-up fill-both animate-glass-glow">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-primary" />
            <p className="text-xs text-muted-foreground">💰 收入</p>
          </div>
          <p className="text-xl font-bold tabular-nums text-primary"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            ¥{formatMoney(i)}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4 animate-in slide-up fill-both"
          style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={14} className="text-destructive" />
            <p className="text-xs text-muted-foreground">💸 支出</p>
          </div>
          <p className="text-xl font-bold tabular-nums text-destructive"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            ¥{formatMoney(e)}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4 animate-in slide-up fill-both"
          style={{ animationDelay: '200ms' }}>
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={14} className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground">💼 结余</p>
          </div>
          <p className="text-xl font-bold tabular-nums"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            ¥{formatMoney(i - e)}
          </p>
        </div>
      </div>

      <CalendarView
        month={month}
        daily={daily}
        onMonthChange={handleMonthChange}
      />

      {topAccounts.length > 0 && (
        <div className="glass-card rounded-2xl p-4 animate-in slide-up fill-both"
          style={{ animationDelay: '200ms' }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Wallet size={14} className="text-primary" />
            🏦 账户余额
          </h3>
          <div className="space-y-2.5">
            {topAccounts.map((a, i) => (
              <div key={a.id} className="flex items-center justify-between">
                <p className="text-sm">{a.name}</p>
                <p className="text-sm font-bold tabular-nums"
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  ¥{formatMoney(a.balance)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {topCategories.length > 0 && (
        <div className="glass-card rounded-2xl p-4 animate-in slide-up fill-both"
          style={{ animationDelay: '300ms' }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <TrendingDown size={14} className="text-destructive" />
            📈 支出排行
          </h3>
          <div className="space-y-3">
            {topCategories.map((c, i) => (
              <div key={c.category_id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>{c.category_icon} {c.category_name}</span>
                  <span className="font-bold tabular-nums text-xs"
                    style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                    ¥{formatMoney(c.total)}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-destructive/60 transition-all duration-700 ease-out animate-in fade-in"
                    style={{ width: `${(c.total / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card rounded-2xl p-4 animate-in slide-up fill-both"
        style={{ animationDelay: '400ms' }}>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <ArrowRightLeft size={14} className="text-primary" />
          📝 最近交易
        </h3>
        {recent.length > 0 ? (
          <div className="space-y-2">
            {recent.map(t => (
              <div key={t.id} className="flex items-center gap-3 py-1.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${t.type === 'income' ? 'text-primary' : 'text-destructive'}`}
                  style={{ background: `hsl(var(--${t.type === 'income' ? 'primary' : 'destructive'}) / 0.12)` }}>
                  {t.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{t.category_name || t.note || '未分类'}</p>
                  <p className="text-xs text-muted-foreground">{t.date}</p>
                </div>
                <span className={`text-sm font-bold tabular-nums ${t.type === 'income' ? 'text-primary' : 'text-destructive'}`}
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {t.type === 'income' ? '+' : '-'}¥{formatMoney(t.amount)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">📭 暂无交易</p>
        )}
      </div>
    </div>
  )
}
