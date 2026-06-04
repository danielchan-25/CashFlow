import { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const navItems = [
  { to: '/', label: '📝 记账', end: true },
  { to: '/transactions', label: '📊 概览' },
  { to: '/accounts', label: '🏦 账户' },
  { to: '/categories', label: '🏷️ 分类' },
]

const moreItems = [
  { to: '/import', label: '📥 导入' },
  { to: '/export', label: '📤 导出' },
]

function Sidebar() {
  const { theme, setTheme } = useTheme()
  const { logout } = useAuth()

  const nextTheme = { light: 'dark', dark: 'system', system: 'light' }
  const themeLabel = { light: '浅色', dark: '深色', system: '系统' }
  const themeIcon = { light: <Sun size={16} />, dark: <Moon size={16} />, system: <Monitor size={16} /> }

  return (
    <aside className="hidden md:flex md:flex-col md:w-60 lg:w-64 h-dvh sidebar shrink-0">
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
            <span className="text-base leading-none">💸</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">CashFlow</h1>
            <p className="text-[10px] text-muted-foreground">个人记账</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group">
            {({ isActive }) => (
              <>
                <span className={`transition-colors duration-200 ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground group-hover:text-foreground'}`}>
                  {label}
                </span>
                {isActive && (
                  <span className="ml-auto w-1 h-5 rounded-full bg-primary" />
                )}
              </>
            )}
          </NavLink>
        ))}
        <div className="border-t border-border/40 my-2" />
        {moreItems.map(({ to, label }) => (
          <NavLink key={to} to={to}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group">
            {({ isActive }) => (
              <>
                <span className={`transition-colors duration-200 ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground group-hover:text-foreground'}`}>
                  {label}
                </span>
                {isActive && (
                  <span className="ml-auto w-1 h-5 rounded-full bg-primary" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 pt-2 space-y-1 border-t border-border/40">
        <button
          onClick={() => setTheme(nextTheme[theme])}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-accent group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground group-hover:text-foreground bg-transparent group-hover:bg-accent transition-all duration-200">
            {themeIcon[theme]}
          </div>
          <span>🎨 主题 ({themeLabel[theme]})</span>
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all duration-200 text-muted-foreground hover:text-destructive hover:bg-destructive/10 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground group-hover:text-destructive bg-transparent group-hover:bg-destructive/10 transition-all duration-200">
            <LogOut size={16} />
          </div>
          <span>🚪 退出登录</span>
        </button>
      </div>
    </aside>
  )
}

function BottomTabBar() {
  const { theme, setTheme } = useTheme()
  const { logout } = useAuth()
  const [showMore, setShowMore] = useState(false)
  const moreRef = useRef(null)

  const nextTheme = { light: 'dark', dark: 'system', system: 'light' }

  useEffect(() => {
    function handleClick(e) {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setShowMore(false)
      }
    }
    if (showMore) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [showMore])

  const moreItems = [
    { to: '/import', label: '📥 导入' },
    { to: '/export', label: '📤 导出' },
    { type: 'divider' },
    { type: 'theme', label: '🎨 主题' },
    { type: 'logout', label: '🚪 退出' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-tabbar">
      {showMore && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
          <div ref={moreRef} className="absolute bottom-full left-0 right-0 z-50 px-3 pb-2 animate-in slide-up fill-both">
            <div className="bg-card rounded-2xl overflow-hidden border border-border/50 shadow-lg">
              {moreItems.map((item, i) => {
                if (item.type === 'divider') {
                  return <div key={i} className="h-px bg-border/40 mx-3" />
                }
                if (item.type === 'theme') {
                  return (
                    <button key={i} onClick={() => { setTheme(nextTheme[theme]); setShowMore(false) }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-foreground hover:bg-accent/50 transition-all duration-200 active:scale-[0.98]">
                      <span>{item.label}</span>
                      <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {theme === 'light' ? '浅色' : theme === 'dark' ? '深色' : '跟随系统'}
                      </span>
                    </button>
                  )
                }
                if (item.type === 'logout') {
                  return (
                    <button key={i} onClick={() => { logout(); setShowMore(false) }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-all duration-200 active:scale-[0.98]">
                      <span>{item.label}</span>
                    </button>
                  )
                }
                return (
                  <NavLink key={item.to} to={item.to} onClick={() => setShowMore(false)}
                    className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-foreground hover:bg-accent/50 transition-all duration-200 active:scale-[0.98]">
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        </>
      )}
      <div className="max-w-lg mx-auto flex items-center justify-around h-16 px-2">
        {navItems.map(({ to, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className="flex flex-col items-center gap-0.5 relative py-1 group min-w-0 flex-1">
            {({ isActive }) => (
              <>
                <span className={`text-[11px] font-medium transition-colors duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                  {label}
                </span>
                {isActive && (
                  <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary animate-in fade-in" />
                )}
              </>
            )}
          </NavLink>
        ))}
        <button onClick={() => setShowMore(v => !v)}
          className="flex flex-col items-center gap-0.5 relative py-1 group min-w-0 flex-1">
          <span className={`text-[11px] font-medium transition-colors duration-300 ${showMore ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
            ⚙️ 更多
          </span>
          {showMore && (
            <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary animate-in fade-in" />
          )}
        </button>
      </div>
    </nav>
  )
}

export default function Layout() {
  return (
    <div className="min-h-dvh bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 pb-24 md:pb-8 pt-5 animate-in min-h-dvh">
        <Outlet />
      </main>
      <BottomTabBar />
    </div>
  )
}
