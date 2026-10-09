const s = require('../services/dashboardService');
const days = (q, def) => Math.min(Math.max(parseInt(q, 10) || def, 1), 365);
exports.summary = async (req, res) => res.json(await s.summary());
exports.sales = async (req, res) => res.json(await s.sales(days(req.query.days, 30)));
exports.stock = async (req, res) => res.json(await s.stock());
exports.topProducts = async (req, res) => res.json(await s.topProducts(days(req.query.days, 30), days(req.query.limit, 6)));
