const pool = require('../config/db');
exports.findByEmail = async (email) => (await pool.query('SELECT * FROM users WHERE email = ?', [email]))[0][0] || null;
exports.findById = async (id) => (await pool.query('SELECT id, name, email, role FROM users WHERE id = ?', [id]))[0][0] || null;
exports.getHash = async (id) => (await pool.query('SELECT password_hash FROM users WHERE id = ?', [id]))[0][0]?.password_hash;
exports.updatePassword = (id, hash) => pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);
