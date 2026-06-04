import { useState } from 'react'
import { api } from '../lib/api'
import { Download, Calendar } from 'lucide-react'

export default function Export() {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const blob = await api.exportCSV({ start, end })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cashflow_${start || 'all'}_${end || 'all'}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center gap-3 animate-in slide-up fill-both">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Download size={18} className="text-primary" />
        </div>
        <h1 className="text-lg font-bold">📤 导出 CSV</h1>
      </div>

      <div className="glass-card-strong rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Calendar size={14} className="text-muted-foreground" />
          <p className="text-xs font-semibold text-muted-foreground">📅 选择日期范围</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">开始日期</label>
            <input type="date" value={start} onChange={e => setStart(e.target.value)}
              className="w-full bg-muted rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-muted-foreground">结束日期</label>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)}
              className="w-full bg-muted rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">💡 留空则导出全部数据</p>
        <button onClick={handleExport} disabled={exporting}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-50 shadow-sm flex items-center gap-2">
          <Download size={14} />
          {exporting ? '导出中...' : '📥 导出 CSV'}
        </button>
      </div>
    </div>
  )
}
