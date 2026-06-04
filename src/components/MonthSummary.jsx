import { TrendingDown, TrendingUp, Wallet } from 'lucide-react'

function SummaryCard({ icon: Icon, label, amount, color, delay }) {
  return (
    <div className={`glass-card rounded-2xl p-4 flex items-center gap-3.5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 animate-in slide-up fill-both`}
      style={{ animationDelay: `${delay}ms` }}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0`}
        style={{ background: `hsl(var(--${color}) / 0.12)`, color: `hsl(var(--${color}))` }}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label === '收入' ? '💰 收入' : label === '支出' ? '💸 支出' : '💼 结余'}</p>
        <p className="text-base font-bold tabular-nums truncate"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}>
          ¥{amount}
        </p>
      </div>
    </div>
  )
}

export default function MonthSummary({ income, expense, balance }) {
  const i = Number(income) || 0
  const e = Number(expense) || 0
  const b = Number(balance) || 0

  return (
    <div className="grid grid-cols-3 gap-3">
      <SummaryCard icon={TrendingUp} label="收入" amount={i.toFixed(2)} color="primary" delay={0} />
      <SummaryCard icon={TrendingDown} label="支出" amount={e.toFixed(2)} color="destructive" delay={100} />
      <SummaryCard icon={Wallet} label="结余" amount={(i - e + b).toFixed(2)} color="primary" delay={200} />
    </div>
  )
}
