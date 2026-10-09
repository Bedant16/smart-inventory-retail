import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi.js';
import { useAuth } from '../hooks/useAuth.jsx';
import { api, notifyChange } from '../services/api.js';
import Async from '../components/Async.jsx';
import { SeverityBadge } from '../components/StatusBadge.jsx';
import { dateTime } from '../utils/format.js';

export default function Alerts() {
  const { canEdit } = useAuth();
  const [tab, setTab] = useState('open');
  const [error, setError] = useState('');
  const list = useApi(`/alerts?resolved=${tab === 'resolved'}&limit=200`);

  async function resolve(a) {
    setError('');
    try { await api.put(`/alerts/${a.id}/resolve`); notifyChange(); list.reload(); } catch (e) { setError(e.message); }
  }
  return (
    <>
      <div className="toolbar">
        <div className="tabs" role="tablist">
          <button role="tab" aria-selected={tab === 'open'} className={tab === 'open' ? 'on' : ''} onClick={() => setTab('open')}>Open{tab === 'open' && list.data ? ` (${list.data.items.length})` : ''}</button>
          <button role="tab" aria-selected={tab === 'resolved'} className={tab === 'resolved' ? 'on' : ''} onClick={() => setTab('resolved')}>Resolved</button>
        </div>
        <span className="grow muted small">Alerts are raised and cleared automatically as stock and sales change.</span>
      </div>
      {error && <div className="notice error">{error}</div>}
      <div className="card flush"><Async state={list}>{(d) => (
        <div className="table-wrap"><table className="table">
          <thead><tr><th>Severity</th><th>Product</th><th>Alert</th><th>{tab === 'open' ? 'Raised' : 'Resolved'}</th>{tab === 'open' && canEdit && <th />}{tab === 'resolved' && <th>How</th>}</tr></thead>
          <tbody>{d.items.map((a) => (
            <tr key={a.id}><td><SeverityBadge severity={a.severity} /></td>
              <td><Link to={`/products/${a.product_id}`} className="link"><strong>{a.product_name}</strong></Link></td><td className="wide">{a.message}</td>
              <td>{dateTime(tab === 'open' ? a.created_at : a.resolved_at)}</td>
              {tab === 'open' && canEdit && <td className="actions"><button className="btn sm" onClick={() => resolve(a)}>Resolve</button></td>}
              {tab === 'resolved' && <td>{a.resolution === 'MANUAL' ? 'Marked resolved' : 'Stock recovered'}</td>}</tr>
          ))}{d.items.length === 0 && <tr><td colSpan={6} className="empty">{tab === 'open' ? 'No open alerts. Every product is above its reorder level.' : 'No resolved alerts yet.'}</td></tr>}</tbody>
        </table></div>
      )}</Async></div>
    </>
  );
}
