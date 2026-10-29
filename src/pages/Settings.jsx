import { useEffect, useRef, useState } from 'react';
import { Save, RotateCcw, Store, Receipt as ReceiptIcon, CreditCard, Server, Plus, Pencil, Check, Download, Upload, Archive, Bug } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Button, Badge, Tabs, Modal, Field, Card, StatCard, Toggle, ConfirmDialog } from '../components/ui';
import { money, fmtNum, uid, fmtDate, fmtDateTime, toDateKey } from '../utils/format';
import { STATE_VERSION } from '../data/mockData';
import { readClientErrors, clearClientErrors } from '../utils/errorLog';

export default function Settings() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const [tab, setTab] = useState('general');
  const [form, setForm] = useState(state.settings);
  const [tenant, setTenant] = useState(null);
  const [reset, setReset] = useState(false);
  const [pendingImport, setPendingImport] = useState(null);
  const [errorLog, setErrorLog] = useState(() => readClientErrors());
  const fileRef = useRef(null);

  const exportBackup = () => {
    const { user, ...data } = state;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `restropos-backup-${toDateKey(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Zaxira nusxa yuklab olindi', 'success');
  };

  const pickImportFile = () => fileRef.current?.click();

  const onImportFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== 'object' || !Array.isArray(data.orders) || !Array.isArray(data.staff)) {
          toast("Fayl formati noto'g'ri — bu RestroPOS zaxira fayli emas", 'error');
          return;
        }
        setPendingImport({ data, fileName: file.name, versionMismatch: data.version !== STATE_VERSION });
      } catch {
        toast("Faylni o'qib bo'lmadi — JSON formatida emas", 'error');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => setForm(state.settings), [state.settings]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const save = (keys) => {
    const patch = Object.fromEntries(keys.map((k) => [k, form[k]]));
    dispatch({ type: 'UPDATE_SETTINGS', patch });
    toast('Sozlamalar saqlandi', 'success');
  };

  const planPrice = (p) => state.plans.find((x) => x.id === p)?.price || 0;
  const mrr = state.tenants.filter((t) => t.status === 'active').reduce((s, t) => s + planPrice(t.plan), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <Tabs
          tabs={[
            { id: 'general', label: 'Restoran' },
            { id: 'receipt', label: 'Chek va soliq' },
            { id: 'payments', label: "To'lov turlari" },
            { id: 'saas', label: 'SaaS (Super Admin)' },
            { id: 'backup', label: 'Zaxira nusxa' },
          ]}
          value={tab}
          onChange={setTab}
        />
        <Button variant="secondary" icon={RotateCcw} onClick={() => setReset(true)}>Demo ma'lumotlarni tiklash</Button>
      </div>

      {tab === 'general' && (
        <Card title={<span className="flex items-center gap-2"><Store size={18} /> Restoran ma'lumotlari</span>}>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl">
            <Field label="Restoran nomi"><input className="input" value={form.restaurantName} onChange={(e) => set('restaurantName', e.target.value)} /></Field>
            <Field label="Telefon"><input className="input" value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
            <Field label="Manzil" className="sm:col-span-2"><input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
            <Field label="Ish vaqti"><input className="input" value={form.workingHours} onChange={(e) => set('workingHours', e.target.value)} /></Field>
            <Field label="Oshxona kechikish limiti (daqiqa)" hint="KDS'da shu vaqtdan oshgan buyurtmalar qizil bo'ladi">
              <input type="number" className="input" value={form.kitchenLateMinutes} onChange={(e) => set('kitchenLateMinutes', +e.target.value)} />
            </Field>
            <Field label="Yetkazib berish narxi (so'm)"><input type="number" className="input" value={form.deliveryFee} onChange={(e) => set('deliveryFee', +e.target.value)} /></Field>
            <Field label="Ombordan ayirish vaqti" hint="To'lovda yoki pishirish boshlanganda">
              <select className="input" value={form.stockDeductAt} onChange={(e) => set('stockDeductAt', e.target.value)}>
                <option value="payment">To'lov qabul qilinganda</option>
                <option value="cooking">Pishirish boshlanganda (Tayyorlanmoqda)</option>
              </select>
            </Field>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 max-w-3xl mt-4">
            <Toggle checked={!!form.waiterOnlyOwnTables} onChange={(v) => set('waiterOnlyOwnTables', v)} />
            <div>
              <div className="text-sm font-medium">Ofitsiant faqat o'z stollarini ko'rsin</div>
              <div className="text-xs text-slate-400">Yoqilsa, ofitsiant boshqa ofitsiant xizmat qilayotgan stollarni ro'yxatda ko'rmaydi</div>
            </div>
          </div>
          <Button className="mt-5" icon={Save} onClick={() => save(['restaurantName', 'phone', 'address', 'workingHours', 'kitchenLateMinutes', 'deliveryFee', 'stockDeductAt', 'waiterOnlyOwnTables'])}>Saqlash</Button>
        </Card>
      )}

      {tab === 'receipt' && (
        <div className="grid lg:grid-cols-[1fr_340px] gap-5">
          <Card title={<span className="flex items-center gap-2"><ReceiptIcon size={18} /> Chek sozlamalari</span>}>
            <div className="grid gap-4 max-w-xl">
              <Field label="Xizmat haqi (%)" hint="Faqat zal buyurtmalariga qo'shiladi">
                <input type="number" className="input" value={form.serviceFee} onChange={(e) => set('serviceFee', +e.target.value)} />
              </Field>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200">
                <Toggle checked={!!form.vatEnabled} onChange={(v) => set('vatEnabled', v)} />
                <div className="flex-1">
                  <div className="text-sm font-medium">QQS (QQS to'lovchisi)</div>
                  <div className="text-xs text-slate-400">Yoqilsa, chekda alohida qator sifatida qo'shiladi</div>
                </div>
                <input type="number" disabled={!form.vatEnabled} className="input !w-24 disabled:opacity-40" value={form.vatRate} onChange={(e) => set('vatRate', +e.target.value)} />
                <span className="text-sm text-slate-400">%</span>
              </div>
              <Field label="Naqd pulni yaxlitlash" hint="To'lov naqd bo'lsa, jami summa shu qadamgacha yaxlitlanadi">
                <select className="input" value={form.cashRounding} onChange={(e) => set('cashRounding', +e.target.value)}>
                  <option value={0}>Yaxlitlanmaydi</option>
                  <option value={100}>100 so'm</option>
                  <option value={500}>500 so'm</option>
                  <option value={1000}>1 000 so'm</option>
                </select>
              </Field>
              <Field label="Chek sarlavhasi"><input className="input" value={form.receiptHeader} onChange={(e) => set('receiptHeader', e.target.value)} /></Field>
              <Field label="Chek pastki matni"><textarea rows={2} className="input" value={form.receiptFooter} onChange={(e) => set('receiptFooter', e.target.value)} /></Field>
            </div>
            <Button className="mt-5" icon={Save} onClick={() => save(['serviceFee', 'vatEnabled', 'vatRate', 'cashRounding', 'receiptHeader', 'receiptFooter'])}>Saqlash</Button>
          </Card>
          <div className="card p-5 font-mono text-xs bg-white">
            <div className="text-center font-bold text-sm">{form.restaurantName}</div>
            <div className="text-center text-slate-500">{form.address}</div>
            <div className="text-center mt-1">{form.receiptHeader}</div>
            <div className="border-t border-dashed my-2" />
            <div className="flex justify-between"><span>Pitsa Margherita</span><span>85 000</span></div>
            <div className="flex justify-between"><span>Kola 0.5L x2</span><span>30 000</span></div>
            <div className="border-t border-dashed my-2" />
            <div className="flex justify-between"><span>Xizmat haqi ({form.serviceFee}%)</span><span>{fmtNum((115000 * form.serviceFee) / 100)}</span></div>
            <div className="flex justify-between font-bold text-sm"><span>JAMI</span><span>{fmtNum(115000 * (1 + form.serviceFee / 100))}</span></div>
            <div className="border-t border-dashed my-2" />
            <div className="text-center text-slate-500">{form.receiptFooter}</div>
          </div>
        </div>
      )}

      {tab === 'payments' && (
        <Card title={<span className="flex items-center gap-2"><CreditCard size={18} /> To'lov turlari</span>}>
          <div className="space-y-2 max-w-xl">
            {form.paymentMethods.map((m, idx) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200">
                <input
                  className="input flex-1"
                  value={m.label}
                  onChange={(e) => set('paymentMethods', form.paymentMethods.map((x, i) => (i === idx ? { ...x, label: e.target.value } : x)))}
                />
                <Toggle checked={m.enabled} onChange={(v) => set('paymentMethods', form.paymentMethods.map((x, i) => (i === idx ? { ...x, enabled: v } : x)))} />
              </div>
            ))}
          </div>
          <Button
            className="mt-5"
            icon={Save}
            onClick={() => {
              if (!form.paymentMethods.some((m) => m.enabled)) return toast("Kamida bitta to'lov turi yoqilgan bo'lishi kerak", 'error');
              save(['paymentMethods']);
            }}
          >
            Saqlash
          </Button>
        </Card>
      )}

      {tab === 'saas' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard label="Restoranlar" value={state.tenants.length} icon={Store} color="blue" />
            <StatCard label="Faol obunalar" value={state.tenants.filter((t) => t.status === 'active').length} icon={Check} color="green" />
            <StatCard label="Oylik daromad (MRR)" value={money(mrr)} icon={CreditCard} color="purple" />
            <StatCard label="Jami filiallar" value={state.tenants.reduce((s, t) => s + t.branches, 0)} icon={Server} color="amber" />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {state.plans.map((p) => (
              <div key={p.id} className={`card p-5 ${p.id === 'Pro' ? 'ring-2 ring-blue-500' : ''}`}>
                <div className="flex items-center justify-between">
                  <div className="font-bold text-lg">{p.id}</div>
                  {p.id === 'Pro' && <Badge color="blue">Ommabop</Badge>}
                </div>
                <div className="text-2xl font-bold mt-2">{money(p.price)}<span className="text-sm text-slate-400 font-normal"> / oy</span></div>
                <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
                  {p.features.map((f) => <li key={f} className="flex items-center gap-2"><Check size={14} className="text-emerald-500" />{f}</li>)}
                </ul>
                <div className="text-xs text-slate-400 mt-4">{state.tenants.filter((t) => t.plan === p.id).length} ta restoran</div>
              </div>
            ))}
          </div>

          <Card title="Restoranlar ro'yxati" actions={<Button size="sm" icon={Plus} onClick={() => setTenant({ id: uid(), name: '', owner: '', plan: 'Starter', branches: 1, status: 'active', createdAt: toDateKey(new Date()), isNew: true })}>Restoran</Button>} bodyClass="p-0 pt-3">
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Restoran</th><th>Egasi</th><th>Tarif</th><th className="text-right">Filiallar</th><th className="text-right">To'lov / oy</th><th>Ulangan</th><th>Holat</th><th /></tr></thead>
                <tbody>
                  {state.tenants.map((t) => (
                    <tr key={t.id}>
                      <td className="font-medium">{t.name}</td>
                      <td className="text-slate-600">{t.owner}</td>
                      <td><Badge color="blue">{t.plan}</Badge></td>
                      <td className="text-right">{t.branches}</td>
                      <td className="text-right tabular-nums">{money(planPrice(t.plan))}</td>
                      <td className="text-slate-500">{fmtDate(t.createdAt)}</td>
                      <td>
                        <button type="button" onClick={() => dispatch({ type: 'SAVE_TENANT', item: { ...t, status: t.status === 'active' ? 'suspended' : 'active' } })}>
                          <Badge color={t.status === 'active' ? 'green' : 'red'}>{t.status === 'active' ? 'Faol' : "To'xtatilgan"}</Badge>
                        </button>
                      </td>
                      <td><button type="button" onClick={() => setTenant({ ...t })} className="p-1.5 text-slate-400 hover:text-blue-600"><Pencil size={15} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === 'backup' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <Card title={<span className="flex items-center gap-2"><Download size={18} /> Zaxira nusxa olish</span>}>
            <p className="text-sm text-slate-500 max-w-md">
              Backend (server) ishlatilmagani uchun barcha ma'lumotlar shu brauzerda saqlanadi. Kompyuter
              almashtirilsa yoki brauzer tarixi tozalansa, ma'lumotlar yo'qolib ketishi mumkin — shuning
              uchun vaqti-vaqti bilan zaxira faylini yuklab, xavfsiz joyda saqlang.
            </p>
            <Button className="mt-5" icon={Download} onClick={exportBackup}>Zaxira faylini yuklab olish (.json)</Button>
          </Card>
          <Card title={<span className="flex items-center gap-2"><Upload size={18} /> Zaxiradan tiklash</span>}>
            <p className="text-sm text-slate-500 max-w-md">
              Avval yuklab olingan <b>.json</b> zaxira faylini tanlang. Diqqat: bu amal joriy ma'lumotlarning
              hammasini (buyurtmalar, ombor, xodimlar va h.k.) tanlangan fayldagi holat bilan almashtiradi.
            </p>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={onImportFile} />
            <Button className="mt-5" variant="secondary" icon={Upload} onClick={pickImportFile}>Fayldan tiklash</Button>
          </Card>
          <Card title={<span className="flex items-center gap-2"><Archive size={18} /> Eski buyurtmalarni arxivlash</span>}>
            <p className="text-sm text-slate-500 max-w-md">
              90 kundan eski, yopilgan (to'langan/qaytarilgan) buyurtmalar asosiy ro'yxatdan arxivga ko'chiriladi —
              bu ilovani tezroq ishlatadi. Arxivlangan buyurtmalar zaxira faylida saqlanib qoladi.
            </p>
            <div className="text-sm text-slate-500 mt-3">Hozircha arxivda: <b>{(state.archivedOrders || []).length}</b> ta buyurtma</div>
            <Button
              className="mt-3"
              variant="secondary"
              icon={Archive}
              onClick={() => {
                dispatch({ type: 'ARCHIVE_OLD_ORDERS', days: 90 });
                toast('Eski buyurtmalar tekshirildi va arxivlandi', 'success');
              }}
            >
              Hozir arxivlash
            </Button>
          </Card>
          <Card title={<span className="flex items-center gap-2"><Bug size={18} /> Lokal xato jurnali</span>}>
            <p className="text-sm text-slate-500 max-w-md">
              Brauzerda yuz bergan JavaScript xatolari shu qurilmada saqlanadi (hech qayerga yuborilmaydi).
              Muammo yuz bersa, shu ro'yxatni dasturchiga ko'rsatishingiz mumkin.
            </p>
            <div className="text-sm text-slate-500 mt-3">Jami: <b>{errorLog.length}</b> ta yozuv</div>
            {errorLog.length > 0 && (
              <div className="mt-3 max-h-40 overflow-y-auto scrollbar-thin space-y-1.5">
                {errorLog.slice(0, 10).map((e, i) => (
                  <div key={i} className="text-xs p-2 rounded-lg bg-rose-50 text-rose-700">
                    <div className="font-medium">{fmtDateTime(e.at)}</div>
                    <div className="truncate">{e.message}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  clearClientErrors();
                  setErrorLog([]);
                  toast('Xato jurnali tozalandi', 'success');
                }}
              >
                Tozalash
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Modal
        open={!!tenant}
        onClose={() => setTenant(null)}
        title={tenant?.isNew ? 'Yangi restoran' : 'Restoran'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTenant(null)}>Bekor</Button>
            <Button onClick={() => {
              if (!tenant.name.trim()) return toast('Nomini kiriting', 'error');
              const { isNew, ...item } = tenant;
              dispatch({ type: 'SAVE_TENANT', item: { ...item, branches: +item.branches || 1 } });
              setTenant(null);
              toast('Saqlandi', 'success');
            }}>Saqlash</Button>
          </>
        }
      >
        {tenant && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Restoran nomi" className="col-span-2"><input className="input" value={tenant.name} onChange={(e) => setTenant({ ...tenant, name: e.target.value })} /></Field>
            <Field label="Egasi"><input className="input" value={tenant.owner} onChange={(e) => setTenant({ ...tenant, owner: e.target.value })} /></Field>
            <Field label="Tarif">
              <select className="input" value={tenant.plan} onChange={(e) => setTenant({ ...tenant, plan: e.target.value })}>
                {state.plans.map((p) => <option key={p.id}>{p.id}</option>)}
              </select>
            </Field>
            <Field label="Filiallar soni"><input type="number" className="input" value={tenant.branches} onChange={(e) => setTenant({ ...tenant, branches: e.target.value })} /></Field>
            <Field label="Holat">
              <select className="input" value={tenant.status} onChange={(e) => setTenant({ ...tenant, status: e.target.value })}>
                <option value="active">Faol</option>
                <option value="suspended">To'xtatilgan</option>
              </select>
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={reset}
        danger
        title="Demo ma'lumotlarni tiklash"
        message="Barcha o'zgarishlar o'chib, boshlang'ich demo ma'lumotlar qayta yuklanadi."
        confirmText="Tiklash"
        onClose={() => setReset(false)}
        onConfirm={() => { dispatch({ type: 'RESET' }); setReset(false); toast("Ma'lumotlar tiklandi", 'success'); }}
      />

      <ConfirmDialog
        open={!!pendingImport}
        danger
        title="Zaxiradan tiklash"
        confirmText="Ha, almashtirish"
        onClose={() => setPendingImport(null)}
        onConfirm={() => {
          dispatch({ type: 'IMPORT_DATA', data: pendingImport.data, fileName: pendingImport.fileName });
          setPendingImport(null);
          toast("Ma'lumotlar zaxiradan tiklandi", 'success');
        }}
      >
        <p className="text-sm text-slate-600">
          <b>{pendingImport?.fileName}</b> fayli joriy barcha ma'lumotlarni almashtiradi. Bu amalni ortga qaytarib bo'lmaydi.
        </p>
        {pendingImport?.versionMismatch && (
          <p className="text-xs text-amber-600 mt-2">
            Ogohlantirish: fayl versiyasi joriy ilova versiyasidan farq qiladi, ba'zi ma'lumotlar to'g'ri ko'rinmasligi mumkin.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
