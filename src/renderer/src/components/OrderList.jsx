import React, { useState, useEffect } from 'react'
import {
  Search,
  Plus,
  Download,
  MoreHorizontal,
  CheckCircle2,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  X,
  Calendar,
  Check,
  Rows3,
  Rows4,
  ExternalLink,
} from 'lucide-react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import { Card } from './ui/card'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from './ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import DateRangePicker from './DateRangePicker'
import { toast } from 'sonner'



import dayjs from 'dayjs'

export default function OrderList({ onEditOrder, onNewOrder }) {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])

  // Filters
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('ALL')
  const [brands, setBrands] = useState([])
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [accountFilter, setAccountFilter] = useState('ALL')
  const [accounts, setAccounts] = useState([])

  // Date Filters
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Density (relaxed/宽松 by default as requested, persisted to localStorage)
  const [isCompact, setIsCompact] = useState(() => {
    return localStorage.getItem('orderbook_table_density') === 'compact'
  })

  const toggleDensity = () => {
    setIsCompact((prev) => {
      const next = !prev
      localStorage.setItem('orderbook_table_density', next ? 'compact' : 'relaxed')
      return next
    })
  }

  // Pagination
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const fetchOrders = async () => {
    if (!window.api?.getOrders) return
    setLoading(true)
    try {
      const filters = {
        page,
        pageSize,
        search: search.trim() || undefined,
        brand: brandFilter === 'ALL' ? undefined : brandFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        account: accountFilter === 'ALL' ? undefined : accountFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }
      const res = await window.api.getOrders(filters)
      if (res) {
        setOrders(res.data || [])
        setTotal(res.total || 0)
      }
    } catch (err) {
      toast.error('获取商单列表失败: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchFilterOptions = async () => {
    if (!window.api) return
    try {
      const [accs, brandList] = await Promise.all([
        window.api.getAccounts?.(),
        window.api.getBrands?.(),
      ])
      if (accs) setAccounts(accs)
      if (brandList) {
        // Sort brands alphabetically case-insensitively
        const sorted = [...brandList].sort((a, b) => a.localeCompare(b, 'zh-CN'))
        setBrands(sorted)
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [page, pageSize, brandFilter, statusFilter, accountFilter, startDate, endDate])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      fetchOrders()
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const handleResetAllFilters = () => {
    setSearch('')
    setBrandFilter('ALL')
    setStatusFilter('ALL')
    setAccountFilter('ALL')
    setStartDate('')
    setEndDate('')
    setPage(1)
  }

  useEffect(() => {
    const handleRefresh = () => {
      fetchOrders()
      fetchFilterOptions()
    }
    window.addEventListener('refreshData', handleRefresh)
    return () => window.removeEventListener('refreshData', handleRefresh)
  }, [])

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(orders.map((o) => o.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id])
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id))
    }
  }

  const handleBatchMarkPaid = async () => {
    if (selectedIds.length === 0) return
    try {
      await window.api.batchUpdateStatus(selectedIds, '已结款')
      toast.success(`已将选中的 ${selectedIds.length} 笔商单标记为已结款`)
      setSelectedIds([])
      fetchOrders()
      window.dispatchEvent(new Event('refreshData'))
    } catch (err) {
      toast.error('批量更新失败: ' + err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('确定要删除这条商单记录吗？此操作无法撤销。')) return
    try {
      await window.api.deleteOrder(id)
      toast.success('删除成功')
      fetchOrders()
      window.dispatchEvent(new Event('refreshData'))
    } catch (err) {
      toast.error('删除失败: ' + err.message)
    }
  }

  // Instant one-click settlement
  const handleQuickPay = async (order) => {
    try {
      const today = new Date().toISOString().slice(0, 10)
      await window.api.updateOrder(order.id, {
        status: '已结款',
        settlement_date: today,
      })
      toast.success(`商单「${order.brand_name}」已快速标记为结款`)
      fetchOrders()
      window.dispatchEvent(new Event('refreshData'))
    } catch (err) {
      toast.error('结款更新失败: ' + err.message)
    }
  }

  const handleExport = async () => {
    try {
      toast.loading('正在导出 Excel...', { id: 'export' })
      const res = await window.api.exportExcel({
        search: search.trim() || undefined,
        brand: brandFilter === 'ALL' ? undefined : brandFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        account: accountFilter === 'ALL' ? undefined : accountFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      })
      if (res) {
        toast.success('导出成功！', { id: 'export' })
      } else {
        toast.dismiss('export')
      }
    } catch (err) {
      toast.error('导出失败: ' + err.message, { id: 'export' })
    }
  }

  const formatCurrency = (val) => {
    return '¥' + Number(val || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case '已结款':
        return <Badge variant="success" className="font-normal text-[11px] px-2 py-0">已结款</Badge>
      case '待结款':
        return <Badge variant="warning" className="font-normal text-[11px] px-2 py-0">待结款</Badge>
      case '需返点':
        return <Badge variant="destructive" className="font-normal text-[11px] px-2 py-0">需返点</Badge>
      case '报备的':
        return <Badge variant="info" className="font-normal text-[11px] px-2 py-0">报备的</Badge>
      case '待确认':
        return <Badge variant="purple" className="font-normal text-[11px] px-2 py-0">待确认</Badge>
      default:
        return <Badge variant="secondary" className="font-normal text-[11px] px-2 py-0">{status || '待结款'}</Badge>
    }
  }

  const totalPages = Math.ceil(total / pageSize) || 1
  const hasActiveFilters = Boolean(
    search ||
    brandFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    accountFilter !== 'ALL' ||
    startDate ||
    endDate
  )

  return (
    <div className="space-y-3.5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold tracking-tight text-foreground">商单管理</h2>
            <Badge variant="secondary" className="text-xs font-semibold px-2 py-0.5">
              共 {total} 笔记录
            </Badge>
            {hasActiveFilters && (
              <Badge variant="outline" className="text-[11px] text-primary border-primary/30">
                已应用筛选
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            快速跟踪品牌合作款项、付款状态及催收进度
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Density toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDensity}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
            title={isCompact ? '当前紧凑模式，点击切换宽松' : '当前宽松模式，点击切换紧凑'}
          >
            {isCompact ? <Rows3 className="h-3.5 w-3.5" /> : <Rows4 className="h-3.5 w-3.5" />}
            <span>{isCompact ? '紧凑' : '宽松'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium"
            onClick={handleExport}
          >
            <Download className="h-3.5 w-3.5" />
            导出表格
          </Button>

          <Button
            size="sm"
            className="h-8 gap-1.5 text-xs font-medium shadow-sm"
            onClick={onNewOrder}
          >
            <Plus className="h-3.5 w-3.5" />
            新建商单
          </Button>
        </div>
      </div>

      {/* Integrated Filter Toolbar */}
      <div className="space-y-2 pt-1">
        {/* Filter Controls Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="搜索品牌、明星笔记、PR..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-background"
            />
          </div>

          {/* 1. 品牌筛选 Brand Filter */}
          <div className="w-[140px]">
            <Select
              value={brandFilter}
              onValueChange={(val) => {
                setBrandFilter(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="筛选品牌" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="ALL">全部品牌 ({brands.length})</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. 结款状态 Status Filter */}
          <div className="w-[115px]">
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="结款状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部状态</SelectItem>
                <SelectItem value="待结款">待结款</SelectItem>
                <SelectItem value="已结款">已结款</SelectItem>
                <SelectItem value="需返点">需返点</SelectItem>
                <SelectItem value="报备的">报备的</SelectItem>
                <SelectItem value="待确认">待确认</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 3. 所属账号 Account Filter */}
          <div className="w-[135px]">
            <Select
              value={accountFilter}
              onValueChange={(val) => {
                setAccountFilter(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="h-8 text-xs bg-background">
                <SelectValue placeholder="所属账号" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">所有账号</SelectItem>
                {accounts.map((acc) => (
                  <SelectItem key={acc} value={acc}>
                    {acc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. 专业日期范围选择器 DateRangePicker */}
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onDateChange={(start, end) => {
              setStartDate(start)
              setEndDate(end)
              setPage(1)
            }}
          />

          {/* 重置所有筛选按钮 */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs px-2 text-muted-foreground hover:text-foreground gap-1"
              onClick={handleResetAllFilters}
            >
              <X className="h-3 w-3" />
              重置
            </Button>
          )}
        </div>

        {/* Selected Items Batch Floating Strip */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-md text-xs">
            <span className="font-medium text-foreground">
              已选 <strong className="text-primary">{selectedIds.length}</strong> 项
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-[11px] px-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => setSelectedIds([])}
            >
              取消
            </Button>
            <Button
              size="sm"
              className="h-6 text-[11px] px-2 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleBatchMarkPaid}
            >
              <Check className="h-3 w-3" />
              批量标记已结款
            </Button>
          </div>
        )}
      </div>

      {/* Main Data Table */}
      <Card className="border shadow-sm overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-[36px] py-2 px-3">
                <Checkbox
                  checked={selectedIds.length > 0 && selectedIds.length === orders.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="全选"
                />
              </TableHead>
              <TableHead className="w-[160px] py-2 px-3">品牌名称</TableHead>
              <TableHead className="py-2 px-3">合作笔记 / 明星</TableHead>
              <TableHead className="w-[110px] py-2 px-3">发布日期</TableHead>
              <TableHead className="w-[110px] py-2 px-3 text-right">商单金额</TableHead>
              <TableHead className="w-[90px] py-2 px-3 text-center">状态</TableHead>
              <TableHead className="w-[130px] py-2 px-3">结款详情</TableHead>
              <TableHead className="w-[140px] py-2 px-3">账号与对接</TableHead>
              <TableHead className="w-[140px] py-2 px-3">备注信息</TableHead>
              <TableHead className="w-[110px] py-2 px-3 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} className="h-40 text-center text-muted-foreground text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>正在载入商单数据...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="h-40 text-center text-muted-foreground text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileSpreadsheet className="h-7 w-7 text-muted-foreground/30" />
                    <span>未查找到匹配的商单记录</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                const isSelected = selectedIds.includes(order.id)
                const isPaid = order.status === '已结款'
                const isRebate = order.status === '需返点'
                const cellPadding = isCompact ? 'py-2 px-3' : 'py-3 px-3'

                return (
                  <TableRow
                    key={order.id}
                    data-state={isSelected ? 'selected' : undefined}
                    className="cursor-pointer hover:bg-muted/40 transition-colors group"
                    onClick={() => onEditOrder(order)}
                  >
                    {/* Checkbox */}
                    <TableCell className={cellPadding} onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectOne(order.id, !!checked)}
                        aria-label={`选择 ${order.brand_name}`}
                      />
                    </TableCell>

                    {/* Brand Name */}
                    <TableCell className={cellPadding}>
                      <span className="font-semibold text-foreground truncate max-w-[140px] block" title={order.brand_name}>
                        {order.brand_name}
                      </span>
                    </TableCell>

                    {/* Note / Star */}
                    <TableCell className={cellPadding}>
                      <span className="text-foreground/90 font-medium truncate max-w-[190px] block" title={order.note}>
                        {order.note || <span className="text-muted-foreground/40 font-normal">未备注内容</span>}
                      </span>
                    </TableCell>

                    {/* Publish Date */}
                    <TableCell className={`${cellPadding} text-muted-foreground text-xs font-mono`}>
                      {order.publish_date || '-'}
                    </TableCell>

                    {/* Amount (color-coded) */}
                    <TableCell className={`${cellPadding} text-right font-bold tabular-nums`}>
                      <span
                        className={
                          isPaid
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isRebate
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-foreground'
                        }
                      >
                        {formatCurrency(order.amount)}
                      </span>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className={`${cellPadding} text-center`}>
                      {getStatusBadge(order.status)}
                    </TableCell>

                    {/* Settlement Detail (replaces empty columns) */}
                    <TableCell className={`${cellPadding} text-xs`}>
                      {order.settlement_date ? (
                        <div className="flex flex-col">
                          <span className="font-mono text-foreground text-[11px]">
                            {order.settlement_date}
                          </span>
                          {order.settlement_method && (
                            <span className="text-[10px] text-muted-foreground">
                              {order.settlement_method}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40 text-[11px]">未结款</span>
                      )}
                    </TableCell>

                    {/* Account & PR (Cleanly combined, no --- spam) */}
                    <TableCell className={`${cellPadding} text-xs`}>
                      <div className="flex flex-col gap-0.5">
                        {order.account_name && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1 w-fit max-w-[120px] truncate">
                            {order.account_name}
                          </Badge>
                        )}
                        {order.contact_pr && (
                          <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                            PR: {order.contact_pr}
                          </span>
                        )}
                        {!order.account_name && !order.contact_pr && (
                          <span className="text-muted-foreground/30">-</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Remark & Promo cost */}
                    <TableCell className={`${cellPadding} text-xs`}>
                      {order.remark ? (
                        <span className="text-muted-foreground truncate max-w-[130px] block" title={order.remark}>
                          {order.remark}
                        </span>
                      ) : order.promo_cost > 0 ? (
                        <span className="text-[11px] text-rose-500">
                          推广: ¥{order.promo_cost}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30">-</span>
                      )}
                    </TableCell>

                    {/* Actions: Quick Pay Button + Dropdown */}
                    <TableCell className={`${cellPadding} text-right`} onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {!isPaid && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-1.5 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 dark:text-emerald-400 gap-1 font-medium"
                            title="快速结款（设置到账日期为今天）"
                            onClick={() => handleQuickPay(order)}
                          >
                            <Check className="h-3 w-3" />
                            结款
                          </Button>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-36">
                            <DropdownMenuItem onClick={() => onEditOrder(order)} className="gap-2 text-xs">
                              <Edit2 className="h-3.5 w-3.5" />
                              编辑商单
                            </DropdownMenuItem>
                            {!isPaid && (
                              <DropdownMenuItem
                                onClick={() => handleQuickPay(order)}
                                className="gap-2 text-xs text-emerald-600 dark:text-emerald-400"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                标为已结款
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(order.id)}
                              className="gap-2 text-xs text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              删除记录
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>

        {/* Integrated Pagination Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-t bg-muted/20 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              第 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} 条，共 {total} 笔商单
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span>每页</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="h-6 text-xs rounded border border-input bg-background px-1 cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={35}>35</option>
                <option value={50}>50</option>
              </select>
              <span>条</span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
              <span className="px-1.5 font-medium text-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
