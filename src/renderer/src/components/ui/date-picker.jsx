import React, { useState, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from './popover'
import { Button } from './button'
import dayjs from 'dayjs'

export function DatePicker({
  value,
  onChange,
  placeholder = '请选择日期',
  className = '',
  allowClear = true,
}) {
  const [open, setOpen] = useState(false)

  // Calendar view year and month
  const initialYear = value ? dayjs(value).year() : dayjs().year()
  const initialMonth = value ? dayjs(value).month() : dayjs().month()
  const [viewYear, setViewYear] = useState(initialYear)
  const [viewMonth, setViewMonth] = useState(initialMonth)

  useEffect(() => {
    if (value) {
      setViewYear(dayjs(value).year())
      setViewMonth(dayjs(value).month())
    }
  }, [value, open])

  // Calculation for calendar grid
  const firstDayOfMonth = dayjs(`${viewYear}-${viewMonth + 1}-01`)
  const daysInMonth = firstDayOfMonth.daysInMonth()
  const startDayOfWeek = (firstDayOfMonth.day() + 6) % 7 // Monday as first day

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1)
      setViewMonth(11)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1)
      setViewMonth(0)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const handleSelectDay = (day) => {
    const formatted = dayjs(`${viewYear}-${viewMonth + 1}-${day}`).format('YYYY-MM-DD')
    onChange(formatted)
    setOpen(false)
  }

  const handleSetToday = () => {
    const today = dayjs().format('YYYY-MM-DD')
    onChange(today)
    setViewYear(dayjs().year())
    setViewMonth(dayjs().month())
    setOpen(false)
  }

  const handleSetYesterday = () => {
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
    onChange(yesterday)
    setViewYear(dayjs(yesterday).year())
    setViewMonth(dayjs(yesterday).month())
    setOpen(false)
  }

  const handleClear = () => {
    onChange('')
    setOpen(false)
  }

  const availableYears = [2027, 2026, 2025, 2024, 2023, 2022]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={`relative flex items-center ${className}`}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors hover:bg-accent/40 focus:outline-none focus:ring-1 focus:ring-ring text-left cursor-pointer select-none ${
              !value ? 'text-muted-foreground' : 'text-foreground font-medium'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{value || placeholder}</span>
            </div>

            {value && allowClear ? (
              <span
                role="button"
                className="rounded-full p-0.5 hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
                title="清除日期"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </button>
        </PopoverTrigger>
      </div>

      <PopoverContent
        align="start"
        className="w-[280px] p-3 rounded-xl shadow-2xl border bg-popover"
      >
        {/* Header: Year & Month Selectors + Navigation */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <select
              value={viewYear}
              onChange={(e) => setViewYear(Number(e.target.value))}
              className="h-7 text-xs font-semibold rounded border border-input bg-transparent px-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>

            <select
              value={viewMonth}
              onChange={(e) => setViewMonth(Number(e.target.value))}
              className="h-7 text-xs font-semibold rounded border border-input bg-transparent px-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {i + 1}月
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 p-0"
              onClick={prevMonth}
              title="上个月"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 p-0"
              onClick={nextMonth}
              title="下个月"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1 text-[11px] font-medium text-muted-foreground">
          <span>一</span>
          <span>二</span>
          <span>三</span>
          <span>四</span>
          <span>五</span>
          <span>六</span>
          <span>日</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-7 w-7" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = dayjs(`${viewYear}-${viewMonth + 1}-${day}`).format('YYYY-MM-DD')
            const isSelected = value === dateStr
            const isToday = dayjs().format('YYYY-MM-DD') === dateStr

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={`h-7 w-7 text-xs rounded-md flex items-center justify-center transition-all cursor-pointer font-medium relative ${
                  isSelected
                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                    : isToday
                    ? 'border border-primary text-primary font-bold'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {day}
              </button>
            )
          })}
        </div>

        {/* Quick action buttons footer */}
        <div className="mt-3 pt-2 border-t flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleSetToday}
              className="px-2 py-0.5 rounded text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              今天
            </button>
            <button
              type="button"
              onClick={handleSetYesterday}
              className="px-2 py-0.5 rounded text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              昨天
            </button>
          </div>

          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="px-2 py-0.5 rounded text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              清空
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
