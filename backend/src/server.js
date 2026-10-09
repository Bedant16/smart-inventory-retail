const env = require('./config/env');
const pool = require('./config/db');
const app = require('./app');
const alertService = require('./services/alertService');

(async () => {
  try {
    await pool.query('SELECT 1');
  } catch (err) {
    console.error(`Cannot connect to MySQL at ${env.db.host}:${env.db.port} (database "${env.db.database}"): ${err.message}`);
    console.error('Check that MySQL is running, schema.sql and seed.sql were applied, and backend/.env is correct.');
    process.exit(1);
  }
  const n = await alertService.syncAll();
  app.listen(env.port, () => console.log(`API on http://localhost:${env.port} (alerts checked for ${n} products)`));
})();
