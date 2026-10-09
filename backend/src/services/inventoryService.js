const env = require('../config/env');
const { withTransaction } = require('../config/db');
const productRepo = require('../repositories/productRepository');
const txRepo = require('../repositories/transactionRepository');
const alertService = require('./alertService');
const { analyze, RANK } = require('./stockAnalysis');
const v = require('../utils/validate');
const { HttpError } = require('../utils/errors');

exports.list = (q) => txRepo.list({
  productId: q.product_id ? Number(q.product_id) : null,
  type: q.type && ['SALE', 'PURCHASE', 'RETURN', 'ADJUSTMENT'].includes(q.type) ? q.type : null,
  limit: Math.min(Number(q.limit) || 200, 500),
});

exports.lowStock = async () => {
  const rows = await productRepo.findAll({ windowDays: env.velocityWindowDays });
  return rows.map(analyze).filter((p) => p.stock_status !== 'HEALTHY')
    .sort((a, b) => RANK[a.stock_status] - RANK[b.stock_status] || (a.days_until_stockout ?? Infinity) - (b.days_until_stockout ?? Infinity));
};

// Manual stock movement. Sales go through salesService so they always carry a sales record.
exports.record = async (body, user) => {
  const productId = v.int(body.product_id, 'Product', { min: 1 });
  const type = v.oneOf(body.transaction_type, 'Transaction type', ['PURCHASE', 'RETURN', 'ADJUSTMENT']);
  const quantity = v.int(body.quantity, 'Quantity', { min: -1e6, max: 1e6 });
  if (quantity === 0) v.fail('Quantity cannot be zero');
  if (type !== 'ADJUSTMENT' && quantity < 0) v.fail('Quantity must be positive for purchases and returns');
  const notes = v.str(body.notes, 'Reason', { max: 255, required: type === 'ADJUSTMENT' });

  return withTransaction(async (c) => {
    const p = await productRepo.lockById(productId, c);
    if (!p) throw new HttpError(404, 'Product not found');
    const next = p.current_stock + quantity;
    if (next < 0) throw new HttpError(409, `Stock cannot go below zero (currently ${p.current_stock} ${p.unit})`);
    await productRepo.setStock(productId, next, c);
    await txRepo.insert({ product_id: productId, type, quantity, previous: p.current_stock, next, notes, user_id: user.id }, c);
    await alertService.syncProduct(productId, c);
    return { product_id: productId, previous_stock: p.current_stock, new_stock: next };
  });
};
