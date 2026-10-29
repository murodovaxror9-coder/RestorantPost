import { useState } from 'react';
import { Wallet, Lock, Unlock, Receipt as ReceiptIcon, RotateCcw, BellRing, Printer, XCircle, SplitSquareHorizontal, ArrowDownToLine, ArrowUpFromLine, FileBarChart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Card, Button, Badge, StatCard, Modal, Field, EmptyState, ConfirmDialog, PageHeader, SearchInput } from '../components/ui';
import PaymentModal from '../components/orders/PaymentModal';
import Receipt from '../components/orders/Receipt';
import ManagerApproval from '../components/ManagerApproval';
import { money, calcOrder, fmtTime, fmtDateTime, isToday, minutesSince } from '../utils/format';
import { ORDER_TYPES, ORDER_STATUS, PAYMENT_LABELS } from '../data/labels';

export default function Cashier() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [payId, setPayId] = useState(null);
  const [opening, setOpening] = useState('500000');
  const [closeOpen, setCloseOpen] = useState(false);
  const [counted, setCounted] = useState('');
  const [refundId, setRefundId] = useState(null);
  const [cancelId, setCancelId] = useState(null);
  const [reason, setReason] = useState('');
  const [receiptId, setReceiptId] = useState(null);
  const [needsApproval, setNeedsApproval] = useState(null);
  const [receiptQuery, setReceiptQuery] = useState('');
  const [partialOrder, setPartialOrder] = useState(null);
  const [needsItemApproval, setNeedsItemApproval] = useState(null);
  const [cashMoveOpen, setCashMoveOpen] = useState(null);
  const [cashMoveAmount, setCashMoveAmount] = useState('');
  const [cashMoveNote, setCashMoveNote] = useState('');
  const [xReportOpen, setXReportOpen] = useState(false);

  const isManager = ['admin', 'manager'].includes(state.user?.role);
  const doRefund = (orderId, approver) => {
    dispatch({ type: 'REFUND_ORDER', orderId, reason: approver ? `${reason}${reason ? ' — ' : ''}Tasdiqladi: ${approver.name}` : reason });
    toast("To'lov qaytarildi", 'success');
  };
  const doItemRefund = (orderId, itemId, approver) => {
    dispatch({ type: 'PARTIAL_REFUND', orderId, itemId, reason: approver ? `Tasdiqladi: ${approver.name}` : '' });
    toast('Pozitsiya qaytarildi', 'success');
  };

  const shift = state.currentShift;
  const open = state.orders
    .filter((o) => o.status === 'open' && o.onlineStatus !== 'pending')
    .sort((a, b) => (b.billRequested ? 1 : 0) - (a.billRequested ? 1 : 0));
  const shiftOrders = shift ? state.orders.filter((o) => o.shiftId === shift.id && ['paid', 'refunded'].includes(o.status)) : [];
  const byMethod = {};
  let shiftTotal = 0;
  let cashRefunds = 0;
  shiftOrders.forEach((o) => {
    const parts = o.payment.method === 'mixed' ? o.payment.splits : [{ method: o.payment.method, amount: o.total }];
    parts.forEach((p) => { byMethod[p.method] = (byMethod[p.method] || 0) + p.amount; });
    shiftTotal += o.total;
    if (o.status === 'refunded' && o.payment.method === 'cash') cashRefunds += o.total;
  });
  const cashIn = shift ? (shift.cashMovements || []).filter((m) => m.type === 'in').reduce((s, m) => s + m.amount, 0) : 0;
  const cashOut = shift ? (shift.cashMovements || []).filter((m) => m.type === 'out').reduce((s, m) => s + m.amount, 0) : 0;
  const expectedCash = shift ? shift.openingCash + (byMethod.cash || 0) - cashRefunds + cashIn - cashOut : 0;

  const searching = receiptQuery.trim().length > 0;
  const todayPaid = state.orders
    .filter((o) => ['paid', 'refunded'].includes(o.status) && (searching ? String(o.number).includes(receiptQuery.trim()) : isToday(o.paidAt)))
    .sort((a, b) => (a.paidAt < b.paidAt ? 1 : -1))
    .slice(0, 40);

  const tableName = (o) => state.tables.find((t) => t.id === o.tableId)?.name || ORDER_TYPES[o.type];

  return (
    <div className="space-y-5">
      <PageHeader title="Kassir paneli" subtitle="Smena, to'lovlar va qaytarishlar" />

      {/* Smena */}
      <div className="card p-5">
        {shift ? (
          <div className="flex flex-col lg:flex-row lg:items-center gap-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Unlock size={22} /></div>
              <div>
                <div className="font-semibold">Smena ochiq</div>
                <div className="text-sm text-slate-500">{shift.cashierName} · {fmtTime(shift.openedAt)} dan beri</div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
              <MiniStat l="Savdo" v={money(shiftTotal)} />
              <MiniStat l="Naqd" v={money(byMethod.cash || 0)} />
              <MiniStat l="Karta / Click / Payme" v={money((byMethod.card || 0) + (byMethod.click || 0) + (byMethod.payme || 0))} />
              <MiniStat l="Kassada bo'lishi kerak" v={money(expectedCash)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" icon={ArrowDownToLine} onClick={() => setCashMoveOpen('in')}>Kirim</Button>
              <Button variant="secondary" icon={ArrowUpFromLine} onClick={() => setCashMoveOpen('out')}>Chiqim</Button>
              <Button variant="secondary" icon={FileBarChart} onClick={() => setXReportOpen(true)}>X-hisobot</Button>
              <Button variant="danger" icon={Lock} onClick={() => { setCounted(String(expectedCash)); setCloseOpen(true); }}>Smenani yopish</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center"><Lock size={22} /></div>
              <div>
                <div className="font-semibold">Smena yopiq</div>
                <div className="text-sm text-slate-500">To'lovlarni smenaga bog'lash uchun smenani oching</div>
              </div>
            </div>
            <Field label="Boshlang'ich kassa (naqd)" className="sm:w-56">
              <input type="number" className="input" value={opening} onChange={(e) => setOpening(e.target.value)} />
            </Field>
            <Button variant="success" icon={Unlock} onClick={() => { dispatch({ type: 'OPEN_SHIFT', openingCash: opening }); toast('Smena ochildi', 'success'); }}>
              Smenani ochish
            </Button>
          </div>
        )}
      </div>

      <div className="grid xl:grid-cols-[1fr_1.2fr] gap-5">
        <Card title={`To'lanmagan buyurtmalar (${open.length})`}>
          <div className="space-y-2">
            {open.map((o) => {
              const c = calcOrder(o, state.settings);
              const pending = o.items.filter((i) => ['new', 'cooking'].includes(i.status)).length;
              return (
                <div key={o.id} className={`flex items-center gap-3 p-3 rounded-xl border ${o.billRequested ? 'border-amber-300 bg-amber-50' : 'border-slate-200'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">#{o.number}</span>
                      <span className="text-sm text-slate-600">{tableName(o)}</span>
                      {o.billRequested && <Badge color="amber"><BellRing size={11} /> Hisob so'raldi</Badge>}
                      {o.source !== 'pos' && <Badge color="purple">{o.source === 'qr' ? 'QR' : o.source === 'online' ? 'Onlayn' : 'Ofitsiant'}</Badge>}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {minutesSince(o.createdAt)} daq oldin · {o.items.filter((i) => i.status !== 'cancelled').length} pozitsiya{pending ? ` · ${pending} tayyorlanmoqda` : ''}
                    </div>
                  </div>
                  <div className="font-bold tabular-nums">{money(c.total)}</div>
                  <button type="button" title="Bekor qilish" onClick={() => { setReason(''); setCancelId(o.id); }} className="p-2 text-slate-400 hover:text-rose-600"><XCircle size={18} /></button>
                  <Button size="sm" variant="success" onClick={() => setPayId(o.id)}>To'lov</Button>
                </div>
              );
            })}
            {!open.length && <EmptyState icon={Wallet} title="Hammasi to'langan" />}
          </div>
        </Card>

        <Card
          title={searching ? 'Qidiruv natijasi' : "Bugungi to'lovlar"}
          actions={<SearchInput value={receiptQuery} onChange={setReceiptQuery} placeholder="Chek raqami..." className="!w-40" />}
          bodyClass="p-0 pt-3"
        >
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr><th>Chek</th><th>Vaqt</th><th>Joy</th><th>To'lov</th><th className="text-right">Summa</th><th /></tr>
              </thead>
              <tbody>
                {todayPaid.map((o) => (
                  <tr key={o.id}>
                    <td className="font-medium">#{o.number}</td>
                    <td className="text-slate-500">{fmtTime(o.paidAt)}</td>
                    <td>{tableName(o)}</td>
                    <td>
                      {o.status === 'refunded' ? <Badge color={ORDER_STATUS.refunded.color}>Qaytarilgan</Badge> : <Badge>{PAYMENT_LABELS[o.payment.method]}</Badge>}
                    </td>
                    <td className={`text-right font-semibold tabular-nums ${o.status === 'refunded' ? 'line-through text-slate-400' : ''}`}>{money(o.total)}</td>
                    <td className="text-right whitespace-nowrap">
                      <button type="button" title="Chek" onClick={() => setReceiptId(o.id)} className="p-1.5 text-slate-400 hover:text-blue-600"><ReceiptIcon size={16} /></button>
                      {o.status === 'paid' && (
                        <>
                          <button type="button" title="Qisman qaytarish" onClick={() => setPartialOrder(o)} className="p-1.5 text-slate-400 hover:text-violet-600"><SplitSquareHorizontal size={16} /></button>
                          <button type="button" title="To'liq qaytarish" onClick={() => { setReason(''); setRefundId(o.id); }} className="p-1.5 text-slate-400 hover:text-rose-600"><RotateCcw size={16} /></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!todayPaid.length && <EmptyState title="Bugun hali to'lov yo'q" />}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {state.shifts.slice(0, 4).map((s) => (
          <StatCard key={s.id} label={`Smena · ${fmtDateTime(s.openedAt).slice(0, 10)}`} value={money(s.total)} icon={Wallet} color={s.difference < 0 ? 'red' : 'green'} hint={`Farq: ${money(s.difference)}`} />
        ))}
      </div>

      {payId && <PaymentModal orderId={payId} onClose={() => setPayId(null)} />}

      <Modal
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        title="Smenani yopish"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCloseOpen(false)}>Bekor</Button>
            <Button variant="danger" onClick={() => { dispatch({ type: 'CLOSE_SHIFT', countedCash: counted }); setCloseOpen(false); toast('Smena yopildi', 'success'); }}>Yopish</Button>
          </>
        }
      >
        <div className="space-y-2 text-sm mb-4">
          <Row l="Boshlang'ich kassa" r={money(shift?.openingCash)} />
          {Object.entries(byMethod).map(([m, v]) => <Row key={m} l={PAYMENT_LABELS[m]} r={money(v)} />)}
          <Row l="Naqd qaytarishlar" r={`-${money(cashRefunds)}`} />
          {cashIn > 0 && <Row l="Kassaga kirim" r={money(cashIn)} />}
          {cashOut > 0 && <Row l="Kassadan chiqim" r={`-${money(cashOut)}`} />}
          <Row l="Kassada bo'lishi kerak" r={money(expectedCash)} b />
        </div>
        <Field label="Sanalgan naqd pul (yopishdan oldin)">
          <input type="number" className="input text-lg font-semibold" value={counted} onChange={(e) => setCounted(e.target.value)} />
        </Field>
        <div className={`mt-3 p-3 rounded-xl text-sm font-semibold flex justify-between ${+counted - expectedCash < 0 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
          <span>Farq</span>
          <span>{money(+counted - expectedCash)}</span>
        </div>
      </Modal>

      <Modal
        open={!!cashMoveOpen}
        onClose={() => setCashMoveOpen(null)}
        title={cashMoveOpen === 'in' ? "Kassaga kirim (inkassatsiya)" : 'Kassadan chiqim'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCashMoveOpen(null)}>Bekor</Button>
            <Button
              onClick={() => {
                if (!(+cashMoveAmount > 0)) return toast('Summani kiriting', 'error');
                dispatch({ type: 'CASH_MOVEMENT', moveType: cashMoveOpen, amount: +cashMoveAmount, note: cashMoveNote });
                setCashMoveOpen(null);
                setCashMoveAmount('');
                setCashMoveNote('');
                toast('Saqlandi', 'success');
              }}
            >
              Saqlash
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Summa (so'm)"><input type="number" className="input text-lg font-semibold" value={cashMoveAmount} onChange={(e) => setCashMoveAmount(e.target.value)} /></Field>
          <Field label="Izoh"><input className="input" value={cashMoveNote} onChange={(e) => setCashMoveNote(e.target.value)} placeholder={cashMoveOpen === 'in' ? "Masalan: seyfdan qo'shimcha naqd" : 'Masalan: bankka inkassatsiya'} /></Field>
        </div>
      </Modal>

      <Modal open={xReportOpen} onClose={() => setXReportOpen(false)} title="X-hisobot (joriy smena)" size="sm">
        <div className="space-y-2 text-sm">
          <Row l="Smena boshlangan" r={shift ? fmtDateTime(shift.openedAt) : '—'} />
          <Row l="Boshlang'ich kassa" r={money(shift?.openingCash)} />
          {Object.entries(byMethod).map(([m, v]) => <Row key={m} l={PAYMENT_LABELS[m]} r={money(v)} />)}
          <Row l="Naqd qaytarishlar" r={`-${money(cashRefunds)}`} />
          {cashIn > 0 && <Row l="Kassaga kirim" r={money(cashIn)} />}
          {cashOut > 0 && <Row l="Kassadan chiqim" r={`-${money(cashOut)}`} />}
          <Row l="Jami savdo" r={money(shiftTotal)} />
          <Row l="Kassada bo'lishi kerak" r={money(expectedCash)} b />
        </div>
        <p className="text-xs text-slate-400 mt-3">Bu — oraliq hisobot, smena hali yopilmagan. Yakuniy (Z) hisobot smena yopilganda yaratiladi.</p>
      </Modal>

      <ConfirmDialog
        open={!!refundId}
        title="To'lovni qaytarish"
        confirmText="Qaytarish"
        danger
        onClose={() => setRefundId(null)}
        onConfirm={() => {
          if (isManager) {
            doRefund(refundId);
            setRefundId(null);
          } else {
            setNeedsApproval(refundId);
            setRefundId(null);
          }
        }}
      >
        <Field label="Sabab">
          <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Masalan: taom sifatsiz" />
        </Field>
      </ConfirmDialog>

      <ManagerApproval
        open={!!needsApproval}
        message="Pulni qaytarish uchun menejer yoki administrator PIN kodi kerak."
        onClose={() => setNeedsApproval(null)}
        onApprove={(approver) => { doRefund(needsApproval, approver); setNeedsApproval(null); }}
      />

      <Modal open={!!partialOrder} onClose={() => setPartialOrder(null)} title={`#${partialOrder?.number} — qisman qaytarish`} size="sm">
        {partialOrder && (() => {
          const live = state.orders.find((x) => x.id === partialOrder.id) || partialOrder;
          const refundable = live.items.filter((i) => i.status !== 'cancelled' && i.status !== 'refunded');
          return (
            <div className="space-y-1.5">
              {refundable.map((i) => (
                <div key={i.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50">
                  <span className="text-lg">{i.emoji}</span>
                  <div className="flex-1 min-w-0 text-sm">
                    <div className="font-medium truncate">{i.qty}× {i.name}</div>
                    <div className="text-xs text-slate-400">{money(i.price * i.qty)}</div>
                  </div>
                  <Button
                    size="xs"
                    variant="secondary"
                    icon={RotateCcw}
                    onClick={() => (isManager ? doItemRefund(live.id, i.id) : setNeedsItemApproval({ orderId: live.id, itemId: i.id }))}
                  >
                    Qaytarish
                  </Button>
                </div>
              ))}
              {!refundable.length && <p className="text-sm text-slate-400 text-center py-4">Qaytariladigan pozitsiya qolmadi</p>}
            </div>
          );
        })()}
      </Modal>

      <ManagerApproval
        open={!!needsItemApproval}
        message="Pozitsiyani qaytarish uchun menejer yoki administrator PIN kodi kerak."
        onClose={() => setNeedsItemApproval(null)}
        onApprove={(approver) => {
          doItemRefund(needsItemApproval.orderId, needsItemApproval.itemId, approver);
          setNeedsItemApproval(null);
        }}
      />

      <ConfirmDialog
        open={!!cancelId}
        title="Buyurtmani bekor qilish"
        confirmText="Bekor qilish"
        danger
        onClose={() => setCancelId(null)}
        onConfirm={() => { dispatch({ type: 'CANCEL_ORDER', orderId: cancelId, reason }); setCancelId(null); toast('Buyurtma bekor qilindi'); }}
      >
        <Field label="Sabab">
          <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Masalan: mijoz ketdi" />
        </Field>
      </ConfirmDialog>

      <Modal
        open={!!receiptId}
        onClose={() => setReceiptId(null)}
        title="Chek"
        size="sm"
        footer={<Button icon={Printer} onClick={() => { dispatch({ type: 'MARK_PRINTED', orderId: receiptId }); window.print(); }}>Chop etish</Button>}
      >
        <Receipt order={state.orders.find((o) => o.id === receiptId)} />
      </Modal>
    </div>
  );
}

function MiniStat({ l, v }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50">
      <div className="text-xs text-slate-500">{l}</div>
      <div className="font-semibold tabular-nums">{v}</div>
    </div>
  );
}

function Row({ l, r, b }) {
  return (
    <div className={`flex justify-between ${b ? 'font-semibold pt-2 border-t border-slate-100' : ''}`}>
      <span className="text-slate-500">{l}</span>
      <span className="tabular-nums">{r}</span>
    </div>
  );
}
