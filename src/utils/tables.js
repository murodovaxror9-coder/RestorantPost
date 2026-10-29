import { toDateKey } from './format';

export const TABLE_STATUS = {
  free: { label: "Bo'sh", cls: 'bg-white border-slate-200 text-slate-700 hover:border-blue-300' },
  busy: { label: 'Band', cls: 'bg-emerald-500 border-emerald-500 text-white' },
  reserved: { label: 'Bron', cls: 'bg-amber-400 border-amber-400 text-white' },
};

export function getTableStatus(table, orders, reservations) {
  if (orders.some((o) => o.status === 'open' && o.tableId === table.id && o.onlineStatus !== 'pending')) {
    return 'busy';
  }
  const today = toDateKey(new Date());
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const reserved = reservations.some((r) => {
    if (r.tableId !== table.id || r.date !== today) return false;
    if (!['pending', 'confirmed'].includes(r.status)) return false;
    const [h, m] = r.time.split(':').map(Number);
    const t = h * 60 + m;
    return t - nowMin <= 120 && nowMin - t <= 30;
  });
  return reserved ? 'reserved' : 'free';
}
