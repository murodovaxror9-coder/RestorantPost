export const ORDER_TYPES = {
  'dine-in': 'Zal',
  takeaway: 'Olib ketish',
  delivery: 'Yetkazib berish',
};

export const ITEM_STATUS = {
  pending: { label: 'Kutilmoqda', color: 'slate' },
  new: { label: 'Yangi', color: 'blue' },
  cooking: { label: 'Tayyorlanmoqda', color: 'amber' },
  ready: { label: 'Tayyor', color: 'green' },
  served: { label: 'Berildi', color: 'slate' },
  cancelled: { label: 'Bekor', color: 'red' },
  refunded: { label: 'Qaytarilgan', color: 'purple' },
};

export const ORDER_STATUS = {
  open: { label: 'Ochiq', color: 'blue' },
  paid: { label: "To'langan", color: 'green' },
  cancelled: { label: 'Bekor qilingan', color: 'red' },
  refunded: { label: 'Qaytarilgan', color: 'amber' },
};

export const ONLINE_STATUS = {
  pending: { label: 'Yangi', color: 'blue' },
  accepted: { label: 'Qabul qilindi', color: 'amber' },
  delivering: { label: "Yo'lda", color: 'purple' },
  completed: { label: 'Yakunlandi', color: 'green' },
  rejected: { label: 'Rad etildi', color: 'red' },
};

export const RES_STATUS = {
  pending: { label: 'Kutilmoqda', color: 'amber' },
  confirmed: { label: 'Tasdiqlandi', color: 'blue' },
  seated: { label: 'Keldi', color: 'green' },
  cancelled: { label: 'Bekor', color: 'red' },
  'no-show': { label: 'Kelmadi', color: 'slate' },
};

export const PURCHASE_STATUS = {
  ordered: { label: 'Buyurtma berildi', color: 'blue' },
  received: { label: 'Qabul qilindi', color: 'amber' },
  paid: { label: "To'langan", color: 'green' },
  cancelled: { label: 'Bekor qilindi', color: 'red' },
};

export const MOVE_TYPES = {
  in: { label: 'Kirim', color: 'green' },
  out: { label: 'Chiqim', color: 'blue' },
  waste: { label: 'Isrof', color: 'red' },
  sale: { label: 'Sotuv', color: 'slate' },
  adjust: { label: 'Tuzatish', color: 'amber' },
  refund: { label: 'Qaytarish', color: 'purple' },
};

export const PAYMENT_LABELS = {
  cash: 'Naqd',
  card: 'Karta',
  click: 'Click',
  payme: 'Payme',
  online: 'Onlayn',
  mixed: 'Aralash',
  credit: 'Nasiya',
};

export const EXPENSE_CATEGORIES = ['Ijara', 'Kommunal', 'Maosh', 'Xarid', 'Marketing', 'Boshqa'];

export const LOG_TYPES = {
  auth: 'Kirish',
  order: 'Buyurtma',
  payment: "To'lov",
  menu: 'Menyu',
  inventory: 'Ombor',
  staff: 'Xodimlar',
  finance: 'Moliya',
  crm: 'CRM',
  reservation: 'Bron',
  settings: 'Sozlamalar',
};

export const UNITS = ['kg', 'g', 'l', 'ml', 'dona'];

export const EMOJIS = ['🍕', '🍔', '🥗', '🍛', '🍜', '🍢', '🍟', '🌯', '🥙', '🍝', '🥩', '🍗', '🍣', '🥤', '☕', '🍵', '🧃', '🍰', '🎂', '🍦'];
