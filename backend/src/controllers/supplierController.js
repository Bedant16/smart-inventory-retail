const s = require('../services/supplierService');
const v = require('../utils/validate');
exports.list = async (req, res) => res.json(await s.list());
exports.create = async (req, res) => res.status(201).json(await s.create(req.body));
exports.update = async (req, res) => res.json(await s.update(v.int(req.params.id, 'id', { min: 1 }), req.body));
