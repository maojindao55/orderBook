import * as xlsx from 'xlsx'
import { normalizeBrandAndNote } from './brandNormalizer'

function excelDateToJSDate(serial) {
  if (typeof serial === 'number') {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    const year = date_info.getFullYear();
    const month = String(date_info.getMonth() + 1).padStart(2, '0');
    const day = String(date_info.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  if (typeof serial === 'string') {
    const date = new Date(serial);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }
  return serial;
}

function parseStatus(statusStr) {
  if (!statusStr) return { status: '待结款', remark: '' };
  const s = String(statusStr);
  if (s === '已结款' || s.includes('已结款') || s.includes('√')) return { status: '已结款', remark: '' };
  if (s === '需返点' || s.includes('需返点')) return { status: '需返点', remark: '' };
  if (s === '报备' || s.includes('报备')) return { status: '报备的', remark: '' };
  return { status: '待结款', remark: s };
}

function importExcelFile(db, filePath) {
  let imported = 0;
  let errors = [];
  
  try {
    const workbook = xlsx.readFile(filePath);
    
    const checkDuplicate = db.prepare('SELECT id FROM orders WHERE brand_name = ? AND note = ? AND publish_date = ?');
    const insertStmt = db.prepare(`
      INSERT INTO orders (brand_name, note, publish_date, amount, status, settlement_date, contact_pr, account_name, remark)
      VALUES (@brand_name, @note, @publish_date, @amount, @status, @settlement_date, @contact_pr, @account_name, @remark)
    `);

    const processRow = (row, mappingOverrides) => {
      let { brand_name, note, publish_date, amount, statusStr, settlement_date, contact_pr, account_name } = row;
      
      if (mappingOverrides) {
        brand_name = mappingOverrides.brand_name || brand_name;
        statusStr = mappingOverrides.statusStr !== undefined ? mappingOverrides.statusStr : statusStr;
      }

      if (!brand_name) return; // Skip empty brand

      const normalized = normalizeBrandAndNote(brand_name, note);
      brand_name = normalized.brand;
      note = normalized.note;

      if (!brand_name) return;

      const parsedStatus = parseStatus(statusStr);
      let pDate = publish_date ? excelDateToJSDate(publish_date) : null;
      let sDate = settlement_date ? excelDateToJSDate(settlement_date) : null;
      
      let amt = parseFloat(amount);
      if (isNaN(amt)) amt = 0;

      const record = {
        brand_name: String(brand_name || ''),
        note: String(note || ''),
        publish_date: pDate,
        amount: amt,
        status: parsedStatus.status,
        settlement_date: sDate,
        contact_pr: String(contact_pr || ''),
        account_name: String(account_name || ''),
        remark: parsedStatus.remark
      };

      try {
        const exists = checkDuplicate.get(record.brand_name, record.note, record.publish_date);
        if (!exists) {
          insertStmt.run(record);
          imported++;
        }
      } catch (err) {
        errors.push(`Error inserting row for ${record.brand_name}: ${err.message}`);
      }
    };

    // Sheet 1
    if (workbook.SheetNames.length > 0) {
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = xlsx.utils.sheet_to_json(sheet);
      data.forEach(row => {
        processRow({
          brand_name: row['品牌名称'],
          note: row['笔记'],
          publish_date: row['发布日期'],
          amount: row['金额'],
          statusStr: row['结款时间'],
          settlement_date: row['结款时间'], 
          contact_pr: row['对接pr']
        });
      });
    }

    // Sheet 2 (已结完的)
    if (workbook.SheetNames.length > 1) {
      const sheet = workbook.Sheets[workbook.SheetNames[1]];
      const data = xlsx.utils.sheet_to_json(sheet);
      data.forEach(row => {
        processRow({
          brand_name: row['品牌名称'],
          note: '',
          publish_date: row['发布日期'],
          amount: row['金额'],
          statusStr: '已结款',
          settlement_date: row['结款时间'], 
          contact_pr: row['对接pr']
        });
      });
    }

    // Sheet 3 (multi-account)
    if (workbook.SheetNames.length > 2) {
      const sheet = workbook.Sheets[workbook.SheetNames[2]];
      const data = xlsx.utils.sheet_to_json(sheet);
      data.forEach(row => {
        processRow({
          brand_name: row['名称'],
          note: '',
          publish_date: row['日期'],
          amount: row['金额'],
          statusStr: '',
          account_name: row['账号']
        });
      });
    }
    
  } catch (err) {
    errors.push(`Failed to read Excel file: ${err.message}`);
  }
  
  return { imported, errors };
}

export { importExcelFile }
