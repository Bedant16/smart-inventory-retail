import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';

// GET a path; keeps the previous data on screen while reloading.
export function useApi(path) {
  const [state, setState] = useState({ data: null, loading: Boolean(path), error: null });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!path) return;
    let live = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    api.get(path)
      .then((data) => live && setState({ data, loading: false, error: null }))
      .catch((e) => live && setState((s) => ({ ...s, loading: false, error: e.message })));
    return () => { live = false; };
  }, [path, tick]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  return { ...state, reload };
}
