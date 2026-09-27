import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Orders
  getOrders: (filters) => ipcRenderer.invoke('db:getOrders', filters),
  getOrder: (id) => ipcRenderer.invoke('db:getOrder', id),
  createOrder: (data) => ipcRenderer.invoke('db:createOrder', data),
  updateOrder: (id, data) => ipcRenderer.invoke('db:updateOrder', id, data),
  deleteOrder: (id) => ipcRenderer.invoke('db:deleteOrder', id),
  batchUpdateStatus: (ids, status) => ipcRenderer.invoke('db:batchUpdateStatus', ids, status),
  
  // Stats
  getStats: () => ipcRenderer.invoke('db:getStats'),
  getMonthlyIncome: (year) => ipcRenderer.invoke('db:getMonthlyIncome', year),
  getBrandRanking: (limit) => ipcRenderer.invoke('db:getBrandRanking', limit),
  getStatusDistribution: () => ipcRenderer.invoke('db:getStatusDistribution'),
  
  // Brands & Accounts
  getBrands: () => ipcRenderer.invoke('db:getBrands'),
  getAccounts: () => ipcRenderer.invoke('db:getAccounts'),
  
  // Import/Export
  importExcel: () => ipcRenderer.invoke('db:importExcel'),
  exportExcel: (filters) => ipcRenderer.invoke('db:exportExcel', filters),
})
