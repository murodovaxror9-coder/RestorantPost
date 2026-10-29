import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Check, Minus, Users, UserCheck, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Button, Badge, Tabs, Modal, Field, SearchInput, Avatar, StatCard, ConfirmDialog } from '../components/ui';
import { money, uid, fmtDateTime, fmtDate, startOfDayOffset } from '../utils/format';
import { sha256Hex } from '../utils/crypto';
import { ROLES, NAV, effectiveRoles } from '../data/navigation';

export default function Staff() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState('list');
  const [q, setQ] = useState('');
  const [role, setRole] = useState('all');
  const [edit, setEdit] = useState(null);
  const [del, setDel] = useState(null);
  const [period, setPeriod] = useState(1);

  const list = state.staff.filter((s) => !s.archived && (role === 'all' || s.role === role) && s.name.toLowerCase().includes(q.toLowerCase()));
  const payroll = state.staff.filter((s) => s.status === 'active').reduce((a, s) => a + (+s.salary || 0), 0);

  const activity = useMemo(() => {
    const from = startOfDayOffset(period - 1);
    const paid = state.orders.filter((o) => o.status === 'paid' && new Date(o.paidAt) >= from);
    return state.staff.map((s) => {
      const asWaiter = paid.filter((o) => o.waiterId === s.id);
      const asCashier = paid.filter((o) => o.cashierId === s.id);
      const logs = state.auditLogs.filter((l) => l.userId === s.id && new Date(l.at) >= from);
      const tips = asWaiter.reduce((a, o) => a + (o.tip || 0), 0);
      const periodFraction = period / 30;
      const payroll = (+s.salary || 0) * periodFraction + tips;
      return {
        ...s,
        waiterOrders: asWaiter.length,
        waiterSum: asWaiter.reduce((a, o) => a + o.total, 0),
        cashierOrders: asCashier.length,
        cashierSum: asCashier.reduce((a, o) => a + o.total, 0),
        actions: logs.length,
        lastAction: logs[0],
        tips,
        payroll,
      };
    });
  }, [state.orders, state.staff, state.auditLogs, period]);

  const save = async () => {
    if (!edit.name.trim()) return toast('Ismini kiriting', 'error');
    if (edit.isNew && !/^\d{4}$/.test(edit.pin)) return toast("PIN 4 ta raqamdan iborat bo'lishi kerak", 'error');
    if (!edit.isNew && edit.pin && !/^\d{4}$/.test(edit.pin)) return toast("PIN 4 ta raqamdan iborat bo'lishi kerak", 'error');
    const { isNew, pin, ...item } = edit;
    const pinHash = pin ? await sha256Hex(pin) : item.pinHash;
    dispatch({ type: 'SAVE_STAFF', item: { ...item, pinHash, salary: +item.salary || 0 } });
    setEdit(null);
    toast('Saqlandi', 'success');
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Jami xodimlar" value={state.staff.filter((s) => !s.archived).length} icon={Users} color="blue" />
        <StatCard label="Faol" value={state.staff.filter((s) => !s.archived && s.status === 'active').length} icon={UserCheck} color="green" />
        <StatCard label="Oylik fond" value={money(payroll)} icon={Wallet} color="purple" />
        <StatCard label="Rollar" value={Object.keys(ROLES).length} icon={Users} color="amber" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <Tabs tabs={[{ id: 'list', label: 'Xodimlar' }, { id: 'roles', label: 'Rollar va ruxsatlar' }, { id: 'schedule', label: 'Ish jadvali va smenalar' }, { id: 'attendance', label: 'Davomat' }, { id: 'activity', label: 'Faoliyat' }]} value={tab} onChange={setTab} />
        <Button icon={Plus} onClick={() => setEdit({ id: uid(), name: '', role: 'waiter', phone: '+998 ', salary: 3000000, pin: '', status: 'active', schedule: '09:00 - 18:00', workDays: 'Du-Ju', joinedAt: new Date().toISOString().slice(0, 10), isNew: true })}>Xodim qo'shish</Button>
      </div>

      {tab === 'list' && (
        <div className="card overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
            <SearchInput value={q} onChange={setQ} className="sm:w-64" />
            <select className="input sm:!w-48" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="all">Barcha rollar</option>
              {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Xodim</th><th>Rol</th><th>Telefon</th><th>Ish vaqti</th><th className="text-right">Maosh</th><th>Holat</th><th /></tr></thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} />
                        <div>
                          <div className="font-medium">{s.name}</div>
                          <div className="text-xs text-slate-400">{s.joinedAt} dan beri</div>
                        </div>
                      </div>
                    </td>
                    <td><Badge color={ROLES[s.role].color}>{ROLES[s.role].label}</Badge></td>
                    <td className="text-slate-600">{s.phone}</td>
                    <td className="text-slate-600">{s.schedule} · {s.workDays}</td>
                    <td className="text-right tabular-nums">{money(s.salary)}</td>
                    <td>
                      <button type="button" onClick={() => dispatch({ type: 'SAVE_STAFF', item: { ...s, status: s.status === 'active' ? 'inactive' : 'active' } })}>
                        <Badge color={s.status === 'active' ? 'green' : 'slate'}>{s.status === 'active' ? 'Faol' : 'Nofaol'}</Badge>
                      </button>
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <button type="button" onClick={() => setEdit({ ...s, pin: '' })} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil size={16} /></button>
                      <button
                        type="button"
                        onClick={() => (s.id === state.user.id ? toast("O'zingizni o'chira olmaysiz", 'error') : setDel(s))}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'roles' && (
        <div className="card overflow-hidden">
          <div className="px-4 pt-4 text-sm text-slate-500">Katakchani bosib, rolga shu bo'limdan foydalanish ruxsatini yoqing/o'chiring. Administrator uchun hammasi doim yoqiq.</div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Modul</th>
                  {Object.entries(ROLES).map(([k, v]) => <th key={k} className="text-center">{v.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {NAV.map((n) => {
                  const roles = effectiveRoles(n, state.settings.rolePermissions);
                  const toggle = (r) => {
                    if (r === 'admin') return;
                    const next = roles.includes(r) ? roles.filter((x) => x !== r) : [...roles, r];
                    const rolePermissions = { ...(state.settings.rolePermissions || {}), [n.path]: next };
                    dispatch({ type: 'UPDATE_SETTINGS', patch: { rolePermissions } });
                  };
                  return (
                    <tr key={n.path}>
                      <td className="font-medium"><span className="flex items-center gap-2"><n.icon size={16} className="text-slate-400" />{n.label}</span></td>
                      {Object.keys(ROLES).map((r) => (
                        <td key={r} className="text-center">
                          <button
                            type="button"
                            disabled={r === 'admin'}
                            onClick={() => toggle(r)}
                            className={`inline-flex w-6 h-6 rounded-full items-center justify-center ${r === 'admin' ? 'cursor-default' : 'hover:ring-2 hover:ring-blue-300'} ${
                              roles.includes(r) ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'
                            }`}
                          >
                            {roles.includes(r) ? <Check size={14} /> : <Minus size={14} />}
                          </button>
                        </td>
                      ))}
                    </tr>
                  );
                })}
                <tr>
                  <td className="font-medium">Xodimlar soni</td>
                  {Object.keys(ROLES).map((r) => <td key={r} className="text-center font-semibold">{state.staff.filter((s) => s.role === r).length}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
          {state.settings.rolePermissions && (
            <div className="p-3 border-t border-slate-100">
              <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'UPDATE_SETTINGS', patch: { rolePermissions: null } })}>Standart holatga qaytarish</Button>
            </div>
          )}
        </div>
      )}

      {tab === 'schedule' && (
        <div className="grid xl:grid-cols-2 gap-5">
          <div className="card overflow-hidden">
            <div className="px-4 pt-4 font-semibold">Ish jadvali</div>
            <table className="tbl mt-3">
              <thead><tr><th>Xodim</th><th>Rol</th><th>Kunlar</th><th>Vaqt</th></tr></thead>
              <tbody>
                {state.staff.filter((s) => !s.archived).map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.name}</td>
                    <td><Badge color={ROLES[s.role].color}>{ROLES[s.role].label}</Badge></td>
                    <td>{s.workDays}</td>
                    <td className="tabular-nums">{s.schedule}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card overflow-hidden">
            <div className="px-4 pt-4 font-semibold">Kassa smenalari tarixi</div>
            <div className="overflow-x-auto">
              <table className="tbl mt-3">
                <thead><tr><th>Kassir</th><th>Ochilgan</th><th>Yopilgan</th><th className="text-right">Savdo</th><th className="text-right">Farq</th></tr></thead>
                <tbody>
                  {state.currentShift && (
                    <tr className="bg-emerald-50/50">
                      <td className="font-medium">{state.currentShift.cashierName}</td>
                      <td>{fmtDateTime(state.currentShift.openedAt)}</td>
                      <td><Badge color="green">Ochiq</Badge></td>
                      <td className="text-right">—</td>
                      <td className="text-right">—</td>
                    </tr>
                  )}
                  {state.shifts.map((s) => (
                    <tr key={s.id}>
                      <td className="font-medium">{s.cashierName}</td>
                      <td className="text-slate-500 whitespace-nowrap">{fmtDateTime(s.openedAt)}</td>
                      <td className="text-slate-500 whitespace-nowrap">{fmtDateTime(s.closedAt)}</td>
                      <td className="text-right tabular-nums">{money(s.total)}</td>
                      <td className={`text-right tabular-nums font-medium ${s.difference < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{money(s.difference)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Xodim</th><th>Sana</th><th>Keldi</th><th>Ketdi</th><th className="text-right">Ish vaqti</th></tr></thead>
              <tbody>
                {state.attendance.slice(0, 60).map((a) => {
                  const st = state.staff.find((s) => s.id === a.staffId);
                  const hours = a.checkOut ? ((new Date(a.checkOut) - new Date(a.checkIn)) / 3600000).toFixed(1) : null;
                  return (
                    <tr key={a.id}>
                      <td className="font-medium">{st?.name || a.staffId}</td>
                      <td className="text-slate-500">{fmtDate(a.date)}</td>
                      <td className="tabular-nums">{fmtDateTime(a.checkIn).split(' ')[1]}</td>
                      <td className="tabular-nums">{a.checkOut ? fmtDateTime(a.checkOut).split(' ')[1] : <Badge color="green">Hali ishda</Badge>}</td>
                      <td className="text-right tabular-nums">{hours ? `${hours} soat` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!state.attendance.length && <div className="text-center text-sm text-slate-400 py-10">Davomat ma'lumotlari hali yo'q — xodim tizimga kirganda avtomatik yoziladi</div>}
          </div>
        </div>
      )}

      {tab === 'activity' && (
        <div className="card overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <Tabs tabs={[{ id: 1, label: 'Bugun' }, { id: 7, label: '7 kun' }, { id: 30, label: '30 kun' }]} value={period} onChange={setPeriod} />
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Xodim</th><th>Rol</th><th className="text-right">Xizmat qilgan buyurtmalar</th><th className="text-right">Ofitsiant savdosi</th><th className="text-right">Choy puli</th><th className="text-right">Kassa to'lovlari</th><th className="text-right">Amallar</th><th className="text-right">Maosh (davr uchun)</th></tr></thead>
              <tbody>
                {activity.map((s) => (
                  <tr key={s.id}>
                    <td className="font-medium">{s.name}</td>
                    <td><Badge color={ROLES[s.role].color}>{ROLES[s.role].label}</Badge></td>
                    <td className="text-right tabular-nums">{s.waiterOrders || '—'}</td>
                    <td className="text-right tabular-nums">{s.waiterSum ? money(s.waiterSum) : '—'}</td>
                    <td className="text-right tabular-nums text-emerald-600">{s.tips ? money(s.tips) : '—'}</td>
                    <td className="text-right tabular-nums">{s.cashierOrders ? `${s.cashierOrders} · ${money(s.cashierSum)}` : '—'}</td>
                    <td className="text-right tabular-nums">{s.actions}</td>
                    <td className="text-right tabular-nums font-semibold">{money(s.payroll)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.isNew ? 'Yangi xodim' : 'Xodimni tahrirlash'} size="lg" footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Bekor</Button><Button onClick={save}>Saqlash</Button></>}>
        {edit && (
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="F.I.Sh."><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Telefon"><input className="input" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
            <Field label="Rol">
              <select className="input" value={edit.role} onChange={(e) => setEdit({ ...edit, role: e.target.value })}>
                {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            <Field label={edit.isNew ? 'PIN kod (4 raqam)' : "Yangi PIN (o'zgartirish uchun)"} hint={edit.isNew ? undefined : "Bo'sh qoldirsangiz, joriy PIN saqlanadi"}>
              <input className="input tracking-widest" maxLength={4} placeholder={edit.isNew ? '' : '••••'} value={edit.pin} onChange={(e) => setEdit({ ...edit, pin: e.target.value.replace(/\D/g, '') })} />
            </Field>
            <Field label="Oylik maosh (so'm)"><input type="number" className="input" value={edit.salary} onChange={(e) => setEdit({ ...edit, salary: e.target.value })} /></Field>
            <Field label="Holat">
              <select className="input" value={edit.status} onChange={(e) => setEdit({ ...edit, status: e.target.value })}>
                <option value="active">Faol</option>
                <option value="inactive">Nofaol</option>
              </select>
            </Field>
            <Field label="Ish vaqti"><input className="input" value={edit.schedule} onChange={(e) => setEdit({ ...edit, schedule: e.target.value })} placeholder="09:00 - 18:00" /></Field>
            <Field label="Ish kunlari"><input className="input" value={edit.workDays} onChange={(e) => setEdit({ ...edit, workDays: e.target.value })} placeholder="Du-Ju yoki 2/2" /></Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!del}
        danger
        title="Xodimni o'chirish"
        message={`${del?.name} tizimdan o'chiriladi.`}
        confirmText="O'chirish"
        onClose={() => setDel(null)}
        onConfirm={() => { dispatch({ type: 'DELETE_STAFF', id: del.id }); setDel(null); toast("Xodim o'chirildi"); }}
      />
    </div>
  );
}
