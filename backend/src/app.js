const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const pool = require('./config/db');
const routes = require('./routes');
const { notFound, handler } = require('./middleware/error');

const app = express();
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.get('/api/health', async (req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'ok', database: 'connected' }); }
  catch { res.status(503).json({ status: 'error', database: 'unreachable' }); }
});
app.use('/api', routes);
app.use(notFound);
app.use(handler);
module.exports = app;
