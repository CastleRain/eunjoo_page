/** Approved clinic policy: inclusive calendar dates, including weekends/holidays. */
export type LeaveType = '연차' | '오전 반차' | '오후 반차' | '병가' | '기타';

function utcDay(value: string | null | undefined): number | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const result = Date.parse(value + 'T00:00:00Z');
  return Number.isFinite(result) && new Date(result).toISOString().slice(0, 10) === value ? result : null;
}

export function calculateLeaveDays(type: string, start: string | null | undefined, end: string | null | undefined): number | null {
  const first = utcDay(start);
  if (first === null) return null;
  if (type === '오전 반차' || type === '오후 반차') return 0.5;
  const last = utcDay(end);
  if (last === null || last < first) return null;
  return (last - first) / 86_400_000 + 1;
}
