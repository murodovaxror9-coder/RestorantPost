const COLORS = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-rose-50 text-rose-600',
  purple: 'bg-violet-50 text-violet-600',
  slate: 'bg-slate-100 text-slate-600',
};

export default function StatCard({ label, value, icon: Icon, hint, color = 'blue', trend, onClick, active }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`card p-4 flex items-start gap-3 w-full text-left ${onClick ? 'cursor-pointer hover:border-slate-300 transition' : ''} ${active ? 'ring-2 ring-blue-500' : ''}`}
    >
      {Icon && (
        <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${COLORS[color]}`}>
          <Icon size={20} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-lg font-bold text-slate-800 truncate tabular-nums">{value}</div>
        {(hint || trend != null) && (
          <div className="text-xs mt-0.5 flex items-center gap-1.5">
            {trend != null && (
              <span className={trend >= 0 ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                {trend >= 0 ? '▲' : '▼'} {Math.abs(trend).toFixed(1)}%
              </span>
            )}
            {hint && <span className="text-slate-400 truncate">{hint}</span>}
          </div>
        )}
      </div>
    </Tag>
  );
}
