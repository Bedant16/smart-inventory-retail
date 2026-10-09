const STOCK = { HEALTHY: ['ok', 'Healthy'], LOW: ['warn', 'Low stock'], CRITICAL: ['danger', 'Critical'], STOCKOUT_RISK: ['warn', 'Stockout risk'] };
export function StockBadge({ status }) {
  const [tone, label] = STOCK[status] || ['ok', status];
  return <span className={`badge ${tone}`}>{label}</span>;
}
export function SeverityBadge({ severity }) {
  return <span className={`badge ${severity === 'CRITICAL' ? 'danger' : 'warn'}`}>{severity === 'CRITICAL' ? 'Critical' : 'Warning'}</span>;
}
