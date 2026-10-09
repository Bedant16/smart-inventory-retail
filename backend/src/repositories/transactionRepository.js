const pool = require('../config/db');
exports.insert = (t, db) => db.query(
  `INSERT INTO inventory_transactions (product_id, transaction_type, quantity, previous_stock, new_stock, reference_id, notes, created_by)
   VALUES (?,?,?,?,?,?,?,?)`,
  [t.product_id, t.type, t.quantity, t.previous, t.next, t.reference_id ?? null, t.notes ?? null, t.user_id ?? null]);
exports.list = async ({ productId, type, limit }, db = pool) => {
  const where = [], params = [];
  if (productId) { where.push('t.product_id = ?'); params.push(productId); }
  if (type) { where.push('t.transaction_type = ?'); params.push(type); }
  params.push(limit);
  const [rows] = await db.query(
    `SELECT t.id, t.product_id, p.name AS product_name, p.sku, t.transaction_type, t.quantity, t.previous_stock,
            t.new_stock, t.reference_id, t.transaction_date, t.notes, u.name AS created_by_name
     FROM inventory_transactions t JOIN products p ON p.id = t.product_id LEFT JOIN users u ON u.id = t.created_by
     ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY t.transaction_date DESC, t.id DESC LIMIT ?`, params);
  return rows;
};
