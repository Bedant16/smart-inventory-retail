const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { HttpError } = require('../utils/errors');

exports.authenticate = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Authentication required'));
  try { req.user = jwt.verify(token, env.jwtSecret); next(); }
  catch { next(new HttpError(401, 'Session expired. Please sign in again.')); }
};

exports.requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(new HttpError(403, 'Your role does not allow this action'));
