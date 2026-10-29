import { useMemo, useState } from 'react';
import { Download, ScrollText } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Button, Badge, SearchInput, Avatar, EmptyState, Field } from '../components/ui';
import { fmtDateTime, toDateKey, downloadCSV } from '../utils/format';
import { LOG_TYPES } from '../data/labels';

const TYPE_COLORS = { auth: 'slate', order: 'blue', payment: 'green', menu: 'purple', inventory: 'amber', staff: 'blue', finance: 'green', crm: 'purple', reservation: 'amber', settings: 'red' };

export default function AuditLogs() {
  const { state } = useApp();
  const [q, setQ] = useState('');
  const [user, setUser] = useState('all');
  const [type, setType] = useState('all');
  const [date, setDate] = useState('');
  const [limit, setLimit] = useState(100);

  const filtered = useMemo(
    () =>
      state.auditLogs.filter(
        (l) =>
          (user === 'all' || l.userName === user) &&
          (type === 'all' || l.type === type) &&
          (!date || toDateKey(l.at) === date) &&
          `${l.action} ${l.details}`.toLowerCase().includes(q.toLowerCase())
      ),
    [state.auditLogs, user, type, date, q]
  );
  const users = [...new Set(state.auditLogs.map((l) => l.userName))];

  const exportCSV = () =>
    downloadCSV(`audit_${toDateKey(new Date())}.csv`, [
      ['Vaqt', 'Foydalanuvchi', 'Turi', 'Amal', 'Tafsilot'],
      ...filtered.map((l) => [fmtDateTime(l.at), l.userName, LOG_TYPES[l.type] || l.type, l.action, l.details]),
    ]);

  return (
    <div className="space-y-5">
      <div className="card p-4 grid sm:grid-cols-2 lg:grid-cols-[1fr_200px_200px_180px_auto] gap-3 items-end">
        <Field label="Qidirish"><SearchInput value={q} onChange={setQ} placeholder="Amal yoki tafsilot..." /></Field>
        <Field label="Foydalanuvchi">
          <select className="input" value={user} onChange={(e) => setUser(e.target.value)}>
            <option value="all">Barchasi</option>
            {users.map((u) => <option key={u}>{u}</option>)}
          </select>
        </Field>
        <Field label="Turi">
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">Barchasi</option>
            {Object.entries(LOG_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </Field>
        <Field label="Sana"><input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Button variant="secondary" icon={Download} onClick={exportCSV}>CSV</Button>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 text-sm text-slate-500">{filtered.length} ta yozuv</div>
        <div className="overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Vaqt</th><th>Foydalanuvchi</th><th>Turi</th><th>Amal</th><th>Tafsilot</th></tr></thead>
            <tbody>
              {filtered.slice(0, limit).map((l) => (
                <tr key={l.id}>
                  <td className="text-slate-500 whitespace-nowrap tabular-nums">{fmtDateTime(l.at)}</td>
                  <td><div className="flex items-center gap-2"><Avatar name={l.userName} size="sm" /><span className="font-medium whitespace-nowrap">{l.userName}</span></div></td>
                  <td><Badge color={TYPE_COLORS[l.type]}>{LOG_TYPES[l.type] || l.type}</Badge></td>
                  <td className="font-medium whitespace-nowrap">{l.action}</td>
                  <td className="text-slate-600">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!filtered.length && <EmptyState icon={ScrollText} title="Yozuvlar topilmadi" />}
        </div>
        {filtered.length > limit && (
          <div className="p-3 text-center border-t border-slate-100">
            <Button variant="ghost" onClick={() => setLimit((l) => l + 100)}>Yana ko'rsatish</Button>
          </div>
        )}
      </div>
    </div>
  );
}
