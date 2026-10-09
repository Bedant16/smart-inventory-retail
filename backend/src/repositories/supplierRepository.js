const pool = require('../config/db');
exports.list = async () => (await pool.query(
  `SELECT s.id, s.name, s.contact_person, s.email, s.phone,
          (SELECT COUNT(*) FROM products p WHERE p.supplier_id = s.id AND p.status = 'ACTIVE') AS products_supplied,
          (SELECT COUNT(*) FROM purchase_orders po WHERE po.supplier_id = s.id AND po.status IN ('DRAFT','ORDERED')) AS open_orders
   FROM suppliers s ORDER BY s.name`))[0];
exports.insert = async (s) => (await pool.query(
  'INSERT INTO suppliers (name, contact_person, email, phone) VALUES (?,?,?,?)', [s.name, s.contact_person, s.email, s.phone]))[0].insertId;
exports.update = async (id, s) => (await pool.query(
  'UPDATE suppliers SET name=?, contact_person=?, email=?, phone=? WHERE id=?', [s.name, s.contact_person, s.email, s.phone, id]))[0];
