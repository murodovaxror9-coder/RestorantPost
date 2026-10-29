import { Fragment, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Truck, PackageCheck, Wallet, Trash2, Phone, ChevronDown, ChevronUp, Pencil, Download, History } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Button, Badge, Tabs, Modal, Field, StatCard, EmptyState } from '../components/ui';
import { money, uid, fmtDate, toDateKey, downloadCSV } from '../utils/format';
import { PURCHASE_STATUS } from '../data/labels';

export default function Purchasing() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [initialRows] = useState(location.state?.prefill || null);
  const [tab, setTab] = useState('orders');
  const [createOpen, setCreateOpen] = useState(!!initialRows);
  const [payFor, setPayFor] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [supplier, setSupplier] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [priceHistoryFor, setPriceHistoryFor] = useState(null);

  useEffect(() => {
    if (location.state?.prefill) navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const supName = (id) => state.suppliers.find((s) => s.id === id)?.name || '—';
  const debtOf = (sid) => state.purchases.filter((p) => p.supplierId === sid && !['ordered', 'cancelled'].includes(p.status)).reduce((s, p) => s + (p.total - p.paid), 0);
  const totalDebt = state.suppliers.reduce((s, sp) => s + debtOf(sp.id), 0);
  const pendingCount = state.purchases.filter((p) => p.status === 'ordered').length;
  const monthTotal = state.purchases.filter((p) => p.status !== 'cancelled' && Date.now() - new Date(p.createdAt) < 30 * 86400000).reduce((s, p) => s + p.total, 0);

  const exportCSV = () => {
    downloadCSV(`xaridlar_${toDateKey(new Date())}.csv`, [
      ['№', 'Yetkazib beruvchi', 'Sana', 'Mahsulotlar soni', 'Summa', "To'langan", 'Qarz', 'Holat'],
      ...state.purchases.map((p) => [p.number, supName(p.supplierId), fmtDate(p.createdAt), p.items.length, p.total, p.paid, p.total - p.paid, PURCHASE_STATUS[p.status]?.label || p.status]),
    ]);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Yetkazib beruvchilar" value={state.suppliers.length} icon={Truck} color="blue" />
        <StatCard label="Kutilayotgan buyurtmalar" value={pendingCount} icon={PackageCheck} color="amber" />
        <StatCard label="30 kunlik xarid" value={money(monthTotal)} icon={Wallet} color="green" />
        <StatCard label="Umumiy qarz" value={money(totalDebt)} icon={Wallet} color="red" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <Tabs tabs={[{ id: 'orders', label: 'Xarid buyurtmalari' }, { id: 'suppliers', label: 'Yetkazib beruvchilar' }, { id: 'debts', label: "To'lovlar va qarzlar" }]} value={tab} onChange={setTab} />
        <div className="flex gap-2">
          {tab === 'orders' && <Button variant="secondary" icon={Download} onClick={exportCSV}>CSV eksport</Button>}
          <Button variant="secondary" icon={Plus} onClick={() => setSupplier({ id: uid(), name: '', phone: '', category: '', contact: '', address: '', isNew: true })}>Yetkazib beruvchi</Button>
          <Button icon={Plus} onClick={() => setCreateOpen(true)}>Xarid buyurtmasi</Button>
        </div>
      </div>

      {tab === 'orders' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>№</th><th>Yetkazib beruvchi</th><th>Sana</th><th>Mahsulotlar</th><th className="text-right">Summa</th><th className="text-right">To'langan</th><th>Holat</th><th /></tr></thead>
              <tbody>
                {state.purchases.map((p) => (
                  <Fragment key={p.id}>
                    <tr>
                      <td className="font-medium">#{p.number}</td>
                      <td>{supName(p.supplierId)}</td>
                      <td className="text-slate-500">{fmtDate(p.createdAt)}</td>
                      <td>
                        <button type="button" onClick={() => setExpanded(expanded === p.id ? null : p.id)} className="flex items-center gap-1 text-blue-600 text-sm">
                          {p.items.length} ta {expanded === p.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </td>
                      <td className="text-right font-semibold tabular-nums">{money(p.total)}</td>
                      <td className="text-right tabular-nums text-slate-500">{money(p.paid)}</td>
                      <td><Badge color={PURCHASE_STATUS[p.status].color}>{PURCHASE_STATUS[p.status].label}</Badge></td>
                      <td className="text-right whitespace-nowrap space-x-1">
                        {p.status === 'ordered' && <Button size="xs" variant="soft" onClick={() => { dispatch({ type: 'RECEIVE_PURCHASE', id: p.id }); toast('Mahsulotlar omborga qabul qilindi', 'success'); }}>Qabul qilish</Button>}
                        {p.status === 'ordered' && (
                          <Button size="xs" variant="ghost" className="text-rose-600" onClick={() => { dispatch({ type: 'CANCEL_PURCHASE', id: p.id }); toast('Xarid bekor qilindi'); }}>Bekor</Button>
                        )}
                        {p.status !== 'cancelled' && p.paid < p.total && <Button size="xs" variant="success" onClick={() => { setPayFor(p); setPayAmount(String(p.total - p.paid)); }}>To'lash</Button>}
                      </td>
                    </tr>
                    {expanded === p.id && (
                      <tr>
                        <td colSpan={8} className="bg-slate-50">
                          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            {p.items.map((i) => (
                              <div key={i.ingredientId} className="text-sm flex justify-between bg-white rounded-lg px-3 py-2 border border-slate-100">
                                <span>{i.name}</span>
                                <span className="text-slate-500">{i.qty} {i.unit} × {money(i.price)}</span>
                              </div>
                            ))}
                          </div>
                          {p.note && <div className="text-xs text-slate-500 mt-2">Izoh: {p.note}</div>}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
            {!state.purchases.length && <EmptyState title="Xaridlar yo'q" />}
          </div>
        </div>
      )}

      {tab === 'suppliers' && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {state.suppliers.map((s) => {
            const debt = debtOf(s.id);
            const count = state.purchases.filter((p) => p.supplierId === s.id).length;
            return (
              <div key={s.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Truck size={20} /></div>
                  <div className="flex gap-1">
                    <button type="button" title="Narxlar tarixi" onClick={() => setPriceHistoryFor(s)} className="p-1.5 text-slate-400 hover:text-blue-600"><History size={15} /></button>
                    <button type="button" onClick={() => setSupplier({ ...s })} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil size={15} /></button>
                  </div>
                </div>
                <div className="font-semibold mt-3">{s.name}</div>
                <div className="text-xs text-slate-500">{s.category} · {s.contact}</div>
                <div className="text-sm text-slate-600 mt-2 flex items-center gap-1.5"><Phone size={13} /> {s.phone}</div>
                <div className="flex justify-between mt-4 pt-3 border-t border-slate-100 text-sm">
                  <span className="text-slate-500">{count} ta xarid</span>
                  <span className={debt > 0 ? 'text-rose-600 font-semibold' : 'text-emerald-600'}>{debt > 0 ? `Qarz: ${money(debt)}` : "Qarz yo'q"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'debts' && (
        <div className="card overflow-hidden">
          <table className="tbl">
            <thead><tr><th>Yetkazib beruvchi</th><th className="text-right">Jami xarid</th><th className="text-right">To'langan</th><th className="text-right">Qarz</th></tr></thead>
            <tbody>
              {state.suppliers.map((s) => {
                const list = state.purchases.filter((p) => p.supplierId === s.id);
                const total = list.reduce((a, p) => a + p.total, 0);
                const paid = list.reduce((a, p) => a + p.paid, 0);
                return (
                  <tr key={s.id}>
                    <td className="font-medium">{s.name}</td>
                    <td className="text-right tabular-nums">{money(total)}</td>
                    <td className="text-right tabular-nums text-emerald-600">{money(paid)}</td>
                    <td className="text-right tabular-nums font-semibold text-rose-600">{money(debtOf(s.id))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <PurchaseModal open={createOpen} initialRows={initialRows} onClose={() => setCreateOpen(false)} />

      <Modal
        open={!!payFor}
        onClose={() => setPayFor(null)}
        title={`To'lov — Xarid #${payFor?.number}`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayFor(null)}>Bekor</Button>
            <Button variant="success" onClick={() => { dispatch({ type: 'PAY_PURCHASE', id: payFor.id, amount: +payAmount }); setPayFor(null); toast("To'lov saqlandi va xarajatlarga yozildi", 'success'); }}>To'lash</Button>
          </>
        }
      >
        {payFor && (
          <div className="space-y-3">
            <div className="text-sm text-slate-500">Qoldiq: <b className="text-slate-800">{money(payFor.total - payFor.paid)}</b></div>
            <Field label="Summa"><input type="number" className="input" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} /></Field>
          </div>
        )}
      </Modal>

      <Modal
        open={!!supplier}
        onClose={() => setSupplier(null)}
        title={supplier?.isNew ? 'Yangi yetkazib beruvchi' : 'Yetkazib beruvchi'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setSupplier(null)}>Bekor</Button>
            <Button onClick={() => {
              if (!supplier.name.trim()) return toast('Nomini kiriting', 'error');
              const { isNew, ...item } = supplier;
              dispatch({ type: 'SAVE_SUPPLIER', item });
              setSupplier(null);
              toast('Saqlandi', 'success');
            }}>Saqlash</Button>
          </>
        }
      >
        {supplier && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nomi" className="col-span-2"><input className="input" value={supplier.name} onChange={(e) => setSupplier({ ...supplier, name: e.target.value })} /></Field>
            <Field label="Telefon"><input className="input" value={supplier.phone} onChange={(e) => setSupplier({ ...supplier, phone: e.target.value })} /></Field>
            <Field label="Kategoriya"><input className="input" value={supplier.category} onChange={(e) => setSupplier({ ...supplier, category: e.target.value })} /></Field>
            <Field label="Mas'ul shaxs"><input className="input" value={supplier.contact} onChange={(e) => setSupplier({ ...supplier, contact: e.target.value })} /></Field>
            <Field label="Manzil"><input className="input" value={supplier.address} onChange={(e) => setSupplier({ ...supplier, address: e.target.value })} /></Field>
          </div>
        )}
      </Modal>

      <Modal open={!!priceHistoryFor} onClose={() => setPriceHistoryFor(null)} title={`${priceHistoryFor?.name} — narxlar tarixi`} size="md">
        {priceHistoryFor && (() => {
          const rows = state.purchases
            .filter((p) => p.supplierId === priceHistoryFor.id && p.status !== 'cancelled')
            .flatMap((p) => p.items.map((i) => ({ ...i, date: p.createdAt, name: state.inventory.find((ing) => ing.id === i.ingredientId)?.name || i.ingredientId })))
            .sort((a, b) => (a.date < b.date ? 1 : -1));
          return rows.length ? (
            <table className="tbl">
              <thead><tr><th>Sana</th><th>Mahsulot</th><th className="text-right">Narx</th><th className="text-right">Miqdor</th></tr></thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx}>
                    <td className="text-slate-500">{fmtDate(r.date)}</td>
                    <td className="font-medium">{r.name}</td>
                    <td className="text-right tabular-nums">{money(r.price)}</td>
                    <td className="text-right tabular-nums text-slate-500">{r.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="Xaridlar tarixi yo'q" />
          );
        })()}
      </Modal>
    </div>
  );
}

function PurchaseModal({ open, onClose, initialRows }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [supplierId, setSupplierId] = useState(state.suppliers[0]?.id || '');
  const [rows, setRows] = useState([]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setRows(initialRows?.length ? initialRows : [{ ingredientId: state.inventory[0]?.id, qty: 1, price: state.inventory[0]?.cost || 0 }]);
      setNote('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const setRow = (idx, patch) => setRows((r) => r.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  const total = rows.reduce((s, r) => s + (+r.qty || 0) * (+r.price || 0), 0);

  const save = () => {
    const items = rows
      .filter((r) => r.ingredientId && +r.qty > 0)
      .map((r) => {
        const ing = state.inventory.find((i) => i.id === r.ingredientId);
        return { ingredientId: r.ingredientId, name: ing.name, unit: ing.unit, qty: +r.qty, price: +r.price };
      });
    if (!items.length) return toast("Kamida bitta mahsulot qo'shing", 'error');
    dispatch({ type: 'CREATE_PURCHASE', purchase: { supplierId, items, note } });
    toast('Xarid buyurtmasi yaratildi', 'success');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Yangi xarid buyurtmasi"
      size="lg"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-sm">Jami: <b>{money(total)}</b></div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Bekor</Button>
            <Button onClick={save}>Yaratish</Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <Field label="Yetkazib beruvchi">
          <select className="input" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            {state.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.category}</option>)}
          </select>
        </Field>
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_90px_120px_32px] gap-2 text-xs text-slate-500 font-medium">
            <span>Mahsulot</span><span>Miqdor</span><span>Narx</span><span />
          </div>
          {rows.map((r, idx) => (
            <div key={idx} className="grid grid-cols-[1fr_90px_120px_32px] gap-2">
              <select className="input" value={r.ingredientId} onChange={(e) => { const ing = state.inventory.find((i) => i.id === e.target.value); setRow(idx, { ingredientId: e.target.value, price: ing?.cost || 0 }); }}>
                {state.inventory.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
              </select>
              <input type="number" className="input" value={r.qty} onChange={(e) => setRow(idx, { qty: e.target.value })} />
              <input type="number" className="input" value={r.price} onChange={(e) => setRow(idx, { price: e.target.value })} />
              <button type="button" onClick={() => setRows((x) => x.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-600 flex items-center justify-center"><Trash2 size={16} /></button>
            </div>
          ))}
          <Button size="sm" variant="soft" icon={Plus} onClick={() => setRows((x) => [...x, { ingredientId: state.inventory[0]?.id, qty: 1, price: state.inventory[0]?.cost || 0 }])}>Qator qo'shish</Button>
        </div>
        <Field label="Izoh"><input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Yetkazish muddati, shartlar..." /></Field>
      </div>
    </Modal>
  );
}
