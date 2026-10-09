const pool = require('../config/db');
exports.insert = async (s, db) => (await db.query(
  'INSERT INTO sales (product_id, quantity, unit_price, total_amount, sold_by) VALUES (?,?,?,?,?)',
  [s.product_id, s.quantity, s.unit_price, s.total_amount, s.sold_by]))[0].insertId;
exports.list = async ({ productId, limit }, db = pool) => {
  const [rows] = await db.query(
    `SELECT s.id, s.product_id, p.name AS product_name, p.sku, s.quantity, s.unit_price, s.total_amount, s.sold_at, u.name AS sold_by_name
     FROM sales s JOIN products p ON p.id = s.product_id LEFT JOIN users u ON u.id = s.sold_by
     ${productId ? 'WHERE s.product_id = ?' : ''} ORDER BY s.sold_at DESC, s.id DESC LIMIT ?`,
    productId ? [productId, limit] : [limit]);
  return rows;
};
