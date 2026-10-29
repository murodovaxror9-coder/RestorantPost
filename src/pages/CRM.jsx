import { useState } from 'react';
import { Plus, Pencil, Users, Crown, Gift, Megaphone, Trash2, Phone } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Button, Badge, Tabs, Modal, Field, SearchInput, Avatar, StatCard, Toggle, Card } from '../components/ui';
import { money, fmtNum, uid, fmtDate, getTier, toDateKey } from '../utils/format';

const TIER_COLORS = { Bronze: 'amber', Silver: 'slate', Gold: 'amber', Platinum: 'purple' };

export default function CRM() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState('customers');
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(null);
  const [view, setView] = useState(null);
  const [camp, setCamp] = useState(null);
  const [loyalty, setLoyalty] = useState(state.settings.loyalty);

  const [segment, setSegment] = useState('all');
  const bySegment = (c) => {
    if (segment === 'vip') return ['Gold', 'Platinum'].includes(getTier(c, state.settings).name);
    if (segment === 'inactive') return !c.lastVisit || (Date.now() - new Date(c.lastVisit)) / 86400000 > 30;
    return true;
  };
  const list = state.customers
    .filter((c) => (c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.replace(/\s/g, '').includes(q.replace(/\s/g, ''))) && bySegment(c))
    .sort((a, b) => b.totalSpent - a.totalSpent);
  const totalPoints = state.customers.reduce((s, c) => s + c.points, 0);
  const avgSpent = state.customers.length ? state.customers.reduce((s, c) => s + c.totalSpent, 0) / state.customers.length : 0;
  const history = view ? state.orders.filter((o) => o.customerId === view.id && o.status === 'paid').slice(0, 15) : [];

  const saveCustomer = () => {
    if (!edit.name.trim() || edit.phone.replace(/\D/g, '').length < 9) return toast('Ism va telefonni kiriting', 'error');
    const dup = state.customers.find((c) => c.id !== edit.id && c.phone.replace(/\D/g, '') === edit.phone.replace(/\D/g, ''));
    if (dup) return toast(`Bu telefon raqami "${dup.name}" nomiga allaqachon ro'yxatdan o'tgan`, 'error');
    const { isNew, ...item } = edit;
    dispatch({ type: 'SAVE_CUSTOMER', item: { ...item, points: +item.points || 0 } });
    setEdit(null);
    toast('Saqlandi', 'success');
  };

  const daysToBirthday = (b) => {
    if (!b) return null;
    const today = new Date();
    const bd = new Date(b);
    const next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
    if (next < new Date(today.getFullYear(), today.getMonth(), today.getDate())) next.setFullYear(next.getFullYear() + 1);
    return Math.round((next - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
  };
  const upcomingBirthdays = state.customers.filter((c) => { const d = daysToBirthday(c.birthday); return d !== null && d <= 14; }).sort((a, b) => daysToBirthday(a.birthday) - daysToBirthday(b.birthday));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Mijozlar" value={state.customers.length} icon={Users} color="blue" />
        <StatCard label="O'rtacha xarid" value={money(avgSpent)} icon={Crown} color="purple" />
        <StatCard label="Jami bonus ballari" value={fmtNum(totalPoints)} icon={Gift} color="amber" />
        <StatCard label="Faol kampaniyalar" value={state.campaigns.filter((c) => c.active).length} icon={Megaphone} color="green" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <Tabs tabs={[{ id: 'customers', label: 'Mijozlar bazasi' }, { id: 'loyalty', label: 'Bonuslar va darajalar' }, { id: 'campaigns', label: 'Kampaniyalar' }]} value={tab} onChange={setTab} />
        {tab === 'customers' && <Button icon={Plus} onClick={() => setEdit({ id: uid(), name: '', phone: '+998 ', birthday: '', note: '', points: 0, totalSpent: 0, visits: 0, createdAt: toDateKey(new Date()), isNew: true })}>Mijoz qo'shish</Button>}
        {tab === 'campaigns' && <Button icon={Plus} onClick={() => setCamp({ id: uid(), name: '', discount: 10, description: '', active: true, from: toDateKey(new Date()), to: toDateKey(Date.now() + 30 * 86400000), isNew: true })}>Kampaniya</Button>}
      </div>

      {tab === 'customers' && (
        <div className="space-y-4">
          {upcomingBirthdays.length > 0 && (
            <div className="card p-3 flex flex-wrap items-center gap-2 bg-amber-50/50">
              <span className="text-sm font-medium text-amber-700">🎂 Tez orada tug'ilgan kun:</span>
              {upcomingBirthdays.map((c) => (
                <Badge key={c.id} color="amber">{c.name} · {daysToBirthday(c.birthday) === 0 ? 'bugun!' : `${daysToBirthday(c.birthday)} kun`}</Badge>
              ))}
            </div>
          )}
          <div className="card overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex flex-wrap items-center gap-2">
            <SearchInput value={q} onChange={setQ} placeholder="Ism yoki telefon..." className="max-w-xs" />
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl ml-auto">
              {[{ id: 'all', label: 'Barchasi' }, { id: 'vip', label: 'VIP' }, { id: 'inactive', label: 'Uzoq kelmagan' }].map((s) => (
                <button key={s.id} type="button" onClick={() => setSegment(s.id)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${segment === s.id ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600'}`}>{s.label}</button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Mijoz</th><th>Telefon</th><th>Daraja</th><th className="text-right">Tashriflar</th><th className="text-right">Jami xarid</th><th className="text-right">Ballar</th><th>Oxirgi tashrif</th><th /></tr></thead>
              <tbody>
                {list.map((c) => {
                  const tier = getTier(c, state.settings);
                  return (
                    <tr key={c.id} className="cursor-pointer" onClick={() => setView(c)}>
                      <td><div className="flex items-center gap-3"><Avatar name={c.name} size="sm" /><span className="font-medium">{c.name}</span></div></td>
                      <td className="text-slate-600">{c.phone}</td>
                      <td><Badge color={TIER_COLORS[tier.name] || 'blue'}><Crown size={11} /> {tier.name} · {tier.discount}%</Badge></td>
                      <td className="text-right tabular-nums">{c.visits}</td>
                      <td className="text-right tabular-nums font-medium">{money(c.totalSpent)}</td>
                      <td className="text-right tabular-nums text-emerald-600 font-medium">+{fmtNum(c.points)}</td>
                      <td className="text-slate-500">{c.lastVisit ? fmtDate(c.lastVisit) : '—'}</td>
                      <td className="text-right"><button type="button" onClick={(e) => { e.stopPropagation(); setEdit({ ...c }); }} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil size={16} /></button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {tab === 'loyalty' && (
        <div className="grid lg:grid-cols-[1fr_340px] gap-5">
          <div className="grid sm:grid-cols-2 gap-4">
            {loyalty.tiers.map((t, idx) => (
              <div key={t.name} className="card p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-lg flex-1">
                    <Crown size={20} className="text-amber-500 shrink-0" />
                    <input className="input !py-1 font-bold" value={t.name} onChange={(e) => setLoyalty({ ...loyalty, tiers: loyalty.tiers.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)) })} />
                  </div>
                  <Badge color="blue">{state.customers.filter((c) => getTier(c, state.settings).name === t.name).length} mijoz</Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Field label="Minimal xarid (so'm)">
                    <input type="number" className="input" value={t.minSpent} disabled={idx === 0} onChange={(e) => setLoyalty({ ...loyalty, tiers: loyalty.tiers.map((x, i) => (i === idx ? { ...x, minSpent: +e.target.value } : x)) })} />
                  </Field>
                  <Field label="Chegirma (%)">
                    <input type="number" className="input" value={t.discount} onChange={(e) => setLoyalty({ ...loyalty, tiers: loyalty.tiers.map((x, i) => (i === idx ? { ...x, discount: +e.target.value } : x)) })} />
                  </Field>
                </div>
              </div>
            ))}
          </div>
          <Card title="Bonus sozlamalari">
            <Field label="Har bir xariddan ball (%)" hint="Masalan 1% — 100 000 so'mlik xarid uchun 1 000 ball">
              <input type="number" step="0.5" className="input" value={loyalty.pointsRate} onChange={(e) => setLoyalty({ ...loyalty, pointsRate: +e.target.value })} />
            </Field>
            <Button className="w-full mt-4" onClick={() => { dispatch({ type: 'UPDATE_SETTINGS', patch: { loyalty } }); toast('Loyalty sozlamalari saqlandi', 'success'); }}>Saqlash</Button>
          </Card>
        </div>
      )}

      {tab === 'campaigns' && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {state.campaigns.map((c) => {
            const expired = c.to < toDateKey(new Date());
            return (
              <div key={c.id} className={`card p-5 ${c.active && !expired ? '' : 'opacity-70'}`}>
                <div className="flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">-{c.discount}%</div>
                  <Toggle checked={c.active} onChange={(v) => dispatch({ type: 'SAVE_CAMPAIGN', item: { ...c, active: v } })} />
                </div>
                <div className="font-semibold mt-3">{c.name}</div>
                <div className="text-sm text-slate-500">{c.description}</div>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs">
                  <span className="text-slate-500">{fmtDate(c.from)} — {fmtDate(c.to)}</span>
                  <div className="flex items-center gap-1">
                    {expired && <Badge color="red">Muddati tugagan</Badge>}
                    <button type="button" onClick={() => setCamp({ ...c })} className="p-1 text-slate-400 hover:text-blue-600"><Pencil size={14} /></button>
                    <button type="button" onClick={() => dispatch({ type: 'DELETE_CAMPAIGN', id: c.id })} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit?.isNew ? 'Yangi mijoz' : 'Mijozni tahrirlash'} footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Bekor</Button><Button onClick={saveCustomer}>Saqlash</Button></>}>
        {edit && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="F.I.Sh." className="col-span-2"><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Telefon"><input className="input" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} /></Field>
            <Field label="Tug'ilgan kun"><input type="date" className="input" value={edit.birthday} onChange={(e) => setEdit({ ...edit, birthday: e.target.value })} /></Field>
            <Field label="Bonus ballari"><input type="number" className="input" value={edit.points} onChange={(e) => setEdit({ ...edit, points: e.target.value })} /></Field>
            <Field label="Izoh"><input className="input" value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></Field>
          </div>
        )}
      </Modal>

      <Modal open={!!view} onClose={() => setView(null)} title={view?.name} size="lg">
        {view && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge color="blue"><Phone size={11} /> {view.phone}</Badge>
              <Badge color="purple"><Crown size={11} /> {getTier(view, state.settings).name}</Badge>
              {view.birthday && <Badge>🎂 {fmtDate(view.birthday)}</Badge>}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50"><div className="text-xs text-slate-500">Tashriflar</div><div className="font-bold">{view.visits}</div></div>
              <div className="p-3 rounded-xl bg-slate-50"><div className="text-xs text-slate-500">Jami xarid</div><div className="font-bold">{money(view.totalSpent)}</div></div>
              <div className="p-3 rounded-xl bg-slate-50"><div className="text-xs text-slate-500">Ballar</div><div className="font-bold text-emerald-600">{fmtNum(view.points)}</div></div>
            </div>
            <div>
              <div className="font-semibold text-sm mb-2">Buyurtmalar tarixi</div>
              <ul className="divide-y divide-slate-100">
                {history.map((o) => (
                  <li key={o.id} className="py-2 flex justify-between text-sm">
                    <span>#{o.number} · {fmtDate(o.paidAt)} · {o.items.length} pozitsiya</span>
                    <span className="font-medium tabular-nums">{money(o.total)}</span>
                  </li>
                ))}
                {!history.length && <li className="py-3 text-sm text-slate-400">Tizimda buyurtma topilmadi</li>}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={!!camp}
        onClose={() => setCamp(null)}
        title={camp?.isNew ? 'Yangi kampaniya' : 'Kampaniya'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCamp(null)}>Bekor</Button>
            <Button onClick={() => {
              if (!camp.name.trim()) return toast('Nomini kiriting', 'error');
              const { isNew, ...item } = camp;
              dispatch({ type: 'SAVE_CAMPAIGN', item: { ...item, discount: +item.discount } });
              setCamp(null);
              toast('Saqlandi', 'success');
            }}>Saqlash</Button>
          </>
        }
      >
        {camp && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nomi" className="col-span-2"><input className="input" value={camp.name} onChange={(e) => setCamp({ ...camp, name: e.target.value })} /></Field>
            <Field label="Chegirma (%)"><input type="number" className="input" value={camp.discount} onChange={(e) => setCamp({ ...camp, discount: e.target.value })} /></Field>
            <Field label="Faol"><div className="h-10 flex items-center"><Toggle checked={camp.active} onChange={(v) => setCamp({ ...camp, active: v })} /></div></Field>
            <Field label="Boshlanish"><input type="date" className="input" value={camp.from} onChange={(e) => setCamp({ ...camp, from: e.target.value })} /></Field>
            <Field label="Tugash"><input type="date" className="input" value={camp.to} onChange={(e) => setCamp({ ...camp, to: e.target.value })} /></Field>
            <Field label="Tavsif" className="col-span-2"><textarea rows={2} className="input" value={camp.description} onChange={(e) => setCamp({ ...camp, description: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
