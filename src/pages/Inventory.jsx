import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowDownToLine, ArrowUpFromLine, Package, AlertTriangle, ClipboardCheck, Pencil, ShoppingCart, CalendarClock, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Button, Badge, Tabs, Modal, Field, SearchInput, StatCard, Card, EmptyState } from '../components/ui';
import { money, uid, fmtDateTime, fmtDate, toDateKey, downloadCSV } from '../utils/format';
import { MOVE_TYPES, UNITS } from '../data/labels';

const stockStatus = (i) =>
  i.qty <= 0 ? { label: 'Tugagan', color: 'red' } : i.qty < i.min ? { label: 'Kam', color: 'amber' } : { label: 'Normal', color: 'green' };
const daysLeft = (i) => Math.ceil((new Date(i.expiry) - new Date(toDateKey(new Date()))) / 86400000);

export default function Inventory() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState('items');
  const [q, setQ] = useState('');
  const [move, setMove] = useState(null);
  const [edit, setEdit] = useState(null);
  const [counts, setCounts] = useState({});
  const [moveFilter, setMoveFilter] = useState('all');

  const inv = state.inventory.filter(
    (i) => i.name.toLowerCase().includes(q.toLowerCase()) || (i.barcode || '').includes(q.trim())
  );
  const low = state.inventory.filter((i) => i.qty < i.min);
  const expiring = state.inventory.filter((i) => daysLeft(i) <= 3);
  const totalValue = state.inventory.reduce((s, i) => s + i.qty * i.cost, 0);
  const moves = state.stockMoves.filter((m) => moveFilter === 'all' || m.type === moveFilter).slice(0, 200);

  const orderLow = () =>
    navigate('/purchasing', {
      state: { prefill: low.map((i) => ({ ingredientId: i.id, qty: Math.max(1, +(i.min * 2 - i.qty).toFixed(1)), price: i.cost })) },
    });

  const saveCount = () => {
    dispatch({ type: 'INVENTORY_COUNT', counts });
    setCounts({});
    toast('Inventarizatsiya saqlandi', 'success');
  };

  const exportItemsCSV = () => {
    downloadCSV(`ombor_${toDateKey(new Date())}.csv`, [
      ['Mahsulot', 'Shtrix-kod', 'Kategoriya', 'Qoldiq', 'Birlik', 'Minimal', 'Narx', 'Qiymat', 'Yaroqlilik', 'Holat'],
      ...inv.map((i) => [i.name, i.barcode || '', i.category, i.qty, i.unit, i.min, i.cost, +(i.qty * i.cost).toFixed(2), i.expiry, stockStatus(i).label]),
    ]);
  };

  const exportMovesCSV = () => {
    downloadCSV(`ombor_harakatlari_${toDateKey(new Date())}.csv`, [
      ['Vaqt', 'Mahsulot', 'Turi', 'Miqdor', 'Birlik', 'Izoh', 'Xodim'],
      ...moves.map((m) => [fmtDateTime(m.at), m.name, MOVE_TYPES[m.type]?.label || m.type, m.qty, m.unit, m.note, m.userName]),
    ]);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Mahsulotlar" value={state.inventory.length} icon={Package} color="blue" />
        <StatCard label="Ombor qiymati" value={money(totalValue)} icon={Package} color="green" />
        <StatCard label="Minimal zaxiradan kam" value={low.length} icon={AlertTriangle} color="amber" />
        <StatCard label="Muddati yaqin (≤3 kun)" value={expiring.length} icon={CalendarClock} color="red" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <Tabs tabs={[{ id: 'items', label: 'Mahsulotlar' }, { id: 'moves', label: 'Kirim / Chiqim' }, { id: 'count', label: 'Inventarizatsiya' }]} value={tab} onChange={setTab} />
        <div className="flex flex-wrap gap-2">
          {tab === 'items' && <Button variant="secondary" icon={Download} onClick={exportItemsCSV}>CSV eksport</Button>}
          {tab === 'moves' && <Button variant="secondary" icon={Download} onClick={exportMovesCSV}>CSV eksport</Button>}
          <Button variant="success" icon={ArrowDownToLine} onClick={() => setMove({ moveType: 'in', ingredientId: state.inventory[0]?.id, qty: '', note: '' })}>Kirim</Button>
          <Button variant="secondary" icon={ArrowUpFromLine} onClick={() => setMove({ moveType: 'out', ingredientId: state.inventory[0]?.id, qty: '', note: '' })}>Chiqim</Button>
          <Button icon={Plus} onClick={() => setEdit({ id: uid(), name: '', unit: 'kg', qty: 0, min: 1, cost: 0, category: '', expiry: toDateKey(Date.now() + 30 * 86400000), isNew: true })}>Mahsulot</Button>
        </div>
      </div>

      {tab === 'items' && (
        <div className="grid xl:grid-cols-[1fr_320px] gap-5">
          <div className="card overflow-hidden">
            <div className="p-3 border-b border-slate-100">
              <SearchInput
                value={q}
                onChange={setQ}
                placeholder="Nomi yoki shtrix-kod bo'yicha qidirish / skanerlash..."
                className="max-w-xs"
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  const hit = state.inventory.find((i) => i.barcode === q.trim());
                  if (hit) {
                    setMove({ moveType: 'in', ingredientId: hit.id, qty: '', note: 'Shtrix-kod skanerlandi' });
                    setQ('');
                  }
                }}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead>
                  <tr><th>Mahsulot</th><th>Kategoriya</th><th className="text-right">Qoldiq</th><th className="text-right">Min.</th><th className="text-right">Narx</th><th>Yaroqlilik</th><th>Holat</th><th /></tr>
                </thead>
                <tbody>
                  {inv.map((i) => {
                    const st = stockStatus(i);
                    const dl = daysLeft(i);
                    const pct = Math.min(100, (i.qty / Math.max(i.min * 2, 0.001)) * 100);
                    return (
                      <tr key={i.id}>
                        <td className="font-medium">{i.name}</td>
                        <td className="text-slate-500">{i.category}</td>
                        <td className="text-right">
                          <div className="font-semibold tabular-nums">{i.qty} {i.unit}</div>
                          <div className="h-1 w-20 ml-auto mt-1 rounded-full bg-slate-100 overflow-hidden">
                            <div className={`h-full ${st.color === 'green' ? 'bg-emerald-500' : st.color === 'amber' ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                        <td className="text-right text-slate-500 tabular-nums">{i.min} {i.unit}</td>
                        <td className="text-right tabular-nums">{money(i.cost)}</td>
                        <td className={dl <= 3 ? 'text-rose-600 font-medium' : 'text-slate-500'}>{fmtDate(i.expiry)}{dl <= 3 && ` (${dl} kun)`}</td>
                        <td><Badge color={st.color}>{st.label}</Badge></td>
                        <td className="text-right whitespace-nowrap">
                          <button type="button" title="Kirim" onClick={() => setMove({ moveType: 'in', ingredientId: i.id, qty: '', note: '' })} className="p-1.5 text-slate-400 hover:text-emerald-600"><ArrowDownToLine size={16} /></button>
                          <button type="button" title="Chiqim" onClick={() => setMove({ moveType: 'waste', ingredientId: i.id, qty: '', note: '' })} className="p-1.5 text-slate-400 hover:text-rose-600"><ArrowUpFromLine size={16} /></button>
                          <button type="button" title="Tahrirlash" onClick={() => setEdit({ ...i })} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil size={16} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-5">
            <Card title="Minimal zaxira">
              <ul className="space-y-2">
                {low.map((i) => (
                  <li key={i.id} className="flex justify-between text-sm">
                    <span>{i.name}</span>
                    <span className="text-amber-600 font-medium tabular-nums">{i.qty} / {i.min} {i.unit}</span>
                  </li>
                ))}
                {!low.length && <li className="text-sm text-slate-400">Hammasi yetarli ✅</li>}
              </ul>
              {low.length > 0 && <Button className="w-full mt-4" icon={ShoppingCart} onClick={orderLow}>Xarid buyurtmasi</Button>}
            </Card>
            <Card title="Muddati yaqinlashgan">
              <ul className="space-y-2">
                {expiring.map((i) => (
                  <li key={i.id} className="flex justify-between text-sm">
                    <span>{i.name}</span>
                    <Badge color="red">{daysLeft(i)} kun</Badge>
                  </li>
                ))}
                {!expiring.length && <li className="text-sm text-slate-400">Yo'q</li>}
              </ul>
            </Card>
          </div>
        </div>
      )}

      {tab === 'moves' && (
        <div className="card overflow-hidden">
          <div className="p-3 border-b border-slate-100">
            <Tabs tabs={[{ id: 'all', label: 'Barchasi' }, ...Object.entries(MOVE_TYPES).map(([id, v]) => ({ id, label: v.label }))]} value={moveFilter} onChange={setMoveFilter} />
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Vaqt</th><th>Mahsulot</th><th>Turi</th><th className="text-right">Miqdor</th><th>Izoh</th><th>Xodim</th></tr></thead>
              <tbody>
                {moves.map((m) => (
                  <tr key={m.id}>
                    <td className="text-slate-500 whitespace-nowrap">{fmtDateTime(m.at)}</td>
                    <td className="font-medium">{m.name}</td>
                    <td><Badge color={MOVE_TYPES[m.type]?.color}>{MOVE_TYPES[m.type]?.label}</Badge></td>
                    <td className={`text-right font-semibold tabular-nums ${m.qty > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{m.qty > 0 ? '+' : ''}{m.qty} {m.unit}</td>
                    <td className="text-slate-500">{m.note}</td>
                    <td className="text-slate-500">{m.userName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!moves.length && <EmptyState title="Harakatlar yo'q" />}
          </div>
        </div>
      )}

      {tab === 'count' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div className="text-sm text-slate-500">Haqiqiy qoldiqni kiriting. Farq avtomatik "Tuzatish" sifatida yoziladi.</div>
            <Button icon={ClipboardCheck} disabled={!Object.keys(counts).length} onClick={saveCount}>Saqlash</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Mahsulot</th><th className="text-right">Tizimda</th><th>Haqiqiy</th><th className="text-right">Farq</th></tr></thead>
              <tbody>
                {state.inventory.map((i) => {
                  const v = counts[i.id];
                  const diff = v !== undefined && v !== '' ? +(+v - i.qty).toFixed(3) : null;
                  return (
                    <tr key={i.id}>
                      <td className="font-medium">{i.name}</td>
                      <td className="text-right tabular-nums">{i.qty} {i.unit}</td>
                      <td><input type="number" step="0.01" className="input !w-32" placeholder={String(i.qty)} value={v ?? ''} onChange={(e) => setCounts((c) => ({ ...c, [i.id]: e.target.value }))} /></td>
                      <td className={`text-right font-semibold tabular-nums ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-rose-600' : 'text-slate-400'}`}>{diff === null ? '—' : `${diff > 0 ? '+' : ''}${diff} ${i.unit}`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Kirim / Chiqim modal */}
      <Modal
        open={!!move}
        onClose={() => setMove(null)}
        title={move?.moveType === 'in' ? 'Kirim (omborga qabul)' : 'Chiqim / isrof'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setMove(null)}>Bekor</Button>
            <Button
              onClick={() => {
                if (!(+move.qty > 0)) return toast("Miqdorni to'g'ri kiriting", 'error');
                dispatch({ type: 'STOCK_MOVE', ...move, qty: +move.qty });
                setMove(null);
                toast('Saqlandi', 'success');
              }}
            >
              Saqlash
            </Button>
          </>
        }
      >
        {move && (
          <div className="space-y-3">
            {move.moveType !== 'in' && (
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl">
                {['out', 'waste'].map((t) => (
                  <button key={t} type="button" onClick={() => setMove({ ...move, moveType: t })} className={`py-1.5 rounded-lg text-sm ${move.moveType === t ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600'}`}>
                    {MOVE_TYPES[t].label}
                  </button>
                ))}
              </div>
            )}
            <Field label="Mahsulot">
              <select className="input" value={move.ingredientId} onChange={(e) => setMove({ ...move, ingredientId: e.target.value })}>
                {state.inventory.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.qty} {i.unit})</option>)}
              </select>
            </Field>
            <Field label={`Miqdor (${state.inventory.find((i) => i.id === move.ingredientId)?.unit || ''})`}>
              <input type="number" step="0.01" className="input" autoFocus value={move.qty} onChange={(e) => setMove({ ...move, qty: e.target.value })} />
            </Field>
            <Field label="Izoh">
              <input className="input" value={move.note} onChange={(e) => setMove({ ...move, note: e.target.value })} placeholder={move.moveType === 'waste' ? 'Buzilgan, yaroqsiz...' : ''} />
            </Field>
          </div>
        )}
      </Modal>

      {/* Mahsulot modal */}
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.isNew ? 'Yangi mahsulot' : 'Mahsulotni tahrirlash'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEdit(null)}>Bekor</Button>
            <Button
              onClick={() => {
                if (!edit.name.trim()) return toast('Nomini kiriting', 'error');
                const { isNew, ...item } = edit;
                dispatch({ type: 'SAVE_INGREDIENT', item: { ...item, qty: +item.qty, min: +item.min, cost: +item.cost } });
                setEdit(null);
                toast('Saqlandi', 'success');
              }}
            >
              Saqlash
            </Button>
          </>
        }
      >
        {edit && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nomi" className="col-span-2"><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Shtrix-kod" className="col-span-2"><input className="input" value={edit.barcode || ''} onChange={(e) => setEdit({ ...edit, barcode: e.target.value })} placeholder="Skanerlang yoki qo'lda kiriting" /></Field>
            <Field label="Kategoriya"><input className="input" value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })} /></Field>
            <Field label="O'lchov birligi">
              <select className="input" value={edit.unit} onChange={(e) => setEdit({ ...edit, unit: e.target.value })}>
                {UNITS.map((u) => <option key={u}>{u}</option>)}
              </select>
            </Field>
            {edit.isNew && <Field label="Boshlang'ich qoldiq"><input type="number" className="input" value={edit.qty} onChange={(e) => setEdit({ ...edit, qty: e.target.value })} /></Field>}
            <Field label="Minimal zaxira"><input type="number" className="input" value={edit.min} onChange={(e) => setEdit({ ...edit, min: e.target.value })} /></Field>
            <Field label="Narx (1 birlik)"><input type="number" className="input" value={edit.cost} onChange={(e) => setEdit({ ...edit, cost: e.target.value })} /></Field>
            <Field label="Yaroqlilik muddati"><input type="date" className="input" value={edit.expiry} onChange={(e) => setEdit({ ...edit, expiry: e.target.value })} /></Field>
          </div>
        )}
      </Modal>
    </div>
  );
}
