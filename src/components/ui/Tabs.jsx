export default function Tabs({ tabs, value, onChange, className = '' }) {
  return (
    <div className={`flex gap-1 p-1 bg-slate-100 rounded-xl w-fit max-w-full overflow-x-auto scrollbar-thin ${className}`}>
      {tabs.map((t) => {
        const id = typeof t === 'object' ? t.id : t;
        const label = typeof t === 'object' ? t.label : t;
        const active = value === id;
        return (
          <button
            type="button"
            key={id}
            onClick={() => onChange(id)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              active ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label}
            {typeof t === 'object' && t.count != null && (
              <span className={`text-[11px] px-1.5 rounded-full ${active ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
