import { Component } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { logClientError } from '../utils/errorLog';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('RestroPOS xatolik:', error, info);
    logClientError(error?.message || String(error), { stack: error?.stack, componentStack: info?.componentStack });
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 px-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
          <AlertTriangle size={26} />
        </div>
        <div className="font-semibold text-slate-800 text-lg">Nimadir xato ketdi</div>
        <p className="text-sm text-slate-500 mt-1 max-w-sm">
          Sahifada kutilmagan xatolik yuz berdi. Ma'lumotlaringiz saqlangan — sahifani qayta yuklab ko'ring.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800"
        >
          <RotateCcw size={16} /> Sahifani qayta yuklash
        </button>
      </div>
    );
  }
}
