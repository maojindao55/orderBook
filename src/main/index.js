import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import fs from 'fs'
import * as xlsx from 'xlsx'
import dbFuncs from './database.js'
import { importExcelFile } from './importExcel.js'

let mainWindow;

function createWindow() {
  const preloadPath = fs.existsSync(join(__dirname, '../preload/index.mjs'))
    ? join(__dirname, '../preload/index.mjs')
    : join(__dirname, '../preload/index.js')

  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#ffffff',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 12 },
    webPreferences: {
      preload: preloadPath,
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  setTimeout(() => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show()
      mainWindow.focus()
    }
  }, 1000)

  mainWindow.setTitle('商单管家')

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  dbFuncs.initDatabase(app.getPath('userData'))
  
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers
const handleIPC = (channel, func) => {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      return await func(...args);
    } catch (error) {
      console.error(`Error in ${channel}:`, error);
      throw error;
    }
  });
};

handleIPC('db:getOrders', (filters) => dbFuncs.getOrders(filters || {}))
handleIPC('db:getOrder', (id) => dbFuncs.getOrder(id))
handleIPC('db:createOrder', (data) => dbFuncs.createOrder(data))
handleIPC('db:updateOrder', (id, data) => dbFuncs.updateOrder(id, data))
handleIPC('db:deleteOrder', (id) => dbFuncs.deleteOrder(id))
handleIPC('db:batchUpdateStatus', (ids, status) => dbFuncs.batchUpdateStatus(ids, status))

handleIPC('db:getStats', () => dbFuncs.getStats())
handleIPC('db:getMonthlyIncome', (year) => dbFuncs.getMonthlyIncome(year))
handleIPC('db:getBrandRanking', (limit) => dbFuncs.getBrandRanking(limit))
handleIPC('db:getStatusDistribution', () => dbFuncs.getStatusDistribution())

handleIPC('db:getBrands', () => dbFuncs.getBrands())
handleIPC('db:getAccounts', () => dbFuncs.getAccounts())

handleIPC('db:importExcel', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: '导入商单',
    filters: [{ name: 'Excel Files', extensions: ['xls', 'xlsx'] }],
    properties: ['openFile']
  });

  if (canceled || filePaths.length === 0) return { imported: 0, errors: [] };

  const db = dbFuncs.getDB();
  return importExcelFile(db, filePaths[0]);
});

handleIPC('db:exportExcel', async (filters) => {
  const { data } = dbFuncs.getOrders({ ...filters, page: 1, pageSize: 999999 });
  
  if (!data || data.length === 0) {
    throw new Error('没有可导出的数据');
  }

  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: '导出商单',
    defaultPath: '商单导出.xlsx',
    filters: [{ name: 'Excel Files', extensions: ['xlsx'] }]
  });

  if (canceled || !filePath) return false;

  const worksheet = xlsx.utils.json_to_sheet(data.map(item => ({
    'ID': item.id,
    '品牌名称': item.brand_name,
    '笔记/明星名': item.note,
    '发布日期': item.publish_date,
    '金额': item.amount,
    '结款状态': item.status,
    '结款日期': item.settlement_date,
    '结款方式': item.settlement_method,
    '对接PR': item.contact_pr,
    '所属账号': item.account_name,
    '是否需返点': item.need_rebate ? '是' : '否',
    '推广花费': item.promo_cost,
    '备注': item.remark,
    '创建时间': item.created_at
  })));

  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, '商单');
  
  xlsx.writeFile(workbook, filePath);
  return true;
});
