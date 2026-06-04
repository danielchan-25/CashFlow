import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { Tags, Plus, X, ChevronDown, ChevronRight } from 'lucide-react'

const expenseEmojis = ['🍱','🚗','🏠','👕','📱','💊','🎮','📚','✈️','🎁','💄','🏋️','🐱','💼','🛒','🍜','☕','🎬','🎵','🐾','🍪','🍻','🧴','🚌','🚘','🏢','💡','🔑','🛋️','🏨','🎯','📋','📞','☁️','🎤','🖨️','🏥','💆','🧧','🏡','🎓','📖','🏕️','🔒','🌸','🐶','🔗','💉','🩺','💇','🍽️','🥡','🍳','🚇','🚄','🚕','⛽','🅿️','🔧','🛣️','🎫','🤖','🍎','🌐','🖥️','🍖','🪣','🛏️','🔒']
const incomeEmojis = ['💰','💳','🏦','💵','💶','💷','💸','💎','👑','🧧','📈','🏢','💼','🎯','⭐','🔄','🏪','🛍️','🎉','🏆']

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', icon: '📦', type: 'expense', parent_id: '' })
  const [expanded, setExpanded] = useState({})

  useEffect(() => { loadCategories() }, [])

  async function loadCategories() {
    const res = await api.getCategories()
    setCategories(res.data)
  }

  function buildTree(type) {
    const map = {}
    const roots = []
    categories.filter(c => c.type === type).forEach(c => { map[c.id] = { ...c, children: [] } })
    categories.filter(c => c.type === type).forEach(c => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].children.push(map[c.id])
      } else if (!c.parent_id) {
        roots.push(map[c.id])
      }
    })
    return roots
  }

  function renderTree(nodes, depth = 0) {
    return nodes.map(node => (
      <div key={node.id}>
        <div
          className="glass-card rounded-2xl px-4 py-2.5 flex items-center justify-between text-sm transition-all hover:bg-accent/30 cursor-pointer"
          style={{ marginLeft: depth * 20 }}
          onClick={() => {
            if (node.children.length > 0) {
              setExpanded(p => ({ ...p, [node.id]: !p[node.id] }))
            }
          }}>
          <div className="flex items-center gap-2 min-w-0">
            {node.children.length > 0 ? (
              expanded[node.id] ? <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
                : <ChevronRight size={14} className="shrink-0 text-muted-foreground" />
            ) : <span className="w-3.5 shrink-0" />}
            <span className="truncate">{node.icon} {node.name}</span>
          </div>
          <button onClick={e => { e.stopPropagation(); handleDelete(node.id) }}
            className="text-muted-foreground hover:text-destructive transition-all shrink-0 ml-2">
            <X size={12} />
          </button>
        </div>
        {node.children.length > 0 && expanded[node.id] && renderTree(node.children, depth + 1)}
      </div>
    ))
  }

  const emojis = form.type === 'expense' ? expenseEmojis : incomeEmojis
  const rootCats = categories.filter(c => !c.parent_id && c.type === form.type)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name) return
    await api.createCategory({
      name: form.name,
      icon: form.icon || '📦',
      type: form.type,
      parent_id: form.parent_id || null,
    })
    setForm({ name: '', icon: '📦', type: 'expense', parent_id: '' })
    setShowForm(false)
    loadCategories()
  }

  async function handleDelete(id) {
    try {
      await api.deleteCategory(id)
      loadCategories()
    } catch (err) {
      const msg = await err.response?.json().catch(() => ({}))
      if (msg.error === 'has_children') {
        alert('此分类下有子分类，请先删除子分类')
      } else {
        alert('删除失败：' + err.message)
      }
    }
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
              <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t, parent_id: '' }))}
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

          <select value={form.parent_id} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
            className="w-full bg-muted rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all">
            <option value="">📂 顶级分类（大类）</option>
            {rootCats.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>

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
              {(() => {
                const tree = buildTree(type)
                if (tree.length === 0) return (
                  <p className="text-xs py-3 text-muted-foreground">
                    {type === 'expense' ? '💸 暂无支出分类' : '💰 暂无收入分类'}
                  </p>
                )
                return renderTree(tree)
              })()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
