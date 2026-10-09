const s = require('../services/inventoryService');
exports.list = async (req, res) => res.json(await s.list(req.query));
exports.lowStock = async (req, res) => res.json(await s.lowStock());
exports.record = async (req, res) => res.status(201).json(await s.record(req.body, req.user));
