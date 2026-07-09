import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Lock, Sun, Moon, Monitor } from 'lucide-react'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { login, hasPassword } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const themeIcons = { light: <Sun size={16} />, dark: <Moon size={16} />, system: <Monitor size={16} /> }
  const nextTheme = { light: 'dark', dark: 'system', system: 'light' }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    }
    setBusy(false)
  }

  if (!hasPassword) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full" style={{ background: 'hsl(var(--income) / 0.08)', filter: 'blur(80px)' }} />
        <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full" style={{ background: 'hsl(var(--expense) / 0.06)', filter: 'blur(80px)' }} />

        <div className="w-full max-w-sm animate-fade-in-scale">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/25 animate-glass-float">
              <span className="text-4xl">💸</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">CashFlow</h1>
            <p className="text-sm mt-1 text-muted-foreground">个人记账</p>
          </div>

          <form onSubmit={handleSubmit} className="glass-card-strong rounded-2xl p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold mb-1.5 px-1 text-muted-foreground">
                🔑 设置访问密码
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="输入密码"
                  autoFocus
                  className="w-full bg-muted rounded-xl pl-9 pr-4 py-3 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all duration-200"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm font-medium px-1 text-destructive animate-in fade-in">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
            >
              {busy ? '设置中...' : '设置密码并进入'}
            </button>

            <p className="text-xs text-center text-muted-foreground">
              设置密码后，下次访问需要输入密码
            </p>
          </form>

          <button type="button" onClick={() => navigate('/', { replace: true })}
            className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground transition-colors">
            跳过，下次再说
          </button>

          <button onClick={() => setTheme(nextTheme[theme])}
            className="mx-auto mt-6 w-10 h-10 rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
            {themeIcons[theme]}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full" style={{ background: 'hsl(var(--income) / 0.08)', filter: 'blur(80px)' }} />
      <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full" style={{ background: 'hsl(var(--expense) / 0.06)', filter: 'blur(80px)' }} />

      <div className="w-full max-w-sm animate-fade-in-scale">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/25 animate-glass-float">
            <span className="text-4xl">💸</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">CashFlow</h1>
          <p className="text-sm mt-1 text-muted-foreground">个人记账</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card-strong rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold mb-1.5 px-1 text-muted-foreground">
              🔑 访问密码
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="输入密码"
                autoFocus
                className="w-full bg-muted rounded-xl pl-9 pr-4 py-3 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all duration-200"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm font-medium px-1 text-destructive animate-in fade-in">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
          >
            {busy ? '验证中...' : '进入'}
          </button>
        </form>

        <button onClick={() => setTheme(nextTheme[theme])}
          className="mx-auto mt-6 w-10 h-10 rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
          {themeIcons[theme]}
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-background relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full" style={{ background: 'hsl(var(--income) / 0.08)', filter: 'blur(80px)' }} />
      <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full" style={{ background: 'hsl(var(--expense) / 0.06)', filter: 'blur(80px)' }} />

      <div className="w-full max-w-sm animate-fade-in-scale">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-5 shadow-lg shadow-primary/25 animate-glass-float">
            <span className="text-4xl">💸</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">CashFlow</h1>
          <p className="text-sm mt-1 text-muted-foreground">个人记账</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card-strong rounded-2xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold mb-1.5 px-1 text-muted-foreground">
              🔑 访问密码
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="输入密码或留空"
                autoFocus
                className="w-full bg-muted rounded-xl pl-9 pr-4 py-3 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-primary transition-all duration-200"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm font-medium px-1 text-destructive animate-in fade-in">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm"
          >
            {busy ? '验证中...' : '进入'}
          </button>

          <p className="text-xs text-center text-muted-foreground">
            首次使用无需密码，直接点击进入
          </p>
        </form>

        <button onClick={() => setTheme(nextTheme[theme])}
          className="mx-auto mt-6 w-10 h-10 rounded-full glass-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
          {themeIcons[theme]}
        </button>
      </div>
    </div>
  )
}
