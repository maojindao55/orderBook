import React, { useEffect, useState } from 'react'
import {
  Clock,
  AlertCircle,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  RefreshCw,
  ReceiptText,
  Building2,
  Calendar,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import ReactECharts from 'echarts-for-react'
import { toast } from 'sonner'

export default function Dashboard({ onNavigateToOrders, onEditOrder }) {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    pendingAmount: 0,
    pendingCount: 0,
    rebateAmount: 0,
    rebateCount: 0,
    monthlyIncome: 0,
    totalIncome: 0,
    totalOrders: 0,
  })
  const [monthlyData, setMonthlyData] = useState([])
  const [statusDistribution, setStatusDistribution] = useState([])
  const [recentPending, setRecentPending] = useState([])

  const fetchData = async () => {
    if (!window.api?.getStats) return
    setLoading(true)
    try {
      const currentYear = new Date().getFullYear()
      const [statsRes, monthlyRes, statusRes, pendingOrdersRes] = await Promise.all([
        window.api.getStats(),
        window.api.getMonthlyIncome(currentYear),
        window.api.getStatusDistribution(),
        window.api.getOrders({ status: '待结款', page: 1, pageSize: 5 }),
      ])

      if (statsRes) setStats(statsRes)
      if (monthlyRes) setMonthlyData(monthlyRes)
      if (statusRes) setStatusDistribution(statusRes)
      if (pendingOrdersRes?.data) setRecentPending(pendingOrdersRes.data)
    } catch (err) {
      console.error(err)
      toast.error('加载看板数据失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const handleRefresh = () => fetchData()
    window.addEventListener('refreshData', handleRefresh)
    return () => window.removeEventListener('refreshData', handleRefresh)
  }, [])

  const formatCurrency = (val) => {
    return '¥' + Number(val || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // Monthly income bar chart config
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
  const monthLabels = months.map((m) => `${parseInt(m, 10)}月`)
  const monthValues = months.map((m) => {
    const found = monthlyData.find((item) => item.month === m)
    return found ? Number(found.amount) : 0
  })

  const isDarkMode = document.documentElement.classList.contains('dark')

  const barChartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
      borderColor: isDarkMode ? '#27272a' : '#e4e4e7',
      textStyle: { color: isDarkMode ? '#fafafa' : '#09090b', fontSize: 12 },
      formatter: (params) => {
        const item = params[0]
        return `<div class="p-1"><div class="font-medium text-xs text-muted-foreground">${item.name}已结收入</div><div class="font-bold text-sm mt-0.5">${formatCurrency(item.value)}</div></div>`
      },
    },
    grid: {
      top: '12%',
      left: '2%',
      right: '2%',
      bottom: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: monthLabels,
      axisLine: { lineStyle: { color: isDarkMode ? '#3f3f46' : '#e4e4e7' } },
      axisTick: { show: false },
      axisLabel: { color: isDarkMode ? '#a1a1aa' : '#71717a', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: isDarkMode ? '#27272a' : '#f4f4f5',
          type: 'dashed',
        },
      },
      axisLabel: {
        color: isDarkMode ? '#a1a1aa' : '#71717a',
        fontSize: 11,
        formatter: (val) => `¥${val}`,
      },
    },
    series: [
      {
        data: monthValues,
        type: 'bar',
        barWidth: '35%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: isDarkMode ? '#38bdf8' : '#0284c7',
        },
      },
    ],
  }

  // Status donut chart
  const statusColors = {
    已结款: '#10b981',
    待结款: '#f59e0b',
    需返点: '#ef4444',
    报备的: '#3b82f6',
    待确认: '#8b5cf6',
  }

  const pieChartOption = {
    tooltip: {
      trigger: 'item',
      backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
      borderColor: isDarkMode ? '#27272a' : '#e4e4e7',
      textStyle: { color: isDarkMode ? '#fafafa' : '#09090b', fontSize: 12 },
      formatter: '{b}: {c} 笔 ({d}%)',
    },
    legend: {
      bottom: '0%',
      left: 'center',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { color: isDarkMode ? '#a1a1aa' : '#71717a', fontSize: 11 },
    },
    series: [
      {
        name: '状态分布',
        type: 'pie',
        radius: ['52%', '75%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: isDarkMode ? '#09090b' : '#ffffff',
          borderWidth: 2,
        },
        label: { show: false },
        data: statusDistribution.map((item) => ({
          name: item.status || '未分类',
          value: item.count,
          itemStyle: { color: statusColors[item.status] || '#a1a1aa' },
        })),
      },
    ],
  }

  const handleQuickPay = async (orderId) => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      await window.api.updateOrder(orderId, {
        status: '已结款',
        settlement_date: today,
      })
      toast.success('已标记为结款')
      fetchData()
    } catch (err) {
      toast.error('操作失败: ' + err.message)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">数据看板</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            实时查看商单待结账款、返点跟踪与月度收益趋势
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: 待结款 */}
        <Card className="border shadow-sm hover:border-amber-400/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              待结款金额
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
              {formatCurrency(stats.pendingAmount)}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">未结款账单</span>
              <Badge variant="warning">{stats.pendingCount} 笔待催款</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: 需返点 */}
        <Card className="border shadow-sm hover:border-rose-400/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              需返点金额
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {formatCurrency(stats.rebateAmount)}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">需处理返点</span>
              <Badge variant="destructive">{stats.rebateCount} 笔待处理</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: 本月已结 */}
        <Card className="border shadow-sm hover:border-emerald-400/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              本月实收 (已结)
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.monthlyIncome)}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">{new Date().getMonth() + 1}月实收账款</span>
              <Badge variant="success">已到账</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: 累计总额 */}
        <Card className="border shadow-sm hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              累计历史收入
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(stats.totalIncome)}
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">全部商单记录</span>
              <Badge variant="secondary">{stats.totalOrders} 笔记录</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-7">
        {/* Left: Monthly Trend */}
        <Card className="md:col-span-4 border shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold">年度结款收入趋势</CardTitle>
                <CardDescription className="text-xs mt-1">
                  {new Date().getFullYear()} 年度各月实际已结款金额统计
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {new Date().getFullYear()} 年
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ReactECharts
                option={barChartOption}
                style={{ height: '100%', width: '100%' }}
                notMerge={true}
              />
            </div>
          </CardContent>
        </Card>

        {/* Right: Status Distribution */}
        <Card className="md:col-span-3 border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">商单状态占比</CardTitle>
            <CardDescription className="text-xs mt-1">
              当前所有商单的状态分布情况
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              {statusDistribution.length > 0 ? (
                <ReactECharts
                  option={pieChartOption}
                  style={{ height: '100%', width: '100%' }}
                  notMerge={true}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-xs">
                  暂无状态统计数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Pending Orders Preview */}
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">待结款商单提醒</CardTitle>
            <CardDescription className="text-xs mt-1">
              需要跟进或即将结款的前 5 笔商单
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToOrders}
            className="text-xs gap-1 text-muted-foreground hover:text-foreground"
          >
            查看全部
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentPending.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-sm">
              太棒了！当前没有待结款的商单 🎉
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentPending.map((order) => (
                <div
                  key={order.id}
                  className="py-3 flex items-center justify-between hover:bg-muted/30 px-3 rounded-lg transition-colors cursor-pointer"
                  onClick={() => onEditOrder(order)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold truncate flex items-center gap-2">
                        {order.brand_name}
                        {order.note && (
                          <span className="text-xs font-normal text-muted-foreground truncate">
                            · {order.note}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {order.publish_date || '未定日期'}
                        </span>
                        {order.contact_pr && <span>PR: {order.contact_pr}</span>}
                        {order.account_name && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1">
                            {order.account_name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                        {formatCurrency(order.amount)}
                      </div>
                      <Badge variant="warning" className="text-[10px] py-0">
                        {order.status}
                      </Badge>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 border-emerald-200 dark:border-emerald-800"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleQuickPay(order.id)
                      }}
                    >
                      结款
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
