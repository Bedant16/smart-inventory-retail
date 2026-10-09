const { HttpError } = require('./errors');
const fail = (msg) => { throw new HttpError(400, msg); };
const blank = (v) => v === undefined || v === null || String(v).trim() === '';

exports.fail = fail;
exports.str = (v, name, { max = 255, required = true } = {}) => {
  if (blank(v)) { if (required) fail(`${name} is required`); return null; }
  const s = String(v).trim();
  if (s.length > max) fail(`${name} must be at most ${max} characters`);
  return s;
};
exports.int = (v, name, { min = 0, max = 1e9, required = true } = {}) => {
  if (blank(v)) { if (required) fail(`${name} is required`); return null; }
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) fail(`${name} must be a whole number between ${min} and ${max}`);
  return n;
};
exports.money = (v, name) => {
  const n = Number(v);
  if (blank(v) || !Number.isFinite(n) || n < 0 || n > 1e7) fail(`${name} must be a number of 0 or more`);
  return Math.round(n * 100) / 100;
};
exports.oneOf = (v, name, list) => { if (!list.includes(v)) fail(`${name} must be one of: ${list.join(', ')}`); return v; };
exports.email = (v, name = 'Email', { required = true } = {}) => {
  const s = exports.str(v, name, { max: 150, required });
  if (s && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)) fail(`${name} is not a valid email address`);
  return s;
};
