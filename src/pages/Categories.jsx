import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { categoriesData } from '../data/categories'
import { Tags, Plus, X, ChevronDown, ChevronRight, Upload } from 'lucide-react'

const expenseEmojis = ['🍱','🚗','🏠','👕','📱','💊','🎮','📚','✈️','🎁','💄','🏋️','🐱','💼','🛒','🍜','☕','🎬','🎵','🐾','🍪','🍻','🧴','🚌','🚘','🏢','💡','🔑','🛋️','🏨','🎯','📋','📞','☁️','🎤','🖨️','🏥','💆','🧧','🏡','🎓','📖','🏕️','🔒','🌸','🐶','🔗','💉','🩺','💇','🍽️','🥡','🍳','🚇','🚄','🚕','⛽','🅿️','🔧','🛣️','🎫','🤖','🍎','🌐','🖥️','🍖','🪣','🛏️','🔒']
const incomeEmojis = ['💰','💳','🏦','💵','💶','💷','💸','💎','👑','🧧','📈','🏢','💼','🎯','⭐','🔄','🏪','🛍️','🎉','🏆']

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', icon: '📦', type: 'expense', parent_id: '' })
  const [expanded, setExpanded] = useState({})
  const [loadError, setLoadError] = useState('')
  const [editingIcon, setEditingIcon] = useState(null)
  const pickerRef = useRef(null)

  useEffect(() => { loadCategories() }, [])

  useEffect(() => {
    function handleClick(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setEditingIcon(null)
      }
    }
    if (editingIcon) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [editingIcon])

  async function loadCategories() {
    try {
      setLoadError('')
      const res = await api.getCategories()
      if (res.data) setCategories(res.data)
      else setCategories([])
    } catch (err) {
      setLoadError('加载失败：' + err.message)
      console.error('加载分类失败', err)
    }
  }

  function buildTree(type) {
    const map = {}
    const roots = []
    categories.filter(c => c.type === type).forEach(c => { map[c.id] = { ...c, children: [] } })
    categories.filter(c => c.type === type).forEach(c => {
      if (c.parent_id != null && c.parent_id !== '' && map[c.parent_id]) {
        map[c.parent_id].children.push(map[c.id])
      } else if (c.parent_id == null || c.parent_id === '') {
        roots.push(map[c.id])
      }
    })
    return roots
  }

  function flattenTree(nodes, depth = 0) {
    if (depth > 10) return []
    const result = []
    for (const node of nodes) {
      result.push({ id: node.id, name: node.name, icon: node.icon, depth })
      result.push(...flattenTree(node.children, depth + 1))
    }
    return result
  }

  function renderTree(nodes, depth = 0) {
    if (depth > 10) return <p className="text-xs text-muted-foreground py-2">⚠️ 分类层级过深</p>
    return nodes.map(node => (
      <div key={node.id}>
        <div
          className="glass-card rounded-2xl px-3 sm:px-4 py-2.5 flex items-center justify-between text-sm transition-all hover:bg-accent/30 cursor-pointer"
          style={{ marginLeft: Math.min(depth * 16, 64) }}
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
            <span className="truncate">
              <button onClick={e => { e.stopPropagation(); setEditingIcon(node.id) }}
                className="inline hover:scale-110 transition-transform active:scale-95 cursor-pointer">
                {node.icon}
              </button>
              {node.name}
            </span>
          </div>
          <button onClick={e => { e.stopPropagation(); handleDelete(node.id) }}
            className="text-muted-foreground hover:text-destructive transition-all shrink-0 ml-2">
            <X size={12} />
          </button>
        </div>
        {editingIcon === node.id && (
          <div ref={pickerRef} className="ml-8 mb-2 p-2 glass-card rounded-xl max-h-32 overflow-y-auto flex flex-wrap gap-1"
            style={{ marginLeft: Math.min((depth + 1) * 16 + 4, 72) }}>
            {(node.type === 'income' ? incomeEmojis : expenseEmojis).map(e => (
              <button key={e} onClick={() => handleIconChange(node.id, e)}
                className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm hover:bg-accent transition-all ${node.icon === e ? 'ring-2 ring-primary' : ''}`}>
                {e}
              </button>
            ))}
          </div>
        )}
        {node.children.length > 0 && expanded[node.id] && renderTree(node.children, depth + 1)}
      </div>
    ))
  }

  const emojis = form.type === 'expense' ? expenseEmojis : incomeEmojis
  const parentOptions = flattenTree(buildTree(form.type))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name) return
    try {
      await api.createCategory({
        name: form.name,
        icon: form.icon || '📦',
        type: form.type,
        parent_id: form.parent_id || null,
      })
    } catch (err) {
      alert('创建失败：' + err.message)
      return
    }
    setForm({ name: '', icon: '📦', type: 'expense', parent_id: '' })
    setShowForm(false)
    loadCategories()
  }

  async function handleIconChange(id, newIcon) {
    try {
      await api.updateCategory(id, { icon: newIcon })
      setEditingIcon(null)
      await loadCategories()
    } catch (err) {
      alert('修改图标失败：' + err.message)
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteCategory(id)
      loadCategories()
    } catch (err) {
      if (err.message === 'has_children') {
        alert('此分类下有子分类，请先删除子分类')
      } else if (err.message === 'has_transactions') {
        alert('此分类下有交易记录，无法删除')
      } else {
        alert('删除失败：' + err.message)
      }
    }
  }

  async function handleImport() {
    if (!confirm('将清空所有分类和交易记录，从 categories.js 重新导入，确定？')) return
    try {
      await api.importCategories(categoriesData)
      await loadCategories()
      alert('✅ 导入成功')
    } catch (err) {
      alert('导入失败：' + err.message)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 animate-in slide-up fill-both">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Tags size={18} className="text-primary" />
          </div>
          <h1 className="text-base sm:text-lg font-bold">🏷️ 分类管理</h1>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={handleImport}
            className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-muted text-muted-foreground hover:bg-accent transition-all active:scale-[0.97] flex items-center gap-1">
            <Upload size={13} />
            <span className="hidden sm:inline">🔄 重新导入</span>
            <span className="sm:hidden">导入</span>
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-primary-foreground bg-primary hover:brightness-110 transition-all active:scale-[0.97] shadow-sm flex items-center gap-1">
            <Plus size={13} />
            {showForm ? '取消' : <><span className="hidden sm:inline">➕ 添加</span><span className="sm:hidden">添加</span></>}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="p-3 rounded-xl text-sm bg-destructive/10 text-destructive animate-in slide-up fill-both">
          ⚠️ {loadError}
        </div>
      )}

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

          <div className="grid grid-cols-[8fr_2fr] gap-3">
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="分类名称" required
              className="w-full bg-muted rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all min-w-0" />
            <select value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
              className="w-full bg-muted rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all text-center min-w-0">
              {emojis.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <select value={form.parent_id} onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
            className="w-full bg-muted rounded-lg px-3.5 py-2.5 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all">
            <option value="">📂 顶级分类（大类）</option>
            {parentOptions.map(c => (
              <option key={c.id} value={c.id}>
                {'　'.repeat(c.depth + 1)}{c.icon} {c.name}
              </option>
            ))}
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
