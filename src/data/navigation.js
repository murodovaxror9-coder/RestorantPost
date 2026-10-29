import {
  LayoutDashboard,
  MonitorSmartphone,
  Wallet,
  ConciergeBell,
  ChefHat,
  Flame,
  Globe,
  BookOpen,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  HeartHandshake,
  CalendarDays,
  Building2,
  ScrollText,
  Settings,
} from 'lucide-react';

export const ROLES = {
  admin: { label: 'Administrator', color: 'purple' },
  manager: { label: 'Menejer', color: 'blue' },
  cashier: { label: 'Kassir', color: 'green' },
  waiter: { label: 'Ofitsiant', color: 'amber' },
  chef: { label: 'Oshpaz', color: 'red' },
  warehouse: { label: 'Omborchi', color: 'slate' },
};

export const NAV = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, group: 'Asosiy', roles: ['admin', 'manager'] },
  { path: '/pos', label: 'POS — Kassa', icon: MonitorSmartphone, group: 'Savdo', roles: ['admin', 'manager', 'cashier'] },
  { path: '/cashier', label: 'Kassir', icon: Wallet, group: 'Savdo', roles: ['admin', 'manager', 'cashier'] },
  { path: '/waiter', label: 'Ofitsiant', icon: ConciergeBell, group: 'Savdo', roles: ['admin', 'manager', 'waiter'] },
  { path: '/online', label: 'Onlayn & QR', icon: Globe, group: 'Savdo', roles: ['admin', 'manager', 'cashier'] },
  { path: '/reservations', label: 'Bronlar', icon: CalendarDays, group: 'Savdo', roles: ['admin', 'manager', 'cashier', 'waiter'] },
  { path: '/kitchen', label: 'Oshxona (KDS)', icon: ChefHat, group: 'Oshxona', roles: ['admin', 'manager', 'chef'] },
  { path: '/stations', label: 'Stansiyalar', icon: Flame, group: 'Oshxona', roles: ['admin', 'manager', 'chef'] },
  { path: '/menu', label: 'Menyu', icon: BookOpen, group: 'Oshxona', roles: ['admin', 'manager', 'chef'] },
  { path: '/inventory', label: 'Ombor', icon: Package, group: 'Ombor', roles: ['admin', 'manager', 'warehouse', 'chef'] },
  { path: '/purchasing', label: 'Xaridlar', icon: ShoppingCart, group: 'Ombor', roles: ['admin', 'manager', 'warehouse'] },
  { path: '/staff', label: 'Xodimlar', icon: Users, group: 'Boshqaruv', roles: ['admin', 'manager'] },
  { path: '/finance', label: 'Moliya', icon: BarChart3, group: 'Boshqaruv', roles: ['admin', 'manager'] },
  { path: '/crm', label: 'CRM & Loyalty', icon: HeartHandshake, group: 'Boshqaruv', roles: ['admin', 'manager', 'cashier'] },
  { path: '/branches', label: 'Filiallar', icon: Building2, group: 'Tizim', roles: ['admin'] },
  { path: '/audit', label: 'Audit loglar', icon: ScrollText, group: 'Tizim', roles: ['admin', 'manager'] },
  { path: '/settings', label: 'Sozlamalar', icon: Settings, group: 'Tizim', roles: ['admin'] },
];

export const defaultPathFor = (role, rolePermissions) =>
  NAV.find((n) => effectiveRoles(n, rolePermissions).includes(role))?.path || '/login';

// Admin tomonidan Xodimlar → Rollar va ruxsatlar bo'limida o'zgartirilgan ruxsatlarni
// statik NAV.roles bilan birlashtiradi (sozlama bo'lmasa, standart qiymat ishlatiladi).
export const effectiveRoles = (navItem, rolePermissions) => rolePermissions?.[navItem.path] || navItem.roles;
