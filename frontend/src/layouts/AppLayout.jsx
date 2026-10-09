import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useApi } from '../hooks/useApi.js';

const NAV = [['dashboard', 'Dashboard'], ['products', 'Products'], ['inventory', 'Inventory'], ['sales', 'Sales'], ['suppliers', 'Suppliers'], ['alerts', 'Alerts']];
const TITLES = { dashboard: 'Dashboard', products: 'Products', inventory: 'Inventory movements', sales: 'Sales', suppliers: 'Suppliers', alerts: 'Alerts', settings: 'Settings' };

export default function AppLayout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const alerts = useApi('/alerts?limit=1');
  const seg = pathname.split('/')[1];
  const title = seg === 'products' && pathname.split('/')[2] ? 'Product details' : TITLES[seg] || 'Not found';
  const openCount = alerts.data?.open_count ?? 0;

  useEffect(() => {
    window.addEventListener('inventory:changed', alerts.reload);
    return () => window.removeEventListener('inventory:changed', alerts.reload);
  }, [alerts.reload]);
  useEffect(() => { document.title = `${title} · Retail Inventory`; }, [title]);

  const search = (e) => { e.preventDefault(); nav(`/products?search=${encodeURIComponent(q.trim())}`); };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Retail Inventory</div>
        <nav>
          {NAV.map(([to, label]) => (
            <NavLink key={to} to={`/${to}`} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
              {label}{to === 'alerts' && openCount > 0 && <span className="nav-count">{openCount}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-foot">
          <NavLink to="/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>Settings</NavLink>
          <Link to="/settings" className="me">
            <span className="avatar">{user.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</span>
            <span><strong>{user.name}</strong><small>{user.role.charAt(0) + user.role.slice(1).toLowerCase()}</small></span>
          </Link>
        </div>
      </aside>
      <div className="main">
        <header className="topbar">
          <h1>{title}</h1>
          <form onSubmit={search} className="search" role="search">
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products by name or SKU" aria-label="Search products" />
          </form>
          <Link to="/alerts" className="bell" aria-label={`${openCount} open alerts`} title={`${openCount} open alerts`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
            {openCount > 0 && <span className="bell-count">{openCount}</span>}
          </Link>
        </header>
        <main className="content"><Outlet /></main>
      </div>
    </div>
  );
}
