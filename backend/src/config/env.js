const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET. Copy backend/.env.example to backend/.env and fill it in.');
  process.exit(1);
}

module.exports = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpires: process.env.JWT_EXPIRES || '8h',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  velocityWindowDays: Number(process.env.VELOCITY_WINDOW_DAYS) || 14,
  stockoutRiskDays: Number(process.env.STOCKOUT_RISK_DAYS) || 3,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'retail_inventory',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },
};
