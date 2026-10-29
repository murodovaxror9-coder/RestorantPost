import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Wallet, ShoppingBag, Receipt, Armchair, Clock, CalendarDays, TrendingDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatCard, Card, Badge, Avatar } from '../components/ui';
import { money, fmtNum, toDateKey, isToday, fmtTime, minutesSince, calcOrder } from '../utils/format';
import { getTableStatus } from '../utils/tables';
import { ROLES } from '../data/navigation';
import { ORDER_TYPES } from '../data/labels';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
const short = (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}K` : v);

export default function Dashboard() {
  const { state } = useApp();
  const navigate = useNavigate();
  const { tables, staff, reservations, expenses, branches, settings } = state;
  const orders = state.orders.filter((o) => o.branchId === state.branchId);

  const d = useMemo(() => {
    const paid = orders.filter((o) => o.status === 'paid');
    const today = paid.filter((o) => isToday(o.paidAt));
    const revenueToday = today.reduce((s, o) => s + o.total, 0);
    const yKey = toDateKey(Date.now() - 86400000);
    const revenueYesterday = paid.filter((o) => toDateKey(o.paidAt) === yKey).reduce((s, o) => s + o.total, 0);
    const expensesToday = expenses.filter((e) => isToday(e.date)).reduce((s, e) => s + e.amount, 0);

    const days = Array.from({ length: 14 }, (_, i) => toDateKey(Date.now() - (13 - i) * 86400000));
    const byDay = Object.fromEntries(days.map((k) => [k, 0]));
    paid.forEach((o) => {
      const k = toDateKey(o.paidAt);
      if (k in byDay) byDay[k] += o.total;
    });
    const trend = days.map((k) => ({ day: `${k.slice(8)}.${k.slice(5, 7)}`, revenue: byDay[k] }));

    const itemMap = {};
    paid.forEach((o) => o.items.forEach((i) => {
      if (i.status !== 'cancelled') itemMap[i.name] = (itemMap[i.name] || 0) + i.qty;
    }));
    const top = Object.entries(itemMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, value]) => ({ name, value }));

    const hourly = Array.from({ length: 14 }, (_, i) => i + 9).map((h) => ({
      hour: `${h}:00`,
      sum: today.filter((o) => new Date(o.paidAt).getHours() === h).reduce((s, o) => s + o.total, 0),
    }));

    const staffAct = staff
      .filter((s) => ['waiter', 'cashier'].includes(s.role))
      .map((s) => {
        const list = today.filter((o) => (s.role === 'waiter' ? o.waiterId === s.id : o.cashierId === s.id));
        return { ...s, count: list.length, sum: list.reduce((a, o) => a + o.total, 0) };
      })
      .sort((a, b) => b.sum - a.sum);

    return { revenueToday, revenueYesterday, countToday: today.length, avg: today.length ? revenueToday / today.length : 0, expensesToday, trend, top, hourly, staffAct };
  }, [orders, staff, expenses]);

  const active = orders.filter((o) => o.status === 'open' && o.onlineStatus !== 'pending');
  const busy = tables.filter((t) => getTableStatus(t, orders, reservations) === 'busy').length;
  const diff = d.revenueYesterday ? ((d.revenueToday - d.revenueYesterday) / d.revenueYesterday) * 100 : null;
  const todayRes = reservations.filter((r) => r.date === toDateKey(new Date()) && r.status !== 'cancelled').sort((a, b) => a.time.localeCompare(b.time));
  const lowStock = state.inventory.filter((i) => i.qty < i.min);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <StatCard label="Bugungi tushum" value={money(d.revenueToday)} icon={Wallet} color="blue" trend={diff} hint="kechaga nisbatan" />
        <StatCard label="Buyurtmalar" value={fmtNum(d.countToday)} icon={ShoppingBag} color="green" hint="bugun to'langan" />
        <StatCard label="O'rtacha chek" value={money(d.avg)} icon={Receipt} color="purple" />
        <StatCard label="Band stollar" value={`${busy} / ${tables.length}`} icon={Armchair} color="amber" hint={`${active.length} ta faol buyurtma`} />
        <StatCard label="Bugungi xarajat" value={money(d.expensesToday)} icon={TrendingDown} color="red" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card title="Savdo statistikasi (14 kun)" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={d.trend} margin={{ left: -10, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={short} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [money(v), 'Tushum']} />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Eng ko'p sotilgan taomlar">
          <div className="h-40">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={d.top} dataKey="value" nameKey="name" innerRadius={42} outerRadius={70} paddingAngle={2}>
                  {d.top.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v} dona`, 'Sotildi']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1.5 mt-2">
            {d.top.map((t, i) => (
              <li key={t.name} className="flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i] }} />
                <span className="flex-1 truncate">{t.name}</span>
                <span className="text-slate-500 tabular-nums">{t.value}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card title="Soatlar bo'yicha savdo (bugun)" className="lg:col-span-2">
          <div className="h-56">
            <ResponsiveContainer>
              <BarChart data={d.hourly} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="hour" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={short} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [money(v), 'Savdo']} />
                <Bar dataKey="sum" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Xodimlar faoliyati (bugun)">
          <ul className="space-y-3">
            {d.staffAct.map((s) => (
              <li key={s.id} className="flex items-center gap-3">
                <Avatar name={s.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{s.name}</div>
                  <div className="text-xs text-slate-400">{ROLES[s.role].label} · {s.count} buyurtma</div>
                </div>
                <div className="text-sm font-semibold tabular-nums">{money(s.sum)}</div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card title="Faol buyurtmalar" actions={<button type="button" className="text-sm text-blue-600" onClick={() => navigate('/cashier')}>Barchasi</button>}>
          <ul className="divide-y divide-slate-100">
            {active.slice(0, 6).map((o) => {
              const t = tables.find((x) => x.id === o.tableId);
              const ready = o.items.filter((i) => i.status === 'ready').length;
              return (
                <li key={o.id} className="py-2.5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">#{String(o.number).slice(-3)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{t ? t.name : ORDER_TYPES[o.type]}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1"><Clock size={11} /> {minutesSince(o.createdAt)} daq · {o.items.length} pozitsiya</div>
                  </div>
                  {ready > 0 && <Badge color="green">{ready} tayyor</Badge>}
                  <div className="text-sm font-semibold tabular-nums">{money(calcOrder(o, settings).total)}</div>
                </li>
              );
            })}
            {!active.length && <li className="py-6 text-center text-sm text-slate-400">Faol buyurtma yo'q</li>}
          </ul>
        </Card>

        <Card title="Bugungi bronlar" actions={<CalendarDays size={16} className="text-slate-400" />}>
          <ul className="space-y-2">
            {todayRes.map((r) => (
              <li key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                <div className="text-sm font-bold text-blue-600 w-12">{r.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{r.name}</div>
                  <div className="text-xs text-slate-400">{r.guests} kishi · {tables.find((t) => t.id === r.tableId)?.name}</div>
                </div>
              </li>
            ))}
            {!todayRes.length && <li className="py-6 text-center text-sm text-slate-400">Bugun bron yo'q</li>}
          </ul>
          {lowStock.length > 0 && (
            <button type="button" onClick={() => navigate('/inventory')} className="mt-4 w-full text-left p-3 rounded-xl bg-amber-50 text-amber-800 text-sm">
              ⚠️ Omborda {lowStock.length} ta mahsulot minimal zaxiradan kam
            </button>
          )}
        </Card>

        <Card title="Filiallar statistikasi">
          <ul className="space-y-3">
            {branches.map((b) => {
              const rev = b.id === 'b1' ? d.revenueToday : b.revenueToday;
              const max = Math.max(d.revenueToday, ...branches.map((x) => x.revenueToday || 0));
              return (
                <li key={b.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{b.name}</span>
                    <span className="tabular-nums text-slate-600">{money(rev)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${max ? (rev / max) * 100 : 0}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">Oxirgi yangilanish: {fmtTime(new Date())}</div>
        </Card>
      </div>
    </div>
  );
}
