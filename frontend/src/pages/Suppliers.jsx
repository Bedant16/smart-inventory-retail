import { useState } from 'react';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../services/api.js';
import Async from '../components/Async.jsx';
import Modal, { Field } from '../components/Modal.jsx';

function SupplierForm({ supplier, onClose, onSaved }) {
  const [f, setF] = useState({ name: supplier?.name ?? '', contact_person: supplier?.contact_person ?? '', email: supplier?.email ?? '', phone: supplier?.phone ?? '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  async function submit(e) {
    e.preventDefault(); setBusy(true); setError('');
    try { if (supplier) await api.put(`/suppliers/${supplier.id}`, f); else await api.post('/suppliers', f); onSaved(); }
    catch (err) { setError(err.message); setBusy(false); }
  }
  return (
    <Modal title={supplier ? 'Edit supplier' : 'Add supplier'} onClose={onClose}>
      <form className="form" onSubmit={submit}>
        <Field label="Supplier name"><input value={f.name} onChange={set('name')} required maxLength={150} /></Field>
        <Field label="Contact person"><input value={f.contact_person} onChange={set('contact_person')} maxLength={100} /></Field>
        <div className="form-grid"><Field label="Email"><input type="email" value={f.email} onChange={set('email')} /></Field>
          <Field label="Phone"><input value={f.phone} onChange={set('phone')} maxLength={30} /></Field></div>
        {error && <div className="notice error">{error}</div>}
        <div className="form-actions"><button type="button" className="btn" onClick={onClose}>Cancel</button><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save supplier'}</button></div>
      </form>
    </Modal>
  );
}

export default function Suppliers() {
  const { canEdit } = useAuth();
  const list = useApi('/suppliers');
  const [form, setForm] = useState(null); // null closed, {} new, supplier edit
  return (
    <>
      <div className="toolbar"><span className="grow" />{canEdit && <button className="btn primary" onClick={() => setForm({})}>Add supplier</button>}</div>
      <div className="card flush"><Async state={list}>{(rows) => (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Supplier</th><th>Contact</th><th>Email</th><th>Phone</th><th className="r">Products supplied</th><th className="r">Open purchase orders</th>{canEdit && <th />}</tr></thead>
          <tbody>{rows.map((s) => (
            <tr key={s.id}><td><strong>{s.name}</strong></td><td>{s.contact_person || '—'}</td><td>{s.email || '—'}</td><td>{s.phone || '—'}</td>
              <td className="r num">{s.products_supplied}</td><td className="r num">{s.open_orders}</td>
              {canEdit && <td className="actions"><button className="btn sm" onClick={() => setForm(s)}>Edit</button></td>}</tr>
          ))}{rows.length === 0 && <tr><td colSpan={7} className="empty">No suppliers yet.</td></tr>}</tbody>
        </table></div>
      )}</Async></div>
      {form && <SupplierForm supplier={form.id ? form : null} onClose={() => setForm(null)} onSaved={() => { setForm(null); list.reload(); }} />}
    </>
  );
}
