const env = require('../config/env');
const { withTransaction } = require('../config/db');
const repo = require('../repositories/productRepository');
const txRepo = require('../repositories/transactionRepository');
const salesRepo = require('../repositories/salesRepository');
const alertService = require('./alertService');
const { analyze, RANK } = require('./stockAnalysis');
const v = require('../utils/validate');
const { HttpError } = require('../utils/errors');

const SORTS = {
  name: (a, b) => a.name.localeCompare(b.name),
  sku: (a, b) => a.sku.localeCompare(b.sku),
  stock: (a, b) => a.current_stock - b.current_stock,
  price: (a, b) => a.price - b.price,
  status: (a, b) => RANK[a.stock_status] - RANK[b.stock_status] || a.name.localeCompare(b.name),
  days: (a, b) => (a.days_until_stockout ?? Infinity) - (b.days_until_stockout ?? Infinity),
};

function parse(b) {
  const d = {
    sku: v.str(b.sku, 'SKU', { max: 40 }).toUpperCase(),
    name: v.str(b.name, 'Name', { max: 150 }),
    category_id: v.int(b.category_id, 'Category', { min: 1 }),
    supplier_id: v.int(b.supplier_id, 'Supplier', { min: 1, required: false }),
    price: v.money(b.price, 'Price'),
    cost_price: v.money(b.cost_price, 'Cost price'),
    minimum_stock: v.int(b.minimum_stock, 'Minimum stock'),
    reorder_level: v.int(b.reorder_level, 'Reorder level'),
    unit: v.str(b.unit || 'unit', 'Unit', { max: 20 }),
  };
  if (d.reorder_level < d.minimum_stock) v.fail('Reorder level must be at least the minimum stock');
  return d;
}

exports.list = async (q) => {
  const rows = await repo.findAll({
    windowDays: env.velocityWindowDays,
    search: q.search?.trim() || null,
    categoryId: q.category_id ? Number(q.category_id) : null,
    includeDiscontinued: q.include_discontinued === 'true',
  });
  let items = rows.map(analyze);
  if (q.status) items = items.filter((p) => p.stock_status === q.status);
  items.sort(SORTS[q.sort] || SORTS.name);
  if (q.order === 'desc') items.reverse();
  return items;
};

exports.get = async (id) => {
  const p = await repo.findById(id, env.velocityWindowDays);
  if (!p) throw new HttpError(404, 'Product not found');
  return {
    ...analyze(p),
    recent_transactions: await txRepo.list({ productId: id, limit: 10 }),
    recent_sales: await salesRepo.list({ productId: id, limit: 10 }),
  };
};

exports.create = async (body, user) => {
  const d = parse(body);
  const opening = v.int(body.current_stock ?? 0, 'Opening stock');
  return withTransaction(async (c) => {
    const id = await repo.insert({ ...d, current_stock: opening }, c);
    if (opening > 0) {
      await txRepo.insert({ product_id: id, type: 'ADJUSTMENT', quantity: opening, previous: 0, next: opening, notes: 'Opening stock', user_id: user.id }, c);
    }
    await alertService.syncProduct(id, c);
    return { id };
  });
};

exports.update = async (id, body) => {
  const d = { ...parse(body), status: v.oneOf(body.status || 'ACTIVE', 'Status', ['ACTIVE', 'DISCONTINUED']) };
  return withTransaction(async (c) => {
    const r = await repo.update(id, d, c);
    if (!r.affectedRows) throw new HttpError(404, 'Product not found');
    await alertService.syncProduct(id, c);
    return { id };
  });
};

// Products that have sales or stock history cannot be deleted without losing records, so they are archived instead.
exports.remove = async (id) => {
  const p = await repo.findById(id, env.velocityWindowDays);
  if (!p) throw new HttpError(404, 'Product not found');
  try { await repo.remove(id); return { deleted: true }; }
  catch (err) {
    if (err.code !== 'ER_ROW_IS_REFERENCED_2') throw err;
    await withTransaction(async (c) => { await repo.discontinue(id, c); await alertService.syncProduct(id, c); });
    return { discontinued: true };
  }
};

exports.categories = () => repo.categories();
