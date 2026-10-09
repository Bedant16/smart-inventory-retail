const repo = require('../repositories/supplierRepository');
const v = require('../utils/validate');
const { HttpError } = require('../utils/errors');

const parse = (b) => ({
  name: v.str(b.name, 'Supplier name', { max: 150 }),
  contact_person: v.str(b.contact_person, 'Contact person', { max: 100, required: false }),
  email: v.email(b.email, 'Email', { required: false }),
  phone: v.str(b.phone, 'Phone', { max: 30, required: false }),
});
exports.list = () => repo.list();
exports.create = async (b) => ({ id: await repo.insert(parse(b)) });
exports.update = async (id, b) => {
  const r = await repo.update(id, parse(b));
  if (!r.affectedRows) throw new HttpError(404, 'Supplier not found');
  return { id };
};
