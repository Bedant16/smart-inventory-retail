const s = require('../services/authService');
exports.login = async (req, res) => res.json(await s.login(req.body));
exports.me = async (req, res) => res.json(await s.me(req.user.id));
exports.changePassword = async (req, res) => res.json(await s.changePassword(req.user.id, req.body));
