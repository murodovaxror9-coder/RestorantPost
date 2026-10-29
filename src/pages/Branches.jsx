import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Plus, Building2, MapPin, Phone, User, Pencil, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Button, Badge, Modal, Field, Card, StatCard } from '../components/ui';
import { money, uid, isToday } from '../utils/format';

const short = (v) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `${Math.round(v / 1e3)}K` : v);

export default function Branches() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [edit, setEdit] = useState(null);

  const mainRevenue = state.orders.filter((o) => o.status === 'paid' && isToday(o.paidAt)).reduce((s, o) => s + o.total, 0);
  const rows = state.branches.map((b) => ({
    ...b,
    revenue: b.id === 'b1' ? mainRevenue : b.revenueToday || 0,
    staff: b.id === 'b1' ? state.staff.length : b.staffCount || 0,
    tablesCount: b.id === 'b1' ? state.tables.length : b.tables || 0,
  }));
  const total = rows.reduce((s, b) => s + b.revenue, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Filiallar" value={rows.length} icon={Building2} color="blue" />
        <StatCard label="Faol" value={rows.filter((b) => b.status === 'active').length} icon={CheckCircle2} color="green" />
        <StatCard label="Bugungi umumiy tushum" value={money(total)} icon={Building2} color="purple" />
        <StatCard label="Jami xodimlar" value={rows.reduce((s, b) => s + b.staff, 0)} icon={User} color="amber" />
      </div>

      <div className="flex justify-end">
        <Button icon={Plus} onClick={() => setEdit({ id: uid(), name: '', city: '', address: '', manager: '', phone: '+998 ', status: 'active', revenueToday: 0, staffCount: 0, tables: 10, isNew: true })}>Filial qo'shish</Button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {rows.map((b) => (
          <div key={b.id} className={`card p-5 ${state.branchId === b.id ? 'ring-2 ring-blue-500' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Building2 size={22} /></div>
              <div className="flex items-center gap-1">
                <Badge color={b.status === 'active' ? 'green' : 'slate'}>{b.status === 'active' ? 'Faol' : 'Yopiq'}</Badge>
                <button type="button" onClick={() => setEdit({ ...b })} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil size={15} /></button>
              </div>
            </div>
            <div className="font-bold text-lg mt-3">{b.name}</div>
            <div className="text-sm text-slate-500 space-y-1 mt-2">
              <div className="flex items-center gap-1.5"><MapPin size={13} /> {b.address}</div>
              <div className="flex items-center gap-1.5"><User size={13} /> {b.manager}</div>
              <div className="flex items-center gap-1.5"><Phone size={13} /> {b.phone}</div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="p-2 rounded-xl bg-slate-50"><div className="text-sm font-bold">{short(b.revenue)}</div><div className="text-[11px] text-slate-500">Tushum</div></div>
              <div className="p-2 rounded-xl bg-slate-50"><div className="text-sm font-bold">{b.staff}</div><div className="text-[11px] text-slate-500">Xodim</div></div>
              <div className="p-2 rounded-xl bg-slate-50"><div className="text-sm font-bold">{b.tablesCount}</div><div className="text-[11px] text-slate-500">Stol</div></div>
            </div>
            <Button
              className="w-full mt-4"
              variant={state.branchId === b.id ? 'secondary' : 'soft'}
              disabled={state.branchId === b.id}
              onClick={() => { dispatch({ type: 'SET_BRANCH', id: b.id }); toast(`${b.name} tanlandi`, 'success'); }}
            >
              {state.branchId === b.id ? 'Joriy filial' : 'Tanlash'}
            </Button>
          </div>
        ))}
      </div>

      <Card title="Filiallar bo'yicha bugungi tushum">
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={rows.map((b) => ({ name: b.name, Tushum: b.revenue }))} margin={{ left: -10, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={short} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => money(v)} />
              <Bar dataKey="Tushum" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.isNew ? 'Yangi filial' : 'Filialni tahrirlash'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEdit(null)}>Bekor</Button>
            <Button onClick={() => {
              if (!edit.name.trim()) return toast('Nomini kiriting', 'error');
              const { isNew, revenue, staff, tablesCount, ...item } = edit;
              dispatch({ type: 'SAVE_BRANCH', item: { ...item, tables: +item.tables || 0 } });
              setEdit(null);
              toast('Saqlandi', 'success');
            }}>Saqlash</Button>
          </>
        }
      >
        {edit && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nomi"><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Shahar"><input className="input" value={edit.city} onChange={(e) => setEdit({ ...edit, city: e.target.value })} /></Field>
            <Field label="Manzil" className="col-span-2"><input className="input" value={edit.address} onChange={(e) => setEdit({ ...edit, address: e.target.value })} /></Field>
            <Field label="Menejer"><input className="input" value={edit.manager} onChange={(e) => setEdit({ ...edit, manager: e.target.value })} /></Field>
            <Field label="Telefon"><input className="input" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
            <Field label="Stollar soni"><input type="number" className="input" value={edit.tables} onChange={(e) => setEdit({ ...edit, tables: e.target.value })} /></Field>
            <Field label="Holat">
              <select className="input" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                <option value="active">Faol</option>
                <option value="closed">Yopiq</option>
              </select>
            </Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
