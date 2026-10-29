import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { UtensilsCrossed, Delete, ArrowLeft, Check, Lock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ROLES, defaultPathFor } from '../data/navigation';
import { Avatar, Badge } from '../components/ui';
import { sha256Hex } from '../utils/crypto';
import useNow from '../hooks/useNow';

const FEATURES = ['POS va kassa', 'Oshxona ekrani (KDS)', 'Ombor va retseptlar', 'Moliya hisobotlari', 'Onlayn va QR menyu', 'CRM va bonuslar'];

const LOCK_KEY = 'restropos_login_lock';
const MAX_ATTEMPTS = 5;
const LOCK_MS = 60000;

function readLocks() {
  try {
    return JSON.parse(localStorage.getItem(LOCK_KEY) || '{}');
  } catch {
    return {};
  }
}
function writeLock(id, data) {
  const locks = readLocks();
  if (data) locks[id] = data;
  else delete locks[id];
  try {
    localStorage.setItem(LOCK_KEY, JSON.stringify(locks));
  } catch {
    /* ignore */
  }
}

export default function Login() {
  const { state, dispatch } = useApp();
  const [sel, setSel] = useState(null);
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [checking, setChecking] = useState(false);
  const now = useNow(1000);

  const lock = sel ? readLocks()[sel.id] : null;
  const lockedMsLeft = lock?.lockedUntil ? lock.lockedUntil - now : 0;
  const locked = lockedMsLeft > 0;

  const press = (d) => {
    if (locked || checking) return;
    setErr('');
    setPin((prev) => (prev + d).slice(0, 4));
  };

  useEffect(() => {
    if (!sel || pin.length < 4 || locked) return undefined;
    let cancelled = false;
    setChecking(true);
    (async () => {
      const hash = await sha256Hex(pin);
      if (cancelled) return;
      // Eski (pinHash'dan oldingi) saqlangan ma'lumotda ochiq PIN qolgan bo'lsa ham ishlaydi,
      // muvaffaqiyatli kirishda esa darhol hash'ga ko'chiriladi.
      const legacyMatch = !sel.pinHash && sel.pin && sel.pin === pin;
      if (hash === sel.pinHash || legacyMatch) {
        writeLock(sel.id, null);
        if (legacyMatch) dispatch({ type: 'SAVE_STAFF', item: { id: sel.id, pinHash: hash, pin: undefined } });
        setTimeout(() => dispatch({ type: 'LOGIN', user: { id: sel.id, name: sel.name, role: sel.role } }), 120);
        return;
      }
      const prevLock = readLocks()[sel.id] || { attempts: 0 };
      const attempts = prevLock.attempts + 1;
      if (attempts >= MAX_ATTEMPTS) {
        writeLock(sel.id, { attempts: 0, lockedUntil: Date.now() + LOCK_MS });
        setErr(`Juda ko'p urinish — ${Math.ceil(LOCK_MS / 1000)} soniyaga bloklandi`);
      } else {
        writeLock(sel.id, { attempts });
        setErr(`PIN noto'g'ri — ${MAX_ATTEMPTS - attempts} ta urinish qoldi`);
      }
      setChecking(false);
      setTimeout(() => setPin(''), 400);
    })();
    return () => {
      cancelled = true;
    };
  }, [pin, sel, dispatch, locked]);

  useEffect(() => {
    if (!sel) return undefined;
    const onKey = (e) => {
      if (/^\d$/.test(e.key)) press(e.key);
      if (e.key === 'Backspace') setPin((p) => p.slice(0, -1));
      if (e.key === 'Escape') { setSel(null); setPin(''); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, locked, checking]);

  if (state.user) return <Navigate to={defaultPathFor(state.user.role, state.settings.rolePermissions)} replace />;

  const users = state.staff.filter((s) => s.status === 'active');

  return (
    <div className="min-h-screen grid lg:grid-cols-[1fr_1.2fr]">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-slate-950 text-white">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-blue-400"><UtensilsCrossed size={22} /></div>
          <div>
            <div className="text-xl font-bold">RestroPOS</div>
            <div className="text-sm text-slate-400">Barcha restoran jarayonlari bitta tizimda</div>
          </div>
        </div>
        <div>
          <h2 className="text-4xl font-bold leading-tight">O'zbekistonda ishlab chiqilgan<br />restoran boshqaruv tizimi</h2>
          <div className="grid grid-cols-2 gap-3 mt-8">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-2 text-slate-300 text-sm">
                <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center"><Check size={12} /></span>
                {f}
              </div>
            ))}
          </div>
        </div>
        <div className="text-sm text-slate-500">Sizning biznesingiz — bizning maqsadimiz!</div>
      </div>

      <div className="flex items-center justify-center p-6 bg-cream dark:bg-slate-950">
        <div className="w-full max-w-xl">
          {!sel ? (
            <>
              <h1 className="text-2xl font-bold text-slate-800">Tizimga kirish</h1>
              <p className="text-slate-500 mt-1 mb-6">Xodimni tanlang va PIN kodni kiriting</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {users.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => { setSel(u); setPin(''); setErr(''); }}
                    className="card p-4 flex flex-col items-center text-center hover:border-blue-400 hover:shadow-md transition"
                  >
                    <Avatar name={u.name} size="lg" />
                    <div className="mt-2 text-sm font-medium text-slate-800 leading-tight">{u.name}</div>
                    <Badge color={ROLES[u.role].color} className="mt-1.5">{ROLES[u.role].label}</Badge>
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-400 mt-6 text-center">Demo PIN barcha xodimlar uchun: <b>1111</b></p>
            </>
          ) : (
            <div className="max-w-xs mx-auto text-center">
              <button type="button" onClick={() => { setSel(null); setPin(''); }} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 mb-6">
                <ArrowLeft size={16} /> Orqaga
              </button>
              <Avatar name={sel.name} size="lg" className="mx-auto" />
              <div className="mt-2 font-semibold">{sel.name}</div>
              <div className="text-sm text-slate-500">{ROLES[sel.role].label}</div>
              <div className="flex justify-center gap-3 my-6">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className={`w-4 h-4 rounded-full transition ${err ? 'bg-rose-500' : i < pin.length ? 'bg-blue-600' : 'bg-slate-200'}`} />
                ))}
              </div>
              <div className="h-5 text-sm text-rose-600 mb-2 flex items-center justify-center gap-1.5">
                {locked && <Lock size={14} />}
                {locked ? `Bloklangan — ${Math.ceil(lockedMsLeft / 1000)} soniya` : err}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <Key key={d} disabled={locked || checking} onClick={() => press(d)}>{d}</Key>
                ))}
                <span />
                <Key disabled={locked || checking} onClick={() => press('0')}>0</Key>
                <Key disabled={locked || checking} onClick={() => setPin((p) => p.slice(0, -1))}><Delete size={20} /></Key>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Key({ children, onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="h-16 rounded-2xl bg-white border border-slate-200 text-xl font-semibold text-slate-700 hover:bg-slate-100 active:scale-95 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
    >
      {children}
    </button>
  );
}
