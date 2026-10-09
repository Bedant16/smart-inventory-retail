const pool = require('../config/db');
exports.salesTotals = async () => (await pool.query(
  `SELECT
     COALESCE(SUM(CASE WHEN sold_at >= CURDATE() THEN total_amount END), 0) AS today_revenue,
     COUNT(CASE WHEN sold_at >= CURDATE() THEN 1 END) AS today_orders,
     COALESCE(SUM(CASE WHEN sold_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) THEN total_amount END), 0) AS week_revenue,
     COUNT(CASE WHEN sold_at >= DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) THEN 1 END) AS week_orders,
     COALESCE(SUM(CASE WHEN sold_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN total_amount END), 0) AS month_revenue,
     COUNT(CASE WHEN sold_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN 1 END) AS month_orders
   FROM sales WHERE sold_at >= CURDATE() - INTERVAL 40 DAY`))[0][0];
exports.dailySales = async (days) => (await pool.query(
  `SELECT DATE_FORMAT(sold_at, '%Y-%m-%d') AS date, SUM(total_amount) AS revenue, SUM(quantity) AS units
   FROM sales WHERE sold_at >= CURDATE() - INTERVAL ? DAY GROUP BY DATE_FORMAT(sold_at, '%Y-%m-%d')`, [days - 1]))[0];
exports.stockByCategory = async () => (await pool.query(
  `SELECT c.name AS category, COUNT(p.id) AS products, COALESCE(SUM(p.current_stock), 0) AS units,
          COALESCE(SUM(p.current_stock * p.cost_price), 0) AS value
   FROM categories c LEFT JOIN products p ON p.category_id = c.id AND p.status = 'ACTIVE'
   GROUP BY c.id, c.name ORDER BY value DESC`))[0];
exports.topProducts = async (days, limit) => (await pool.query(
  `SELECT p.id, p.name, p.sku, SUM(s.quantity) AS units, SUM(s.total_amount) AS revenue
   FROM sales s JOIN products p ON p.id = s.product_id WHERE s.sold_at >= NOW() - INTERVAL ? DAY
   GROUP BY p.id, p.name, p.sku ORDER BY units DESC LIMIT ?`, [days, limit]))[0];
