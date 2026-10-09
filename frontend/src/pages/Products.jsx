import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useDebounce } from '../hooks/useDebounce.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { api, notifyChange } from '../services/api.js';
import Async from '../components/Async.jsx';
import ProductForm from '../components/ProductForm.jsx';
import { StockBadge } from '../components/StatusBadge.jsx';
import { money2, num } from '../utils/format.js';

export default function Products() {
  const { canEdit } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('name');
  const [form, setForm] = useState(null); // null = closed, {} = new, product = edit
  const [notice, setNotice] = useState('');
  useEffect(() => setSearch(params.get('search') || ''), [params]);

  const q = useDebounce(search.trim());
  const qs = new URLSearchParams({ sort, ...(q && { search: q }), ...(category && { category_id: category }), ...(status && { status }) });
  const list = useApi(`/products?${qs}`);
  const cats = useApi('/categories');
  const sups = useApi('/suppliers');

  async function remove(p) {
    if (!window.confirm(`Delete ${p.name}? Products with sales or stock history are archived instead of deleted.`)) return;
    try {
      const r = await api.del(`/products/${p.id}`);
      setNotice(r.discontinued ? `${p.name} has history, so it was marked discontinued.` : `${p.name} was deleted.`);
      notifyChange(); list.reload();
    } catch (e) { setNotice(e.message); }
  }

  return (
    <>
      <div className="toolbar">
        <input className="grow" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or SKU" aria-label="Search" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category">
          <option value="">All categories</option>{cats.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Stock status">
          <option value="">All stock levels</option><option value="HEALTHY">Healthy</option><option value="LOW">Low stock</option>
          <option value="CRITICAL">Critical</option><option value="STOCKOUT_RISK">Stockout risk</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort by">
          <option value="name">Sort: Name</option><option value="status">Sort: Most urgent</option><option value="days">Sort: Days left</option>
          <option value="stock">Sort: Stock</option><option value="price">Sort: Price</option><option value="sku">Sort: SKU</option>
        </select>
        {canEdit && <button className="btn primary" onClick={() => setForm({})} disabled={!cats.data || !sups.data}>Add product</button>}
      </div>
      {notice && <div className="notice info" role="status">{notice} <button className="btn ghost sm" onClick={() => setNotice('')}>Dismiss</button></div>}

      <div className="card flush">
        <Async state={list}>{(rows) => (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>SKU</th><th>Product</th><th>Category</th><th className="r">Stock</th><th className="r">Reorder level</th><th className="r">Price</th><th>Status</th>{canEdit && <th />}</tr></thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="click" onClick={() => nav(`/products/${p.id}`)}>
                    <td className="mono">{p.sku}</td><td><strong>{p.name}</strong></td><td>{p.category_name}</td>
                    <td className="r num">{num(p.current_stock)} <span className="muted">{p.unit}</span></td>
                    <td className="r num">{num(p.reorder_level)}</td><td className="r num">{money2(p.price)}</td>
                    <td><StockBadge status={p.stock_status} /></td>
                    {canEdit && (
                      <td className="actions" onClick={(e) => e.stopPropagation()}>
                        <button className="btn sm" onClick={() => setForm(p)}>Edit</button>
                        <button className="btn sm danger-text" onClick={() => remove(p)}>Delete</button>
                      </td>
                    )}
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={8} className="empty">No products match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
        )}</Async>
      </div>
      {form && <ProductForm product={form.id ? form : null} categories={cats.data} suppliers={sups.data} onClose={() => setForm(null)} onSaved={() => { setForm(null); list.reload(); }} />}
    </>
  );
}
