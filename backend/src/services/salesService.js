const { withTransaction } = require('../config/db');
const productRepo = require('../repositories/productRepository');
const txRepo = require('../repositories/transactionRepository');
const salesRepo = require('../repositories/salesRepository');
const alertService = require('./alertService');
const v = require('../utils/validate');
const { HttpError } = require('../utils/errors');

exports.list = (q) => salesRepo.list({
  productId: q.product_id ? Number(q.product_id) : null,
  limit: Math.min(Number(q.limit) || 100, 500),
});

// One database transaction: sale row + stock decrease + ledger entry + alert refresh.
// The product row is locked so two simultaneous sales cannot oversell.
exports.create = async (body, user) => {
  const productId = v.int(body.product_id, 'Product', { min: 1 });
  const quantity = v.int(body.quantity, 'Quantity', { min: 1, max: 100000 });
  return withTransaction(async (c) => {
    const p = await productRepo.lockById(productId, c);
    if (!p) throw new HttpError(404, 'Product not found');
    if (p.status !== 'ACTIVE') throw new HttpError(409, 'This product is discontinued and cannot be sold');
    if (p.current_stock < quantity) throw new HttpError(409, `Only ${p.current_stock} ${p.unit} in stock`);
    const total = Math.round(p.price * quantity * 100) / 100;
    const saleId = await salesRepo.insert({ product_id: productId, quantity, unit_price: p.price, total_amount: total, sold_by: user.id }, c);
    const next = p.current_stock - quantity;
    await productRepo.setStock(productId, next, c);
    await txRepo.insert({ product_id: productId, type: 'SALE', quantity: -quantity, previous: p.current_stock, next, reference_id: saleId, user_id: user.id }, c);
    await alertService.syncProduct(productId, c);
    return { id: saleId, product_id: productId, quantity, total_amount: total, new_stock: next };
  });
};
