const env = require('../config/env');
const productRepo = require('../repositories/productRepository');
const alertRepo = require('../repositories/alertRepository');
const repo = require('../repositories/dashboardRepository');
const { analyze } = require('./stockAnalysis');

const round2 = (n) => Math.round(n * 100) / 100;
const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

exports.summary = async () => {
  const products = (await productRepo.findAll({ windowDays: env.velocityWindowDays })).map(analyze);
  const t = await repo.salesTotals();
  const count = (s) => products.filter((p) => p.stock_status === s).length;
  return {
    total_products: products.length,
    inventory_value: round2(products.reduce((s, p) => s + p.current_stock * p.cost_price, 0)),
    low_stock: count('LOW'),
    critical: count('CRITICAL'),
    stockout_risk: count('STOCKOUT_RISK'),
    open_alerts: await alertRepo.countOpen(),
    sales: {
      today: { revenue: t.today_revenue, orders: t.today_orders },
      week: { revenue: t.week_revenue, orders: t.week_orders },
      month: { revenue: t.month_revenue, orders: t.month_orders },
    },
  };
};

exports.sales = async (days) => {
  const rows = new Map((await repo.dailySales(days)).map((r) => [r.date, r]));
  const out = [], d = new Date();
  d.setDate(d.getDate() - (days - 1));
  for (let i = 0; i < days; i++, d.setDate(d.getDate() + 1)) {
    const key = localDate(d), r = rows.get(key);
    out.push({ date: key, revenue: r ? Number(r.revenue) : 0, units: r ? Number(r.units) : 0 });
  }
  return out;
};
exports.stock = () => repo.stockByCategory();
exports.topProducts = (days, limit) => repo.topProducts(days, limit);
