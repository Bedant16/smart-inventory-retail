// Rule-based inventory analytics (no machine learning).
//   average_daily_sales = units sold in the last N days / N
//   days_until_stockout = current_stock / average_daily_sales
const env = require('../config/env');

function analyze(p) {
  const avg = Number(p.sold_qty) / env.velocityWindowDays;
  const days = avg > 0 ? p.current_stock / avg : null;

  let status = 'HEALTHY';
  if (p.current_stock <= p.minimum_stock) status = 'CRITICAL';
  else if (p.current_stock <= p.reorder_level) status = 'LOW';
  else if (days !== null && days <= env.stockoutRiskDays) status = 'STOCKOUT_RISK';

  // Suggest enough stock for twice the reorder level, or two weeks of sales, whichever is larger.
  const target = Math.max(p.reorder_level * 2, Math.ceil(avg * 14));
  return {
    ...p,
    avg_daily_sales: Math.round(avg * 100) / 100,
    days_until_stockout: days === null ? null : Math.round(days * 10) / 10,
    stock_status: status,
    suggested_reorder_qty: status === 'HEALTHY' ? 0 : Math.max(0, target - p.current_stock),
  };
}
const RANK = { CRITICAL: 0, LOW: 1, STOCKOUT_RISK: 2, HEALTHY: 3 };
module.exports = { analyze, RANK };
