const s = require('../services/productService');
const v = require('../utils/validate');
const id = (req) => v.int(req.params.id, 'id', { min: 1 });
exports.list = async (req, res) => res.json(await s.list(req.query));
exports.get = async (req, res) => res.json(await s.get(id(req)));
exports.create = async (req, res) => res.status(201).json(await s.create(req.body, req.user));
exports.update = async (req, res) => res.json(await s.update(id(req), req.body));
exports.remove = async (req, res) => res.json(await s.remove(id(req)));
exports.categories = async (req, res) => res.json(await s.categories());
