import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal, Button, SearchInput } from '../ui';
import { money } from '../../utils/format';

export default function MenuPicker({ open, onClose, onConfirm, title = "Taom qo'shish", confirmText = 'Oshxonaga yuborish' }) {
  const { state } = useApp();
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [cart, setCart] = useState({});
  const [notes, setNotes] = useState({});

  useEffect(() => {
    if (open) {
      setCart({});
      setNotes({});
      setQ('');
    }
  }, [open]);

  const items = useMemo(
    () => state.menu.filter((m) => m.available && (cat === 'all' || m.categoryId === cat) && m.name.toLowerCase().includes(q.toLowerCase())),
    [state.menu, cat, q]
  );

  const change = (id, d) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] || 0) + d) }));
  const selected = Object.entries(cart).filter(([, n]) => n > 0);
  const total = selected.reduce((s, [id, n]) => s + (state.menu.find((m) => m.id === id)?.price || 0) * n, 0);

  const confirm = () => {
    const list = selected.map(([id, qty]) => {
      const m = state.menu.find((x) => x.id === id);
      return { menuId: id, name: m.name, price: m.price, station: m.station, emoji: m.emoji, qty, note: notes[id] || '' };
    });
    onConfirm(list);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="xl"
      footer={
        <div className="flex items-center justify-between w-full gap-3">
          <div className="text-sm text-slate-500">
            {selected.length} ta pozitsiya · <span className="font-semibold text-slate-800">{money(total)}</span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>Bekor</Button>
            <Button disabled={!selected.length} onClick={confirm}>{confirmText}</Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-thin flex-1 pb-1">
          {[{ id: 'all', name: 'Barchasi', emoji: '🍽️' }, ...state.categories].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap border ${cat === c.id ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              {c.emoji} {c.name}
            </button>
          ))}
        </div>
        <SearchInput value={q} onChange={setQ} className="sm:w-56" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((m) => {
          const n = cart[m.id] || 0;
          return (
            <div key={m.id} className={`rounded-xl border p-3 transition ${n ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200'}`}>
              <button type="button" className="w-full text-left" onClick={() => change(m.id, 1)}>
                <div className="text-3xl mb-1">{m.emoji}</div>
                <div className="text-sm font-medium leading-tight">{m.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{money(m.price)}</div>
              </button>
              {n > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={() => change(m.id, -1)} className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center"><Minus size={14} /></button>
                    <span className="font-semibold">{n}</span>
                    <button type="button" onClick={() => change(m.id, 1)} className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center"><Plus size={14} /></button>
                  </div>
                  <input className="input !py-1 !text-xs" placeholder="Izoh (ixtiyoriy)" value={notes[m.id] || ''} onChange={(e) => setNotes((x) => ({ ...x, [m.id]: e.target.value }))} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
