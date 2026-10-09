const s = require('../services/salesService');
exports.list = async (req, res) => res.json(await s.list(req.query));
exports.create = async (req, res) => res.status(201).json(await s.create(req.body, req.user));
