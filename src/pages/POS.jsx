import { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, Trash2, Send, CreditCard, ShoppingCart, StickyNote, X, Keyboard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Button, SearchInput, Badge, EmptyState } from '../components/ui';
import PaymentModal from '../components/orders/PaymentModal';
import { money, uid, calcOrder } from '../utils/format';
import { getTableStatus } from '../utils/tables';
import { ORDER_TYPES } from '../data/labels';

const DRAFT_KEY = 'restropos_pos_draft';
const DRAFT_MAX_AGE = 8 * 60 * 60 * 1000;

function loadDraft() {
  try {
    const d = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
    if (d && Date.now() - d.savedAt < DRAFT_MAX_AGE) return d;
  } catch {
    /* ignore */
  }
  return null;
}

export default function POS() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const { menu, categories, tables, customers, settings, reservations } = state;
  const orders = state.orders.filter((o) => o.branchId === state.branchId);
  const draft = useRef(loadDraft()).current;

  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [cart, setCart] = useState(draft?.cart || []);
  const [type, setType] = useState(draft?.type || 'dine-in');
  const [tableId, setTableId] = useState(draft?.tableId || '');
  const [customerId, setCustomerId] = useState(draft?.customerId || '');
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerOpen, setCustomerOpen] = useState(false);
  const customerBoxRef = useRef(null);
  const [payId, setPayId] = useState(null);
  const [noteKey, setNoteKey] = useState(null);
  const searchRef = useRef(null);

  useEffect(() => {
    try {
      if (cart.length) localStorage.setItem(DRAFT_KEY, JSON.stringify({ cart, type, tableId, customerId, savedAt: Date.now() }));
      else localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  }, [cart, type, tableId, customerId]);

  useEffect(() => {
    if (draft?.cart?.length) toast("Saqlanib qolgan savat tiklandi", 'info');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onClick = (e) => customerBoxRef.current && !customerBoxRef.current.contains(e.target) && setCustomerOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const matchingCustomers = customerQuery.trim()
    ? customers.filter((c) => c.name.toLowerCase().includes(customerQuery.toLowerCase()) || c.phone.replace(/\D/g, '').includes(customerQuery.replace(/\D/g, '')))
    : customers;

  const items = useMemo(
    () => menu.filter((m) => m.available && (cat === 'all' || m.categoryId === cat) && m.name.toLowerCase().includes(q.toLowerCase())),
    [menu, cat, q]
  );
  const openOrders = orders.filter((o) => o.status === 'open' && o.onlineStatus !== 'pending');
  const existing = type === 'dine-in' && tableId ? openOrders.find((o) => o.tableId === tableId) : null;
  const existingCalc = existing ? calcOrder(existing, settings) : null;
  const cartCalc = calcOrder({ type, items: cart }, settings);

  const add = (m) =>
    setCart((c) => {
      const ex = c.find((i) => i.menuId === m.id && !i.note);
      if (ex) return c.map((i) => (i === ex ? { ...i, qty: i.qty + 1 } : i));
      return [...c, { key: uid(), menuId: m.id, name: m.name, price: m.price, station: m.station, emoji: m.emoji, qty: 1, note: '' }];
    });
  const changeQty = (key, d) => setCart((c) => c.map((i) => (i.key === key ? { ...i, qty: i.qty + d } : i)).filter((i) => i.qty > 0));
  const setNote = (key, note) => setCart((c) => c.map((i) => (i.key === key ? { ...i, note } : i)));
  const toItems = () => cart.map(({ key, ...i }) => i);

  const submit = (pay) => {
    if (type === 'dine-in' && !tableId) return toast('Stolni tanlang', 'error');
    if (!cart.length && !(pay && existing)) return toast("Savat bo'sh", 'error');
    let id;
    if (existing) {
      id = existing.id;
      if (cart.length) dispatch({ type: 'ADD_ITEMS', orderId: id, items: toItems() });
      if (customerId && existing.customerId !== customerId) dispatch({ type: 'UPDATE_ORDER', orderId: id, patch: { customerId } });
    } else {
      id = uid();
      dispatch({
        type: 'CREATE_ORDER',
        order: { id, type, tableId: type === 'dine-in' ? tableId : null, customerId: customerId || null, source: 'pos', waiterId: null, items: toItems() },
      });
    }
    setCart([]);
    setCustomerId('');
    if (pay) setPayId(id);
    else toast('Buyurtma oshxonaga yuborildi', 'success');
  };

  useEffect(() => {
    const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');
    const onKey = (e) => {
      if (payId || noteKey) return;
      if (e.key === '/' && !isTyping(document.activeElement)) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === 'Escape' && document.activeElement === searchRef.current) {
        setQ('');
        searchRef.current.blur();
        return;
      }
      if (isTyping(document.activeElement)) return;
      if (/^[1-9]$/.test(e.key)) {
        const idx = +e.key - 1;
        if (items[idx]) add(items[idx]);
        return;
      }
      if (e.key === 'Enter' && cart.length) {
        e.preventDefault();
        submit(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, cart, payId, noteKey]);

  return (
    <div className="grid lg:grid-cols-[1fr_380px] gap-4 lg:h-[calc(100vh-7rem)]">
      {/* Menyu */}
      <div className="flex flex-col min-h-0">
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-thin flex-1 pb-1">
            {[{ id: 'all', name: 'Barchasi', emoji: '🍽️' }, ...categories].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                className={`px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap border transition ${
                  cat === c.id ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
          <SearchInput ref={searchRef} value={q} onChange={setQ} placeholder="Mahsulot qidirish... ( / )" className="sm:w-60" />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Keyboard size={13} />
          <span><kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200">1-9</kbd> tez qo'shish · <kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200">/</kbd> qidirish · <kbd className="px-1 py-0.5 rounded bg-slate-100 border border-slate-200">Enter</kbd> chek</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin pr-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
            {items.map((m, idx) => {
              const inCart = cart.filter((i) => i.menuId === m.id).reduce((s, i) => s + i.qty, 0);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => add(m)}
                  className={`relative card p-3 text-left hover:shadow-md hover:border-blue-300 transition active:scale-[0.98] ${inCart ? 'ring-2 ring-blue-500' : ''}`}
                >
                  {idx < 9 && <span className="absolute top-2 left-2 w-5 h-5 rounded-md bg-slate-100 text-slate-400 text-[10px] font-bold flex items-center justify-center">{idx + 1}</span>}
                  {inCart > 0 && (
                    <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{inCart}</span>
                  )}
                  <div className="h-20 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-5xl mb-2">{m.emoji}</div>
                  <div className="text-sm font-semibold text-slate-800 leading-tight">{m.name}</div>
                  <div className="text-xs text-slate-400 truncate mt-0.5">{m.description}</div>
                  <div className="text-sm font-bold text-blue-600 mt-1.5">{money(m.price)}</div>
                </button>
              );
            })}
          </div>
          {!items.length && <EmptyState title="Mahsulot topilmadi" />}
        </div>

        {/* Ochiq buyurtmalar */}
        {openOrders.length > 0 && (
          <div className="mt-3 card p-2 flex gap-2 overflow-x-auto scrollbar-thin">
            <span className="text-xs text-slate-500 self-center px-2 whitespace-nowrap">Ochiq buyurtmalar:</span>
            {openOrders.map((o) => {
              const t = tables.find((x) => x.id === o.tableId);
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setPayId(o.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs border hover:bg-blue-50 hover:border-blue-300 ${o.billRequested ? 'border-amber-400 bg-amber-50' : 'border-slate-200'}`}
                >
                  <b>#{o.number}</b> · {t ? t.name : ORDER_TYPES[o.type]} · {money(calcOrder(o, settings).total)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Savat */}
      <div className="card flex flex-col min-h-[520px] lg:min-h-0">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
            {Object.entries(ORDER_TYPES).map(([k, v]) => (
              <button
                key={k}
                type="button"
                onClick={() => setType(k)}
                className={`py-1.5 rounded-lg text-xs font-medium ${type === k ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'}`}
              >
                {v}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {type === 'dine-in' && (
              <select className="input" value={tableId} onChange={(e) => setTableId(e.target.value)}>
                <option value="">Stol tanlang</option>
                {tables.map((t) => {
                  const st = getTableStatus(t, orders, reservations);
                  return (
                    <option key={t.id} value={t.id}>
                      {t.name} {st === 'busy' ? '• band' : st === 'reserved' ? '• bron' : ''}
                    </option>
                  );
                })}
              </select>
            )}
            <div className={`relative ${type !== 'dine-in' ? 'col-span-2' : ''}`} ref={customerBoxRef}>
              <input
                className="input"
                placeholder="Mijoz (ism yoki telefon)..."
                value={customerOpen ? customerQuery : selectedCustomer?.name || ''}
                onFocus={() => { setCustomerOpen(true); setCustomerQuery(''); }}
                onChange={(e) => setCustomerQuery(e.target.value)}
              />
              {customerOpen && (
                <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto scrollbar-thin card p-1.5 shadow-lg">
                  <button
                    type="button"
                    onClick={() => { setCustomerId(''); setCustomerOpen(false); }}
                    className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50 text-slate-400"
                  >
                    Mijozsiz
                  </button>
                  {matchingCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { setCustomerId(c.id); setCustomerOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-slate-50 flex items-center justify-between gap-2"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-slate-400">{c.phone}</span>
                    </button>
                  ))}
                  {!matchingCustomers.length && <div className="px-3 py-2 text-sm text-slate-400">Topilmadi</div>}
                </div>
              )}
            </div>
          </div>
          {existing && (
            <div className="text-xs p-2.5 rounded-lg bg-blue-50 text-blue-800">
              Bu stolda ochiq buyurtma bor: <b>#{existing.number}</b> · {existing.items.filter((i) => i.status !== 'cancelled').length} pozitsiya · {money(existingCalc.total)}. Yangi taomlar shu buyurtmaga qo'shiladi.
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
          {cart.map((i) => (
            <div key={i.key} className="p-2.5 rounded-xl bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{i.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{i.name}</div>
                  <div className="text-xs text-slate-500">{money(i.price)}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => changeQty(i.key, -1)} className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                    {i.qty === 1 ? <Trash2 size={13} className="text-rose-500" /> : <Minus size={13} />}
                  </button>
                  <span className="w-6 text-center text-sm font-semibold">{i.qty}</span>
                  <button type="button" onClick={() => changeQty(i.key, 1)} className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                    <Plus size={13} />
                  </button>
                </div>
              </div>
              {noteKey === i.key ? (
                <div className="flex gap-1 mt-2">
                  <input autoFocus className="input !py-1 !text-xs" placeholder="Izoh: achchiq emas, piyozsiz..." value={i.note} onChange={(e) => setNote(i.key, e.target.value)} onKeyDown={(e) => e.key === 'Enter' && setNoteKey(null)} />
                  <button type="button" onClick={() => setNoteKey(null)} className="px-2 text-slate-400"><X size={14} /></button>
                </div>
              ) : (
                <button type="button" onClick={() => setNoteKey(i.key)} className="mt-1 ml-9 text-xs text-slate-400 hover:text-blue-600 flex items-center gap-1">
                  <StickyNote size={12} /> {i.note || "Izoh qo'shish"}
                </button>
              )}
            </div>
          ))}
          {!cart.length && <EmptyState icon={ShoppingCart} title="Savat bo'sh" text="Chap tomondan mahsulot tanlang" />}
        </div>

        <div className="p-4 border-t border-slate-100 space-y-1.5 text-sm">
          <div className="flex justify-between text-slate-500"><span>Oraliq summa</span><span>{money(cartCalc.subtotal)}</span></div>
          {cartCalc.service > 0 && <div className="flex justify-between text-slate-500"><span>Xizmat haqi ({settings.serviceFee}%)</span><span>{money(cartCalc.service)}</span></div>}
          {cartCalc.deliveryFee > 0 && <div className="flex justify-between text-slate-500"><span>Yetkazib berish</span><span>{money(cartCalc.deliveryFee)}</span></div>}
          <div className="flex justify-between text-lg font-bold pt-1">
            <span>Jami</span>
            <span className="text-blue-600">{money(cartCalc.total)}</span>
          </div>
          {existing && cart.length > 0 && (
            <div className="flex justify-between text-xs text-slate-500"><span>Stol bo'yicha umumiy</span><Badge color="blue">{money(calcOrder({ ...existing, items: [...existing.items, ...cart] }, settings).total)}</Badge></div>
          )}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="primary" size="lg" icon={Send} onClick={() => submit(false)} disabled={!cart.length}>Chek</Button>
            <Button variant="success" size="lg" icon={CreditCard} onClick={() => submit(true)} disabled={!cart.length && !existing}>To'lov</Button>
          </div>
        </div>
      </div>

      {payId && <PaymentModal orderId={payId} onClose={() => setPayId(null)} />}
    </div>
  );
}
