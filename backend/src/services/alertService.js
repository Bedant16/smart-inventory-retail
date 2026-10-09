const pool = require('../config/db');
const env = require('../config/env');
const alerts = require('../repositories/alertRepository');
const products = require('../repositories/productRepository');
const { analyze } = require('./stockAnalysis');

const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

function describe(a) {
  const eta = a.days_until_stockout === null ? '' : ` Estimated stockout in ${plural(Math.max(1, Math.ceil(a.days_until_stockout)), 'day')}.`;
  const reorder = a.suggested_reorder_qty > 0 ? ` Reorder recommended: ${a.suggested_reorder_qty} ${a.unit}.` : '';
  switch (a.stock_status) {
    case 'CRITICAL':
      return { type: 'CRITICAL_STOCK', severity: 'CRITICAL',
        message: a.current_stock === 0 ? `Out of stock.${reorder}` : `Only ${a.current_stock} ${a.unit} remaining (minimum ${a.minimum_stock}).${eta}${reorder}` };
    case 'LOW':
      return { type: 'LOW_STOCK', severity: 'WARNING', message: `Stock is below reorder level (${a.current_stock} of ${a.reorder_level}).${eta}${reorder}` };
    case 'STOCKOUT_RISK':
      return { type: 'STOCKOUT_RISK', severity: 'WARNING',
        message: `Selling ${a.avg_daily_sales} per day; stock lasts about ${plural(Math.max(1, Math.ceil(a.days_until_stockout)), 'day')}.${reorder}` };
    default: return null;
  }
}

// Brings the alert table in line with the product's current stock state.
// Each product has at most one open alert. Alerts clear themselves when stock recovers.
// An alert resolved by hand is not re-raised unless the severity type changes or stock recovers first.
async function syncProduct(productId, db = pool) {
  const product = await products.findById(productId, env.velocityWindowDays, db);
  const open = await alerts.findOpen(productId, db);
  const desired = product && product.status === 'ACTIVE' ? describe(analyze(product)) : null;

  if (!desired) {
    if (open) await alerts.resolve(open.id, 'AUTO', db);
    else await alerts.clearManualFlag(productId, db);
    return;
  }
  if (open) return alerts.update(open.id, desired, open.alert_type !== desired.type, db);
  const last = await alerts.findLatest(productId, db);
  if (last && last.alert_type === desired.type && last.resolution === 'MANUAL') return;
  return alerts.insert(productId, desired, db);
}

async function syncAll() {
  const rows = await products.findAll({ windowDays: env.velocityWindowDays, includeDiscontinued: true });
  for (const p of rows) await syncProduct(p.id);
  return rows.length;
}

async function list(q) {
  const resolved = q.resolved === 'true';
  const limit = Math.min(Number(q.limit) || 100, 500);
  return { items: await alerts.list({ resolved, limit }), open_count: await alerts.countOpen() };
}

module.exports = { syncProduct, syncAll, list, describe };
