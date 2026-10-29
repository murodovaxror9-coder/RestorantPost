import { useState } from 'react';
import { Plus, Pencil, Trash2, BookOpen, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Button, Badge, Tabs, Modal, Field, SearchInput, Toggle, ConfirmDialog, EmptyState } from '../components/ui';
import { money, uid } from '../utils/format';
import { EMOJIS } from '../data/labels';

export default function Menu() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState('items');
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [edit, setEdit] = useState(null);
  const [recipeFor, setRecipeFor] = useState(null);
  const [catEdit, setCatEdit] = useState(null);
  const [del, setDel] = useState(null);

  const ingName = (id) => state.inventory.find((i) => i.id === id);
  const costOf = (m) => (m.recipe || []).reduce((s, r) => s + (ingName(r.ingredientId)?.cost || 0) * r.qty, 0);
  const items = state.menu.filter((m) => !m.archived && (cat === 'all' || m.categoryId === cat) && m.name.toLowerCase().includes(q.toLowerCase()));
  const catName = (id) => state.categories.find((c) => c.id === id)?.name || '—';
  const stName = (id) => state.stations.find((s) => s.id === id);

  const newItem = () => setEdit({ id: uid(), name: '', categoryId: state.categories[0]?.id, price: 0, station: 'kitchen', emoji: '🍽️', description: '', available: true, recipe: [], isNew: true });

  const save = () => {
    if (!edit.name.trim()) return toast('Taom nomini kiriting', 'error');
    if (!(+edit.price > 0)) return toast('Narxni kiriting', 'error');
    const { isNew, ...item } = edit;
    dispatch({ type: 'SAVE_MENU_ITEM', item: { ...item, price: +item.price } });
    setEdit(null);
    toast('Saqlandi', 'success');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <Tabs tabs={[{ id: 'items', label: 'Taomlar', count: state.menu.filter((m) => !m.archived).length }, { id: 'categories', label: 'Kategoriyalar', count: state.categories.length }, { id: 'recipes', label: 'Retseptlar' }]} value={tab} onChange={setTab} />
        {tab === 'categories' ? (
          <Button icon={Plus} onClick={() => setCatEdit({ id: uid(), name: '', emoji: '🍽️', isNew: true })}>Kategoriya</Button>
        ) : (
          <Button icon={Plus} onClick={newItem}>Taom qo'shish</Button>
        )}
      </div>

      {tab === 'items' && (
        <div className="card overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
            <SearchInput value={q} onChange={setQ} className="sm:w-64" />
            <select className="input sm:!w-48" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="all">Barcha kategoriyalar</option>
              {state.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Taom</th><th>Kategoriya</th><th>Stansiya</th><th className="text-right">Narx</th><th className="text-right">Tannarx</th><th className="text-right">Marja</th><th>Sotuvda</th><th /></tr></thead>
              <tbody>
                {items.map((m) => {
                  const cost = costOf(m);
                  const margin = m.price ? ((m.price - cost) / m.price) * 100 : 0;
                  return (
                    <tr key={m.id} className={m.available ? '' : 'opacity-60'}>
                      <td>
                        <div className="flex items-center gap-3">
                          <span className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">{m.emoji}</span>
                          <div>
                            <div className="font-medium">{m.name}</div>
                            <div className="text-xs text-slate-400 max-w-[220px] truncate">{m.description}</div>
                          </div>
                        </div>
                      </td>
                      <td>{catName(m.categoryId)}</td>
                      <td>{stName(m.station)?.emoji} {stName(m.station)?.name}</td>
                      <td className="text-right font-semibold tabular-nums">{money(m.price)}</td>
                      <td className="text-right tabular-nums text-slate-500">{money(cost)}</td>
                      <td className="text-right"><Badge color={margin >= 60 ? 'green' : margin >= 40 ? 'amber' : 'red'}>{margin.toFixed(0)}%</Badge></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Toggle checked={m.available} onChange={(v) => dispatch({ type: 'SAVE_MENU_ITEM', item: { ...m, available: v, stopListAuto: false } })} />
                          {m.stopListAuto && <Badge color="red">Ingredient tugadi</Badge>}
                        </div>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <button type="button" title="Retsept" onClick={() => setRecipeFor({ ...m, recipe: [...(m.recipe || [])] })} className="p-1.5 text-slate-400 hover:text-blue-600"><Layers size={16} /></button>
                        <button type="button" title="Tahrirlash" onClick={() => setEdit({ ...m })} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil size={16} /></button>
                        <button type="button" title="O'chirish" onClick={() => setDel({ type: 'item', id: m.id, name: m.name })} className="p-1.5 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!items.length && <EmptyState icon={BookOpen} title="Taom topilmadi" />}
          </div>
        </div>
      )}

      {tab === 'categories' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {state.categories.map((c) => {
            const count = state.menu.filter((m) => !m.archived && m.categoryId === c.id).length;
            return (
              <div key={c.id} className="card p-4 flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl">{c.emoji}</span>
                <div className="flex-1">
                  <div className="font-semibold">{c.name}</div>
                  <div className="text-xs text-slate-500">{count} ta taom</div>
                </div>
                <button type="button" onClick={() => setCatEdit({ ...c })} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil size={16} /></button>
                <button
                  type="button"
                  onClick={() => (count ? toast("Avval kategoriyadagi taomlarni o'chiring yoki ko'chiring", 'error') : setDel({ type: 'cat', id: c.id, name: c.name }))}
                  className="p-1.5 text-slate-400 hover:text-rose-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'recipes' && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {state.menu.filter((m) => !m.archived).map((m) => (
            <div key={m.id} className="card p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{m.emoji}</span>
                <div className="flex-1 font-semibold">{m.name}</div>
                <Button size="xs" variant="soft" onClick={() => setRecipeFor({ ...m, recipe: [...(m.recipe || [])] })}>Tahrirlash</Button>
              </div>
              <ul className="space-y-1 text-sm">
                {(m.recipe || []).map((r) => (
                  <li key={r.ingredientId} className="flex justify-between">
                    <span className="text-slate-600">{ingName(r.ingredientId)?.name}</span>
                    <span className="tabular-nums">{r.qty} {ingName(r.ingredientId)?.unit}</span>
                  </li>
                ))}
                {!(m.recipe || []).length && <li className="text-slate-400">Retsept kiritilmagan</li>}
              </ul>
              <div className="flex justify-between text-xs mt-3 pt-2 border-t border-slate-100 text-slate-500">
                <span>Tannarx: {money(costOf(m))}</span>
                <span>Narx: {money(m.price)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Taom modal */}
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={edit?.isNew ? 'Yangi taom' : 'Taomni tahrirlash'}
        size="lg"
        footer={<><Button variant="secondary" onClick={() => setEdit(null)}>Bekor</Button><Button onClick={save}>Saqlash</Button></>}
      >
        {edit && (
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Nomi" className="sm:col-span-2"><input className="input" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field label="Kategoriya">
              <select className="input" value={edit.categoryId} onChange={(e) => setEdit({ ...edit, categoryId: e.target.value })}>
                {state.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Narx (so'm)"><input type="number" className="input" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} /></Field>
            <Field label="Tayyorlash stansiyasi">
              <select className="input" value={edit.station} onChange={(e) => setEdit({ ...edit, station: e.target.value })}>
                {state.stations.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
              </select>
            </Field>
            <Field label="Sotuvda">
              <div className="h-10 flex items-center"><Toggle checked={edit.available} onChange={(v) => setEdit({ ...edit, available: v })} /></div>
            </Field>
            <Field label="Tavsif" className="sm:col-span-2"><textarea rows={2} className="input" value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></Field>
            <div className="sm:col-span-2">
              <div className="label">Rasm (emoji)</div>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map((e) => (
                  <button key={e} type="button" onClick={() => setEdit({ ...edit, emoji: e })} className={`w-10 h-10 rounded-lg text-xl border ${edit.emoji === e ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>{e}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Retsept modal */}
      <Modal
        open={!!recipeFor}
        onClose={() => setRecipeFor(null)}
        title={`Retsept — ${recipeFor?.name || ''}`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="text-sm text-slate-500">Tannarx: <b className="text-slate-800">{recipeFor ? money(costOf(recipeFor)) : ''}</b></div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setRecipeFor(null)}>Bekor</Button>
              <Button onClick={() => {
                const recipe = recipeFor.recipe.filter((r) => r.ingredientId && +r.qty > 0).map((r) => ({ ingredientId: r.ingredientId, qty: +r.qty }));
                dispatch({ type: 'SAVE_MENU_ITEM', item: { ...recipeFor, recipe } });
                setRecipeFor(null);
                toast('Retsept saqlandi', 'success');
              }}>Saqlash</Button>
            </div>
          </div>
        }
      >
        {recipeFor && (
          <div className="space-y-2">
            <p className="text-sm text-slate-500 mb-2">Har bir porsiya uchun sarflanadigan mahsulotlar. To'lovdan keyin ombordan avtomatik ayiriladi.</p>
            {recipeFor.recipe.map((r, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_110px_32px] gap-2">
                <select className="input" value={r.ingredientId} onChange={(e) => setRecipeFor({ ...recipeFor, recipe: recipeFor.recipe.map((x, i) => (i === idx ? { ...x, ingredientId: e.target.value } : x)) })}>
                  {state.inventory.map((i) => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                </select>
                <input type="number" step="0.01" className="input" value={r.qty} onChange={(e) => setRecipeFor({ ...recipeFor, recipe: recipeFor.recipe.map((x, i) => (i === idx ? { ...x, qty: e.target.value } : x)) })} />
                <button type="button" onClick={() => setRecipeFor({ ...recipeFor, recipe: recipeFor.recipe.filter((_, i) => i !== idx) })} className="text-slate-400 hover:text-rose-600 flex items-center justify-center"><Trash2 size={16} /></button>
              </div>
            ))}
            <Button size="sm" variant="soft" icon={Plus} onClick={() => setRecipeFor({ ...recipeFor, recipe: [...recipeFor.recipe, { ingredientId: state.inventory[0]?.id, qty: 0.1 }] })}>Ingredient qo'shish</Button>
          </div>
        )}
      </Modal>

      {/* Kategoriya modal */}
      <Modal
        open={!!catEdit}
        onClose={() => setCatEdit(null)}
        title={catEdit?.isNew ? 'Yangi kategoriya' : 'Kategoriya'}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCatEdit(null)}>Bekor</Button>
            <Button onClick={() => {
              if (!catEdit.name.trim()) return toast('Nomini kiriting', 'error');
              const { isNew, ...category } = catEdit;
              dispatch({ type: 'SAVE_CATEGORY', category });
              setCatEdit(null);
            }}>Saqlash</Button>
          </>
        }
      >
        {catEdit && (
          <div className="space-y-3">
            <Field label="Nomi"><input className="input" value={catEdit.name} onChange={(e) => setCatEdit({ ...catEdit, name: e.target.value })} /></Field>
            <div className="flex flex-wrap gap-1.5">
              {EMOJIS.map((e) => (
                <button key={e} type="button" onClick={() => setCatEdit({ ...catEdit, emoji: e })} className={`w-9 h-9 rounded-lg text-lg border ${catEdit.emoji === e ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}>{e}</button>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!del}
        danger
        title="O'chirishni tasdiqlang"
        message={`"${del?.name}" o'chiriladi. Davom etasizmi?`}
        confirmText="O'chirish"
        onClose={() => setDel(null)}
        onConfirm={() => {
          dispatch(del.type === 'item' ? { type: 'DELETE_MENU_ITEM', id: del.id } : { type: 'DELETE_CATEGORY', id: del.id });
          setDel(null);
          toast("O'chirildi");
        }}
      />
    </div>
  );
}
