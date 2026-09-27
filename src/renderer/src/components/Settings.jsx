import React, { useState, useEffect } from 'react'
import {
  Upload,
  Download,
  Database,
  Info,
  CheckCircle2,
  HardDrive,
  FileSpreadsheet,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Separator } from './ui/separator'
import { toast } from 'sonner'

export default function Settings() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    brandsCount: 0,
    accountsCount: 0,
  })
  const [importing, setImporting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const fetchStats = async () => {
    if (!window.api?.getStats) return
    try {
      const [orderStats, brands, accounts] = await Promise.all([
        window.api.getStats(),
        window.api.getBrands(),
        window.api.getAccounts(),
      ])

      setStats({
        totalOrders: orderStats?.totalOrders || 0,
        brandsCount: brands?.length || 0,
        accountsCount: accounts?.length || 0,
      })
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleImport = async () => {
    setImporting(true)
    try {
      const res = await window.api.importExcel()
      if (res && res.imported !== undefined) {
        toast.success(`成功导入 ${res.imported} 条商单数据！`)
        fetchStats()
        window.dispatchEvent(new Event('refreshData'))
      }
    } catch (err) {
      toast.error('导入失败: ' + err.message)
    } finally {
      setImporting(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await window.api.exportExcel({})
      if (res) {
        toast.success('Excel 文件导出成功！')
      }
    } catch (err) {
      toast.error('导出失败: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">系统设置</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          本地数据管理、Excel 文件导入导出与系统运行状态
        </p>
      </div>

      {/* Data Management Card */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">数据导入与导出</CardTitle>
              <CardDescription className="text-xs">
                支持 Excel (.xlsx, .xls) 文件的无缝导入与全量导出
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/30 p-4 text-xs space-y-2">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              智能 Excel 导入兼容规范
            </div>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>自动读取多个工作表（活跃商单、历史已结完单、多账号列表）</li>
              <li>自动转换 Excel 序列号日期（如 46024 → 2025-12-14）为标准年月日格式</li>
              <li>智能状态提取（包含「已结款/√」自动归为已结款，自由文本备注自动分离）</li>
              <li>严格去重：相同品牌 + 笔记 + 日期不会重复录入</li>
            </ul>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              onClick={handleImport}
              disabled={importing}
              className="gap-2 text-xs h-9"
            >
              <Upload className="h-3.5 w-3.5" />
              {importing ? '正在解析导入...' : '导入商单表格 (.xlsx)'}
            </Button>

            <Button
              variant="outline"
              onClick={handleExport}
              disabled={exporting}
              className="gap-2 text-xs h-9"
            >
              <Download className="h-3.5 w-3.5" />
              {exporting ? '正在导出...' : '导出全部商单'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Overview */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <HardDrive className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">本地数据库存储</CardTitle>
              <CardDescription className="text-xs">
                数据安全保存在本机 SQLite 数据库中，不经过任何外部云端服务器
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">已存储商单</div>
              <div className="text-xl font-bold mt-1 text-foreground">
                {stats.totalOrders} <span className="text-xs font-normal text-muted-foreground">笔</span>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">合作品牌库</div>
              <div className="text-xl font-bold mt-1 text-foreground">
                {stats.brandsCount} <span className="text-xs font-normal text-muted-foreground">个</span>
              </div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-xs text-muted-foreground">关联自媒体账号</div>
              <div className="text-xl font-bold mt-1 text-foreground">
                {stats.accountsCount} <span className="text-xs font-normal text-muted-foreground">个</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-3 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Database className="h-4 w-4" />
              <span>数据文件路径：</span>
              <code className="text-[11px] font-mono bg-background px-1.5 py-0.5 rounded border">
                ~/Library/Application Support/order-book/orderbook.db
              </code>
            </div>
            <Badge variant="outline" className="text-[11px] text-emerald-600 border-emerald-300">
              数据受保护
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* About Application */}
      <Card className="border shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Info className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">关于商单管家</CardTitle>
              <CardDescription className="text-xs">
                专为自媒体博主打造的高效商单记录与款项管理客户端
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-muted-foreground">
          <p>
            商单管家致力于替代传统杂乱的 Excel 记账方式，提供结构化字段约束、智能回款提醒、多账号独立归属管理及自动化收益图表分析。
          </p>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="secondary">版本 v1.0.0</Badge>
            <Badge variant="secondary">UI: shadcn/ui</Badge>
            <Badge variant="secondary">Tailwind CSS</Badge>
            <Badge variant="secondary">Radix UI</Badge>
            <Badge variant="secondary">SQLite 3</Badge>
            <Badge variant="secondary">Electron 33</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
