import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, LogOut, ChevronDown, Building2, Sun, Moon, Users2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NAV, ROLES } from '../../data/navigation';
import { Avatar } from '../ui';
import useNow from '../../hooks/useNow';
import useTheme from '../../hooks/useTheme';
import { fmtTime, fmtDate } from '../../utils/format';

export default function Topbar({ onMenu }) {
  const { state, dispatch } = useApp();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const now = useNow(20000);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = NAV.find((n) => n.path === location.pathname);
  const canSwitchBranch = ['admin', 'manager'].includes(state.user?.role);

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/90 backdrop-blur border-b border-slate-200 flex items-center gap-3 px-4 lg:px-6">
      <button type="button" className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100" onClick={onMenu}>
        <Menu size={20} />
      </button>
      <h1 className="font-semibold text-slate-800 truncate">{current?.label}</h1>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        {canSwitchBranch && (
          <div className="hidden md:flex items-center gap-2">
            <Building2 size={16} className="text-slate-400" />
            <select
              className="input !w-auto !py-1.5"
              value={state.branchId}
              onChange={(e) => dispatch({ type: 'SET_BRANCH', id: e.target.value })}
            >
              {state.branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}
        <div
          className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg ${
            state.currentShift ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${state.currentShift ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          {state.currentShift ? 'Smena ochiq' : 'Smena yopiq'}
        </div>
        <div className="hidden sm:block text-right leading-tight">
          <div className="text-sm font-semibold text-slate-700 tabular-nums">{fmtTime(now)}</div>
          <div className="text-[11px] text-slate-400">{fmtDate(now)}</div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'dark' ? "Yorug' rejim" : "Qorong'i rejim"}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative" ref={ref}>
          <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-slate-100">
            <Avatar name={state.user?.name} size="sm" />
            <div className="hidden md:block text-left leading-tight">
              <div className="text-sm font-medium text-slate-700">{state.user?.name}</div>
              <div className="text-[11px] text-slate-400">{ROLES[state.user?.role]?.label}</div>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-56 card p-1.5 shadow-lg animate-in">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <div className="text-sm font-medium">{state.user?.name}</div>
                <div className="text-xs text-slate-400">{ROLES[state.user?.role]?.label}</div>
              </div>
              <button type="button" onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-100">
                <Users2 size={16} /> Xodimni almashtirish
              </button>
              <button type="button" onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-rose-600 hover:bg-rose-50">
                <LogOut size={16} /> Chiqish
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
