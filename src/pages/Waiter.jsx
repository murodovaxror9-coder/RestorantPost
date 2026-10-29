import { useState } from 'react';
import { Plus, ArrowRightLeft, BellRing, CheckCheck, Users, Clock, Trash2, Armchair } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Button, Badge, Tabs, Modal, Field, EmptyState, Card, ConfirmDialog } from '../components/ui';
import MenuPicker from '../components/orders/MenuPicker';
import ManagerApproval from '../components/ManagerApproval';
import useNow from '../hooks/useNow';
import { money, calcOrder, minutesSince, toDateKey } from '../utils/format';
import { getTableStatus, TABLE_STATUS } from '../utils/tables';
import { ITEM_STATUS } from '../data/labels';

export default function Waiter() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const now = useNow(30000);
  const zones = [...new Set(state.tables.map((t) => t.zone))];
  const [zone, setZone] = useState(zones[0]);
  const [sel, setSel] = useState(null);
  const [picker, setPicker] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [guests, setGuests] = useState(2);
  const [removeItem, setRemoveItem] = useState(null);
  const [removeReason, setRemoveReason] = useState('');
  const [needsRemoveApproval, setNeedsRemoveApproval] = useState(null);

  const isManager = ['admin', 'manager'].includes(state.user?.role);
  const ownTablesOnly = state.settings.waiterOnlyOwnTables && state.user?.role === 'waiter';
  const openOrders = state.orders.filter((o) => o.status === 'open' && o.onlineStatus !== 'pending');
  const table = state.tables.find((t) => t.id === sel);
  const order = sel ? openOrders.find((o) => o.tableId === sel) : null;
  const statusOf = (t) => getTableStatus(t, state.orders, state.reservations);
  const readyTotal = openOrders.reduce((s, o) => s + o.items.filter((i) => i.status === 'ready').length, 0);
  const reservation = table && state.reservations.find((r) => r.tableId === table.id && r.date === toDateKey(new Date()) && ['pending', 'confirmed'].includes(r.status));

  const onPick = (items) => {
    if (!items.length) return;
    if (order) dispatch({ type: 'ADD_ITEMS', orderId: order.id, items });
    else dispatch({ type: 'CREATE_ORDER', order: { type: 'dine-in', tableId: sel, source: 'waiter', guests, waiterId: state.user.id, items } });
    setPicker(false);
    toast('Buyurtma oshxonaga yuborildi', 'success');
  };

  const doRemoveItem = (orderId, itemId, reason, approver) => {
    dispatch({
      type: 'REMOVE_ITEM',
      orderId,
      itemId,
      reason: approver ? `${reason}${reason ? ' — ' : ''}Tasdiqladi: ${approver.name}` : reason,
    });
    toast('Pozitsiya bekor qilindi');
  };

  const serveReady = () => {
    const ids = order.items.filter((i) => i.status === 'ready').map((i) => i.id);
    dispatch({ type: 'SET_ITEMS_STATUS', orderId: order.id, itemIds: ids, status: 'served' });
    toast(`${ids.length} ta taom berildi`, 'success');
  };

  const requestBill = () => {
    dispatch({ type: 'UPDATE_ORDER', orderId: order.id, patch: { billRequested: true } });
    toast("Hisob so'raldi — kassirga yuborildi", 'success');
  };

  const move = (tableId) => {
    dispatch({ type: 'MOVE_ORDER', orderId: order.id, tableId });
    setMoveOpen(false);
    setSel(tableId);
    toast("Buyurtma boshqa stolga ko'chirildi", 'success');
  };

  const c = order ? calcOrder(order, state.settings) : null;

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-5">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Tabs tabs={zones.map((z) => ({ id: z, label: z, count: state.tables.filter((t) => t.zone === z).length }))} value={zone} onChange={setZone} />
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <Legend cls="bg-white border border-slate-300" l="Bo'sh" />
            <Legend cls="bg-emerald-500" l="Band" />
            <Legend cls="bg-amber-400" l="Bron" />
            {readyTotal > 0 && <Badge color="green">{readyTotal} ta taom tayyor</Badge>}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {state.tables
            .filter((t) => t.zone === zone)
            .filter((t) => {
              if (!ownTablesOnly) return true;
              const o = openOrders.find((x) => x.tableId === t.id);
              return !o || o.waiterId === state.user.id;
            })
            .map((t) => {
            const st = statusOf(t);
            const o = openOrders.find((x) => x.tableId === t.id);
            const ready = o ? o.items.filter((i) => i.status === 'ready').length : 0;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSel(t.id)}
                className={`relative aspect-[4/3] rounded-2xl border-2 p-3 flex flex-col justify-between text-left transition ${TABLE_STATUS[st].cls} ${sel === t.id ? 'ring-4 ring-blue-300' : ''}`}
              >
                {ready > 0 && <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[11px] font-bold animate-bounce">{ready} tayyor</span>}
                {o?.billRequested && <BellRing size={16} className="absolute top-3 right-3" />}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg">{t.name}</span>
                </div>
                <div className="text-xs opacity-90 flex items-center gap-1"><Users size={12} /> {t.seats} o'rin</div>
                <div className="text-xs font-medium">
                  {o ? (
                    <span className="flex items-center justify-between"><span><Clock size={11} className="inline -mt-0.5" /> {minutesSince(o.createdAt, now)} daq</span><span>{money(calcOrder(o, state.settings).total)}</span></span>
                  ) : (
                    TABLE_STATUS[st].label
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Card className="lg:sticky lg:top-20 h-fit" bodyClass="p-0">
        {!table ? (
          <EmptyState icon={Armchair} title="Stol tanlang" text="Buyurtma olish yoki holatini ko'rish uchun stolni bosing" />
        ) : (
          <div>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-lg font-bold">{table.name}</div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5">
                  <span>{table.zone} · {table.seats} o'rin{order ? ` · #${order.number}` : ''}</span>
                  {order && (
                    <span className="flex items-center gap-1 ml-1">
                      <button type="button" onClick={() => dispatch({ type: 'UPDATE_ORDER', orderId: order.id, patch: { guests: Math.max(1, order.guests - 1) } })} className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center">−</button>
                      <span className="font-medium">{order.guests} mehmon</span>
                      <button type="button" onClick={() => dispatch({ type: 'UPDATE_ORDER', orderId: order.id, patch: { guests: order.guests + 1 } })} className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center">+</button>
                    </span>
                  )}
                </div>
              </div>
              <Badge color={order ? 'green' : 'slate'}>{order ? 'Band' : TABLE_STATUS[statusOf(table)].label}</Badge>
            </div>

            {!order ? (
              <div className="p-4 space-y-4">
                {reservation && (
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-sm">
                    Bron: <b>{reservation.name}</b> · {reservation.time} · {reservation.guests} kishi
                  </div>
                )}
                <div>
                  <div className="label">Mehmonlar soni</div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                      <button key={n} type="button" onClick={() => setGuests(n)} className={`w-9 h-9 rounded-lg text-sm border ${guests === n ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200'}`}>{n}</button>
                    ))}
                  </div>
                </div>
                <Button className="w-full" size="lg" icon={Plus} onClick={() => setPicker(true)}>Buyurtma olish</Button>
              </div>
            ) : (
              <>
                <ul className="p-3 space-y-1.5 max-h-[45vh] overflow-y-auto scrollbar-thin">
                  {order.items.filter((i) => i.status !== 'cancelled').map((i) => (
                    <li key={i.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50">
                      <span className="text-xl">{i.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{i.qty}× {i.name}</div>
                        {i.note && <div className="text-xs text-amber-600 truncate">📝 {i.note}</div>}
                      </div>
                      <Badge color={ITEM_STATUS[i.status].color}>{ITEM_STATUS[i.status].label}</Badge>
                      {i.status === 'new' && (
                        <button type="button" onClick={() => { setRemoveItem(i); setRemoveReason(''); }} className="p-1 text-slate-300 hover:text-rose-500"><Trash2 size={14} /></button>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="p-4 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between font-bold"><span>Jami</span><span className="text-blue-600">{money(c.total)}</span></div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button icon={Plus} onClick={() => setPicker(true)}>Taom qo'shish</Button>
                    <Button variant="success" icon={CheckCheck} disabled={!order.items.some((i) => i.status === 'ready')} onClick={serveReady}>Tayyorlarni berish</Button>
                    <Button variant="secondary" icon={ArrowRightLeft} onClick={() => setMoveOpen(true)}>Ko'chirish</Button>
                    <Button variant="warning" icon={BellRing} disabled={order.billRequested} onClick={requestBill}>{order.billRequested ? "So'ralgan" : "Hisob so'rash"}</Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </Card>

      <MenuPicker open={picker} onClose={() => setPicker(false)} onConfirm={onPick} title={`${table?.name || ''} — buyurtma`} />

      <Modal open={moveOpen} onClose={() => setMoveOpen(false)} title="Boshqa stolga ko'chirish">
        <div className="grid grid-cols-3 gap-2">
          {state.tables.filter((t) => t.id !== sel && statusOf(t) !== 'busy').map((t) => (
            <button key={t.id} type="button" onClick={() => move(t.id)} className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-sm">
              <div className="font-semibold">{t.name}</div>
              <div className="text-xs text-slate-400">{t.zone} · {t.seats} o'rin</div>
            </button>
          ))}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!removeItem}
        title="Pozitsiyani bekor qilish"
        confirmText="Bekor qilish"
        danger
        onClose={() => setRemoveItem(null)}
        onConfirm={() => {
          if (isManager) {
            doRemoveItem(order.id, removeItem.id, removeReason);
          } else {
            setNeedsRemoveApproval({ orderId: order.id, itemId: removeItem.id, reason: removeReason });
          }
          setRemoveItem(null);
        }}
      >
        <p className="text-sm text-slate-600 mb-2">{removeItem?.qty}× {removeItem?.name} bekor qilinadi.</p>
        <Field label="Sabab (ixtiyoriy)">
          <input className="input" value={removeReason} onChange={(e) => setRemoveReason(e.target.value)} placeholder="Mijoz fikrini o'zgartirdi, xato kiritildi..." />
        </Field>
      </ConfirmDialog>

      <ManagerApproval
        open={!!needsRemoveApproval}
        message="Pozitsiyani bekor qilish uchun menejer yoki administrator PIN kodi kerak."
        onClose={() => setNeedsRemoveApproval(null)}
        onApprove={(approver) => {
          doRemoveItem(needsRemoveApproval.orderId, needsRemoveApproval.itemId, needsRemoveApproval.reason, approver);
          setNeedsRemoveApproval(null);
        }}
      />
    </div>
  );
}

function Legend({ cls, l }) {
  return <span className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded ${cls}`} />{l}</span>;
}
