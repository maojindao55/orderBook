import { app, BrowserWindow, ipcMain, shell, net } from 'electron'
import electronUpdater from 'electron-updater'

const { autoUpdater } = electronUpdater

const UPDATE_OWNER = 'maojindao55'
const UPDATE_REPO = 'orderBook'
const UPDATE_EVENT_CHANNEL = 'updater://event'
const RELEASES_URL = `https://github.com/${UPDATE_OWNER}/${UPDATE_REPO}/releases/latest`

let bound = false
let autoCheckDone = false

function safeBroadcast(event) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed() && win.webContents) {
      try {
        win.webContents.send(UPDATE_EVENT_CHANNEL, event)
      } catch (err) {
        console.error('Failed to send updater event:', err)
      }
    }
  }
}

function bindAutoUpdater() {
  if (bound) return
  bound = true

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.logger = null

  try {
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: UPDATE_OWNER,
      repo: UPDATE_REPO
    })
  } catch (err) {
    console.warn('[Updater] Failed to setFeedURL:', err)
  }

  autoUpdater.on('checking-for-update', () => {
    safeBroadcast({ type: 'checking-for-update' })
  })

  autoUpdater.on('update-available', (info) => {
    safeBroadcast({
      type: 'update-available',
      version: info.version || '',
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    })
  })

  autoUpdater.on('update-not-available', (info) => {
    safeBroadcast({
      type: 'update-not-available',
      version: info?.version || app.getVersion()
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    safeBroadcast({
      type: 'download-progress',
      percent: Math.round(progress.percent || 0),
      transferred: progress.transferred || 0,
      total: progress.total || 0,
      bytesPerSecond: progress.bytesPerSecond || 0
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    safeBroadcast({
      type: 'update-downloaded',
      version: info?.version || ''
    })
  })

  autoUpdater.on('error', (err, message) => {
    const errorText = message || err?.message || String(err)
    console.error('[Updater Error]:', errorText)
    safeBroadcast({
      type: 'error',
      message: errorText
    })
  })
}

/**
 * Compare two semver version strings (e.g., '1.0.0' vs '1.0.1')
 * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
 */
function compareSemver(v1, v2) {
  const clean1 = (v1 || '').replace(/^v/, '').trim().split('.').map((n) => parseInt(n, 10) || 0)
  const clean2 = (v2 || '').replace(/^v/, '').trim().split('.').map((n) => parseInt(n, 10) || 0)
  const len = Math.max(clean1.length, clean2.length, 3)

  for (let i = 0; i < len; i++) {
    const num1 = clean1[i] || 0
    const num2 = clean2[i] || 0
    if (num1 > num2) return 1
    if (num1 < num2) return -1
  }
  return 0
}

/**
 * Checks GitHub Releases API directly (used in dev mode or fallback)
 */
async function checkGitHubReleaseDirectly() {
  return new Promise((resolve) => {
    const request = net.request({
      url: `https://api.github.com/repos/${UPDATE_OWNER}/${UPDATE_REPO}/releases/latest`,
      headers: {
        'User-Agent': 'OrderBook-Desktop-App',
        Accept: 'application/vnd.github.v3+json'
      }
    })

    let body = ''
    request.on('response', (response) => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        resolve({ ok: false, error: `GitHub API 响应码: ${response.statusCode}` })
        return
      }

      response.on('data', (chunk) => {
        body += chunk.toString()
      })

      response.on('end', () => {
        try {
          const data = JSON.parse(body)
          const latestVersion = (data.tag_name || '').replace(/^v/, '')
          const currentVersion = app.getVersion()
          const isAvailable = compareSemver(latestVersion, currentVersion) > 0

          resolve({
            ok: true,
            available: isAvailable,
            version: latestVersion,
            releaseDate: data.published_at,
            releaseNotes: data.body,
            htmlUrl: data.html_url
          })
        } catch (e) {
          resolve({ ok: false, error: '解析 GitHub 版本信息失败' })
        }
      })
    })

    request.on('error', (err) => {
      resolve({ ok: false, error: err.message || '网络连接失败' })
    })

    request.end()
  })
}

export function initAutoUpdater() {
  bindAutoUpdater()

  if (!app.isPackaged) return
  if (autoCheckDone) return
  autoCheckDone = true

  // Auto-check once after app launches (delayed for smooth startup)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.warn('[Updater] Background check failed:', err?.message)
    })
  }, 4000)
}

export function registerUpdaterIpc() {
  ipcMain.handle('app:getVersion', () => app.getVersion())

  ipcMain.handle('updater:check', async () => {
    bindAutoUpdater()

    if (!app.isPackaged) {
      safeBroadcast({ type: 'checking-for-update' })
      const direct = await checkGitHubReleaseDirectly()
      if (direct.ok) {
        if (direct.available) {
          safeBroadcast({
            type: 'update-available',
            version: direct.version,
            releaseDate: direct.releaseDate,
            releaseNotes: direct.releaseNotes
          })
        } else {
          safeBroadcast({
            type: 'update-not-available',
            version: direct.version
          })
        }
      } else {
        safeBroadcast({ type: 'error', message: direct.error })
      }
      return direct
    }

    try {
      const result = await autoUpdater.checkForUpdates()
      return {
        ok: true,
        available: result?.isUpdateAvailable ?? false,
        version: result?.updateInfo?.version ?? null,
        releaseNotes: result?.updateInfo?.releaseNotes
      }
    } catch (err) {
      console.warn('[Updater] autoUpdater.checkForUpdates failed, trying direct GitHub API...', err)
      const direct = await checkGitHubReleaseDirectly()
      if (direct.ok) return direct
      return { ok: false, error: err.message || String(err) }
    }
  })

  ipcMain.handle('updater:download', async () => {
    bindAutoUpdater()
    try {
      await autoUpdater.downloadUpdate()
      return { ok: true }
    } catch (err) {
      return { ok: false, error: err.message || String(err) }
    }
  })

  ipcMain.handle('updater:quitAndInstall', () => {
    try {
      setImmediate(() => {
        autoUpdater.quitAndInstall(false, true)
      })
      return { ok: true }
    } catch (err) {
      console.error('[Updater] quitAndInstall failed:', err)
      return { ok: false, error: err.message || String(err) }
    }
  })

  ipcMain.handle('updater:openReleasesPage', () => {
    shell.openExternal(RELEASES_URL)
    return true
  })
}
