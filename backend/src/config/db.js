const mysql = require('mysql2/promise');
const { db } = require('./env');

const pool = mysql.createPool({ ...db, waitForConnections: true, connectionLimit: 10, decimalNumbers: true });

// Runs fn(connection) inside one database transaction; rolls back on any error.
async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = pool;
module.exports.withTransaction = withTransaction;
