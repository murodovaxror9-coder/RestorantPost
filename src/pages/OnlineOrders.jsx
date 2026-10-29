import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Check, X, Truck, PackageCheck, MapPin, Phone, ExternalLink, Printer, Sparkles, QrCode, Globe } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Button, Badge, Tabs, EmptyState, StatCard } from '../components/ui';
import useNow from '../hooks/useNow';
import { money, calcOrder, minutesSince, fmtTime, isToday } from '../utils/format';
import { ONLINE_STATUS, ORDER_TYPES, PAYMENT_LABELS } from '../data/labels';

const DEMO_NAMES = ['Aziza Rahimova', 'Bobur Xasanov', 'Kamola Tursunova', 'Sherzod Yoqubov', 'Madina Ortiqova'];
const DEMO_ADDR = ['Yunusobod 4-kvartal, 18-uy', 'Mirzo Ulug‘bek, Buyuk Ipak Yo‘li 45', 'Sergeli 7-mavze, 3-uy', 'Chilonzor 19-kvartal, 7-uy'];

export default function OnlineOrders() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const now = useNow(30000);
  const [tab, setTab] = useState('orders');
  const [filter, setFilter] = useState('active');
  const [printTable, setPrintTable] = useState(null);

  useEffect(() => {
    if (!printTable) return undefined;
    const t = setTimeout(() => {
      window.print();
      setPrintTable(null);
    }, 50);
    return () => clearTimeout(t);
  }, [printTable]);

  const online = state.orders.filter((o) => ['online', 'qr'].includes(o.source) && o.onlineStatus);
  const byFilter = online.filter((o) => {
    if (filter === 'active') return ['pending', 'accepted', 'delivering'].includes(o.onlineStatus) && o.status !== 'cancelled' && !(o.source === 'qr' && o.onlineStatus === 'accepted' && o.status !== 'open');
    if (filter === 'done') return ['completed', 'rejected'].includes(o.onlineStatus) || (o.source === 'qr' && o.status !== 'open');
    return true;
  }).slice(0, 60);
  const today = online.filter((o) => isToday(o.createdAt));
  const pending = online.filter((o) => o.onlineStatus === 'pending' && o.status === 'open');

  const setStatus = (o, status) => {
    dispatch({ type: 'SET_ONLINE_STATUS', orderId: o.id, status });
    if (status === 'completed' && o.status === 'open') {
      dispatch({ type: 'SET_ITEMS_STATUS', orderId: o.id, itemIds: o.items.map((i) => i.id), status: 'served' });
      dispatch({ type: 'PAY_ORDER', orderId: o.id, method: o.paymentMethod || 'cash' });
    }
    toast(ONLINE_STATUS[status].label, status === 'rejected' ? 'error' : 'success');
  };

  const createDemo = () => {
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const menu = state.menu.filter((m) => m.available);
    const items = Array.from({ length: 1 + Math.floor(Math.random() * 3) }, () => {
      const m = pick(menu);
      return { menuId: m.id, name: m.name, price: m.price, station: m.station, emoji: m.emoji, qty: 1 + Math.floor(Math.random() * 2) };
    });
    const type = Math.random() < 0.7 ? 'delivery' : 'takeaway';
    dispatch({
      type: 'CREATE_ORDER',
      order: {
        type, source: 'online', onlineStatus: 'pending', itemStatus: 'pending', waiterId: null,
        customerName: pick(DEMO_NAMES), phone: `+998 9${Math.floor(Math.random() * 10)} ${100 + Math.floor(Math.random() * 900)} ${10 + Math.floor(Math.random() * 90)} ${10 + Math.floor(Math.random() * 90)}`,
        address: type === 'delivery' ? pick(DEMO_ADDR) : '', paymentMethod: pick(['click', 'payme', 'cash']), items,
      },
    });
    toast('Yangi onlayn buyurtma keldi 🔔', 'success');
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Yangi (javob kutmoqda)" value={pending.length} icon={Globe} color="blue" />
        <StatCard label="Bugungi onlayn buyurtmalar" value={today.length} icon={Truck} color="purple" />
        <StatCard label="Bugungi onlayn tushum" value={money(today.filter((o) => o.status === 'paid').reduce((s, o) => s + o.total, 0))} icon={PackageCheck} color="green" />
        <StatCard label="QR menyuli stollar" value={state.tables.length} icon={QrCode} color="amber" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <Tabs tabs={[{ id: 'orders', label: 'Onlayn buyurtmalar', count: pending.length }, { id: 'qr', label: 'QR menyu' }]} value={tab} onChange={setTab} />
        {tab === 'orders' && (
          <div className="flex gap-2">
            <Tabs tabs={[{ id: 'active', label: 'Faol' }, { id: 'done', label: 'Yakunlangan' }, { id: 'all', label: 'Barchasi' }]} value={filter} onChange={setFilter} />
            <Button variant="soft" icon={Sparkles} onClick={createDemo}>Demo buyurtma</Button>
          </div>
        )}
      </div>

      {tab === 'orders' && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {byFilter.map((o) => {
            const c = calcOrder(o, state.settings);
            const total = o.total ?? c.total;
            const table = state.tables.find((t) => t.id === o.tableId);
            const active = o.items.filter((i) => i.status !== 'cancelled');
            const ready = active.filter((i) => ['ready', 'served'].includes(i.status)).length;
            return (
              <div key={o.id} className={`card p-4 flex flex-col ${o.onlineStatus === 'pending' ? 'ring-2 ring-blue-400' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">#{o.number}</span>
                      <Badge color={o.source === 'qr' ? 'amber' : 'purple'}>{o.source === 'qr' ? `QR · ${table?.name}` : ORDER_TYPES[o.type]}</Badge>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">{fmtTime(o.createdAt)} · {minutesSince(o.createdAt, now)} daq oldin</div>
                  </div>
                  <Badge color={ONLINE_STATUS[o.onlineStatus].color}>{ONLINE_STATUS[o.onlineStatus].label}</Badge>
                </div>
                {o.customerName && (
                  <div className="text-sm space-y-1 mb-3 p-2.5 rounded-xl bg-slate-50">
                    <div className="font-medium">{o.customerName}</div>
                    {o.phone && <div className="text-slate-500 flex items-center gap-1.5"><Phone size={13} /> {o.phone}</div>}
                    {o.address && <div className="text-slate-500 flex items-center gap-1.5"><MapPin size={13} /> {o.address}</div>}
                  </div>
                )}
                <ul className="space-y-1 text-sm flex-1">
                  {active.map((i) => (
                    <li key={i.id} className="flex justify-between">
                      <span>{i.emoji} {i.qty}× {i.name}</span>
                      <span className="text-slate-500 tabular-nums">{money(i.qty * i.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    {o.paymentMethod && <>To'lov: {PAYMENT_LABELS[o.paymentMethod]} · </>}
                    {o.onlineStatus !== 'pending' && `Oshxona: ${ready}/${active.length}`}
                  </div>
                  <div className="font-bold text-blue-600">{money(total)}</div>
                </div>
                <div className="flex gap-2 mt-3">
                  {o.onlineStatus === 'pending' && o.status === 'open' && (
                    <>
                      <Button className="flex-1" variant="danger" size="sm" icon={X} onClick={() => setStatus(o, 'rejected')}>Rad etish</Button>
                      <Button className="flex-1" variant="success" size="sm" icon={Check} onClick={() => setStatus(o, 'accepted')}>Qabul qilish</Button>
                    </>
                  )}
                  {o.onlineStatus === 'accepted' && o.source === 'online' && o.type === 'delivery' && (
                    <Button className="flex-1" size="sm" icon={Truck} onClick={() => setStatus(o, 'delivering')}>Kuryerga berildi</Button>
                  )}
                  {o.onlineStatus === 'accepted' && o.source === 'online' && o.type === 'takeaway' && (
                    <Button className="flex-1" variant="success" size="sm" icon={PackageCheck} onClick={() => setStatus(o, 'completed')}>Mijozga topshirildi</Button>
                  )}
                  {o.onlineStatus === 'delivering' && (
                    <Button className="flex-1" variant="success" size="sm" icon={PackageCheck} onClick={() => setStatus(o, 'completed')}>Yetkazildi</Button>
                  )}
                  {o.onlineStatus === 'accepted' && o.source === 'qr' && (
                    <div className="text-xs text-slate-500 flex-1 text-center py-1.5 bg-slate-50 rounded-lg">Stolga biriktirildi — to'lov kassada</div>
                  )}
                </div>
              </div>
            );
          })}
          {!byFilter.length && (
            <div className="md:col-span-2 xl:col-span-3 card">
              <EmptyState icon={Globe} title="Buyurtmalar yo'q" text="'Demo buyurtma' tugmasi bilan sinab ko'ring yoki QR menyuni oching" />
            </div>
          )}
        </div>
      )}

      {tab === 'qr' && (
        <>
          <div className="card p-4 text-sm text-slate-600">
            Har bir stol uchun QR kod. Mijoz QR orqali menyuni ko'radi va buyurtma beradi — buyurtma shu yerga "Yangi" holatida tushadi, qabul qilingach oshxonaga yuboriladi.
            Demo uchun "Ochish" tugmasini bosing (yangi tabda ochiladi, ma'lumotlar real vaqtda sinxronlanadi).
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {state.tables.map((t) => {
              const url = `${origin}/qr/${t.id}`;
              return (
                <div key={t.id} className="card p-4 text-center">
                  <div className="font-semibold mb-2">{t.name}</div>
                  <div className="bg-white p-2 rounded-xl border border-slate-100 inline-block">
                    <QRCodeSVG value={url} size={112} />
                  </div>
                  <div className="text-xs text-slate-400 mt-1">{t.zone}</div>
                  <div className="flex gap-1.5 mt-3">
                    <a href={`/qr/${t.id}`} target="_blank" rel="noreferrer" className="flex-1 inline-flex items-center justify-center gap-1 text-xs px-2 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100">
                      <ExternalLink size={12} /> Ochish
                    </a>
                    <button type="button" onClick={() => setPrintTable(t)} className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"><Printer size={12} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {printTable && (
        <div className="print-area fixed -left-[9999px] top-0 text-center">
          <div className="font-bold text-lg mb-2">{state.settings.restaurantName}</div>
          <div className="font-semibold mb-3">{printTable.name}</div>
          <div className="inline-block p-3 border border-slate-300">
            <QRCodeSVG value={`${origin}/qr/${printTable.id}`} size={200} />
          </div>
          <div className="text-xs mt-3">Menyuni ko'rish uchun QR kodni skanerlang</div>
        </div>
      )}
    </div>
  );
}
