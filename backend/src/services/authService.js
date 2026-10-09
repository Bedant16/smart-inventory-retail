const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const users = require('../repositories/userRepository');
const v = require('../utils/validate');
const { HttpError } = require('../utils/errors');

exports.login = async (body) => {
  const email = v.str(body.email, 'Email').toLowerCase();
  const password = v.str(body.password, 'Password');
  const u = await users.findByEmail(email);
  if (!u || !(await bcrypt.compare(password, u.password_hash))) throw new HttpError(401, 'Invalid email or password');
  const user = { id: u.id, name: u.name, email: u.email, role: u.role };
  return { token: jwt.sign(user, env.jwtSecret, { expiresIn: env.jwtExpires }), user };
};
exports.me = async (id) => {
  const u = await users.findById(id);
  if (!u) throw new HttpError(401, 'Account no longer exists');
  return u;
};
exports.changePassword = async (id, body) => {
  const current = v.str(body.current_password, 'Current password');
  const next = v.str(body.new_password, 'New password', { max: 72 });
  if (next.length < 8) v.fail('New password must be at least 8 characters');
  if (!(await bcrypt.compare(current, await users.getHash(id)))) throw new HttpError(400, 'Current password is incorrect');
  await users.updatePassword(id, await bcrypt.hash(next, 10));
  return { ok: true };
};
