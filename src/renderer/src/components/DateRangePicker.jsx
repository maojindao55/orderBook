import React, { useState, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from 'lucide-react'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import dayjs from 'dayjs'

export default function DateRangePicker({
  startDate,
  endDate,
  onDateChange,
  className = '',
}) {
  const [open, setOpen] = useState(false)

  // Current calendar view (year & month, 0-indexed for month)
  const initialYear = startDate ? dayjs(startDate).year() : dayjs().year()
  const initialMonth = startDate ? dayjs(startDate).month() : dayjs().month()
  const [viewYear, setViewYear] = useState(initialYear)
  const [viewMonth, setViewMonth] = useState(initialMonth)

  // Temporary selection inside popover
  const [tempStart, setTempStart] = useState(startDate)
  const [tempEnd, setTempEnd] = useState(endDate)
  const [hoverDate, setHoverDate] = useState(null)

  useEffect(() => {
    setTempStart(startDate)
    setTempEnd(endDate)
    if (startDate) {
      setViewYear(dayjs(startDate).year())
      setViewMonth(dayjs(startDate).month())
    }
  }, [startDate, endDate, open])

  // Presets
  const presets = [
    {
      label: '全部时间',
      getRange: () => ({ start: '', end: '' }),
    },
    {
      label: '本月商单',
      getRange: () => ({
        start: dayjs().startOf('month').format('YYYY-MM-DD'),
        end: dayjs().endOf('month').format('YYYY-MM-DD'),
      }),
    },
    {
      label: '上月商单',
      getRange: () => ({
        start: dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
        end: dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD'),
      }),
    },
    {
      label: '近 30 天',
      getRange: () => ({
        start: dayjs().subtract(30, 'day').format('YYYY-MM-DD'),
        end: dayjs().format('YYYY-MM-DD'),
      }),
    },
    {
      label: '近 90 天',
      getRange: () => ({
        start: dayjs().subtract(90, 'day').format('YYYY-MM-DD'),
        end: dayjs().format('YYYY-MM-DD'),
      }),
    },
    {
      label: '2026 年度',
      getRange: () => ({ start: '2026-01-01', end: '2026-12-31' }),
    },
    {
      label: '2023 历史归档',
      getRange: () => ({ start: '2023-01-01', end: '2023-12-31' }),
    },
  ]

  const handleApplyPreset = (preset) => {
    const { start, end } = preset.getRange()
    onDateChange(start, end)
    setTempStart(start)
    setTempEnd(end)
    setOpen(false)
  }

  // Days in month calculation
  const firstDayOfMonth = dayjs(`${viewYear}-${viewMonth + 1}-01`)
  const daysInMonth = firstDayOfMonth.daysInMonth()
  // Monday as first day of week: (firstDayOfMonth.day() + 6) % 7
  const startDayOfWeek = (firstDayOfMonth.day() + 6) % 7

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

  const handleDayClick = (day) => {
    const formatted = dayjs(`${viewYear}-${viewMonth + 1}-${day}`).format('YYYY-MM-DD')

    if (!tempStart || (tempStart && tempEnd)) {
      // Start new selection
      setTempStart(formatted)
      setTempEnd('')
    } else if (tempStart && !tempEnd) {
      if (dayjs(formatted).isBefore(dayjs(tempStart))) {
        setTempStart(formatted)
        setTempEnd(tempStart)
      } else {
        setTempEnd(formatted)
      }
    }
  }

  const handleConfirm = () => {
    onDateChange(tempStart, tempEnd)
    setOpen(false)
  }

  const handleClear = () => {
    onDateChange('', '')
    setTempStart('')
    setTempEnd('')
    setOpen(false)
  }

  // Trigger button label
  const getButtonText = () => {
    if (!startDate && !endDate) return '全部发布日期'
    if (startDate && !endDate) return `${startDate} 起`
    if (!startDate && endDate) return `至 ${endDate}`
    if (startDate === endDate) return startDate
    return `${startDate} ~ ${endDate}`
  }

  const availableYears = [2027, 2026, 2025, 2024, 2023, 2022]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`h-8 inline-flex items-center gap-2 rounded-md border border-input bg-background px-2.5 text-xs text-foreground shadow-xs hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer select-none ${
            startDate || endDate ? 'border-primary/50 text-primary font-medium' : ''
          } ${className}`}
        >
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span>{getButtonText()}</span>
          {(startDate || endDate) && (
            <span
              role="button"
              className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation()
                handleClear()
              }}
              title="清空日期"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto p-0 rounded-xl overflow-hidden shadow-2xl border"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Left Presets Sidebar */}
          <div className="w-32 border-r bg-muted/30 p-2 space-y-1 shrink-0 text-xs">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              快捷周期
            </div>
            {presets.map((preset) => {
              const { start, end } = preset.getRange()
              const isSelected = tempStart === start && tempEnd === end
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>

          {/* Right Visual Calendar Area */}
          <div className="p-3.5 w-[280px]">
            {/* Header: Year, Month & Navigation */}
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

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Empty leading offset */}
              {Array.from({ length: startDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-7 w-7" />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = dayjs(`${viewYear}-${viewMonth + 1}-${day}`).format('YYYY-MM-DD')
                const isStart = tempStart === dateStr
                const isEnd = tempEnd === dateStr
                const inRange =
                  tempStart &&
                  tempEnd &&
                  dayjs(dateStr).isAfter(dayjs(tempStart)) &&
                  dayjs(dateStr).isBefore(dayjs(tempEnd))
                const inHoverRange =
                  tempStart &&
                  !tempEnd &&
                  hoverDate &&
                  dayjs(dateStr).isAfter(dayjs(tempStart)) &&
                  (dayjs(dateStr).isBefore(dayjs(hoverDate)) || dateStr === hoverDate)

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDayClick(day)}
                    onMouseEnter={() => setHoverDate(dateStr)}
                    onMouseLeave={() => setHoverDate(null)}
                    className={`h-7 w-7 text-xs rounded-md flex items-center justify-center transition-all cursor-pointer font-medium ${
                      isStart || isEnd
                        ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                        : inRange || inHoverRange
                        ? 'bg-primary/15 text-primary font-semibold rounded-none first:rounded-l-md last:rounded-r-md'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            {/* Footer with summary and buttons */}
            <div className="mt-3.5 pt-2.5 border-t flex items-center justify-between text-xs">
              <div className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                {tempStart ? (
                  <span>
                    {tempStart} {tempEnd ? `~ ${tempEnd}` : '(请选结束日)'}
                  </span>
                ) : (
                  <span>点选起始与截止日</span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[11px]"
                  onClick={handleClear}
                >
                  清空
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-6 px-2.5 text-[11px] gap-1"
                  onClick={handleConfirm}
                  disabled={!tempStart}
                >
                  <Check className="h-3 w-3" />
                  确定
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
