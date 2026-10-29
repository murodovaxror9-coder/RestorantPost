export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);

export const pad = (n) => String(n).padStart(2, '0');

export const fmtNum = (n) =>
  String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

export const money = (n) => `${fmtNum(n)} so'm`;

export const fmtTime = (v) => {
  const d = new Date(v);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const fmtDate = (v) => {
  const d = new Date(v);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
};

export const fmtDateTime = (v) => `${fmtDate(v)} ${fmtTime(v)}`;

export const toDateKey = (v) => {
  const d = new Date(v);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const isToday = (v) => !!v && toDateKey(v) === toDateKey(new Date());

export const minutesSince = (v, now = Date.now()) =>
  Math.max(0, Math.floor((now - new Date(v).getTime()) / 60000));

export const startOfDayOffset = (days) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
};

export const roundTo = (v, unit) => (unit > 0 ? Math.round(v / unit) * unit : v);

export function calcOrder(order, settings) {
  const items = (order?.items || []).filter((i) => i.status !== 'cancelled' && i.status !== 'refunded');
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmount = Math.round((subtotal * (Number(order?.discount) || 0)) / 100);
  const service =
    order?.type === 'dine-in'
      ? Math.round(((subtotal - discountAmount) * (settings?.serviceFee || 0)) / 100)
      : 0;
  const deliveryFee = order?.type === 'delivery' && subtotal > 0 ? settings?.deliveryFee || 0 : 0;
  const tip = Math.max(0, Number(order?.tip) || 0);
  const vat = settings?.vatEnabled
    ? Math.round((subtotal - discountAmount + service) * ((settings?.vatRate || 0) / 100))
    : 0;
  return {
    subtotal,
    discountAmount,
    service,
    deliveryFee,
    vat,
    tip,
    total: subtotal - discountAmount + service + deliveryFee + vat + tip,
  };
}

export function getTier(customer, settings) {
  const tiers = [...(settings?.loyalty?.tiers || [])].sort((a, b) => b.minSpent - a.minSpent);
  return tiers.find((t) => (customer?.totalSpent || 0) >= t.minSpent) || tiers[tiers.length - 1];
}

export function downloadCSV(filename, rows) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
