import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Tags, Plus, X } from 'lucide-react'

const emojis = ['🍱', '🚗', '🏠', '👕', '📱', '💊', '🎮', '📚', '✈️', '🎁', '💄', '🏋️', '🐱', '💼', '🏦', '💰', '📦', '🛒']

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', icon: '📦', type: 'expense' })

  useEffect(() => { loadCategories() }, [])

  async function loadCategories() {
    const res = await api.getCategories()
    setCategories(res.data)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name) return
    await api.createCategory(form)
    setForm({ name: '', icon: '📦', type: 'expense' })
    setShowForm(false)
    loadCategories()
  }

  async function handleDelete(id) {
    if (!confirm('确定删除此分类？')) return
    await api.deleteCategory(id)
    loadCategories()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between animate-in slide-up fill-both">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Tags size={18} className="text-primary" />
          </div>
          <h1 className="text-lg font-bold">🏷️ 分类管理</h1>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:brightness-110 transition-all active:scale-[0.97] shadow-sm flex items-center gap-1.5">
          <Plus size={14} />
          {showForm ? '取消' : '➕ 添加'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card-strong rounded-2xl p-5 space-y-3 animate-in slide-up fill-both">
          <div className="flex p-1 rounded-xl bg-muted">
            {['expense', 'income'].map(t => (
              <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                className={`flex-1 py-2 rounded-[10px] text-sm font-semibold transition-all duration-200 ${form.type === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'}`}>
                {t === 'expense' ? '💸 支出' : '💰 收入'}
              </button>
            ))}
          </div>
          <div className="flex gap-3">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="分类名称" required
              className="flex-1 bg-muted rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all" />
            <select value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
              className="w-20 bg-muted rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all text-center">
              {emojis.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <button type="submit"
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:brightness-110 transition-all active:scale-[0.97] shadow-sm">
            ✅ 创建
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {['expense', 'income'].map(type => (
          <div key={type} className="animate-in slide-up fill-both"
            style={{ animationDelay: type === 'expense' ? '0ms' : '100ms' }}>
            <h3 className="text-xs font-semibold mb-2 px-1"
              style={{ color: type === 'expense' ? 'hsl(var(--destructive))' : 'hsl(var(--primary))' }}>
              {type === 'expense' ? '💸 支出分类' : '💰 收入分类'}
            </h3>
            <div className="space-y-1.5">
              {categories.filter(c => c.type === type).map((c, i) => (
                <div key={c.id}
                  className="glass-card rounded-2xl px-4 py-2.5 flex items-center justify-between text-sm transition-all hover:bg-accent/30"
                  style={{ animationDelay: `${type === 'expense' ? i : i} * 30ms` }}>
                  <span>{c.icon} {c.name}</span>
                  <button onClick={() => handleDelete(c.id)}
                    className="text-muted-foreground hover:text-destructive transition-all">
                    <X size={12} />
                  </button>
                </div>
              ))}
              {!categories.filter(c => c.type === type).length && (
                <p className="text-xs py-3 text-muted-foreground">
                  {type === 'expense' ? '💸 暂无支出分类' : '💰 暂无收入分类'}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
