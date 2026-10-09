const pool = require('../config/db');
exports.list = async ({ resolved, limit }, db = pool) => (await db.query(
  `SELECT a.id, a.product_id, p.name AS product_name, p.sku, a.alert_type, a.severity, a.message, a.is_resolved, a.resolution, a.created_at, a.resolved_at
   FROM alerts a JOIN products p ON p.id = a.product_id WHERE a.is_resolved = ?
   ORDER BY ${resolved ? 'a.resolved_at DESC' : "FIELD(a.severity,'CRITICAL','WARNING'), a.created_at DESC"} LIMIT ?`,
  [resolved ? 1 : 0, limit]))[0];
exports.countOpen = async (db = pool) => (await db.query('SELECT COUNT(*) AS n FROM alerts WHERE is_resolved = 0'))[0][0].n;
exports.findOpen = async (pid, db = pool) => (await db.query('SELECT * FROM alerts WHERE product_id = ? AND is_resolved = 0 ORDER BY id DESC LIMIT 1', [pid]))[0][0] || null;
exports.findLatest = async (pid, db = pool) => (await db.query('SELECT * FROM alerts WHERE product_id = ? ORDER BY id DESC LIMIT 1', [pid]))[0][0] || null;
exports.insert = (pid, a, db = pool) => db.query('INSERT INTO alerts (product_id, alert_type, message, severity) VALUES (?,?,?,?)', [pid, a.type, a.message, a.severity]);
exports.update = (id, a, bumpTime, db = pool) => db.query(
  `UPDATE alerts SET alert_type=?, message=?, severity=?${bumpTime ? ', created_at=NOW()' : ''} WHERE id=?`, [a.type, a.message, a.severity, id]);
exports.resolve = async (id, kind, db = pool) => (await db.query(
  'UPDATE alerts SET is_resolved = 1, resolution = ?, resolved_at = NOW() WHERE id = ? AND is_resolved = 0', [kind, id]))[0];
exports.clearManualFlag = (pid, db = pool) => db.query("UPDATE alerts SET resolution = 'AUTO' WHERE product_id = ? AND resolution = 'MANUAL'", [pid]);
