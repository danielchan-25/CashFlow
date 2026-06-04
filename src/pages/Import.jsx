import { useState, useRef } from 'react'
import { api } from '../lib/api'
import { parseCSV } from '../lib/csv'
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react'

const fields = [
  { key: 'date', label: '日期', required: true },
  { key: 'type', label: '类型(expense/income)', required: true },
  { key: 'amount', label: '金额', required: true },
  { key: 'account_name', label: '账户名称', required: true },
  { key: 'category_name', label: '分类名称' },
  { key: 'note', label: '备注' },
]

export default function Import() {
  const [preview, setPreview] = useState(null)
  const [mapping, setMapping] = useState({})
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef()

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      const { headers, rows } = parseCSV(ev.target.result)
      setPreview({ headers, rows: rows.slice(0, 5) })
      const guess = {}
      const headerLower = headers.map(h => h.toLowerCase())
      fields.forEach(f => {
        const idx = headerLower.findIndex(h => h.includes(f.key.replace('_', '').toLowerCase()))
        if (idx >= 0) guess[f.key] = idx
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
    <div className="max-w-3xl mx-auto space-y-4 relative">
      <div className="flex items-center gap-3 animate-in slide-up fill-both">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Upload size={18} className="text-primary" />
        </div>
        <h1 className="text-lg font-bold">📥 导入 CSV</h1>
      </div>

      <div className="glass-card-strong rounded-2xl p-5 space-y-4">
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
                  <div key={f.key} className="flex items-center gap-2 text-sm">
                    <span className="w-24 shrink-0 text-muted-foreground">
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
              <div className="overflow-auto -mx-5 px-5">
                <table className="text-xs w-full border-collapse">
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
