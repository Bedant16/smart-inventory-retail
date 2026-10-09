const router = require('express').Router();
const { authenticate, requireRole } = require('../middleware/auth');
const { asyncHandler: h } = require('../utils/errors');
const mgr = requireRole('ADMIN', 'MANAGER');
const p = require('../controllers/productController');
const inv = require('../controllers/inventoryController');
const sales = require('../controllers/salesController');
const sup = require('../controllers/supplierController');
const alert = require('../controllers/alertController');
const dash = require('../controllers/dashboardController');
const auth = require('../controllers/authController');

router.post('/auth/login', h(auth.login));
router.use(authenticate);
router.get('/auth/me', h(auth.me));
router.put('/auth/password', h(auth.changePassword));

router.get('/categories', h(p.categories));
router.get('/products', h(p.list));
router.get('/products/:id', h(p.get));
router.post('/products', mgr, h(p.create));
router.put('/products/:id', mgr, h(p.update));
router.delete('/products/:id', mgr, h(p.remove));

router.get('/inventory', h(inv.list));
router.get('/inventory/low-stock', h(inv.lowStock));
router.post('/inventory/transaction', mgr, h(inv.record));

router.get('/sales', h(sales.list));
router.post('/sales', h(sales.create));

router.get('/suppliers', h(sup.list));
router.post('/suppliers', mgr, h(sup.create));
router.put('/suppliers/:id', mgr, h(sup.update));

router.get('/alerts', h(alert.list));
router.put('/alerts/:id/resolve', mgr, h(alert.resolve));

router.get('/dashboard/summary', h(dash.summary));
router.get('/dashboard/sales', h(dash.sales));
router.get('/dashboard/stock', h(dash.stock));
router.get('/dashboard/top-products', h(dash.topProducts));

module.exports = router;
