import { Link, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import Async from '../components/Async.jsx';
import { StockBadge } from '../components/StatusBadge.jsx';
import { days, dateTime, money2, num, reference, txnId } from '../utils/format.js';

const Row = ({ k, v }) => <div className="kv"><dt>{k}</dt><dd>{v}</dd></div>;

export default function ProductDetail() {
  const { id } = useParams();
  const state = useApi(`/products/${id}`);
  return (
    <>
      <p><Link to="/products" className="link">← All products</Link></p>
      <Async state={state}>{(p) => (
        <>
          <div className="detail-head">
            <div><h2>{p.name}</h2><span className="mono muted">{p.sku}</span></div>
            <StockBadge status={p.stock_status} />
          </div>
          <div className="grid-2">
            <div className="card">
              <h3>Stock and sales velocity</h3>
              <dl className="kvs">
                <Row k="Current stock" v={`${num(p.current_stock)} ${p.unit}`} />
                <Row k="Minimum stock" v={num(p.minimum_stock)} />
                <Row k="Reorder level" v={num(p.reorder_level)} />
                <Row k="Average daily sales" v={p.avg_daily_sales ? `${p.avg_daily_sales} ${p.unit}` : '—'} />
                <Row k="Estimated days until stockout" v={days(p.days_until_stockout)} />
                <Row k="Suggested reorder quantity" v={p.suggested_reorder_qty ? `${num(p.suggested_reorder_qty)} ${p.unit}` : 'Not needed'} />
              </dl>
              <p className="muted small">Daily sales are the units sold over the last 14 days divided by 14.</p>
            </div>
            <div className="card">
              <h3>Product information</h3>
              <dl className="kvs">
                <Row k="Category" v={p.category_name} />
                <Row k="Supplier" v={p.supplier_name || '—'} />
                <Row k="Selling price" v={money2(p.price)} />
                <Row k="Cost price" v={money2(p.cost_price)} />
                <Row k="Margin" v={p.price ? `${Math.round(((p.price - p.cost_price) / p.price) * 100)}%` : '—'} />
                <Row k="Listing" v={p.status === 'ACTIVE' ? 'Active' : 'Discontinued'} />
              </dl>
            </div>
          </div>
          <div className="grid-2">
            <div className="card flush"><h3 className="pad-h">Recent stock movements</h3>
              <div className="table-wrap"><table className="table compact">
                <thead><tr><th>Date</th><th>Type</th><th className="r">Qty</th><th className="r">New stock</th></tr></thead>
                <tbody>{p.recent_transactions.map((t) => (
                  <tr key={t.id}><td>{dateTime(t.transaction_date)}</td><td>{t.transaction_type}</td><td className="r num">{t.quantity > 0 ? '+' : ''}{t.quantity}</td><td className="r num">{t.new_stock}</td></tr>
                ))}{p.recent_transactions.length === 0 && <tr><td colSpan={4} className="empty">No movements yet.</td></tr>}</tbody>
              </table></div></div>
            <div className="card flush"><h3 className="pad-h">Recent sales</h3>
              <div className="table-wrap"><table className="table compact">
                <thead><tr><th>Date</th><th>Transaction</th><th className="r">Qty</th><th className="r">Revenue</th></tr></thead>
                <tbody>{p.recent_sales.map((s) => (
                  <tr key={s.id}><td>{dateTime(s.sold_at)}</td><td className="mono">{txnId(s.id)}</td><td className="r num">{s.quantity}</td><td className="r num">{money2(s.total_amount)}</td></tr>
                ))}{p.recent_sales.length === 0 && <tr><td colSpan={4} className="empty">No sales yet.</td></tr>}</tbody>
              </table></div></div>
          </div>
        </>
      )}</Async>
    </>
  );
}
