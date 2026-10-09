// Renders children(data) once loaded, with consistent loading and error states.
export default function Async({ state, children }) {
  if (state.error && !state.data) {
    return <div className="notice error">{state.error} <button className="btn sm" onClick={state.reload}>Try again</button></div>;
  }
  if (!state.data) return <div className="muted pad">Loading…</div>;
  return children(state.data);
}
