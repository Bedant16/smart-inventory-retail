const s = require('../services/alertService');
const repo = require('../repositories/alertRepository');
const v = require('../utils/validate');
const { HttpError } = require('../utils/errors');
exports.list = async (req, res) => res.json(await s.list(req.query));
exports.resolve = async (req, res) => {
  const r = await repo.resolve(v.int(req.params.id, 'id', { min: 1 }), 'MANUAL');
  if (!r.affectedRows) throw new HttpError(404, 'Alert not found or already resolved');
  res.json({ ok: true });
};
