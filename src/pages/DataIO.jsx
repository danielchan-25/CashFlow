import { useState, useRef } from 'react'
import { api } from '../lib/api'
import { parseCSV } from '../lib/csv'
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react'

const fields = [
  { key: 'date', label: '日期', required: true },
  { key: 'type', label: '类型', required: true },
  { key: 'amount', label: '金额', required: true },
  { key: 'category_parent', label: '大类' },
  { key: 'category_name', label: '中类' },
  { key: 'note', label: '备注' },
]

export default function DataIO() {
  const [exporting, setExporting] = useState(false)
  const [preview, setPreview] = useState(null)
  const [mapping, setMapping] = useState({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef()

  // ---------- export ----------

  async function handleExport() {
    setExporting(true)
    try {
      const blob = await api.exportCSV()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cashflow_${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  // ---------- import ----------

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const { headers, rows } = parseCSV(ev.target.result)
      setPreview({ headers, rows: rows.slice(0, 5) })
      const guess = {}
      const headerLower = headers.map(h => h.toLowerCase())

      // Chinese keyword mapping for accounting apps (MoneyThings, etc.)
      const zhFieldMap = {
        date: ['交易时间', '交易日期', '日期', '时间'],
        type: ['交易类型', '收支类型', '类型', '收支'],
        amount: ['交易金额', '金额', '人民币'],
        category_parent: ['大类', '父类', '一级分类'],
        category_name: ['中类', '分类名称', '子类', '二级分类', '小类'],
        note: ['备注', '说明', '摘要', '描述'],
      }

      fields.forEach(f => {
        // Try English keyword match (existing logic)
        const engIdx = headerLower.findIndex(h => h.includes(f.key.replace(/_/g, '').toLowerCase()))
        if (engIdx >= 0) { guess[f.key] = engIdx; return }
        // Try Chinese keyword match
        const zhKeywords = zhFieldMap[f.key] || []
        for (const kw of zhKeywords) {
          const zhIdx = headerLower.findIndex(h => h.includes(kw))
          if (zhIdx >= 0) { guess[f.key] = zhIdx; return }
        }
      })
      setMapping(guess)
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    const file = fileRef.current.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const { rows } = parseCSV(ev.target.result)
      const mapped = rows.map(row => {
        const item = {}
        fields.forEach(f => {
          const idx = mapping[f.key]
          if (idx !== undefined && idx >= 0) {
            item[f.key] = row[Object.keys(row)[idx]] || ''
          }
        })
        return item
      }).filter(r => r.date && r.type && r.amount)

      setImporting(true)
      try {
        const res = await api.importCSV(mapped)
        setResult(res)
      } catch (e) {
        setResult({ imported: 0, errors: [{ row: 0, error: e.message }] })
      }
      setImporting(false)
    }
    reader.readAsText(file)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3 animate-in slide-up fill-both">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Download size={18} className="text-primary" />
        </div>
        <h1 className="text-lg font-bold">📥📤 数据导入/导出</h1>
      </div>

      {/* ============ Export ============ */}
      <div className="glass-card-strong rounded-2xl p-5 space-y-4 animate-in slide-up fill-both">
        <div className="flex items-center gap-2">
          <Download size={16} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">📤 导出全部数据</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          将数据库中所有交易记录导出为 CSV 文件，不限制日期范围。
        </p>
        <button onClick={handleExport} disabled={exporting}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-50 shadow-sm flex items-center gap-2">
          <Download size={14} />
          {exporting ? '导出中...' : '📥 导出 CSV'}
        </button>
      </div>

      {/* ============ Import ============ */}
      <div className="glass-card-strong rounded-2xl p-5 space-y-4 animate-in slide-up fill-both"
        style={{ animationDelay: '80ms' }}>

        <div className="flex items-center gap-2">
          <Upload size={16} className="text-muted-foreground" />
          <h2 className="text-sm font-semibold">📥 导入 CSV</h2>
        </div>

        {/* usage guide */}
        <div className="bg-muted rounded-xl p-4 text-xs space-y-2">
          <p className="font-semibold text-muted-foreground">📋 CSV 格式说明</p>
          <p>推荐字段（按顺序）：</p>
          <code className="block bg-background rounded-lg px-3 py-2 text-[11px] leading-relaxed overflow-x-auto whitespace-pre">
            date,type,amount,category_parent,category_name,note
            2026-07-01,expense,25.80,美食,堂食,午餐
            2026-07-01,income,5000,工资收入,,7月工资
          </code>
          <ul className="space-y-1 text-muted-foreground break-words">
            <li>• <strong>date</strong> — 日期，格式 YYYY-MM-DD</li>
            <li>• <strong>type</strong> — expense 或 income（也支持中文"支出"/"收入"）</li>
            <li>• <strong>amount</strong> — 金额（正数，支出请用负数或靠 type 区分）</li>
            <li>• <strong>category_parent</strong> — 大类名称（如"美食"），留空则仅按中类匹配</li>
            <li>• <strong>category_name</strong> — 中类名称（如"堂食"）</li>
            <li>• <strong>note</strong> — 备注，可选</li>
          </ul>
        </div>

        <div>
          <label className="block text-xs font-semibold mb-2 text-muted-foreground flex items-center gap-1.5">
            <FileSpreadsheet size={14} />
            📄 选择 CSV 文件
          </label>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile}
            className="text-sm file:mr-3 file:py-1.5 file:px-4 file:rounded-[10px] file:border-0 file:text-sm file:font-semibold file:text-primary-foreground file:bg-primary file:hover:brightness-110 file:transition-all file:cursor-pointer" />
        </div>

        {preview && (
          <>
            <div className="animate-in slide-up fill-both">
              <p className="text-xs font-semibold mb-2 text-muted-foreground">🔗 字段映射</p>
              <div className="space-y-2">
                {fields.map(f => (
                  <div key={f.key} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm">
                    <span className="sm:w-32 text-muted-foreground">
                      {f.label} {f.required && <span className="text-destructive">*</span>}
                    </span>
                    <select value={mapping[f.key] ?? ''}
                      onChange={e => setMapping(m => ({ ...m, [f.key]: e.target.value !== '' ? Number(e.target.value) : undefined }))}
                      className="flex-1 bg-muted rounded-lg px-3 py-1.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all">
                      <option value="">- 不导入 -</option>
                      {preview.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="animate-in slide-up fill-both">
              <p className="text-xs font-semibold mb-2 text-muted-foreground">👁️ 数据预览（前 5 行）</p>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="text-xs w-full border-collapse whitespace-nowrap">
                  <thead>
                    <tr>
                      {preview.headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left font-medium whitespace-nowrap text-muted-foreground border-b border-border">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, i) => (
                      <tr key={i}>
                        {preview.headers.map((h, j) => (
                          <td key={j} className="px-3 py-2 whitespace-nowrap border-b border-border/50">
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button onClick={handleImport} disabled={importing}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:brightness-110 transition-all active:scale-[0.97] disabled:opacity-50 shadow-sm flex items-center gap-2">
              <Upload size={14} />
              {importing ? '导入中...' : '🚀 开始导入'}
            </button>
          </>
        )}

        {result && (
          <div className={`p-3 rounded-xl text-sm animate-in slide-up fill-both ${
            result.errors?.length ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          }`}>
            <div className="flex items-center gap-2 font-medium mb-1">
              {result.errors?.length ? <AlertCircle size={14} /> : <CheckCircle size={14} />}
              <span>成功导入 {result.imported} 条记录</span>
            </div>
            {result.errors?.length > 0 && (
              <div className="mt-2 space-y-0.5 text-xs">
                <p>错误：</p>
                {result.errors.map((e, i) => (
                  <p key={i}>第 {e.row} 行: {e.error}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
