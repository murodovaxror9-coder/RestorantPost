const TEXT_COLORS = {
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  red: 'text-rose-600 dark:text-rose-400',
  purple: 'text-violet-600 dark:text-violet-400',
  slate: 'text-slate-500 dark:text-slate-400',
};

const DOT_COLORS = {
  blue: 'bg-blue-500',
  green: 'bg-emerald-500',
  amber: 'bg-amber-500',
  red: 'bg-rose-500',
  purple: 'bg-violet-500',
  slate: 'bg-slate-400',
};

export default function Badge({ color = 'slate', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap ${TEXT_COLORS[color] || TEXT_COLORS.slate} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${DOT_COLORS[color] || DOT_COLORS.slate}`} />
      {children}
    </span>
  );
}
