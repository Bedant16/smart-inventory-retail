import { useState } from 'react';
import Modal, { Field } from './Modal.jsx';
import { api, notifyChange } from '../services/api.js';

export default function ProductForm({ product, categories, suppliers, onClose, onSaved }) {
  const editing = Boolean(product?.id);
  const [f, setF] = useState({
    sku: product?.sku ?? '', name: product?.name ?? '', category_id: product?.category_id ?? '', supplier_id: product?.supplier_id ?? '',
    unit: product?.unit ?? 'pack', price: product?.price ?? '', cost_price: product?.cost_price ?? '',
    minimum_stock: product?.minimum_stock ?? '', reorder_level: product?.reorder_level ?? '', current_stock: 0, status: product?.status ?? 'ACTIVE',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      if (editing) await api.put(`/products/${product.id}`, f); else await api.post('/products', f);
      notifyChange(); onSaved();
    } catch (err) { setError(err.message); setBusy(false); }
  }

  return (
    <Modal title={editing ? 'Edit product' : 'Add product'} onClose={onClose}>
      <form onSubmit={submit} className="form">
        <div className="form-grid">
          <Field label="SKU"><input value={f.sku} onChange={set('sku')} required maxLength={40} /></Field>
          <Field label="Unit"><input value={f.unit} onChange={set('unit')} required maxLength={20} /></Field>
          <div className="span-2"><Field label="Product name"><input value={f.name} onChange={set('name')} required maxLength={150} /></Field></div>
          <Field label="Category">
            <select value={f.category_id} onChange={set('category_id')} required>
              <option value="">Select…</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Supplier">
            <select value={f.supplier_id ?? ''} onChange={set('supplier_id')}>
              <option value="">None</option>{suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Selling price (₹)"><input type="number" min="0" step="0.01" value={f.price} onChange={set('price')} required /></Field>
          <Field label="Cost price (₹)"><input type="number" min="0" step="0.01" value={f.cost_price} onChange={set('cost_price')} required /></Field>
          <Field label="Minimum stock" hint="At or below this level the product is critical."><input type="number" min="0" value={f.minimum_stock} onChange={set('minimum_stock')} required /></Field>
          <Field label="Reorder level" hint="At or below this level the product is low."><input type="number" min="0" value={f.reorder_level} onChange={set('reorder_level')} required /></Field>
          {editing ? (
            <Field label="Status"><select value={f.status} onChange={set('status')}><option value="ACTIVE">Active</option><option value="DISCONTINUED">Discontinued</option></select></Field>
          ) : (
            <Field label="Opening stock" hint="Recorded as an adjustment in the stock ledger."><input type="number" min="0" value={f.current_stock} onChange={set('current_stock')} /></Field>
          )}
        </div>
        {editing && <p className="muted small">Current stock ({product.current_stock}) changes only through sales and stock movements.</p>}
        {error && <div className="notice error">{error}</div>}
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Add product'}</button>
        </div>
      </form>
    </Modal>
  );
}
