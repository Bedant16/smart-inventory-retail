import { createContext, useContext, useEffect, useState } from 'react';
import { api, setToken } from '../services/api.js';

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(Boolean(localStorage.getItem('token')));

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api.get('/auth/me').then(setUser).catch(() => setToken(null)).finally(() => setBooting(false));
  }, []);
  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const login = async (email, password) => {
    const r = await api.post('/auth/login', { email, password });
    setToken(r.token);
    setUser(r.user);
  };
  const logout = () => { setToken(null); setUser(null); };
  const canEdit = Boolean(user && ['ADMIN', 'MANAGER'].includes(user.role));

  return <Ctx.Provider value={{ user, booting, login, logout, canEdit }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
