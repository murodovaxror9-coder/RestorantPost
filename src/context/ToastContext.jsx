import { createContext, useCallback, useContext, useState } from 'react';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(() => {});

const STYLES = {
  success: { cls: 'bg-emerald-600', icon: CheckCircle2 },
  error: { cls: 'bg-rose-600', icon: AlertCircle },
  info: { cls: 'bg-slate-800', icon: Info },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[70] flex flex-col items-end gap-2 pointer-events-none">
        {toasts.map((t) => {
          const { cls, icon: Icon } = STYLES[t.type] || STYLES.info;
          return (
            <div key={t.id} className={`animate-in pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm text-white ${cls}`}>
              <Icon size={18} />
              {t.message}
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
