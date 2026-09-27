import { create } from 'zustand'

export const useUpdaterStore = create((set, get) => ({
  status: 'idle', // 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'
  appVersion: 'v1.0.0',
  latestVersion: null,
  downloadPercent: 0,
  errorMessage: null,
  initialized: false,

  init: async () => {
    if (get().initialized) return
    set({ initialized: true })

    const updater = window.api?.updater
    if (!updater) return

    try {
      const ver = await updater.getVersion()
      if (ver) {
        set({ appVersion: ver.startsWith('v') ? ver : `v${ver}` })
      }
    } catch {
      // fallback
    }

    updater.onEvent((event) => {
      get().applyEvent(event)
    })
  },

  applyEvent: (event) => {
    switch (event.type) {
      case 'checking-for-update':
        set({ status: 'checking', errorMessage: null })
        break
      case 'update-available':
        set({
          status: 'available',
          latestVersion: event.version,
          errorMessage: null
        })
        break
      case 'update-not-available':
        set({
          status: 'not-available',
          latestVersion: event.version,
          errorMessage: null
        })
        break
      case 'download-progress':
        set({
          status: 'downloading',
          downloadPercent: Math.max(0, Math.min(100, Math.round(event.percent || 0)))
        })
        break
      case 'update-downloaded':
        set({
          status: 'downloaded',
          latestVersion: event.version,
          downloadPercent: 100,
          errorMessage: null
        })
        break
      case 'error':
        set({
          status: 'error',
          errorMessage: event.message || '检查更新失败'
        })
        break
      default:
        break
    }
  },

  checkForUpdates: async () => {
    const updater = window.api?.updater
    if (!updater) return

    set({ status: 'checking', errorMessage: null })
    try {
      const res = await updater.check()
      if (!res.ok) {
        set({ status: 'error', errorMessage: res.error || '无法连接更新服务器' })
      } else if (!res.available) {
        set({ status: 'not-available', latestVersion: res.version })
      }
    } catch (err) {
      set({ status: 'error', errorMessage: err.message || '检查更新失败' })
    }
  },

  downloadUpdate: async () => {
    const updater = window.api?.updater
    if (!updater) return

    set({ status: 'downloading', downloadPercent: 0, errorMessage: null })
    try {
      const res = await updater.download()
      if (!res.ok) {
        set({ status: 'error', errorMessage: res.error || '下载更新失败' })
      }
    } catch (err) {
      set({ status: 'error', errorMessage: err.message || '下载更新失败' })
    }
  },

  quitAndInstall: async () => {
    const updater = window.api?.updater
    if (!updater) return
    try {
      await updater.quitAndInstall()
    } catch (err) {
      set({ status: 'error', errorMessage: err.message || '重启安装失败' })
    }
  }
}))
