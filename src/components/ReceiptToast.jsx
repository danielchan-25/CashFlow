import { useState, useEffect } from 'react'
import { CheckCircle } from 'lucide-react'

export default function ReceiptToast({ amount, type, category, account, onClose }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setExiting(true), 2200)
    const t2 = setTimeout(() => onClose(), 2500)
    return () => { clearTimeout(t); clearTimeout(t2) }
  }, [onClose])

  return (
    <div className={`receipt-toast ${exiting ? 'receipt-toast-exit' : ''}`}>
      <div className="glass-card-strong rounded-xl px-5 py-3.5 flex items-center gap-3 shadow-lg min-w-[200px]">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${type === 'income' ? 'text-green-600 bg-green-500/10' : 'text-destructive bg-destructive/10'}`}>
          <CheckCircle size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold tabular-nums" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
            {type === 'income' ? '+' : '-'}¥{Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {category}{account ? ` · ${account}` : ''}
          </p>
        </div>
      </div>
    </div>
  )
}
