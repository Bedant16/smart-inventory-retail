import { useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { api, notifyChange } from '../services/api.js';
import Async from '../components/Async.jsx';
import Modal, { Field } from '../components/Modal.jsx';
import { dateTime, money2, txnId } from '../utils/format.js';

function SaleForm({ products, onClose, onSaved }) {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const p = products.find((x) => String(x.id) === productId);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { await api.post('/sales', { product_id: productId, quantity }); notifyChange(); onSaved(); }
    catch (err) { setError(err.message); setBusy(false); }
  }
  return (
    <Modal title="Record sale" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <Field label="Product"><select value={productId} onChange={(e) => setProductId(e.target.value)} required>
          <option value="">Select…</option>{products.map((x) => <option key={x.id} value={x.id} disabled={x.current_stock === 0}>{x.name} ({x.current_stock} in stock)</option>)}</select></Field>
        <Field label="Quantity" hint={p ? `${money2(p.price)} each. ${p.current_stock} ${p.unit} available.` : ''}>
          <input type="number" min="1" step="1" max={p?.current_stock} value={quantity} onChange={(e) => setQuantity(e.target.value)} required /></Field>
        {p && Number(quantity) > 0 && <div className="total">Total <strong>{money2(p.price * Number(quantity))}</strong></div>}
        {error && <div className="notice error">{error}</div>}
        <div className="form-actions"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Record sale'}</button></div>
      </form>
    </Modal>
  );
}

export default function Sales() {
  const [open, setOpen] = useState(false);
  const list = useApi('/sales?limit=150');
  const products = useApi('/products');
  return (
    <>
      <div className="toolbar"><span className="grow muted">Most recent 150 sales</span>
        <button className="btn primary" onClick={() => setOpen(true)} disabled={!products.data}>Record sale</button></div>
      <div className="card flush"><Async state={list}>{(rows) => (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Date</th><th>Product</th><th className="r">Quantity</th><th className="r">Revenue</th><th>Transaction ID</th><th>Sold by</th></tr></thead>
          <tbody>{rows.map((s) => (
            <tr key={s.id}><td>{dateTime(s.sold_at)}</td><td><strong>{s.product_name}</strong></td><td className="r num">{s.quantity}</td>
              <td className="r num">{money2(s.total_amount)}</td><td className="mono">{txnId(s.id)}</td><td>{s.sold_by_name || '—'}</td></tr>
          ))}{rows.length === 0 && <tr><td colSpan={6} className="empty">No sales recorded yet.</td></tr>}</tbody>
        </table></div>
      )}</Async></div>
      {open && <SaleForm products={products.data} onClose={() => setOpen(false)} onSaved={() => { setOpen(false); list.reload(); products.reload(); }} />}
    </>
  );
}
