import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  ReceiptText,
  LineChart,
  Settings,
  Plus,
  Upload,
  Sun,
  Moon,
  Database,
  Search,
} from 'lucide-react'
import { Button } from './components/ui/button'
import { Badge } from './components/ui/badge'
import Dashboard from './components/Dashboard'
import OrderList from './components/OrderList'
import Finance from './components/Finance'
import SettingsView from './components/Settings'
import OrderForm from './components/OrderForm'
import { toast } from 'sonner'
import appIcon from './assets/icon.png'

export default function App() {
  const [currentTab, setCurrentTab] = useState('dashboard')
  const [orderModalOpen, setOrderModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [darkMode])

  const navItems = [
    { id: 'dashboard', label: '数据看板', icon: LayoutDashboard },
    { id: 'orders', label: '商单管理', icon: ReceiptText },
    { id: 'finance', label: '财务分析', icon: LineChart },
    { id: 'settings', label: '系统设置', icon: Settings },
  ]

  const handleImportExcel = async () => {
    try {
      if (!window.api?.importExcel) {
        toast.error('当前不在 Electron 环境中')
        return
      }
      toast.loading('正在选择并解析 Excel 文件...', { id: 'import-excel' })
      const res = await window.api.importExcel()
      if (res && res.imported !== undefined) {
        toast.success(`成功导入 ${res.imported} 条商单数据！`, { id: 'import-excel' })
        window.dispatchEvent(new Event('refreshData'))
      } else {
        toast.dismiss('import-excel')
      }
    } catch (err) {
      toast.error(`导入失败: ${err.message}`, { id: 'import-excel' })
    }
  }

  const handleNewOrder = () => {
    setEditingOrder(null)
    setOrderModalOpen(true)
  }

  const handleEditOrder = (order) => {
    setEditingOrder(order)
    setOrderModalOpen(true)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r bg-muted/20 dark:bg-muted/10 shrink-0">
        {/* Window controls padding on Mac + Logo */}
        <div className="pt-8 px-6 pb-6 border-b drag-region">
          <div className="flex items-center space-x-3 no-drag">
            <img src={appIcon} alt="App Icon" className="h-9 w-9 rounded-lg shadow-sm object-contain" />
            <div>
              <div className="font-semibold text-base leading-tight tracking-tight flex items-center gap-1.5">
                商单管家
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">v1.0</Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">自媒体商单财务管理</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-4 space-y-1">
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            工作台
          </div>
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = currentTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t space-y-2">
          <div className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground bg-muted/40 rounded-lg">
            <span className="flex items-center gap-2">
              <Database className="h-3.5 w-3.5 text-emerald-500" />
              本地 SQLite
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">正常</span>
          </div>

          <div className="flex items-center justify-between px-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-2 flex items-center gap-1.5"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              <span>{darkMode ? '明亮模式' : '深色模式'}</span>
            </Button>
            <span className="text-[10px] text-muted-foreground/60 pr-2">本地离线运行</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header / macOS Window Titlebar */}
        <header className="h-12 border-b flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm shrink-0 drag-region select-none">
          <div className="no-drag flex items-center gap-2 text-xs text-muted-foreground">
            <span>工作台</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="font-semibold text-foreground">
              {navItems.find((n) => n.id === currentTab)?.label}
            </span>
          </div>

          <div className="no-drag flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs font-medium"
              onClick={handleImportExcel}
            >
              <Upload className="h-3 w-3" />
              导入表格
            </Button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-muted/10">
          <div className="max-w-7xl mx-auto space-y-6">
            {currentTab === 'dashboard' && (
              <Dashboard
                onNavigateToOrders={() => setCurrentTab('orders')}
                onEditOrder={handleEditOrder}
              />
            )}
            {currentTab === 'orders' && (
              <OrderList
                onEditOrder={handleEditOrder}
                onNewOrder={handleNewOrder}
              />
            )}
            {currentTab === 'finance' && <Finance />}
            {currentTab === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* Modal for Creating / Editing Order */}
      <OrderForm
        open={orderModalOpen}
        onOpenChange={setOrderModalOpen}
        editingOrder={editingOrder}
        onSuccess={() => {
          setOrderModalOpen(false)
          window.dispatchEvent(new Event('refreshData'))
        }}
      />
    </div>
  )
}
