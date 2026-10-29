const VARIANTS = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm dark:bg-blue-600 dark:hover:bg-blue-500',
  secondary: 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm',
  warning: 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm',
  ghost: 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
  soft: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
};

const SIZES = {
  xs: 'px-2 py-1 text-xs rounded-md',
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-5 py-3 text-base rounded-xl',
};

export default function Button({ variant = 'primary', size = 'md', icon: Icon, className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 font-medium transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={size === 'lg' ? 18 : size === 'md' ? 16 : 14} />}
      {children}
    </button>
  );
}
