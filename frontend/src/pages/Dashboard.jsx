import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import Async from '../components/Async.jsx';
import LineChart from '../components/LineChart.jsx';
import BarList from '../components/BarList.jsx';
import { SeverityBadge } from '../components/StatusBadge.jsx';
import { money, num } from '../utils/format.js';

const Stat = ({ label, value, sub, tone }) => (
  <div className="card stat"><div className="label">{label}</div><div className={`value ${tone || ''}`}>{value}</div>{sub && <div className="sub">{sub}</div>}</div>
);

export default function Dashboard() {
  const summary = useApi('/dashboard/summary');
  const sales = useApi('/dashboard/sales?days=30');
  const stock = useApi('/dashboard/stock');
  const top = useApi('/dashboard/top-products?days=30&limit=6');
  const alerts = useApi('/alerts?limit=8');

  return (
    <div className="dash">
      <div className="dash-main">
        <section>
          <h2 className="section-title">Inventory overview</h2>
          <Async state={summary}>{(s) => (
            <div className="stat-grid">
              <Stat label="Total products" value={num(s.total_products)} />
              <Stat label="Inventory value" value={money(s.inventory_value)} sub="At cost price" />
              <Stat label="Low stock items" value={num(s.low_stock)} sub={s.stockout_risk ? `${s.stockout_risk} at stockout risk` : 'Below reorder level'} tone={s.low_stock ? 'warn' : ''} />
              <Stat label="Critical items" value={num(s.critical)} sub="At or below minimum" tone={s.critical ? 'danger' : ''} />
            </div>
          )}</Async>
        </section>

        <section>
          <h2 className="section-title">Sales overview</h2>
          <Async state={summary}>{(s) => (
            <div className="stat-grid three">
              <Stat label="Today" value={money(s.sales.today.revenue)} sub={`${num(s.sales.today.orders)} sales`} />
              <Stat label="This week" value={money(s.sales.week.revenue)} sub={`${num(s.sales.week.orders)} sales since Monday`} />
              <Stat label="This month" value={money(s.sales.month.revenue)} sub={`${num(s.sales.month.orders)} sales`} />
            </div>
          )}</Async>
        </section>

        <section className="card">
          <h3>Daily sales revenue, last 30 days</h3>
          <Async state={sales}>{(d) => <LineChart data={d} xKey="date" yKey="revenue" />}</Async>
        </section>

        <section className="grid-2">
          <div className="card">
            <h3>Stock value by category</h3>
            <Async state={stock}>{(d) => <BarList items={d} labelKey="category" valueKey="value" format={money} />}</Async>
          </div>
          <div className="card">
            <h3>Top selling products, 30 days</h3>
            <Async state={top}>{(d) => d.length ? <BarList items={d} labelKey="name" valueKey="units" format={(n) => `${num(n)} units`} /> : <p className="muted">No sales in this period.</p>}</Async>
          </div>
        </section>
      </div>

      <aside className="card alert-panel">
        <div className="panel-head"><h3>Inventory alerts</h3><Link to="/alerts" className="link">View all</Link></div>
        <Async state={alerts}>{(d) => d.items.length === 0 ? (
          <p className="muted">No open alerts. All stock levels are within their thresholds.</p>
        ) : (
          <ul className="alert-list">
            {d.items.map((a) => (
              <li key={a.id}>
                <SeverityBadge severity={a.severity} />
                <Link to={`/products/${a.product_id}`} className="alert-name">{a.product_name}</Link>
                <p>{a.message}</p>
              </li>
            ))}
            {d.open_count > d.items.length && <li className="muted small">{d.open_count - d.items.length} more open alerts</li>}
          </ul>
        )}</Async>
      </aside>
    </div>
  );
}
