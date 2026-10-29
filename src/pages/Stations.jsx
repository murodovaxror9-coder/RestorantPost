import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Button, Toggle, Card, Badge } from '../components/ui';
import { isToday } from '../utils/format';

export default function Stations() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const navigate = useNavigate();

  const live = state.orders.filter((o) => o.status === 'open' || o.status === 'paid');
  const stats = (sid) => {
    let fresh = 0;
    let cooking = 0;
    let ready = 0;
    let doneToday = 0;
    live.forEach((o) =>
      o.items.forEach((i) => {
        if (i.station !== sid) return;
        if (i.status === 'new') fresh += i.qty;
        if (i.status === 'cooking') cooking += i.qty;
        if (i.status === 'ready') ready += i.qty;
        if (i.status === 'served' && isToday(o.paidAt || o.createdAt)) doneToday += i.qty;
      })
    );
    return { fresh, cooking, ready, doneToday, menuCount: state.menu.filter((m) => m.station === sid).length };
  };

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {state.stations.map((s) => {
          const st = stats(s.id);
          const load = st.fresh + st.cooking;
          return (
            <div key={s.id} className={`card p-5 ${s.active ? '' : 'opacity-60'}`}>
              <div className="flex items-start justify-between">
                <span className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-3xl">{s.emoji}</span>
                <Toggle checked={s.active} onChange={() => dispatch({ type: 'TOGGLE_STATION', id: s.id })} />
              </div>
              <div className="mt-3 font-bold text-lg">{s.name}</div>
              <div className="text-sm text-slate-500">{st.menuCount} ta taom biriktirilgan</div>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <Num l="Yangi" v={st.fresh} c="text-blue-600" />
                <Num l="Jarayonda" v={st.cooking} c="text-amber-600" />
                <Num l="Tayyor" v={st.ready} c="text-emerald-600" />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="text-slate-500">Bugun berildi: {st.doneToday}</span>
                <Badge color={load > 8 ? 'red' : load > 3 ? 'amber' : 'green'}>{load > 8 ? 'Yuqori yuklama' : load > 3 ? "O'rtacha" : 'Erkin'}</Badge>
              </div>
              <Button className="w-full mt-4" variant="soft" onClick={() => navigate(`/kitchen?station=${s.id}`)}>
                Boshqarish <ArrowRight size={16} />
              </Button>
            </div>
          );
        })}
      </div>

      <Card title="Taomlarni stansiyalarga biriktirish" bodyClass="p-0 pt-3">
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Taom</th><th>Kategoriya</th><th>Stansiya</th></tr></thead>
            <tbody>
              {state.menu.filter((m) => !m.archived).map((m) => (
                <tr key={m.id}>
                  <td className="font-medium">{m.emoji} {m.name}</td>
                  <td className="text-slate-500">{state.categories.find((c) => c.id === m.categoryId)?.name}</td>
                  <td>
                    <select
                      className="input !w-48 !py-1.5"
                      value={m.station}
                      onChange={(e) => { dispatch({ type: 'SAVE_MENU_ITEM', item: { ...m, station: e.target.value } }); toast(`${m.name} → ${state.stations.find((s) => s.id === e.target.value)?.name}`, 'success'); }}
                    >
                      {state.stations.map((s) => <option key={s.id} value={s.id}>{s.emoji} {s.name}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Num({ l, v, c }) {
  return (
    <div className="p-2 rounded-xl bg-slate-50">
      <div className={`text-xl font-bold ${c}`}>{v}</div>
      <div className="text-[11px] text-slate-500">{l}</div>
    </div>
  );
}
