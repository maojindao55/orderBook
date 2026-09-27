import Database from 'better-sqlite3'
import path from 'path'
import { normalizeBrandAndNote } from './brandNormalizer'

let db;

function initDatabase(userDataPath) {
  const dbPath = path.join(userDataPath, 'orderbook.db');
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_name TEXT NOT NULL,
      note TEXT,
      publish_date TEXT,
      amount REAL DEFAULT 0,
      status TEXT DEFAULT '待结款',
      settlement_date TEXT,
      settlement_method TEXT,
      contact_pr TEXT,
      account_name TEXT,
      need_rebate INTEGER DEFAULT 0,
      promo_cost REAL DEFAULT 0,
      remark TEXT,
      created_at TEXT DEFAULT (datetime('now','localtime')),
      updated_at TEXT DEFAULT (datetime('now','localtime'))
    )
  `);
}

function getOrders({ status, brand, account, search, startDate, endDate, page = 1, pageSize = 20 }) {
  let conditions = [];
  let params = {};

  if (status) {
    conditions.push('status = @status');
    params.status = status;
  }
  if (brand) {
    conditions.push('brand_name = @brand');
    params.brand = brand;
  }
  if (account) {
    conditions.push('account_name = @account');
    params.account = account;
  }
  if (search) {
    conditions.push('(brand_name LIKE @search OR note LIKE @search OR contact_pr LIKE @search)');
    params.search = `%${search}%`;
  }
  if (startDate) {
    conditions.push('publish_date >= @startDate');
    params.startDate = startDate;
  }
  if (endDate) {
    conditions.push('publish_date <= @endDate');
    params.endDate = endDate;
  }

  const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';
  const limitClause = 'LIMIT @limit OFFSET @offset';
  params.limit = pageSize;
  params.offset = (page - 1) * pageSize;

  const countQuery = `SELECT COUNT(*) as total FROM orders ${whereClause}`;
  const dataQuery = `SELECT * FROM orders ${whereClause} ORDER BY publish_date DESC, id DESC ${limitClause}`;

  const total = db.prepare(countQuery).get(params).total;
  const data = db.prepare(dataQuery).all(params);

  return { data, total };
}

function getOrder(id) {
  return db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
}

function createOrder(data) {
  if (data.brand_name) {
    const norm = normalizeBrandAndNote(data.brand_name, data.note)
    data.brand_name = norm.brand
    if (norm.note) data.note = norm.note
  }
  const fields = Object.keys(data);
  const placeholders = fields.map(f => `@${f}`).join(', ');
  const query = `INSERT INTO orders (${fields.join(', ')}) VALUES (${placeholders})`;
  const result = db.prepare(query).run(data);
  return result.lastInsertRowid;
}

function updateOrder(id, data) {
  if (data.brand_name) {
    const norm = normalizeBrandAndNote(data.brand_name, data.note)
    data.brand_name = norm.brand
    if (norm.note) data.note = norm.note
  }
  const fields = Object.keys(data);
  data.updated_at = db.prepare("SELECT datetime('now','localtime') as t").get().t;
  fields.push('updated_at');
  
  const setClause = fields.map(f => `${f} = @${f}`).join(', ');
  const query = `UPDATE orders SET ${setClause} WHERE id = @id`;
  
  data.id = id;
  const result = db.prepare(query).run(data);
  return result.changes;
}

function deleteOrder(id) {
  const result = db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  return result.changes;
}

function batchUpdateStatus(ids, status) {
  const placeholders = ids.map(() => '?').join(',');
  const query = `UPDATE orders SET status = ?, updated_at = datetime('now','localtime') WHERE id IN (${placeholders})`;
  const result = db.prepare(query).run(status, ...ids);
  return result.changes;
}

function getStats() {
  const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM

  const pendingStats = db.prepare(`SELECT IFNULL(SUM(amount), 0) as pendingAmount, COUNT(*) as pendingCount FROM orders WHERE status = '待结款'`).get();
  const rebateStats = db.prepare(`SELECT IFNULL(SUM(amount), 0) as rebateAmount, COUNT(*) as rebateCount FROM orders WHERE status = '需返点'`).get();
  
  const monthlyIncomeRes = db.prepare(`SELECT IFNULL(SUM(amount), 0) as monthlyIncome FROM orders WHERE status = '已结款' AND publish_date LIKE ?`).get(`${currentMonth}%`);
  const totalIncomeRes = db.prepare(`SELECT IFNULL(SUM(amount), 0) as totalIncome FROM orders WHERE status = '已结款'`).get();
  const totalOrdersRes = db.prepare(`SELECT COUNT(*) as totalOrders FROM orders`).get();

  return {
    pendingAmount: pendingStats.pendingAmount,
    pendingCount: pendingStats.pendingCount,
    rebateAmount: rebateStats.rebateAmount,
    rebateCount: rebateStats.rebateCount,
    monthlyIncome: monthlyIncomeRes.monthlyIncome,
    totalIncome: totalIncomeRes.totalIncome,
    totalOrders: totalOrdersRes.totalOrders
  };
}

function getMonthlyIncome(year) {
  const query = `
    SELECT strftime('%m', publish_date) as month, SUM(amount) as amount 
    FROM orders 
    WHERE status = '已结款' AND strftime('%Y', publish_date) = ?
    GROUP BY month 
    ORDER BY month
  `;
  return db.prepare(query).all(year.toString());
}

function getBrandRanking(limit = 10) {
  const query = `
    SELECT brand_name, COUNT(*) as count, SUM(amount) as total_amount 
    FROM orders 
    GROUP BY brand_name 
    ORDER BY total_amount DESC 
    LIMIT ?
  `;
  return db.prepare(query).all(limit);
}

function getStatusDistribution() {
  const query = `
    SELECT status, COUNT(*) as count, SUM(amount) as amount 
    FROM orders 
    GROUP BY status
  `;
  return db.prepare(query).all();
}

function getBrands() {
  return db.prepare("SELECT DISTINCT brand_name FROM orders WHERE brand_name IS NOT NULL AND brand_name != '' ORDER BY brand_name COLLATE NOCASE ASC").all().map(r => r.brand_name);
}

function getAccounts() {
  return db.prepare("SELECT DISTINCT account_name FROM orders WHERE account_name IS NOT NULL AND account_name != ''").all().map(r => r.account_name);
}

function getDB() {
  return db;
}

export default {
  initDatabase,
  getOrders,
  getOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  batchUpdateStatus,
  getStats,
  getMonthlyIncome,
  getBrandRanking,
  getStatusDistribution,
  getBrands,
  getAccounts,
  getDB
}
