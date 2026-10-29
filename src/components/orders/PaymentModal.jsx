import { useState } from 'react';
import { Printer, Banknote, CreditCard, Smartphone, Wallet, Crown, Gift, Megaphone, SplitSquareHorizontal, HandCoins, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { Modal, Button, Badge } from '../ui';
import Receipt from './Receipt';
import { calcOrder, money, getTier, roundTo, toDateKey } from '../../utils/format';
import { ORDER_TYPES } from '../../data/labels';

const METHOD_ICONS = { cash: Banknote, card: CreditCard, click: Smartphone, payme: Wallet };

export default function PaymentModal({ orderId, onClose }) {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const order = state.orders.find((o) => o.id === orderId);
  const [discount, setDiscount] = useState(order?.discount || 0);
  const [method, setMethod] = useState('cash');
  const [received, setReceived] = useState('');
  const [tip, setTip] = useState('0');
  const [pointsUsed, setPointsUsed] = useState('0');
  const [splitCount, setSplitCount] = useState(2);
  const [showSplitCalc, setShowSplitCalc] = useState(false);
  const [splits, setSplits] = useState([{ method: 'cash', amount: '' }, { method: 'card', amount: '' }]);
  const [done, setDone] = useState(false);
  const [isCopy] = useState(() => (order?.printCount || 0) > 0);

  if (!order) return null;

  if (done || order.status !== 'open') {
    return (
      <Modal
        open
        onClose={onClose}
        title="Chek"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>Yopish</Button>
            <Button icon={Printer} onClick={() => { dispatch({ type: 'MARK_PRINTED', orderId }); window.print(); }}>Chop etish</Button>
          </>
        }
      >
        <Receipt order={order} copy={isCopy} />
      </Modal>
    );
  }

  const customer = state.customers.find((c) => c.id === order.customerId);
  const tier = customer ? getTier(customer, state.settings) : null;
  const table = state.tables.find((t) => t.id === order.tableId);
  const discountLimit = state.settings.discountLimits?.[state.user?.role] ?? 100;
  const activeCampaign = state.campaigns.find((cp) => cp.active && cp.from <= toDateKey(new Date()) && cp.to >= toDateKey(new Date()));
  const c0 = calcOrder({ ...order, discount: +discount || 0, tip: +tip || 0 }, state.settings);
  const maxRedeemable = Math.min(customer?.points || 0, c0.total);
  const pointsValue = Math.min(+pointsUsed || 0, maxRedeemable) * (state.settings.pointsRedeemRate || 1);
  const totalAfterPoints = Math.max(0, c0.total - pointsValue);
  const cashRounded = method === 'cash' ? roundTo(totalAfterPoints, state.settings.cashRounding) : totalAfterPoints;
  const roundingDiff = cashRounded - totalAfterPoints;
  const c = { ...c0, total: cashRounded };
  const methods = state.settings.paymentMethods.filter((m) => m.enabled);
  const change = method === 'cash' && +received > c.total ? +received - c.total : 0;
  const items = order.items.filter((i) => i.status !== 'cancelled');
  const quick = [c.total, Math.ceil(c.total / 50000) * 50000, Math.ceil(c.total / 100000) * 100000, Math.ceil(c.total / 100000) * 100000 + 100000]
    .filter((v, i, a) => a.indexOf(v) === i);
  const splitTotal = splits.reduce((s, x) => s + (+x.amount || 0), 0);
  const splitOk = method !== 'mixed' || Math.abs(splitTotal - c.total) < 1;

  const setDiscountClamped = (v) => setDiscount(Math.min(discountLimit, Math.max(0, v)));

  const pay = () => {
    if (!items.length) return toast("Buyurtmada pozitsiya yo'q", 'error');
    if (!state.currentShift) return toast('Avval smenani oching', 'error');
    if (method === 'credit' && !order.customerId) return toast("Nasiya uchun mijozni tanlang", 'error');
    if (method === 'mixed' && !splitOk) return toast("Bo'lingan summalar jamini tekshiring", 'error');
    if (method === 'cash' && !received) return toast('Mijoz bergan summani kiriting', 'error');
    if (method === 'cash' && +received < c.total) return toast('Berilgan summa yetarli emas', 'error');
    dispatch({
      type: 'PAY_ORDER',
      orderId,
      method,
      discount: +discount || 0,
      tip: +tip || 0,
      pointsUsed: Math.min(+pointsUsed || 0, maxRedeemable),
      received: method === 'cash' ? +received : c.total,
      roundedTotal: method === 'cash' ? cashRounded : null,
      splits: method === 'mixed' ? splits.filter((x) => +x.amount > 0).map((x) => ({ method: x.method, amount: +x.amount })) : undefined,
    });
    toast(method === 'credit' ? "Nasiyaga yozildi" : "To'lov qabul qilindi", 'success');
    setDone(true);
  };

  const perPerson = showSplitCalc && splitCount > 0 ? Math.ceil(c.total / splitCount / 1000) * 1000 : 0;

  return (
    <Modal
      open
      onClose={onClose}
      title={`To'lov — #${order.number}`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Bekor</Button>
          <Button variant="success" size="lg" onClick={pay}>
            {method === 'credit' ? `Nasiyaga yozish ${money(c.total)}` : `To'lash ${money(c.total)}`}
          </Button>
        </>
      }
    >
      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
            <Badge color="blue">{ORDER_TYPES[order.type]}</Badge>
            {table && <Badge>{table.name}</Badge>}
            {customer && <Badge color="purple">{customer.name}</Badge>}
          </div>
          <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin pr-1">
            {items.map((i) => (
              <div key={i.id} className="flex items-center gap-2 text-sm">
                <span className="text-lg">{i.emoji}</span>
                <span className="flex-1 truncate">{i.name}</span>
                <span className="text-slate-500">{i.qty}×</span>
                <span className="font-medium w-24 text-right tabular-nums">{money(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-sm">
            <Line l="Oraliq summa" r={money(c.subtotal)} />
            {c.discountAmount > 0 && <Line l={`Chegirma (${discount}%)`} r={`-${money(c.discountAmount)}`} cls="text-rose-600" />}
            {c.service > 0 && <Line l={`Xizmat haqi (${state.settings.serviceFee}%)`} r={money(c.service)} />}
            {c.vat > 0 && <Line l={`QQS (${state.settings.vatRate}%)`} r={money(c.vat)} />}
            {c.deliveryFee > 0 && <Line l="Yetkazib berish" r={money(c.deliveryFee)} />}
            {c.tip > 0 && <Line l="Choy puli" r={money(c.tip)} />}
            {pointsValue > 0 && <Line l={`Bonus ball (${Math.min(+pointsUsed || 0, maxRedeemable)} ball)`} r={`-${money(pointsValue)}`} cls="text-emerald-600" />}
            {roundingDiff !== 0 && <Line l="Yaxlitlash" r={`${roundingDiff > 0 ? '+' : ''}${money(roundingDiff)}`} cls="text-slate-400" />}
            <div className="flex justify-between pt-2 text-lg font-bold">
              <span>Jami</span>
              <span className="text-blue-600">{money(c.total)}</span>
            </div>
          </div>

          <button type="button" onClick={() => setShowSplitCalc((v) => !v)} className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600">
            <SplitSquareHorizontal size={13} /> Hisobni teng bo'lish kalkulyatori
          </button>
          {showSplitCalc && (
            <div className="mt-2 p-3 rounded-xl bg-slate-50 flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <span>Necha kishi:</span>
                <input type="number" min="1" className="input !w-16 !py-1" value={splitCount} onChange={(e) => setSplitCount(Math.max(1, +e.target.value))} />
              </div>
              <div className="font-semibold">{money(perPerson)} / kishi</div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <div className="label">Chegirma {discountLimit < 100 && <span className="text-slate-400 font-normal">(limit {discountLimit}%)</span>}</div>
            <div className="flex flex-wrap gap-1.5">
              {[0, 5, 10, 15, 20].filter((d) => d <= discountLimit).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDiscountClamped(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition ${+discount === d ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 hover:bg-slate-50'}`}
                >
                  {d}%
                </button>
              ))}
              <input type="number" min="0" max={discountLimit} className="input !w-20" value={discount} onChange={(e) => setDiscountClamped(+e.target.value)} />
            </div>
            {tier && tier.discount > 0 && (
              <button type="button" onClick={() => setDiscountClamped(tier.discount)} className="mt-2 flex items-center gap-1.5 text-xs text-violet-700 bg-violet-50 px-2.5 py-1.5 rounded-lg hover:bg-violet-100">
                <Crown size={14} /> {tier.name} mijoz — {tier.discount}% chegirma qo'llash
              </button>
            )}
            {activeCampaign && (
              <button type="button" onClick={() => setDiscountClamped(activeCampaign.discount)} className="mt-2 ml-0 flex items-center gap-1.5 text-xs text-rose-700 bg-rose-50 px-2.5 py-1.5 rounded-lg hover:bg-rose-100">
                <Megaphone size={14} /> "{activeCampaign.name}" kampaniyasi — {activeCampaign.discount}% qo'llash
              </button>
            )}
          </div>

          {customer && maxRedeemable > 0 && (
            <div>
              <div className="label flex items-center gap-1"><Gift size={12} /> Bonus ball bilan to'lash (mavjud: {customer.points})</div>
              <div className="flex gap-1.5">
                <input type="number" min="0" max={maxRedeemable} className="input !w-28" value={pointsUsed} onChange={(e) => setPointsUsed(Math.min(maxRedeemable, Math.max(0, +e.target.value)))} />
                <button type="button" onClick={() => setPointsUsed(String(maxRedeemable))} className="px-2.5 py-1 rounded-md text-xs bg-slate-100 hover:bg-slate-200">Hammasi</button>
              </div>
            </div>
          )}

          <div>
            <div className="label">Choy puli (ixtiyoriy)</div>
            <div className="flex flex-wrap gap-1.5">
              {[0, 5, 10].map((pct) => {
                const val = Math.round((c0.subtotal - c0.discountAmount) * (pct / 100));
                return (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setTip(String(val))}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition ${+tip === val && pct > 0 ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    {pct === 0 ? "Yo'q" : `${pct}%`}
                  </button>
                );
              })}
              <input type="number" min="0" className="input !w-28" value={tip} onChange={(e) => setTip(e.target.value)} placeholder="so'm" />
            </div>
          </div>

          <div>
            <div className="label">To'lov turi</div>
            <div className="grid grid-cols-2 gap-2">
              {methods.map((m) => {
                const Icon = METHOD_ICONS[m.id] || Wallet;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                      method === m.id ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon size={18} /> {m.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setMethod('mixed')}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                  method === 'mixed' ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-100' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <SplitSquareHorizontal size={18} /> Aralash
              </button>
              {state.settings.creditEnabled && (
                <button
                  type="button"
                  onClick={() => setMethod('credit')}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition ${
                    method === 'credit' ? 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-100' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <HandCoins size={18} /> Nasiya
                </button>
              )}
            </div>
          </div>

          {method === 'credit' && (
            <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-sm">
              {customer ? (
                <>Summa <b>{customer.name}</b> nomidagi nasiya qarziga yoziladi. Joriy qarz: {money(customer.debt || 0)}</>
              ) : (
                "Nasiya uchun avval mijozni tanlang (buyurtma panelida)"
              )}
            </div>
          )}

          {method === 'mixed' && (
            <div className="space-y-2">
              <div className="label">Bo'linган to'lov</div>
              {splits.map((sp, idx) => (
                <div key={idx} className="flex gap-1.5">
                  <select className="input !w-28" value={sp.method} onChange={(e) => setSplits((x) => x.map((s, i) => (i === idx ? { ...s, method: e.target.value } : s)))}>
                    {methods.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                  </select>
                  <input type="number" className="input flex-1" placeholder="Summa" value={sp.amount} onChange={(e) => setSplits((x) => x.map((s, i) => (i === idx ? { ...s, amount: e.target.value } : s)))} />
                  {splits.length > 2 && (
                    <button type="button" onClick={() => setSplits((x) => x.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                  )}
                </div>
              ))}
              <div className="flex items-center justify-between">
                <button type="button" onClick={() => setSplits((x) => [...x, { method: 'cash', amount: '' }])} className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Plus size={13} /> Qo'shish</button>
                <span className={`text-xs font-medium ${splitOk ? 'text-emerald-600' : 'text-rose-600'}`}>Jami: {money(splitTotal)} / {money(c.total)}</span>
              </div>
            </div>
          )}

          {method === 'cash' && (
            <div>
              <div className="label">Mijoz bergan summa</div>
              <input type="number" className="input text-lg font-semibold" placeholder={String(c.total)} value={received} onChange={(e) => setReceived(e.target.value)} />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quick.map((v) => (
                  <button key={v} type="button" onClick={() => setReceived(String(v))} className="px-2.5 py-1 rounded-md text-xs bg-slate-100 hover:bg-slate-200">
                    {money(v)}
                  </button>
                ))}
              </div>
              {change > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-emerald-50 text-emerald-700 flex justify-between font-semibold">
                  <span>Qaytim</span>
                  <span>{money(change)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function Line({ l, r, cls = '' }) {
  return (
    <div className={`flex justify-between ${cls}`}>
      <span className="text-slate-500">{l}</span>
      <span className="tabular-nums">{r}</span>
    </div>
  );
}
