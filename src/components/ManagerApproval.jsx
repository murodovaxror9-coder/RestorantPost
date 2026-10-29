import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Modal, Field } from './ui';
import { sha256Hex } from '../utils/crypto';

export default function ManagerApproval({ open, title = 'Menejer tasdig’i kerak', message, onApprove, onClose }) {
  const { state } = useApp();
  const [pin, setPin] = useState('');
  const [err, setErr] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (open) {
      setPin('');
      setErr('');
    }
  }, [open]);

  const approvers = state.staff.filter((s) => !s.archived && ['admin', 'manager'].includes(s.role));

  const submit = async () => {
    if (!/^\d{4}$/.test(pin)) return setErr('4 xonali PIN kiriting');
    setChecking(true);
    const hash = await sha256Hex(pin);
    const approver = approvers.find((s) => s.pinHash === hash);
    setChecking(false);
    if (!approver) {
      setErr("PIN noto'g'ri yoki bu PIN menejer/admin'ga tegishli emas");
      setPin('');
      return;
    }
    onApprove(approver);
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
          <ShieldCheck size={24} />
        </div>
        {message && <p className="text-sm text-slate-600 mb-4">{message}</p>}
        <Field label="Menejer yoki admin PIN kodi">
          <input
            autoFocus
            type="password"
            inputMode="numeric"
            maxLength={4}
            className="input text-center tracking-[0.5em] text-lg"
            value={pin}
            onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setErr(''); }}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
          />
        </Field>
        {err && <p className="text-xs text-rose-600 mt-2">{err}</p>}
        <div className="flex gap-2 mt-5">
          <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 hover:bg-slate-200">Bekor</button>
          <button
            type="button"
            disabled={checking || pin.length < 4}
            onClick={submit}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Tasdiqlash
          </button>
        </div>
      </div>
    </Modal>
  );
}
