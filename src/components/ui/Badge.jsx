const COLORS = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-rose-50 text-rose-700 ring-rose-600/15',
  purple: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/15',
};

export default function Badge({ color = 'slate', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap ${COLORS[color] || COLORS.slate} ${className}`}>
      {children}
    </span>
  );
}
