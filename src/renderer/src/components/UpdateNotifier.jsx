import React from 'react'
import { Sparkles, Download, RefreshCw, X, AlertCircle } from 'lucide-react'
import { useUpdaterStore } from '../store/updaterStore'
import { Button } from './ui/button'

export default function UpdateNotifier() {
  const {
    status,
    latestVersion,
    downloadPercent,
    errorMessage,
    quitAndInstall,
    checkForUpdates,
  } = useUpdaterStore()

  const [dismissed, setDismissed] = React.useState(false)

  // Re-open if status changes to downloaded
  React.useEffect(() => {
    if (status === 'downloaded') {
      setDismissed(false)
    }
  }, [status])

  if (dismissed || status === 'idle' || status === 'not-available' || status === 'checking') {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-card/95 backdrop-blur-md border border-border shadow-xl rounded-xl p-4 transition-all duration-300 animate-in slide-in-from-bottom-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {status === 'downloaded' ? (
            <div className="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
          ) : status === 'downloading' || status === 'available' ? (
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 animate-pulse">
              <Download className="h-5 w-5" />
            </div>
          ) : (
            <div className="h-9 w-9 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5" />
            </div>
          )}

          <div>
            <h4 className="text-sm font-semibold text-foreground">
              {status === 'downloaded' && '新版本已就绪'}
              {(status === 'available' || status === 'downloading') && '正在更新应用'}
              {status === 'error' && '更新出错'}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {status === 'downloaded' && `版本 ${latestVersion || ''} 已下载完成，重启后生效`}
              {status === 'available' && `发现新版本 ${latestVersion || ''}，准备下载...`}
              {status === 'downloading' && `正在下载新版本 ${latestVersion || ''} (${downloadPercent}%)`}
              {status === 'error' && (errorMessage || '请稍后再试')}
            </p>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground transition-colors p-1 -mr-1 -mt-1 rounded-md"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {status === 'downloading' && (
        <div className="mt-3">
          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-primary h-1.5 transition-all duration-300 rounded-full"
              style={{ width: `${downloadPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-3.5 flex items-center justify-end gap-2">
        {status === 'downloaded' && (
          <Button
            size="sm"
            onClick={quitAndInstall}
            className="w-full h-8 text-xs font-medium gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            立即重启并安装
          </Button>
        )}

        {status === 'error' && (
          <Button
            size="sm"
            variant="outline"
            onClick={checkForUpdates}
            className="h-8 text-xs font-medium gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            重试
          </Button>
        )}
      </div>
    </div>
  )
}
