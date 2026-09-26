// Preview policy: inclusive calendar days. Clinic work schedules are not connected.
function utcDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
  const n = Date.parse(value + 'T00:00:00Z');
  return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === value ? n : null;
}
export function calculateLeaveDays(type, start, end) {
  const first = utcDay(start);
  if (first === null) return null;
  if (type === '오전 반차' || type === '오후 반차') return 0.5;
  const last = utcDay(end);
  if (last === null || last < first) return null;
  return (last - first) / 86400000 + 1;
}
