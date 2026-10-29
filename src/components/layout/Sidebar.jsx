import { NavLink } from 'react-router-dom';
import { UtensilsCrossed } from 'lucide-react';
import { NAV, effectiveRoles } from '../../data/navigation';
import { useApp } from '../../context/AppContext';

export default function Sidebar({ open, onClose }) {
  const { state } = useApp();
  const role = state.user?.role;
  const items = NAV.filter((n) => effectiveRoles(n, state.settings.rolePermissions).includes(role));
  const groups = [...new Set(items.map((i) => i.group))];

  const counters = {
    '/online': state.orders.filter((o) => o.onlineStatus === 'pending' && o.status === 'open').length,
    '/kitchen': state.orders.reduce(
      (s, o) => s + (o.status === 'cancelled' || o.status === 'refunded' ? 0 : o.items.filter((i) => i.status === 'new').length),
      0
    ),
    '/cashier': state.orders.filter((o) => o.status === 'open' && o.billRequested).length,
  };

  return (
    <>
      {open && <div className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden" onClick={onClose} />}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 shrink-0 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-slate-950 flex items-center justify-center text-blue-400 shadow-lg">
            <UtensilsCrossed size={19} />
          </div>
          <div>
            <div className="text-white font-bold leading-tight">RestroPOS</div>
            <div className="text-[11px] text-slate-500">Restoran boshqaruvi</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5 scrollbar-thin">
          {groups.map((g) => (
            <div key={g}>
              <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{g}</div>
              {items
                .filter((i) => i.group === g)
                .map(({ path, label, icon: Icon }) => (
                  <NavLink
                    key={path}
                    to={path}
                    end={path === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm mb-0.5 transition ${
                        isActive ? 'bg-blue-500 text-slate-900 font-semibold' : 'hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon size={18} />
                    <span className="flex-1">{label}</span>
                    {counters[path] > 0 && (
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-semibold flex items-center justify-center">
                        {counters[path]}
                      </span>
                    )}
                  </NavLink>
                ))}
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500">RestroPOS v1.0.0</div>
      </aside>
    </>
  );
}
