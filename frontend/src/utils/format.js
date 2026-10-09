const inr0 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const inr2 = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 });
export const money = (n) => inr0.format(n ?? 0);
export const money2 = (n) => inr2.format(n ?? 0);
export const num = (n) => new Intl.NumberFormat('en-IN').format(n ?? 0);
export const dateTime = (s) => new Date(s).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
export const shortDate = (s) => new Date(`${s}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
export const days = (d) => (d == null ? 'No recent sales' : d < 1 ? 'Under 1 day' : `${d} days`);
export const txnId = (id) => `TXN-${String(id).padStart(6, '0')}`;
export const reference = (t) =>
  t.transaction_type === 'SALE' && t.reference_id ? txnId(t.reference_id)
  : t.transaction_type === 'PURCHASE' && t.reference_id ? `PO-${String(t.reference_id).padStart(4, '0')}`
  : t.notes || '—';
