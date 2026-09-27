import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Building2,
  Receipt,
  BadgeDollarSign,
  Calendar,
  Layers,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import ReactECharts from 'echarts-for-react'
import { toast } from 'sonner'

export default function Finance() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(String(currentYear))
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalOrders: 0,
  })
  const [brandsCount, setBrandsCount] = useState(0)
  const [monthlyData, setMonthlyData] = useState([])
  const [brandRanking, setBrandRanking] = useState([])
  const [statusDistribution, setStatusDistribution] = useState([])

  const fetchFinanceData = async () => {
    if (!window.api?.getMonthlyIncome) return
    setLoading(true)
    try {
      const [statsRes, monthlyRes, brandsRes, rankingRes, statusRes] = await Promise.all([
        window.api.getStats(),
        window.api.getMonthlyIncome(Number(selectedYear)),
        window.api.getBrands(),
        window.api.getBrandRanking(10),
        window.api.getStatusDistribution(),
      ])

      if (statsRes) setStats(statsRes)
      if (monthlyRes) setMonthlyData(monthlyRes)
      if (brandsRes) setBrandsCount(brandsRes.length)
      if (rankingRes) setBrandRanking(rankingRes)
      if (statusRes) setStatusDistribution(statusRes)
    } catch (err) {
      toast.error('加载财务统计失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFinanceData()
  }, [selectedYear])

  const formatCurrency = (val) => {
    return '¥' + Number(val || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const isDarkMode = document.documentElement.classList.contains('dark')

  // Annual total from monthly
  const yearTotalIncome = monthlyData.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
  const avgOrderPrice = stats.totalOrders > 0 ? stats.totalIncome / stats.totalOrders : 0

  // 1. Monthly income trend chart
  const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
  const monthLabels = months.map((m) => `${parseInt(m, 10)}月`)
  const monthValues = months.map((m) => {
    const found = monthlyData.find((item) => item.month === m)
    return found ? Number(found.amount) : 0
  })

  const trendOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
      borderColor: isDarkMode ? '#27272a' : '#e4e4e7',
      textStyle: { color: isDarkMode ? '#fafafa' : '#09090b', fontSize: 12 },
      formatter: (params) => {
        const item = params[0]
        return `<div class="p-1"><div class="text-xs text-muted-foreground">${selectedYear}年 ${item.name}</div><div class="font-bold text-sm mt-0.5">${formatCurrency(item.value)}</div></div>`
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
          color: isDarkMode ? '#818cf8' : '#6366f1',
        },
      },
    ],
  }

  // 2. Brand Ranking Horizontal Bar Chart
  const sortedBrands = [...brandRanking].reverse()
  const brandRankingOption = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
      borderColor: isDarkMode ? '#27272a' : '#e4e4e7',
      textStyle: { color: isDarkMode ? '#fafafa' : '#09090b', fontSize: 12 },
      formatter: (params) => {
        const item = params[0]
        const raw = sortedBrands[item.dataIndex]
        return `<div class="p-1"><div class="font-semibold text-xs">${item.name}</div><div class="mt-1 text-xs text-muted-foreground">合作次数: ${raw?.count || 0} 次</div><div class="font-bold text-sm text-primary mt-0.5">总金额: ${formatCurrency(item.value)}</div></div>`
      },
    },
    grid: {
      top: '5%',
      left: '2%',
      right: '8%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          color: isDarkMode ? '#27272a' : '#f4f4f5',
          type: 'dashed',
        },
      },
      axisLabel: {
        color: isDarkMode ? '#a1a1aa' : '#71717a',
        fontSize: 10,
        formatter: (val) => `¥${val}`,
      },
    },
    yAxis: {
      type: 'category',
      data: sortedBrands.map((b) => b.brand_name),
      axisLine: { lineStyle: { color: isDarkMode ? '#3f3f46' : '#e4e4e7' } },
      axisTick: { show: false },
      axisLabel: {
        color: isDarkMode ? '#e4e4e7' : '#27272a',
        fontSize: 11,
        width: 90,
        overflow: 'truncate',
      },
    },
    series: [
      {
        type: 'bar',
        data: sortedBrands.map((b) => b.total_amount),
        barWidth: '50%',
        itemStyle: {
          borderRadius: [0, 4, 4, 0],
          color: isDarkMode ? '#38bdf8' : '#0ea5e9',
        },
      },
    ],
  }

  // 3. Status Donut Chart
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

  const availableYears = [
    String(currentYear + 1),
    String(currentYear),
    String(currentYear - 1),
    String(currentYear - 2),
    String(currentYear - 3),
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">财务分析</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            收入多维度透视、合作品牌排行及资金回款分析
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-[120px]">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-8 text-xs font-medium">
                <SelectValue placeholder="选择年份" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y} 年度
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {selectedYear} 年度总收入
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Calendar className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">
              {formatCurrency(yearTotalIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">按结款时间统计</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              平均单笔金额
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <BadgeDollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatCurrency(avgOrderPrice)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">历史平均商单单价</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              合作品牌总数
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Building2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {brandsCount} <span className="text-sm font-normal text-muted-foreground">家</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">历史累计合作过的客户</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              全部商单总量
            </CardTitle>
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Receipt className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {stats.totalOrders} <span className="text-sm font-normal text-muted-foreground">笔</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">已建档的历史单据</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend Full Width */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                {selectedYear} 年度月度收入分布
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                按月展示结款到账金额走势
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              年度合计: {formatCurrency(yearTotalIncome)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[280px] w-full">
            <ReactECharts
              option={trendOption}
              style={{ height: '100%', width: '100%' }}
              notMerge={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Two Columns: Brand Ranking + Status Distribution */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Brand Ranking */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">合作金额 Top 10 品牌</CardTitle>
            <CardDescription className="text-xs mt-1">
              合作金额排名前十的核心合作品牌客户
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              {brandRanking.length > 0 ? (
                <ReactECharts
                  option={brandRankingOption}
                  style={{ height: '100%', width: '100%' }}
                  notMerge={true}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                  暂无品牌排行数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">资金状态与结算情况</CardTitle>
            <CardDescription className="text-xs mt-1">
              各状态商单笔数与回款结构
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              {statusDistribution.length > 0 ? (
                <ReactECharts
                  option={pieChartOption}
                  style={{ height: '100%', width: '100%' }}
                  notMerge={true}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                  暂无状态分布数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
