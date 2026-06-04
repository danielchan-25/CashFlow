import { ChevronLeft, ChevronRight } from 'lucide-react'
import { formatMoney } from '../lib/utils'

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日']

function buildCalendar(monthStr) {
  const [y, m] = monthStr.split('-').map(Number)
  const first = new Date(y, m - 1, 1)
  const last = new Date(y, m, 0)
  const daysInMonth = last.getDate()
  const startDow = first.getDay()
  const startOffset = startDow === 0 ? 6 : startDow - 1

  const cells = []
  for (let i = 0; i < startOffset; i++) {
    cells.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d)
  }
  while (cells.length % 7 !== 0) {
    cells.push(null)
  }
  return cells
}

function prevMonth(monthStr) {
  const [y, m] = monthStr.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonth(monthStr) {
  const [y, m] = monthStr.split('-').map(Number)
  const d = new Date(y, m, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CalendarView({ month, daily = [], onMonthChange }) {
  const cells = buildCalendar(month)
  const today = todayStr()

  const dailyMap = {}
  daily.forEach(d => { dailyMap[d.date] = d })

  const label = `${month.slice(0, 4)} 年 ${Number(month.slice(5))} 月`

  return (
    <div className="glass-card rounded-2xl p-4 animate-in slide-up fill-both">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => onMonthChange(prevMonth(month))}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <ChevronLeft size={14} />
        </button>
        <h3 className="text-sm font-semibold">📅 {label}</h3>
        <button onClick={() => onMonthChange(nextMonth(month))}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, i) => {
          if (!day) {
            return <div key={`e-${i}`} className="aspect-square" />
          }

          const dateStr = `${month}-${String(day).padStart(2, '0')}`
          const dd = dailyMap[dateStr]
          const isToday = dateStr === today
          const hasIncome = dd && Number(dd.income) > 0
          const hasExpense = dd && Number(dd.expense) > 0

          return (
            <div key={dateStr}
              className={`relative flex flex-col items-center justify-center rounded-xl transition-all duration-200 aspect-square p-0.5 ${
                isToday ? 'ring-2 ring-primary/40 bg-primary/5' : ''
              }`}>
              <span className={`text-xs font-medium leading-none ${isToday ? 'text-primary' : 'text-foreground'}`}>
                {day}
              </span>
              {hasIncome && (
                <span className="text-[7px] leading-tight text-[hsl(var(--income))] font-medium truncate max-w-full px-0.5 mt-0.5">
                  ¥{formatMoney(dd.income)}
                </span>
              )}
              {hasExpense && (
                <span className="text-[7px] leading-tight text-[hsl(var(--expense))] font-medium truncate max-w-full px-0.5">
                  ¥{formatMoney(dd.expense)}
                </span>
              )}
              {!hasIncome && !hasExpense && (
                <span className="text-[7px] leading-tight text-muted-foreground/30 mt-0.5">-</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
