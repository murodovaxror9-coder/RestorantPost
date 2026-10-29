import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Phone, Users, Clock, Pencil, CalendarDays } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Button, Badge, Modal, Field, Card, EmptyState, StatCard } from '../components/ui';
import { uid, pad, toDateKey, fmtDate, money } from '../utils/format';
import { RES_STATUS } from '../data/labels';

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];
const DOW = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

export default function Reservations() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const today = toDateKey(new Date());
  const [ym, setYm] = useState(() => ({ y: new Date().getFullYear(), m: new Date().getMonth() }));
  const [selDate, setSelDate] = useState(today);
  const [edit, setEdit] = useState(null);

  const first = new Date(ym.y, ym.m, 1);
  const startDow = (first.getDay() + 6) % 7;
  const daysIn = new Date(ym.y, ym.m + 1, 0).getDate();
  const cells = [...Array(startDow).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  const keyOf = (d) => `${ym.y}-${pad(ym.m + 1)}-${pad(d)}`;
  const active = state.reservations.filter((r) => r.status !== 'cancelled');
  const countOn = (k) => active.filter((r) => r.date === k).length;
  const dayList = state.reservations.filter((r) => r.date === selDate).sort((a, b) => a.time.localeCompare(b.time));
  const upcoming = active.filter((r) => r.date >= today && ['pending', 'confirmed'].includes(r.status)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

  const shift = (d) => setYm(({ y, m }) => {
    const nm = m + d;
    return { y: y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
  });

  const save = () => {
    if (!edit.name.trim() || !edit.phone.trim()) return toast('Ism va telefonni kiriting', 'error');
    if (edit.date < today) return toast("O'tgan sanaga bron berib bo'lmaydi", 'error');
    const clash = state.reservations.find((r) => r.id !== edit.id && r.tableId === edit.tableId && r.date === edit.date && !['cancelled', 'no-show'].includes(r.status) && Math.abs(toMin(r.time) - toMin(edit.time)) < 120);
    if (clash) return toast(`Bu stol ${clash.time} da band (${clash.name})`, 'error');
    const { isNew, ...item } = edit;
    dispatch({ type: 'SAVE_RESERVATION', item: { ...item, guests: +item.guests, deposit: +item.deposit || 0 } });
    setEdit(null);
    setSelDate(item.date);
    toast('Bron saqlandi', 'success');
  };

  const tableName = (id) => state.tables.find((t) => t.id === id)?.name || '—';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Bugungi bronlar" value={active.filter((r) => r.date === today).length} icon={CalendarDays} color="blue" />
        <StatCard label="Bugungi mehmonlar" value={active.filter((r) => r.date === today).reduce((s, r) => s + r.guests, 0)} icon={Users} color="green" />
        <StatCard label="Tasdiqlanmagan" value={state.reservations.filter((r) => r.status === 'pending').length} icon={Clock} color="amber" />
        <StatCard label="Kelgusi bronlar" value={upcoming.length} icon={CalendarDays} color="purple" />
      </div>

      <div className="grid xl:grid-cols-[1.2fr_1fr] gap-5">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => shift(-1)} className="p-2 rounded-lg hover:bg-slate-100"><ChevronLeft size={18} /></button>
            <div className="font-semibold">{MONTHS[ym.m]} {ym.y}</div>
            <button type="button" onClick={() => shift(1)} className="p-2 rounded-lg hover:bg-slate-100"><ChevronRight size={18} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {DOW.map((d) => <div key={d} className="text-xs font-medium text-slate-400 py-1">{d}</div>)}
            {cells.map((d, i) => {
              if (!d) return <div key={`e${i}`} />;
              const k = keyOf(d);
              const n = countOn(k);
              const isSel = k === selDate;
              const isTod = k === today;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelDate(k)}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition ${isSel ? 'bg-blue-600 text-white' : isTod ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-slate-100'}`}
                >
                  {d}
                  {n > 0 && <span className={`mt-0.5 text-[10px] px-1.5 rounded-full ${isSel ? 'bg-white/25' : 'bg-amber-100 text-amber-700'}`}>{n}</span>}
                </button>
              );
            })}
          </div>
        </Card>

        <Card
          title={`${fmtDate(selDate)} — bronlar`}
          actions={<Button size="sm" icon={Plus} onClick={() => setEdit({ id: uid(), name: '', phone: '+998 ', date: selDate < today ? today : selDate, time: '19:00', guests: 2, tableId: state.tables[0].id, status: 'confirmed', note: '', createdAt: new Date().toISOString(), isNew: true })}>Bron qilish</Button>}
        >
          <div className="space-y-2">
            {dayList.map((r) => (
              <div key={r.id} className="p-3 rounded-xl border border-slate-200">
                <div className="flex items-start gap-3">
                  <div className="text-center w-14 shrink-0">
                    <div className="text-lg font-bold text-blue-600">{r.time}</div>
                    <div className="text-[11px] text-slate-400">{tableName(r.tableId)}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{r.name}</span>
                      <Badge color={RES_STATUS[r.status].color}>{RES_STATUS[r.status].label}</Badge>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                      <span className="flex items-center gap-1"><Phone size={11} /> {r.phone}</span>
                      <span className="flex items-center gap-1"><Users size={11} /> {r.guests} kishi</span>
                    </div>
                    {r.note && <div className="text-xs text-amber-700 mt-1">📝 {r.note}</div>}
                    {r.deposit > 0 && <div className="text-xs text-emerald-700 mt-1">💰 Depozit: {money(r.deposit)}</div>}
                  </div>
                  <button type="button" onClick={() => setEdit({ ...r })} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil size={15} /></button>
                </div>
                {['pending', 'confirmed'].includes(r.status) && (
                  <div className="flex gap-2 mt-3">
                    {r.status === 'pending' && <Button size="xs" variant="soft" onClick={() => dispatch({ type: 'SET_RESERVATION_STATUS', id: r.id, status: 'confirmed' })}>Tasdiqlash</Button>}
                    <Button size="xs" variant="success" onClick={() => dispatch({ type: 'SET_RESERVATION_STATUS', id: r.id, status: 'seated' })}>Keldi</Button>
                    <Button size="xs" variant="ghost" onClick={() => dispatch({ type: 'SET_RESERVATION_STATUS', id: r.id, status: 'no-show' })}>Kelmadi</Button>
                    <Button size="xs" variant="ghost" onClick={() => dispatch({ type: 'SET_RESERVATION_STATUS', id: r.id, status: 'cancelled' })}>Bekor qilish</Button>
                  </div>
                )}
              </div>
            ))}
            {!dayList.length && <EmptyState icon={CalendarDays} title="Bu kunga bron yo'q" />}
          </div>
        </Card>
      </div>

      <Card title="Kelgusi bronlar" bodyClass="p-0 pt-3">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Sana</th><th>Vaqt</th><th>Mijoz</th><th>Telefon</th><th>Stol</th><th className="text-right">Kishi</th><th>Holat</th></tr></thead>
            <tbody>
              {upcoming.map((r) => (
                <tr key={r.id}>
                  <td>{fmtDate(r.date)}</td>
                  <td className="font-semibold">{r.time}</td>
                  <td className="font-medium">{r.name}</td>
                  <td className="text-slate-500">{r.phone}</td>
                  <td>{tableName(r.tableId)}</td>
                  <td className="text-right">{r.guests}</td>
                  <td><Badge color={RES_STATUS[r.status].color}>{RES_STATUS[r.status].label}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.isNew ? 'Yangi bron' : 'Bronni tahrirlash'} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Bekor</Button><Button onClick={save}>Saqlash</Button></>}>
        {edit && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mijoz ismi" className="col-span-2">
              <input className="input" list="customers-list" value={edit.name} onChange={(e) => {
                const c = state.customers.find((x) => x.name === e.target.value);
                setEdit({ ...edit, name: e.target.value, phone: c ? c.phone : edit.phone });
              }} />
              <datalist id="customers-list">{state.customers.map((c) => <option key={c.id} value={c.name} />)}</datalist>
            </Field>
            <Field label="Telefon"><input className="input" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
            <Field label="Mehmonlar soni"><input type="number" min="1" className="input" value={edit.guests} onChange={(e) => setEdit({ ...edit, guests: e.target.value })} /></Field>
            <Field label="Sana"><input type="date" min={today} className="input" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} /></Field>
            <Field label="Vaqt"><input type="time" className="input" value={edit.time} onChange={(e) => setEdit({ ...edit, time: e.target.value })} /></Field>
            <Field label="Stol">
              <select className="input" value={edit.tableId} onChange={(e) => setEdit({ ...edit, tableId: e.target.value })}>
                {state.tables.map((t) => <option key={t.id} value={t.id} disabled={t.seats < +edit.guests}>{t.name} · {t.zone} · {t.seats} o'rin</option>)}
              </select>
            </Field>
            <Field label="Holat">
              <select className="input" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                {Object.entries(RES_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            <Field label="Depozit (so'm)" hint="Oldindan to'lov, ixtiyoriy"><input type="number" min="0" className="input" value={edit.deposit || ''} onChange={(e) => setEdit({ ...edit, deposit: e.target.value })} placeholder="0" /></Field>
            <Field label="Izoh" className="col-span-2"><input className="input" value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} placeholder="Tug'ilgan kun, deraza yonida..." /></Field>
          </div>
        )}
      </Modal>
    </div>
  );
}

function toMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
