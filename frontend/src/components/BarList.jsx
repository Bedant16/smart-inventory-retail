export default function BarList({ items, labelKey, valueKey, format }) {
  const max = Math.max(1, ...items.map((i) => i[valueKey]));
  return (
    <ul className="barlist">
      {items.map((i, n) => (
        <li key={n}>
          <div className="bl-head"><span>{i[labelKey]}</span><span className="num">{format(i[valueKey])}</span></div>
          <div className="bl-track"><div className="bl-fill" style={{ width: `${(i[valueKey] / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}
