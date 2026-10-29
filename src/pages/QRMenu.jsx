import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, X, CheckCircle2, Clock, ChefHat, UtensilsCrossed, BellRing } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { money, calcOrder } from '../utils/format';
import { ITEM_STATUS, ONLINE_STATUS } from '../data/labels';

export default function QRMenu() {
  const { tableId } = useParams();
  const { state, dispatch } = useApp();
  const toast = useToast();
  const table = state.tables.find((t) => t.id === tableId);
  const storeKey = `qr_orders_${tableId}`;
  const [cat, setCat] = useState('all');
  const [cart, setCart] = useState({});
  const [sheet, setSheet] = useState(false);
  const [note, setNote] = useState('');
  const [placed, setPlaced] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem(storeKey) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(storeKey, JSON.stringify(placed));
    } catch {
      /* ignore */
    }
  }, [placed, storeKey]);

  const items = useMemo(() => state.menu.filter((m) => m.available && (cat === 'all' || m.categoryId === cat)), [state.menu, cat]);
  const cartList = Object.entries(cart).filter(([, n]) => n > 0).map(([id, qty]) => ({ m: state.menu.find((x) => x.id === id), qty })).filter((x) => x.m);
  const count = cartList.reduce((s, x) => s + x.qty, 0);
  const total = cartList.reduce((s, x) => s + x.qty * x.m.price, 0);
  const change = (id, d) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + d) }));
  const myOrders = state.orders.filter((o) => placed.includes(o.id));

  if (!table) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Stol topilmadi</div>;
  }

  const order = () => {
    const id = `qr${Date.now().toString(36)}`;
    dispatch({
      type: 'CREATE_ORDER',
      order: {
        id,
        type: 'dine-in',
        source: 'qr',
        onlineStatus: 'pending',
        itemStatus: 'pending',
        tableId,
        waiterId: null,
        customerName: `${table.name} (QR)`,
        items: cartList.map(({ m, qty }) => ({ menuId: m.id, name: m.name, price: m.price, station: m.station, emoji: m.emoji, qty, note })),
      },
    });
    setPlaced((p) => [id, ...p]);
    setCart({});
    setNote('');
    setSheet(false);
  };

  const callWaiter = () => {
    const open = state.orders.find((o) => o.tableId === tableId && o.status === 'open' && o.onlineStatus !== 'pending');
    if (open) dispatch({ type: 'UPDATE_ORDER', orderId: open.id, patch: { billRequested: true } });
    toast(open ? "Hisob so'raldi. Ofitsiant tez orada keladi." : 'Ofitsiant chaqirildi.', 'success');
  };

  return (
    <div className="min-h-screen bg-cream pb-28">
      <header className="bg-gradient-to-br from-slate-900 to-blue-900 text-white px-5 pt-6 pb-8 rounded-b-3xl">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center"><UtensilsCrossed size={22} /></div>
            <div className="flex-1">
              <div className="font-bold text-lg">{state.settings.restaurantName}</div>
              <div className="text-sm text-slate-300">{table.name} · {state.settings.workingHours}</div>
            </div>
            <button type="button" onClick={callWaiter} className="flex items-center gap-1.5 text-xs bg-white/15 px-3 py-2 rounded-xl hover:bg-white/25">
              <BellRing size={14} /> Hisob
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 -mt-5">
        {myOrders.length > 0 && (
          <div className="card p-4 mb-4">
            <div className="font-semibold mb-2 flex items-center gap-2"><ChefHat size={18} className="text-blue-600" /> Buyurtmalaringiz</div>
            {myOrders.map((o) => (
              <div key={o.id} className="py-2 border-t border-slate-100 first:border-0">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">#{o.number}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${o.onlineStatus === 'pending' ? 'bg-blue-50 text-blue-700' : o.onlineStatus === 'rejected' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {o.onlineStatus === 'pending' ? 'Tasdiqlanmoqda...' : ONLINE_STATUS[o.onlineStatus]?.label}
                  </span>
                </div>
                {o.items.map((i) => (
                  <div key={i.id} className="flex justify-between text-xs text-slate-500">
                    <span>{i.qty}× {i.name}</span>
                    <span>{ITEM_STATUS[i.status]?.label}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 sticky top-0 bg-cream pt-2 z-10">
          {[{ id: 'all', name: 'Barchasi', emoji: '🍽️' }, ...state.categories].map((c) => (
            <button key={c.id} type="button" onClick={() => setCat(c.id)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-sm ${cat === c.id ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}>
              {c.emoji} {c.name}
            </button>
          ))}
        </div>

        <div className="space-y-3 mt-2">
          {items.map((m) => {
            const n = cart[m.id] || 0;
            return (
              <div key={m.id} className="card p-3 flex gap-3">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center text-4xl shrink-0">{m.emoji}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-xs text-slate-500 line-clamp-2">{m.description}</div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-blue-600">{money(m.price)}</span>
                    {n === 0 ? (
                      <button type="button" onClick={() => change(m.id, 1)} className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center"><Plus size={18} /></button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => change(m.id, -1)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Minus size={16} /></button>
                        <span className="font-semibold w-5 text-center">{n}</span>
                        <button type="button" onClick={() => change(m.id, 1)} className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center"><Plus size={16} /></button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {count > 0 && !sheet && (
        <div className="fixed bottom-4 inset-x-4 max-w-2xl mx-auto">
          <button type="button" onClick={() => setSheet(true)} className="w-full flex items-center justify-between bg-blue-600 text-white rounded-2xl px-5 py-4 shadow-xl shadow-blue-600/30">
            <span className="flex items-center gap-2 font-medium"><ShoppingBag size={20} /> {count} ta mahsulot</span>
            <span className="font-bold">{money(total)}</span>
          </button>
        </div>
      )}

      {sheet && (
        <div className="fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setSheet(false)} />
          <div className="relative w-full max-w-2xl mx-auto bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto animate-in">
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-lg">Savat</div>
              <button type="button" onClick={() => setSheet(false)} className="p-1.5 rounded-lg hover:bg-slate-100"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {cartList.map(({ m, qty }) => (
                <div key={m.id} className="flex items-center gap-3">
                  <span className="text-3xl">{m.emoji}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{m.name}</div>
                    <div className="text-xs text-slate-500">{money(m.price)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => change(m.id, -1)} className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center"><Minus size={16} /></button>
                    <span className="font-semibold w-5 text-center">{qty}</span>
                    <button type="button" onClick={() => change(m.id, 1)} className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center"><Plus size={16} /></button>
                  </div>
                </div>
              ))}
            </div>
            <textarea className="input mt-4" rows={2} placeholder="Izoh: achchiq bo'lmasin, piyozsiz..." value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between text-slate-500"><span>Oraliq summa</span><span>{money(total)}</span></div>
              <div className="flex justify-between text-slate-500"><span>Xizmat haqi ({state.settings.serviceFee}%)</span><span>{money(calcOrder({ type: 'dine-in', items: cartList.map(({ m, qty }) => ({ price: m.price, qty })) }, state.settings).service)}</span></div>
              <div className="flex justify-between font-bold text-lg pt-1"><span>Jami</span><span className="text-blue-600">{money(calcOrder({ type: 'dine-in', items: cartList.map(({ m, qty }) => ({ price: m.price, qty })) }, state.settings).total)}</span></div>
            </div>
            <button type="button" onClick={order} disabled={!count} className="mt-4 w-full bg-blue-600 text-white rounded-2xl py-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              <CheckCircle2 size={20} /> Buyurtma berish
            </button>
            <p className="text-xs text-slate-400 text-center mt-2 flex items-center justify-center gap-1"><Clock size={12} /> To'lov ofitsiant yoki kassada amalga oshiriladi</p>
          </div>
        </div>
      )}
    </div>
  );
}
