import { formatMoney, formatDate } from '../lib/utils'
import { Pencil, Trash2, ArrowUpFromLine, ArrowDownToLine, ArrowRightLeft } from 'lucide-react'

export default function TransactionList({ transactions, onEdit, onDelete, loading }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="glass-card rounded-2xl p-4 animate-pulse flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 rounded w-3/4 bg-muted" />
              <div className="h-2.5 rounded w-1/3 bg-muted" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!transactions?.length) {
    return (
      <div className="text-center py-14 animate-in fade-in">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
          <ArrowRightLeft size={28} className="text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">📭 暂无交易记录</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {transactions.map((t, i) => (
        <div key={t.id}
          className={`glass-card rounded-2xl px-4 py-3 flex items-center gap-3 transition-all duration-200 hover:bg-accent/30 active:scale-[0.99] animate-in slide-up fill-both`}
          style={{ animationDelay: `${i * 30}ms` }}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${t.type === 'income' ? 'text-primary' : 'text-destructive'}`}
            style={{ background: `hsl(var(--${t.type === 'income' ? 'primary' : 'destructive'}) / 0.12)` }}>
            {t.type === 'income' ? <ArrowUpFromLine size={16} /> : <ArrowDownToLine size={16} />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{t.category_name || t.note || '未分类'}</p>
            <p className="text-xs text-muted-foreground truncate">
              {formatDate(t.date)}{t.account_name && ` · ${t.account_name}`}{t.note && ` · ${t.note}`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-sm font-bold tabular-nums whitespace-nowrap ${t.type === 'income' ? 'text-primary' : 'text-destructive'}`}
              style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {t.type === 'income' ? '+' : '-'}¥{formatMoney(t.amount)}
            </span>
            {(onEdit || onDelete) && (
              <div className="flex gap-0.5 ml-1">
                {onEdit && (
                  <button onClick={() => onEdit(t)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                    <Pencil size={12} />
                  </button>
                )}
                {onDelete && (
                  <button onClick={() => onDelete(t.id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
