import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { useApp } from './context/AppContext';
import { useToast } from './context/ToastContext';
import { NAV, defaultPathFor, effectiveRoles } from './data/navigation';

import Login from './pages/Login';
import QRMenu from './pages/QRMenu';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Cashier from './pages/Cashier';
import Waiter from './pages/Waiter';
import Kitchen from './pages/Kitchen';
import Stations from './pages/Stations';
import Menu from './pages/Menu';
import Inventory from './pages/Inventory';
import Purchasing from './pages/Purchasing';
import Staff from './pages/Staff';
import Finance from './pages/Finance';
import OnlineOrders from './pages/OnlineOrders';
import CRM from './pages/CRM';
import Reservations from './pages/Reservations';
import Branches from './pages/Branches';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';

const PAGES = {
  '/': Dashboard,
  '/pos': POS,
  '/cashier': Cashier,
  '/waiter': Waiter,
  '/online': OnlineOrders,
  '/reservations': Reservations,
  '/kitchen': Kitchen,
  '/stations': Stations,
  '/menu': Menu,
  '/inventory': Inventory,
  '/purchasing': Purchasing,
  '/staff': Staff,
  '/finance': Finance,
  '/crm': CRM,
  '/branches': Branches,
  '/audit': AuditLogs,
  '/settings': Settings,
};

function Guard({ navItem, children }) {
  const { state } = useApp();
  const role = state.user?.role;
  const roles = effectiveRoles(navItem, state.settings.rolePermissions);
  if (!roles.includes(role)) return <Navigate to={defaultPathFor(role, state.settings.rolePermissions)} replace />;
  return children;
}

function PageBoundary({ children }) {
  const location = useLocation();
  const navItem = NAV.find((n) => n.path === location.pathname);
  useEffect(() => {
    document.title = navItem ? `${navItem.label} — RestroPOS` : 'RestroPOS';
  }, [navItem]);
  return <ErrorBoundary resetKey={location.pathname}>{children}</ErrorBoundary>;
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-cream dark:bg-slate-950">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
        <Compass size={30} />
      </div>
      <div className="text-4xl font-bold text-slate-800">404</div>
      <p className="text-slate-500 mt-2 max-w-sm">Bu sahifa topilmadi yoki o'chirilgan. Manzilni tekshiring yoki bosh sahifaga qayting.</p>
      <Link to="/" className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800">
        Bosh sahifaga qaytish
      </Link>
    </div>
  );
}

function SystemWarnings() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const shown = useRef(null);

  useEffect(() => {
    if (state.storageWarning && shown.current !== state.storageWarning) {
      shown.current = state.storageWarning;
      toast(state.storageWarning, 'error');
    }
  }, [state.storageWarning, toast]);

  useEffect(() => {
    if (state.clockWarning) {
      toast("Qurilma soati noto'g'ri bo'lishi mumkin — bu chek va hisobot vaqtlariga ta'sir qilishi mumkin", 'error');
      dispatch({ type: 'CLOCK_WARNING_SEEN' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}

function UpdateBanner() {
  const [worker, setWorker] = useState(null);

  useEffect(() => {
    const onUpdate = (e) => setWorker(e.detail?.worker || null);
    window.addEventListener('restropos:update-available', onUpdate);
    return () => window.removeEventListener('restropos:update-available', onUpdate);
  }, []);

  if (!worker) return null;

  const applyUpdate = () => {
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
    worker.postMessage('SKIP_WAITING');
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg bg-slate-900 text-white text-sm">
      <span>Ilovaning yangi versiyasi tayyor</span>
      <button type="button" onClick={applyUpdate} className="px-3 py-1.5 rounded-lg bg-blue-500 text-slate-900 font-semibold">Yangilash</button>
      <button type="button" onClick={() => setWorker(null)} className="text-slate-400 hover:text-white">×</button>
    </div>
  );
}

export default function App() {
  return (
    <>
      <SystemWarnings />
      <UpdateBanner />
      <Routes>
        <Route path="/login" element={<PageBoundary><Login /></PageBoundary>} />
        <Route path="/qr/:tableId" element={<PageBoundary><QRMenu /></PageBoundary>} />
        <Route element={<Layout />}>
          {NAV.map((navItem) => {
            const Page = PAGES[navItem.path];
            return (
              <Route
                key={navItem.path}
                path={navItem.path}
                element={
                  <Guard navItem={navItem}>
                    <PageBoundary>
                      <Page />
                    </PageBoundary>
                  </Guard>
                }
              />
            );
          })}
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
