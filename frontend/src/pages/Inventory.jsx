import { useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { api, notifyChange } from '../services/api.js';
import Async from '../components/Async.jsx';
import Modal, { Field } from '../components/Modal.jsx';
import { dateTime, reference } from '../utils/format.js';

function MovementForm({ products, onClose, onSaved }) {
  const [f, setF] = useState({ product_id: '', transaction_type: 'PURCHASE', quantity: '', notes: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const adj = f.transaction_type === 'ADJUSTMENT';

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { await api.post('/inventory/transaction', f); notifyChange(); onSaved(); }
    catch (err) { setError(err.message); setBusy(false); }
  }
  return (
    <Modal title="Record stock movement" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <Field label="Product"><select value={f.product_id} onChange={set('product_id')} required>
          <option value="">Select…</option>{products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.current_stock} in stock)</option>)}</select></Field>
        <Field label="Type"><select value={f.transaction_type} onChange={set('transaction_type')}>
          <option value="PURCHASE">Purchase (stock received)</option><option value="RETURN">Return (stock back from customer)</option><option value="ADJUSTMENT">Adjustment (correct a count)</option></select></Field>
        <Field label="Quantity" hint={adj ? 'Use a negative number to remove stock, e.g. -3 for damaged goods.' : 'Units added to stock.'}>
          <input type="number" step="1" value={f.quantity} onChange={set('quantity')} required /></Field>
        <Field label={adj ? 'Reason' : 'Note (optional)'}><input value={f.notes} onChange={set('notes')} maxLength={255} required={adj} /></Field>
        {error && <div className="notice error">{error}</div>}
        <div className="form-actions"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Record movement'}</button></div>
      </form>
    </Modal>
  );
}

export default function Inventory() {
  const { canEdit } = useAuth();
  const [type, setType] = useState('');
  const [product, setProduct] = useState('');
  const [open, setOpen] = useState(false);
  const list = useApi(`/inventory?limit=200${type ? `&type=${type}` : ''}${product ? `&product_id=${product}` : ''}`);
  const products = useApi('/products');

  return (
    <>
      <div className="toolbar">
        <select value={product} onChange={(e) => setProduct(e.target.value)} aria-label="Product">
          <option value="">All products</option>{products.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Transaction type">
          <option value="">All types</option><option value="SALE">Sale</option><option value="PURCHASE">Purchase</option><option value="RETURN">Return</option><option value="ADJUSTMENT">Adjustment</option></select>
        <span className="grow" />
        {canEdit && <button className="btn primary" onClick={() => setOpen(true)} disabled={!products.data}>Record movement</button>}
      </div>
      <div className="card flush"><Async state={list}>{(rows) => (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Date</th><th>Product</th><th>Transaction</th><th className="r">Quantity</th><th className="r">Previous stock</th><th className="r">New stock</th><th>Reference</th></tr></thead>
          <tbody>{rows.map((t) => (
            <tr key={t.id}><td>{dateTime(t.transaction_date)}</td><td><strong>{t.product_name}</strong></td><td>{t.transaction_type}</td>
              <td className={`r num ${t.quantity < 0 ? 'neg' : 'pos'}`}>{t.quantity > 0 ? '+' : ''}{t.quantity}</td>
              <td className="r num">{t.previous_stock}</td><td className="r num">{t.new_stock}</td><td className="mono">{reference(t)}</td></tr>
          ))}{rows.length === 0 && <tr><td colSpan={7} className="empty">No stock movements found.</td></tr>}</tbody>
        </table></div>
      )}</Async></div>
      {open && <MovementForm products={products.data} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); list.reload(); products.reload(); }} />}
    </>
  );
}
