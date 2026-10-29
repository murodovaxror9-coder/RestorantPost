import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Clock, Maximize, ChefHat, Timer, AlertTriangle, Volume2, VolumeX, Tv, Undo2, Printer } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, Tabs } from '../components/ui';
import useNow from '../hooks/useNow';
import { minutesSince } from '../utils/format';
import { ORDER_TYPES } from '../data/labels';
import { beep } from '../utils/sound';

const SOUND_KEY = 'restropos_kds_sound';
const TV_KEY = 'restropos_kds_tv';

const COLS = [
  { key: 'new', title: 'Yangi buyurtmalar', next: 'cooking', prev: null, action: 'Boshlash', dot: 'bg-blue-500', btn: 'primary' },
  { key: 'cooking', title: 'Tayyorlanmoqda', next: 'ready', prev: 'new', action: 'Tayyor', dot: 'bg-amber-500', btn: 'warning' },
  { key: 'ready', title: 'Tayyor — olib ketish', next: 'served', prev: 'cooking', action: 'Berildi', dot: 'bg-emerald-500', btn: 'success' },
];

export default function Kitchen() {
  const { state, dispatch } = useApp();
  const [params, setParams] = useSearchParams();
  const station = params.get('station') || 'all';
  const now = useNow(15000);
  const late = state.settings.kitchenLateMinutes || 15;
  const stations = state.stations.filter((s) => s.active);

  const active = state.orders.filter((o) => o.branchId === state.branchId && (o.status === 'open' || o.status === 'paid'));
  const match = (i) => station === 'all' || i.station === station;

  const [soundOn, setSoundOn] = useState(() => localStorage.getItem(SOUND_KEY) !== 'off');
  const [tvMode, setTvMode] = useState(() => localStorage.getItem(TV_KEY) === 'on');
  const seenNewIds = useRef(null);
  const toggleSound = () => {
    setSoundOn((v) => {
      const next = !v;
      localStorage.setItem(SOUND_KEY, next ? 'on' : 'off');
      return next;
    });
  };
  const toggleTv = () => {
    setTvMode((v) => {
      const next = !v;
      localStorage.setItem(TV_KEY, next ? 'on' : 'off');
      return next;
    });
  };

  useEffect(() => {
    const newIds = new Set(active.flatMap((o) => o.items.filter((i) => i.status === 'new').map((i) => i.id)));
    if (seenNewIds.current === null) {
      seenNewIds.current = newIds;
      return;
    }
    let hasNew = false;
    newIds.forEach((id) => {
      if (!seenNewIds.current.has(id)) hasNew = true;
    });
    seenNewIds.current = newIds;
    if (hasNew && soundOn) beep({ times: 2 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.orders]);

  const ticketsFor = (key) =>
    active
      .flatMap((o) => {
        const items = o.items.filter((i) => i.status === key && match(i));
        if (!items.length) return [];
        const since = items.reduce((m, i) => (i.addedAt < m ? i.addedAt : m), items[0].addedAt);
        return [{ order: o, items, since }];
      })
      .sort((a, b) => (a.since < b.since ? -1 : 1));

  const countFor = (st) => active.reduce((s, o) => s + o.items.filter((i) => ['new', 'cooking'].includes(i.status) && (st === 'all' || i.station === st)).length, 0);

  const advance = (t, col) => dispatch({ type: 'SET_ITEMS_STATUS', orderId: t.order.id, itemIds: t.items.map((i) => i.id), status: col.next });
  const advanceItem = (orderId, itemId, col) => dispatch({ type: 'SET_ITEMS_STATUS', orderId, itemIds: [itemId], status: col.next });
  const undo = (t, col) => col.prev && dispatch({ type: 'SET_ITEMS_STATUS', orderId: t.order.id, itemIds: t.items.map((i) => i.id), status: col.prev });

  const [printTicket, setPrintTicket] = useState(null);
  useEffect(() => {
    if (!printTicket) return undefined;
    const timer = setTimeout(() => {
      window.print();
      setPrintTicket(null);
    }, 50);
    return () => clearTimeout(timer);
  }, [printTicket]);

  const cooking = ticketsFor('cooking');
  const lateCount = [...ticketsFor('new'), ...cooking].filter((t) => minutesSince(t.since, now) >= late).length;

  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  };

  return (
    <>
      <div className="dark -m-4 lg:-m-6 p-4 lg:p-6 bg-slate-950 text-slate-100 space-y-4 min-h-[calc(100vh-61px)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <Tabs
            tabs={[{ id: 'all', label: 'Barchasi', count: countFor('all') }, ...stations.map((s) => ({ id: s.id, label: `${s.emoji} ${s.name}`, count: countFor(s.id) }))]}
            value={station}
            onChange={(v) => setParams(v === 'all' ? {} : { station: v })}
          />
          <div className="flex items-center gap-2">
            {lateCount > 0 && (
              <span className="flex items-center gap-1.5 text-sm text-rose-400 font-medium bg-rose-500/10 border border-rose-500/30 px-3 py-1.5 rounded-lg">
                <AlertTriangle size={16} /> {lateCount} ta kechikmoqda
              </span>
            )}
            <span className="flex items-center gap-1.5 text-sm text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
              <Timer size={16} /> Limit: {late} daq
            </span>
            <Button variant="secondary" icon={soundOn ? Volume2 : VolumeX} onClick={toggleSound} title={soundOn ? 'Ovozni o\'chirish' : 'Ovozni yoqish'} />
            <Button variant={tvMode ? 'primary' : 'secondary'} icon={Tv} onClick={toggleTv} title="TV rejimi (katta shrift)" />
            <Button variant="secondary" icon={Maximize} onClick={fullscreen}>To'liq ekran</Button>
          </div>
        </div>

        <div className={`grid md:grid-cols-3 gap-4 ${tvMode ? 'text-lg' : ''}`}>
          {COLS.map((col) => {
            const tickets = ticketsFor(col.key);
            return (
              <div key={col.key} className="rounded-2xl border border-slate-800 bg-slate-900/60 flex flex-col min-h-[60vh] overflow-hidden">
                <div className={`flex items-center justify-between border-b border-slate-800 px-4 ${tvMode ? 'py-4' : 'py-3'}`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.dot} shrink-0`} />
                    <span className={`font-semibold text-slate-100 tracking-wide ${tvMode ? 'text-xl' : ''}`}>{col.title}</span>
                  </div>
                  <span className={`font-bold text-slate-300 bg-slate-800 rounded-full ${tvMode ? 'text-base px-3 py-0.5' : 'text-xs px-2 py-0.5'}`}>{tickets.length}</span>
                </div>
                <div className="p-3 space-y-3 flex-1 overflow-y-auto scrollbar-thin">
                  {tickets.map((t) => {
                    const mins = minutesSince(t.since, now);
                    const isLate = col.key !== 'ready' && mins >= late;
                    const table = state.tables.find((x) => x.id === t.order.tableId);
                    const waiter = state.staff.find((s) => s.id === t.order.waiterId);
                    return (
                      <div
                        key={`${t.order.id}-${col.key}`}
                        className={`rounded-xl border bg-slate-800/70 animate-in overflow-hidden ${isLate ? 'border-rose-500/70' : 'border-slate-700/80'}`}
                      >
                        <div className="flex items-start justify-between gap-2 px-3 pt-3">
                          <div className="min-w-0">
                            <div className={`font-bold text-slate-50 ${tvMode ? 'text-2xl' : 'text-base'}`}>{table ? table.name : ORDER_TYPES[t.order.type]}</div>
                            <div className={`text-slate-400 ${tvMode ? 'text-sm' : 'text-xs'}`}>
                              #{t.order.number}
                              {waiter ? ` · ${waiter.name.split(' ')[0]}` : ''}
                              {t.order.source === 'online' ? ' · Onlayn' : t.order.source === 'qr' ? ' · QR' : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {col.prev && (
                              <button type="button" title="Orqaga qaytarish" onClick={() => undo(t, col)} className="p-1.5 rounded-md text-slate-500 hover:text-slate-100 hover:bg-slate-700">
                                <Undo2 size={14} />
                              </button>
                            )}
                            <button type="button" title="Tiketni chop etish" onClick={() => setPrintTicket(t)} className="p-1.5 rounded-md text-slate-500 hover:text-slate-100 hover:bg-slate-700">
                              <Printer size={14} />
                            </button>
                            <div className={`flex items-center gap-1 font-mono font-bold px-2 py-1 rounded-md tabular-nums ${isLate ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-700 text-slate-300'} ${tvMode ? 'text-sm' : 'text-xs'}`}>
                              <Clock size={12} /> {mins}'
                            </div>
                          </div>
                        </div>
                        <ul className="px-1 py-2 mt-1">
                          {t.items.map((i) => (
                            <li key={i.id}>
                              <button type="button" onClick={() => advanceItem(t.order.id, i.id, col)} title="Shu pozitsiyani keyingi bosqichga o'tkazish" className="w-full text-left flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-700/50">
                                <span className={`font-mono font-bold text-blue-400 shrink-0 ${tvMode ? 'w-10 text-lg' : 'w-7'}`}>{i.qty}×</span>
                                <span className="flex-1">
                                  <span className={`font-medium text-slate-100 ${tvMode ? 'text-base' : 'text-sm'}`}>{i.name}</span>
                                  {i.note && <span className="block text-xs text-amber-400 font-medium">📝 {i.note}</span>}
                                </span>
                                <span className="text-base opacity-70">{state.stations.find((s) => s.id === i.station)?.emoji}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                        <div className="p-2 pt-0">
                          <Button className="w-full" size={tvMode ? 'md' : 'sm'} variant={col.btn} onClick={() => advance(t, col)}>{col.action}</Button>
                        </div>
                      </div>
                    );
                  })}
                  {!tickets.length && (
                    <div className="text-center text-sm text-slate-600 py-10">
                      <ChefHat className="mx-auto mb-2 opacity-40" size={28} />
                      Bo'sh
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {printTicket && (
        <div className="print-area fixed -left-[9999px] top-0 font-mono text-[13px] text-black">
          <div className="text-center font-bold text-base mb-1">
            {state.tables.find((x) => x.id === printTicket.order.tableId)?.name || ORDER_TYPES[printTicket.order.type]}
          </div>
          <div className="text-center text-xs mb-2">#{printTicket.order.number} · {new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="border-t border-dashed border-slate-400 py-2 space-y-1">
            {printTicket.items.map((i) => (
              <div key={i.id}>
                <b>{i.qty}× {i.name}</b>
                {i.note && <div className="text-xs">* {i.note}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
