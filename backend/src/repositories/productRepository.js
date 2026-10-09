const pool = require('../config/db');

// sold_qty = units sold in the last ? days; used by the stock analysis service.
const BASE = `
  SELECT p.id, p.sku, p.name, p.category_id, p.supplier_id, p.price, p.cost_price, p.current_stock,
         p.minimum_stock, p.reorder_level, p.unit, p.status, p.created_at, p.updated_at,
         c.name AS category_name, s.name AS supplier_name, COALESCE(v.qty, 0) AS sold_qty
  FROM products p
  JOIN categories c ON c.id = p.category_id
  LEFT JOIN suppliers s ON s.id = p.supplier_id
  LEFT JOIN (SELECT product_id, SUM(quantity) AS qty FROM sales
             WHERE sold_at >= NOW() - INTERVAL ? DAY GROUP BY product_id) v ON v.product_id = p.id`;

exports.findAll = async ({ windowDays, search, categoryId, includeDiscontinued }, db = pool) => {
  const where = [], params = [windowDays];
  if (!includeDiscontinued) where.push("p.status = 'ACTIVE'");
  if (search) { where.push('(p.name LIKE ? OR p.sku LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (categoryId) { where.push('p.category_id = ?'); params.push(categoryId); }
  const [rows] = await db.query(`${BASE}${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY p.name`, params);
  return rows;
};
exports.findById = async (id, windowDays, db = pool) => (await db.query(`${BASE} WHERE p.id = ?`, [windowDays, id]))[0][0] || null;
exports.lockById = async (id, db) =>
  (await db.query('SELECT id, name, price, current_stock, unit, status FROM products WHERE id = ? FOR UPDATE', [id]))[0][0] || null;
exports.setStock = (id, stock, db) => db.query('UPDATE products SET current_stock = ? WHERE id = ?', [stock, id]);
exports.insert = async (p, db = pool) => (await db.query(
  `INSERT INTO products (sku, name, category_id, supplier_id, price, cost_price, current_stock, minimum_stock, reorder_level, unit)
   VALUES (?,?,?,?,?,?,?,?,?,?)`,
  [p.sku, p.name, p.category_id, p.supplier_id, p.price, p.cost_price, p.current_stock, p.minimum_stock, p.reorder_level, p.unit]))[0].insertId;
exports.update = async (id, p, db = pool) => (await db.query(
  `UPDATE products SET sku=?, name=?, category_id=?, supplier_id=?, price=?, cost_price=?, minimum_stock=?, reorder_level=?, unit=?, status=? WHERE id=?`,
  [p.sku, p.name, p.category_id, p.supplier_id, p.price, p.cost_price, p.minimum_stock, p.reorder_level, p.unit, p.status, id]))[0];
exports.remove = (id, db = pool) => db.query('DELETE FROM products WHERE id = ?', [id]);
exports.discontinue = (id, db = pool) => db.query("UPDATE products SET status = 'DISCONTINUED' WHERE id = ?", [id]);
exports.categories = async () => (await pool.query('SELECT id, name FROM categories ORDER BY name'))[0];
