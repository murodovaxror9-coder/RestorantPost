import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Wallet, TrendingDown, TrendingUp, RotateCcw, Percent, Download, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Button, Tabs, Card, StatCard, Modal, Field, Badge } from '../components/ui';
import { money, fmtDateTime, fmtDate, toDateKey, startOfDayOffset, downloadCSV } from '../utils/format';
import { PAYMENT_LABELS, ORDER_TYPES, EXPENSE_CATEGORIES } from '../data/labels';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
const short = (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}K` : v);

export default function Finance() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [period, setPeriod] = useState(7);
  const [customFrom, setCustomFrom] = useState(toDateKey(Date.now() - 6 * 86400000));
  const [customTo, setCustomTo] = useState(toDateKey(new Date()));
  const [expOpen, setExpOpen] = useState(false);
  const [exp, setExp] = useState({ category: 'Kommunal', amount: '', note: '', date: toDateKey(new Date()) });

  const branchOrders = state.orders.filter((o) => o.branchId === state.branchId);

  const range = useMemo(() => {
    if (period === 'custom') {
      const from = new Date(customFrom);
      from.setHours(0, 0, 0, 0);
      const to = new Date(customTo);
      to.setHours(23, 59, 59, 999);
      return { from, to, days: Math.max(1, Math.round((to - from) / 86400000)) };
    }
    const from = startOfDayOffset(period - 1);
    return { from, to: new Date(), days: period };
  }, [period, customFrom, customTo]);

  const summarize = (from, to) => {
    const sold = branchOrders.filter((o) => ['paid', 'refunded'].includes(o.status) && new Date(o.paidAt) >= from && new Date(o.paidAt) <= to);
    const paid = sold.filter((o) => o.status === 'paid');
    const revenue = sold.reduce((s, o) => s + o.total, 0);
    const refunds = sold.filter((o) => o.status === 'refunded').reduce((s, o) => s + o.total, 0);
    const expenses = state.expenses.filter((e) => new Date(e.date) >= from && new Date(e.date) <= to);
    const expTotal = expenses.reduce((s, e) => s + e.amount, 0);
    return { revenue, refunds, expTotal, net: revenue - refunds - expTotal, count: paid.length };
  };

  // Oldingi davr (xuddi shu uzunlikdagi, undan oldingi) bilan solishtirish uchun
  const prevSummary = useMemo(() => {
    const prevTo = new Date(range.from.getTime() - 1);
    const prevFrom = new Date(range.from.getTime() - range.days * 86400000);
    return summarize(prevFrom, prevTo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, state.orders, state.expenses, state.branchId]);

  const d = useMemo(() => {
    const { from, to } = range;
    const sold = branchOrders.filter((o) => ['paid', 'refunded'].includes(o.status) && new Date(o.paidAt) >= from && new Date(o.paidAt) <= to);
    const paid = sold.filter((o) => o.status === 'paid');
    const revenue = sold.reduce((s, o) => s + o.total, 0);
    const refunds = sold.filter((o) => o.status === 'refunded').reduce((s, o) => s + o.total, 0);
    const discounts = sold.reduce((s, o) => s + (o.discountAmount || 0), 0);
    const service = paid.reduce((s, o) => s + (o.service || 0), 0);
    const expenses = state.expenses.filter((e) => new Date(e.date) >= from && new Date(e.date) <= to);
    const expTotal = expenses.reduce((s, e) => s + e.amount, 0);

    let chart;
    if (period === 1) {
      chart = Array.from({ length: 14 }, (_, i) => i + 9).map((h) => ({
        label: `${h}:00`,
        Tushum: paid.filter((o) => new Date(o.paidAt).getHours() === h).reduce((s, o) => s + o.total, 0),
        Xarajat: expenses.filter((e) => new Date(e.date).getHours() === h).reduce((s, e) => s + e.amount, 0),
      }));
    } else {
      chart = Array.from({ length: range.days }, (_, i) => {
        const k = toDateKey(from.getTime() + i * 86400000);
        return {
          label: `${k.slice(8)}.${k.slice(5, 7)}`,
          Tushum: paid.filter((o) => toDateKey(o.paidAt) === k).reduce((s, o) => s + o.total, 0),
          Xarajat: expenses.filter((e) => toDateKey(e.date) === k).reduce((s, e) => s + e.amount, 0),
        };
      });
    }

    const methods = {};
    paid.forEach((o) => {
      const parts = o.payment.method === 'mixed' ? o.payment.splits : [{ method: o.payment.method, amount: o.total }];
      parts.forEach((p) => { methods[p.method] = (methods[p.method] || 0) + p.amount; });
    });
    const types = {};
    paid.forEach((o) => { types[o.type] = (types[o.type] || 0) + o.total; });
    const items = {};
    paid.forEach((o) => o.items.forEach((i) => {
      if (i.status === 'cancelled') return;
      items[i.name] = items[i.name] || { name: i.name, qty: 0, sum: 0 };
      items[i.name].qty += i.qty;
      items[i.name].sum += i.qty * i.price;
    }));
    const byCat = {};
    expenses.forEach((e) => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });

    // ABC tahlili: taomlar tushum bo'yicha kamayish tartibida, kumulyativ % asosida A/B/C guruhlanadi
    const allItems = Object.values(items).sort((a, b) => b.sum - a.sum);
    const itemsTotal = allItems.reduce((s, i) => s + i.sum, 0) || 1;
    let cum = 0;
    const abc = allItems.map((i) => {
      cum += i.sum;
      const cumPct = (cum / itemsTotal) * 100;
      const grp = cumPct <= 80 ? 'A' : cumPct <= 95 ? 'B' : 'C';
      return { ...i, share: (i.sum / itemsTotal) * 100, cumPct, grp };
    });

    return {
      sold, revenue, refunds, discounts, service, expTotal, expenses, chart,
      net: revenue - refunds - expTotal,
      count: paid.length,
      methods: Object.entries(methods).map(([k, v]) => ({ name: PAYMENT_LABELS[k] || k, value: v })),
      types: Object.entries(types).map(([k, v]) => ({ name: ORDER_TYPES[k], value: v })),
      abc,
      byCat: Object.entries(byCat).sort((a, b) => b[1] - a[1]),
    };
  }, [range, state.orders, state.expenses, state.branchId, period]);

  const exportCSV = () => {
    const label = period === 'custom' ? `${customFrom}_${customTo}` : `${period}kun`;
    downloadCSV(`hisobot_${toDateKey(new Date())}_${label}.csv`, [
      ['Chek', 'Sana', 'Turi', "To'lov", 'Holat', 'Chegirma', 'Summa'],
      ...d.sold.map((o) => [o.number, fmtDateTime(o.paidAt), ORDER_TYPES[o.type], PAYMENT_LABELS[o.payment.method], o.status === 'paid' ? "To'langan" : 'Qaytarilgan', o.discountAmount || 0, o.total]),
    ]);
  };

  const addExpense = () => {
    if (!(+exp.amount > 0)) return toast('Summani kiriting', 'error');
    const date = new Date(exp.date);
    const nowD = new Date();
    date.setHours(nowD.getHours(), nowD.getMinutes());
    dispatch({ type: 'ADD_EXPENSE', item: { ...exp, amount: +exp.amount, date: date.toISOString() } });
    setExpOpen(false);
    setExp({ category: 'Kommunal', amount: '', note: '', date: toDateKey(new Date()) });
    toast("Xarajat qo'shildi", 'success');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs tabs={[{ id: 1, label: 'Bugun' }, { id: 7, label: '7 kun' }, { id: 30, label: '30 kun' }, { id: 'custom', label: 'Erkin oraliq' }]} value={period} onChange={setPeriod} />
        <div className="flex gap-2">
          <Button variant="secondary" icon={Download} onClick={exportCSV}>CSV eksport</Button>
          <Button icon={Plus} onClick={() => setExpOpen(true)}>Xarajat</Button>
        </div>
      </div>

      {period === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 card p-3">
          <Field label="Dan" className="!mb-0"><input type="date" className="input" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} /></Field>
          <Field label="Gacha" className="!mb-0"><input type="date" className="input" value={customTo} onChange={(e) => setCustomTo(e.target.value)} /></Field>
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        <StatCard label="Tushum" value={money(d.revenue)} icon={Wallet} color="blue" hint={`${d.count} ta chek`} trend={prevSummary.revenue ? ((d.revenue - prevSummary.revenue) / prevSummary.revenue) * 100 : null} />
        <StatCard label="Xarajat" value={money(d.expTotal)} icon={TrendingDown} color="red" trend={prevSummary.expTotal ? ((d.expTotal - prevSummary.expTotal) / prevSummary.expTotal) * 100 : null} />
        <StatCard label="Sof foyda" value={money(d.net)} icon={TrendingUp} color={d.net >= 0 ? 'green' : 'red'} trend={prevSummary.net ? ((d.net - prevSummary.net) / Math.abs(prevSummary.net)) * 100 : null} />
        <StatCard label="Qaytarilgan" value={money(d.refunds)} icon={RotateCcw} color="amber" />
        <StatCard label="Chegirmalar" value={money(d.discounts)} icon={Percent} color="purple" hint={`Xizmat haqi: ${money(d.service)}`} />
      </div>
      <div className="text-xs text-slate-400">
        Oldingi {range.days} kunlik davr bilan solishtirilmoqda ({fmtDate(new Date(range.from.getTime() - range.days * 86400000))} — {fmtDate(new Date(range.from.getTime() - 1))})
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card title="Savdo va xarajat dinamikasi" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={d.chart} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={short} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => money(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Tushum" fill="#2563eb" radius={[5, 5, 0, 0]} />
                <Bar dataKey="Xarajat" fill="#f87171" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="To'lov usullari">
          <div className="h-44">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={d.methods} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                  {d.methods.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => money(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="space-y-1.5 mt-2">
            {d.methods.map((m, i) => (
              <li key={m.name} className="flex items-center gap-2 text-sm">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="flex-1">{m.name}</span>
                <span className="tabular-nums text-slate-600">{money(m.value)}</span>
                <span className="text-xs text-slate-400 w-10 text-right">{d.revenue ? Math.round((m.value / d.revenue) * 100) : 0}%</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        <Card
          title="Menyu ABC tahlili"
          className="lg:col-span-2"
          bodyClass="p-0 pt-3"
          actions={
            <div className="flex items-center gap-1.5 text-xs">
              <Badge color="green">A: {d.abc.filter((i) => i.grp === 'A').length}</Badge>
              <Badge color="amber">B: {d.abc.filter((i) => i.grp === 'B').length}</Badge>
              <Badge color="red">C: {d.abc.filter((i) => i.grp === 'C').length}</Badge>
            </div>
          }
        >
          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            <table className="tbl">
              <thead><tr><th>#</th><th>Taom</th><th className="text-right">Soni</th><th className="text-right">Tushum</th><th className="text-right">Ulush</th><th>Guruh</th></tr></thead>
              <tbody>
                {d.abc.map((t, i) => (
                  <tr key={t.name}>
                    <td className="text-slate-400">{i + 1}</td>
                    <td className="font-medium">{t.name}</td>
                    <td className="text-right tabular-nums">{t.qty}</td>
                    <td className="text-right tabular-nums font-semibold">{money(t.sum)}</td>
                    <td className="text-right tabular-nums text-slate-500">{t.share.toFixed(1)}%</td>
                    <td><Badge color={t.grp === 'A' ? 'green' : t.grp === 'B' ? 'amber' : 'red'}>{t.grp}</Badge></td>
                  </tr>
                ))}
                {!d.abc.length && <tr><td colSpan={6} className="text-center text-slate-400 py-6">Ma'lumot yo'q</td></tr>}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Buyurtma turlari va xarajatlar">
          <ul className="space-y-2 mb-5">
            {d.types.map((t) => (
              <li key={t.name}>
                <div className="flex justify-between text-sm mb-1"><span>{t.name}</span><span className="tabular-nums">{money(t.value)}</span></div>
                <div className="h-2 rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${d.revenue ? (t.value / d.revenue) * 100 : 0}%` }} /></div>
              </li>
            ))}
          </ul>
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Xarajat kategoriyalari</div>
          <ul className="space-y-1.5">
            {d.byCat.map(([c, v]) => (
              <li key={c} className="flex justify-between text-sm"><span>{c}</span><span className="tabular-nums text-rose-600">{money(v)}</span></li>
            ))}
            {!d.byCat.length && <li className="text-sm text-slate-400">Xarajat yo'q</li>}
          </ul>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card title="Xarajatlar" bodyClass="p-0 pt-3">
          <div className="overflow-x-auto max-h-96 overflow-y-auto scrollbar-thin">
            <table className="tbl">
              <thead><tr><th>Sana</th><th>Kategoriya</th><th>Izoh</th><th className="text-right">Summa</th><th /></tr></thead>
              <tbody>
                {d.expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="text-slate-500 whitespace-nowrap">{fmtDate(e.date)}</td>
                    <td><Badge>{e.category}</Badge></td>
                    <td className="text-slate-600">{e.note}</td>
                    <td className="text-right tabular-nums font-medium">{money(e.amount)}</td>
                    <td><button type="button" onClick={() => dispatch({ type: 'DELETE_EXPENSE', id: e.id })} className="p-1 text-slate-300 hover:text-rose-600"><Trash2 size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Card title="Kassa smenalari hisoboti" bodyClass="p-0 pt-3">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Smena</th><th>Kassir</th><th className="text-right">Cheklar</th><th className="text-right">Savdo</th><th className="text-right">Farq</th></tr></thead>
              <tbody>
                {state.shifts.map((s) => (
                  <tr key={s.id}>
                    <td className="text-slate-500 whitespace-nowrap">{fmtDateTime(s.openedAt)}</td>
                    <td>{s.cashierName}</td>
                    <td className="text-right tabular-nums">{s.ordersCount}</td>
                    <td className="text-right tabular-nums font-medium">{money(s.total)}</td>
                    <td className={`text-right tabular-nums ${s.difference < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{money(s.difference)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal open={expOpen} onClose={() => setExpOpen(false)} title="Yangi xarajat" size="sm" footer={<><Button variant="secondary" onClick={() => setExpOpen(false)}>Bekor</Button><Button onClick={addExpense}>Saqlash</Button></>}>
        <div className="space-y-3">
          <Field label="Kategoriya">
            <select className="input" value={exp.category} onChange={(e) => setExp({ ...exp, category: e.target.value })}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Summa (so'm)"><input type="number" className="input" value={exp.amount} onChange={(e) => setExp({ ...exp, amount: e.target.value })} /></Field>
          <Field label="Sana"><input type="date" className="input" value={exp.date} onChange={(e) => setExp({ ...exp, date: e.target.value })} /></Field>
          <Field label="Izoh"><input className="input" value={exp.note} onChange={(e) => setExp({ ...exp, note: e.target.value })} /></Field>
        </div>
      </Modal>
    </div>
  );
}
