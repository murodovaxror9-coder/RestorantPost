import { useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import useIdleLogout from '../../hooks/useIdleLogout';

const IDLE_MINUTES = 20;

export default function Layout() {
  const { state, dispatch } = useApp();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useIdleLogout(state.user ? IDLE_MINUTES : 0, () => {
    dispatch({ type: 'LOGOUT' });
    toast("Faollik bo'lmagani uchun tizimdan chiqildi", 'info');
    navigate('/login');
  });

  if (!state.user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
