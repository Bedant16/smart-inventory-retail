import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { api } from '../services/api.js';

export default function Settings() {
  const { user, logout } = useAuth();
  const [f, setF] = useState({ current_password: '', new_password: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault(); setBusy(true); setMsg(null);
    try { await api.put('/auth/password', f); setMsg({ ok: true, text: 'Password updated.' }); setF({ current_password: '', new_password: '' }); }
    catch (err) { setMsg({ ok: false, text: err.message }); }
    setBusy(false);
  }
  return (
    <div className="narrow">
      <div className="card">
        <h3>Account</h3>
        <dl className="kvs"><div className="kv"><dt>Name</dt><dd>{user.name}</dd></div><div className="kv"><dt>Email</dt><dd>{user.email}</dd></div>
          <div className="kv"><dt>Role</dt><dd>{user.role.charAt(0) + user.role.slice(1).toLowerCase()}</dd></div></dl>
        <button className="btn" onClick={logout}>Sign out</button>
      </div>
      <form className="card form" onSubmit={submit}>
        <h3>Change password</h3>
        <label className="field"><span>Current password</span><input type="password" value={f.current_password} onChange={set('current_password')} required /></label>
        <label className="field"><span>New password</span><input type="password" value={f.new_password} onChange={set('new_password')} required minLength={8} /><small>At least 8 characters.</small></label>
        {msg && <div className={`notice ${msg.ok ? 'info' : 'error'}`}>{msg.text}</div>}
        <div className="form-actions"><button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Update password'}</button></div>
      </form>
    </div>
  );
}
