import { calcOrder, toDateKey } from '../utils/format';

export const STATE_VERSION = 2;

const daysFrom = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toDateKey(d);
};
const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();
const daysAgoAt = (days, h = 12, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

function seeded(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export const CATEGORIES = [
  { id: 'c1', name: 'Pitsa', emoji: '🍕' },
  { id: 'c2', name: 'Burger', emoji: '🍔' },
  { id: 'c3', name: 'Salatlar', emoji: '🥗' },
  { id: 'c4', name: 'Issiq taomlar', emoji: '🍛' },
  { id: 'c5', name: 'Ichimliklar', emoji: '🥤' },
  { id: 'c6', name: 'Desertlar', emoji: '🍰' },
];

const r = (ingredientId, qty) => ({ ingredientId, qty });

export const MENU = [
  { id: 'm1', name: 'Pitsa Margherita', categoryId: 'c1', price: 85000, station: 'kitchen', emoji: '🍕', description: 'Pomidor sousi, motsarella, rayhon', recipe: [r('i3', 0.25), r('i6', 0.15), r('i1', 0.1)] },
  { id: 'm2', name: 'Pepperoni', categoryId: 'c1', price: 95000, station: 'kitchen', emoji: '🍕', description: 'Pepperoni kolbasa, motsarella', recipe: [r('i3', 0.25), r('i6', 0.15), r('i2', 0.08)] },
  { id: 'm3', name: 'Tovuqli pitsa', categoryId: 'c1', price: 90000, station: 'kitchen', emoji: '🍕', description: "Tovuq go'shti, qo'ziqorin, pishloq", recipe: [r('i3', 0.25), r('i6', 0.12), r('i10', 0.12)] },
  { id: 'm4', name: 'Klassik burger', categoryId: 'c2', price: 45000, station: 'grill', emoji: '🍔', description: "Mol go'shti kotleti, pomidor, salat", recipe: [r('i11', 1), r('i2', 0.15), r('i1', 0.03), r('i9', 0.02)] },
  { id: 'm5', name: 'Chizburger', categoryId: 'c2', price: 50000, station: 'grill', emoji: '🍔', description: 'Ikki qavat pishloq', recipe: [r('i11', 1), r('i2', 0.15), r('i6', 0.04)] },
  { id: 'm6', name: 'Tovuq burger', categoryId: 'c2', price: 42000, station: 'grill', emoji: '🍔', description: 'Qarsildoq tovuq file', recipe: [r('i11', 1), r('i10', 0.15), r('i9', 0.02)] },
  { id: 'm7', name: 'Salat Caesar', categoryId: 'c3', price: 35000, station: 'kitchen', emoji: '🥗', description: 'Tovuq, salat bargi, krutonlar', recipe: [r('i9', 0.1), r('i10', 0.1), r('i6', 0.02)] },
  { id: 'm8', name: 'Grek salati', categoryId: 'c3', price: 32000, station: 'kitchen', emoji: '🥗', description: 'Pomidor, bodring, feta', recipe: [r('i1', 0.12), r('i6', 0.05), r('i9', 0.05)] },
  { id: 'm9', name: 'Osh', categoryId: 'c4', price: 40000, station: 'kitchen', emoji: '🍛', description: "Toshkentcha to'y oshi", recipe: [r('i2', 0.12), r('i15', 0.03), r('i16', 0.15)] },
  { id: 'm10', name: "Lag'mon", categoryId: 'c4', price: 38000, station: 'kitchen', emoji: '🍜', description: "Qo'lda cho'zilgan lag'mon", recipe: [r('i3', 0.15), r('i2', 0.1), r('i1', 0.05)] },
  { id: 'm11', name: 'Shashlik', categoryId: 'c4', price: 28000, station: 'grill', emoji: '🍢', description: "Mol go'shtidan, 1 six", recipe: [r('i2', 0.15)] },
  { id: 'm12', name: 'Fri kartoshka', categoryId: 'c4', price: 20000, station: 'kitchen', emoji: '🍟', description: 'Qarsildoq kartoshka', recipe: [r('i7', 0.2), r('i15', 0.02)] },
  { id: 'm13', name: 'Kola 0.5L', categoryId: 'c5', price: 15000, station: 'bar', emoji: '🥤', description: 'Sovuq gazli ichimlik', recipe: [r('i8', 1)] },
  { id: 'm14', name: 'Kapuchino', categoryId: 'c5', price: 25000, station: 'bar', emoji: '☕', description: 'Espresso va sut ko‘pigi', recipe: [r('i13', 0.02), r('i4', 0.15)] },
  { id: 'm15', name: "Ko'k choy", categoryId: 'c5', price: 10000, station: 'bar', emoji: '🍵', description: 'Choynakda', recipe: [r('i14', 0.01)] },
  { id: 'm16', name: 'Limonad', categoryId: 'c5', price: 22000, station: 'bar', emoji: '🧃', description: 'Uy limonadi', recipe: [r('i12', 0.03)] },
  { id: 'm17', name: 'Cheesecake', categoryId: 'c6', price: 38000, station: 'dessert', emoji: '🍰', description: 'Nyu-York cheesecake', recipe: [r('i6', 0.08), r('i12', 0.03), r('i5', 1)] },
  { id: 'm18', name: 'Shokoladli tort', categoryId: 'c6', price: 35000, station: 'dessert', emoji: '🎂', description: "Bir bo'lak", recipe: [r('i3', 0.08), r('i12', 0.05), r('i5', 1), r('i4', 0.05)] },
  { id: 'm19', name: 'Muzqaymoq', categoryId: 'c6', price: 18000, station: 'dessert', emoji: '🍦', description: '3 shar', recipe: [r('i4', 0.1), r('i12', 0.02)] },
].map((m) => ({ available: true, ...m }));

const INGREDIENTS = [
  ['i1', 'Pomidor', 'kg', 12, 5, 12000, 'Sabzavot', 7],
  ['i2', "Mol go'shti", 'kg', 18, 8, 95000, "Go'sht", 5],
  ['i3', 'Un', 'kg', 40, 15, 7000, 'Quruq mahsulot', 120],
  ['i4', 'Sut', 'l', 10, 6, 11000, 'Sut mahsulotlari', 4],
  ['i5', 'Tuxum', 'dona', 120, 60, 1500, 'Sut mahsulotlari', 14],
  ['i6', 'Pishloq (motsarella)', 'kg', 6, 5, 85000, 'Sut mahsulotlari', 10],
  ['i7', 'Kartoshka', 'kg', 25, 10, 5000, 'Sabzavot', 30],
  ['i8', 'Kola 0.5L', 'dona', 48, 24, 7000, 'Ichimlik', 180],
  ['i9', 'Salat bargi', 'kg', 3, 2, 25000, 'Sabzavot', 2],
  ['i10', 'Tovuq file', 'kg', 9, 5, 45000, "Go'sht", 4],
  ['i11', 'Burger noni', 'dona', 40, 30, 3000, 'Non', 3],
  ['i12', 'Shakar', 'kg', 15, 5, 12000, 'Quruq mahsulot', 200],
  ['i13', 'Qahva doni', 'kg', 2.5, 1, 180000, 'Ichimlik', 90],
  ['i14', "Ko'k choy", 'kg', 1.5, 0.5, 90000, 'Ichimlik', 300],
  ['i15', "O'simlik yog'i", 'l', 12, 5, 18000, 'Quruq mahsulot', 150],
  ['i16', 'Guruch (devzira)', 'kg', 4, 10, 28000, 'Quruq mahsulot', 180],
];

const TABLES = [
  ...Array.from({ length: 8 }, (_, i) => ({ id: `t${i + 1}`, name: `Stol ${i + 1}`, zone: 'Zal', seats: i % 3 === 0 ? 6 : 4 })),
  ...Array.from({ length: 4 }, (_, i) => ({ id: `t${i + 9}`, name: `Stol ${i + 9}`, zone: 'Terrasa', seats: 4 })),
  { id: 't13', name: 'VIP 1', zone: 'VIP', seats: 10 },
  { id: 't14', name: 'VIP 2', zone: 'VIP', seats: 8 },
];

// SHA-256("1111") — demo PIN hashi (haqiqiy PIN hech qachon ochiq saqlanmaydi, faqat hash)
const DEMO_PIN_HASH = '0ffe1abd1a08215353c233d6e009613e95eec4253832a761af28ff37ac5a150c';

const STAFF = [
  { id: 's1', name: 'Azizbek Karimov', role: 'admin', phone: '+998 90 123 45 67', salary: 9000000, schedule: '09:00 - 18:00', workDays: 'Du-Sh' },
  { id: 's6', name: 'Bekzod Toshmatov', role: 'manager', phone: '+998 91 555 22 11', salary: 7000000, schedule: '10:00 - 22:00', workDays: 'Du-Ju' },
  { id: 's2', name: 'Dilshod Rahimov', role: 'cashier', phone: '+998 93 444 12 34', salary: 4500000, schedule: '09:00 - 21:00', workDays: '2/2' },
  { id: 's3', name: 'Shohida Aliyeva', role: 'waiter', phone: '+998 94 777 88 99', salary: 3500000, schedule: '11:00 - 23:00', workDays: '2/2' },
  { id: 's7', name: 'Malika Ergasheva', role: 'waiter', phone: '+998 97 111 22 33', salary: 3500000, schedule: '11:00 - 23:00', workDays: '2/2' },
  { id: 's4', name: 'Rustam Nazarov', role: 'chef', phone: '+998 99 321 65 98', salary: 7500000, schedule: '08:00 - 20:00', workDays: 'Du-Sh' },
  { id: 's8', name: 'Jasur Qodirov', role: 'chef', phone: '+998 90 987 65 43', salary: 5000000, schedule: '12:00 - 23:00', workDays: '2/2' },
  { id: 's5', name: 'Nodira Yusupova', role: 'warehouse', phone: '+998 95 246 80 13', salary: 4000000, schedule: '08:00 - 17:00', workDays: 'Du-Ju' },
].map((s) => ({ pinHash: DEMO_PIN_HASH, status: 'active', joinedAt: '2025-03-01', ...s }));

const CUSTOMERS = [
  { id: 'cu1', name: 'Sardor Aliyev', phone: '+998 90 100 20 30', totalSpent: 6200000, points: 62000, visits: 41, birthday: '1992-05-14' },
  { id: 'cu2', name: 'Malika Saidova', phone: '+998 91 200 30 40', totalSpent: 2450000, points: 24500, visits: 18, birthday: '1996-11-02' },
  { id: 'cu3', name: 'Javohir Rasulov', phone: '+998 93 300 40 50', totalSpent: 17800000, points: 178000, visits: 96, birthday: '1988-02-20' },
  { id: 'cu4', name: 'Dilnoza Karimova', phone: '+998 94 400 50 60', totalSpent: 640000, points: 6400, visits: 5, birthday: '2000-08-09' },
  { id: 'cu5', name: 'Otabek Mirzayev', phone: '+998 97 500 60 70', totalSpent: 1250000, points: 12500, visits: 9, birthday: '1994-12-25' },
].map((c) => ({ note: '', lastVisit: daysAgoAt(2), createdAt: '2025-06-01', debt: 0, ...c }));

function makeSettings() {
  return {
    restaurantName: 'RestroPOS Restoran',
    phone: '+998 71 200 00 00',
    address: "Toshkent sh., Amir Temur ko'chasi 15",
    workingHours: '09:00 - 23:00',
    serviceFee: 10,
    vatEnabled: false,
    vatRate: 12,
    cashRounding: 1000,
    stockDeductAt: 'payment',
    rolePermissions: null,
    waiterOnlyOwnTables: false,
    discountLimits: { admin: 100, manager: 50, cashier: 15, waiter: 15, chef: 0, warehouse: 0 },
    pointsRedeemRate: 1,
    creditEnabled: true,
    deliveryFee: 15000,
    kitchenLateMinutes: 15,
    receiptHeader: 'Xush kelibsiz!',
    receiptFooter: 'Xaridingiz uchun rahmat! Yana kutib qolamiz.',
    paymentMethods: [
      { id: 'cash', label: 'Naqd', enabled: true },
      { id: 'card', label: 'Karta (Uzcard/Humo)', enabled: true },
      { id: 'click', label: 'Click', enabled: true },
      { id: 'payme', label: 'Payme', enabled: true },
    ],
    loyalty: {
      pointsRate: 1,
      tiers: [
        { name: 'Bronze', minSpent: 0, discount: 0 },
        { name: 'Silver', minSpent: 1000000, discount: 5 },
        { name: 'Gold', minSpent: 5000000, discount: 10 },
        { name: 'Platinum', minSpent: 15000000, discount: 15 },
      ],
    },
  };
}

export function createInitialState() {
  const rnd = seeded(20260428);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const settings = makeSettings();

  const inventory = INGREDIENTS.map(([id, name, unit, qty, min, cost, category, expDays], idx) => ({
    id, name, unit, qty, min, cost, category, expiry: daysFrom(expDays),
    barcode: `290${String(idx + 1).padStart(9, '0')}`,
  }));

  // ---- Tarixiy buyurtmalar (oxirgi 30 kun) ----
  const HOURS = [10, 11, 12, 12, 13, 13, 13, 14, 14, 15, 16, 17, 18, 18, 19, 19, 19, 20, 20, 21, 22];
  const methods = ['cash', 'cash', 'cash', 'cash', 'card', 'card', 'card', 'click', 'click', 'payme'];
  const popular = [...MENU.map((m) => m.id), 'm1', 'm1', 'm2', 'm4', 'm4', 'm9', 'm9', 'm13', 'm13', 'm11', 'm14', 'm7'];
  const tableIds = TABLES.map((t) => t.id);
  const orders = [];
  let seq = 1000;

  for (let d = 29; d >= 0; d--) {
    const count = 20 + Math.floor(rnd() * 16);
    const dates = [];
    for (let k = 0; k < count; k++) {
      const dt = new Date();
      dt.setDate(dt.getDate() - d);
      dt.setHours(pick(HOURS), Math.floor(rnd() * 60), Math.floor(rnd() * 60), 0);
      if (dt.getTime() < Date.now() - 40 * 60000) dates.push(dt);
    }
    dates.sort((a, b) => a - b).forEach((dt) => {
      const n = 1 + Math.floor(rnd() * 4);
      const items = [];
      for (let j = 0; j < n; j++) {
        const menuId = pick(popular);
        const m = MENU.find((x) => x.id === menuId);
        const ex = items.find((i) => i.menuId === m.id);
        if (ex) ex.qty += 1;
        else items.push({ id: `h${seq}_${j}`, menuId: m.id, name: m.name, price: m.price, qty: rnd() < 0.25 ? 2 : 1, station: m.station, emoji: m.emoji, status: 'served', note: '' });
      }
      const x = rnd();
      const type = x < 0.65 ? 'dine-in' : x < 0.85 ? 'takeaway' : 'delivery';
      const discount = rnd() < 0.08 ? 10 : 0;
      const c = calcOrder({ type, discount, items }, settings);
      const paidMs = Math.min(dt.getTime() + (20 + Math.floor(rnd() * 40)) * 60000, Date.now() - 60000);
      const online = type === 'delivery' && rnd() < 0.6;
      seq += 1;
      orders.push({
        id: `o${seq}`,
        number: seq,
        type,
        source: online ? 'online' : 'pos',
        onlineStatus: online ? 'completed' : undefined,
        tableId: type === 'dine-in' ? pick(tableIds) : null,
        waiterId: type === 'dine-in' ? pick(['s3', 's7']) : null,
        cashierId: 's2',
        customerId: rnd() < 0.15 ? pick(CUSTOMERS).id : null,
        guests: type === 'dine-in' ? 1 + Math.floor(rnd() * 4) : 1,
        status: rnd() < 0.01 ? 'refunded' : 'paid',
        createdAt: dt.toISOString(),
        paidAt: new Date(paidMs).toISOString(),
        discount,
        subtotal: c.subtotal,
        discountAmount: c.discountAmount,
        service: c.service,
        total: c.total,
        payment: { method: online ? 'click' : pick(methods), received: c.total },
        items,
        branchId: 'b1',
      });
    });
  }
  orders.reverse();

  // ---- Hozirgi faol buyurtmalar ----
  let itemSeq = 0;
  const mk = (menuId, qty, status, addedMin, note = '') => {
    const m = MENU.find((x) => x.id === menuId);
    itemSeq += 1;
    return { id: `a${itemSeq}`, menuId, name: m.name, price: m.price, qty, station: m.station, emoji: m.emoji, status, addedAt: minutesAgo(addedMin), note };
  };
  const active = [
    { tableId: 't5', waiterId: 's3', guests: 3, at: 18, items: [mk('m1', 1, 'cooking', 18), mk('m13', 2, 'ready', 18), mk('m7', 1, 'cooking', 18, 'Sousni alohida')] },
    { tableId: 't3', waiterId: 's7', guests: 2, at: 8, items: [mk('m4', 2, 'new', 8), mk('m12', 2, 'new', 8), mk('m14', 2, 'new', 8)] },
    { tableId: 't7', waiterId: 's3', guests: 4, at: 26, items: [mk('m7', 1, 'ready', 26), mk('m11', 4, 'ready', 26), mk('m15', 1, 'served', 26)], billRequested: true },
    { tableId: 't13', waiterId: 's7', guests: 8, at: 12, items: [mk('m9', 6, 'cooking', 12), mk('m15', 2, 'new', 12), mk('m17', 3, 'new', 4)] },
    { type: 'takeaway', at: 4, items: [mk('m5', 1, 'new', 4), mk('m13', 1, 'new', 4)] },
  ].map((a) => {
    seq += 1;
    return {
      id: `o${seq}`, number: seq, type: a.type || 'dine-in', source: 'pos', tableId: a.tableId || null,
      waiterId: a.waiterId || null, customerId: null, guests: a.guests || 1, status: 'open',
      createdAt: minutesAgo(a.at), discount: 0, items: a.items, billRequested: !!a.billRequested, branchId: 'b1',
    };
  });
  seq += 1;
  active.push({
    id: `o${seq}`, number: seq, type: 'delivery', source: 'online', onlineStatus: 'pending', tableId: null,
    waiterId: null, customerId: 'cu3', customerName: 'Javohir Rasulov', phone: '+998 93 300 40 50',
    address: "Chilonzor 9-kvartal, 12-uy, 45-xonadon", paymentMethod: 'click', guests: 1, status: 'open',
    createdAt: minutesAgo(2), discount: 0, branchId: 'b1',
    items: [mk('m2', 1, 'pending', 2), mk('m16', 2, 'pending', 2)],
  });

  // ---- Xarajatlar ----
  const expenses = [
    { category: 'Ijara', amount: 15000000, note: 'Oylik ijara', d: 25 },
    { category: 'Maosh', amount: 32000000, note: 'Xodimlar maoshi', d: 20 },
    { category: 'Kommunal', amount: 2600000, note: 'Elektr, gaz, suv', d: 15 },
    { category: 'Marketing', amount: 3000000, note: 'Instagram reklama', d: 10 },
    { category: 'Boshqa', amount: 450000, note: "Ta'mirlash", d: 2 },
    ...Array.from({ length: 10 }, (_, i) => ({ category: 'Xarid', amount: 1000000 + Math.round(rnd() * 3000) * 1000, note: 'Mahsulot xaridi', d: i * 3 })),
  ].map((e, i) => ({ id: `e${i + 1}`, category: e.category, amount: e.amount, note: e.note, date: daysAgoAt(e.d, 11), userName: 'Azizbek Karimov' }));

  return {
    version: STATE_VERSION,
    branchId: 'b1',
    orderSeq: seq,
    purchaseSeq: 103,
    categories: CATEGORIES,
    menu: MENU,
    stations: [
      { id: 'kitchen', name: 'Oshxona', emoji: '👨‍🍳', active: true },
      { id: 'bar', name: 'Bar', emoji: '🍸', active: true },
      { id: 'grill', name: 'Grill', emoji: '🔥', active: true },
      { id: 'dessert', name: 'Desert', emoji: '🍰', active: true },
    ],
    tables: TABLES,
    orders: [...active.reverse(), ...orders],
    archivedOrders: [],
    attendance: [],
    inventory,
    stockMoves: [
      { id: 'sm1', at: daysAgoAt(1, 9), ingredientId: 'i2', name: "Mol go'shti", unit: 'kg', type: 'in', qty: 20, note: 'Xarid #101', userName: 'Nodira Yusupova' },
      { id: 'sm2', at: daysAgoAt(1, 10), ingredientId: 'i9', name: 'Salat bargi', unit: 'kg', type: 'waste', qty: -0.5, note: 'Buzilgan', userName: 'Rustam Nazarov' },
      { id: 'sm3', at: daysAgoAt(0, 8), ingredientId: 'i1', name: 'Pomidor', unit: 'kg', type: 'in', qty: 10, note: 'Xarid #102', userName: 'Nodira Yusupova' },
    ],
    staff: STAFF,
    suppliers: [
      { id: 'sp1', name: 'Agro Market', phone: '+998 71 230 11 22', category: 'Oziq-ovqat', contact: 'Anvar', address: 'Toshkent, Yunusobod' },
      { id: 'sp2', name: 'Sardor Food', phone: '+998 90 330 44 55', category: "Go'sht", contact: 'Sardor', address: 'Toshkent, Sergeli' },
      { id: 'sp3', name: 'Eco Fresh', phone: '+998 93 440 55 66', category: 'Sabzavot', contact: 'Kamola', address: 'Toshkent viloyati' },
      { id: 'sp4', name: 'Bodom Savdo', phone: '+998 97 550 66 77', category: 'Ichimliklar', contact: 'Rustam', address: 'Toshkent, Olmazor' },
    ],
    purchases: [
      { id: 'p1', number: 101, supplierId: 'sp2', status: 'paid', createdAt: daysAgoAt(2, 9), receivedAt: daysAgoAt(1, 9), items: [{ ingredientId: 'i2', name: "Mol go'shti", unit: 'kg', qty: 20, price: 95000 }], total: 1900000, paid: 1900000, note: '' },
      { id: 'p2', number: 102, supplierId: 'sp3', status: 'received', createdAt: daysAgoAt(1, 8), receivedAt: daysAgoAt(0, 8), items: [{ ingredientId: 'i1', name: 'Pomidor', unit: 'kg', qty: 10, price: 12000 }, { ingredientId: 'i9', name: 'Salat bargi', unit: 'kg', qty: 3, price: 25000 }], total: 195000, paid: 0, note: '' },
      { id: 'p3', number: 103, supplierId: 'sp1', status: 'ordered', createdAt: daysAgoAt(0, 10), items: [{ ingredientId: 'i16', name: 'Guruch (devzira)', unit: 'kg', qty: 25, price: 28000 }, { ingredientId: 'i3', name: 'Un', unit: 'kg', qty: 50, price: 7000 }], total: 1050000, paid: 0, note: 'Ertaga yetkaziladi' },
    ],
    customers: CUSTOMERS,
    campaigns: [
      { id: 'cp1', name: 'Happy Hour', discount: 20, description: '14:00 - 17:00 barcha ichimliklarga', active: true, from: daysFrom(-10), to: daysFrom(20) },
      { id: 'cp2', name: "Tug'ilgan kun", discount: 15, description: "Tug'ilgan kun egasiga butun buyurtmaga", active: true, from: daysFrom(-60), to: daysFrom(300) },
      { id: 'cp3', name: 'Hafta oxiri combo', discount: 10, description: 'Shanba-yakshanba pitsa + ichimlik', active: false, from: daysFrom(-30), to: daysFrom(-1) },
    ],
    reservations: [
      { id: 'r1', name: 'Sardor Aliyev', phone: '+998 90 100 20 30', date: daysFrom(0), time: '19:00', guests: 4, tableId: 't2', status: 'confirmed', note: "Deraza yonida", createdAt: daysAgoAt(1) },
      { id: 'r2', name: 'Malika Saidova', phone: '+998 91 200 30 40', date: daysFrom(0), time: '20:30', guests: 8, tableId: 't14', status: 'pending', note: "Tug'ilgan kun", createdAt: daysAgoAt(0, 9) },
      { id: 'r3', name: 'Otabek Mirzayev', phone: '+998 97 500 60 70', date: daysFrom(1), time: '13:00', guests: 2, tableId: 't9', status: 'confirmed', note: '', createdAt: daysAgoAt(0, 10) },
      { id: 'r4', name: 'Kompaniya ziyofati', phone: '+998 71 111 22 33', date: daysFrom(3), time: '18:00', guests: 10, tableId: 't13', status: 'confirmed', note: 'Korporativ menyu', createdAt: daysAgoAt(3) },
    ],
    branches: [
      { id: 'b1', name: 'Toshkent (Asosiy)', city: 'Toshkent', address: "Amir Temur ko'chasi 15", manager: 'Bekzod Toshmatov', phone: '+998 71 200 00 00', status: 'active', revenueToday: null, staffCount: null, tables: 14 },
      { id: 'b2', name: 'Samarqand', city: 'Samarqand', address: "Registon ko'chasi 8", manager: 'Shavkat Umarov', phone: '+998 66 233 00 00', status: 'active', revenueToday: 8200000, staffCount: 12, tables: 18 },
      { id: 'b3', name: 'Buxoro', city: 'Buxoro', address: "Mustaqillik ko'chasi 3", manager: 'Gulnora Xolmatova', phone: '+998 65 221 00 00', status: 'active', revenueToday: 5700000, staffCount: 9, tables: 12 },
      { id: 'b4', name: 'Andijon', city: 'Andijon', address: "Navoiy shoh ko'chasi 21", manager: 'Doniyor Ismoilov', phone: '+998 74 224 00 00', status: 'active', revenueToday: 4300000, staffCount: 8, tables: 10 },
    ],
    expenses,
    shifts: [
      { id: 'sh1', cashierId: 's2', cashierName: 'Dilshod Rahimov', openedAt: daysAgoAt(1, 9), closedAt: daysAgoAt(1, 23), openingCash: 500000, ordersCount: 31, total: 4820000, refunds: 0, byMethod: { cash: 2300000, card: 1600000, click: 620000, payme: 300000 }, expectedCash: 2800000, countedCash: 2795000, difference: -5000 },
      { id: 'sh2', cashierId: 's2', cashierName: 'Dilshod Rahimov', openedAt: daysAgoAt(2, 9), closedAt: daysAgoAt(2, 23), openingCash: 500000, ordersCount: 28, total: 4150000, refunds: 85000, byMethod: { cash: 1900000, card: 1500000, click: 450000, payme: 300000 }, expectedCash: 2315000, countedCash: 2315000, difference: 0 },
    ],
    currentShift: null,
    auditLogs: [
      { id: 'l1', at: daysAgoAt(0, 9, 2), type: 'auth', action: 'Tizimga kirdi', details: 'Dilshod Rahimov (cashier)', userId: 's2', userName: 'Dilshod Rahimov' },
      { id: 'l2', at: daysAgoAt(0, 8, 15), type: 'inventory', action: 'Kirim', details: 'Pomidor: 10 kg', userId: 's5', userName: 'Nodira Yusupova' },
      { id: 'l3', at: daysAgoAt(1, 22, 40), type: 'menu', action: 'Taom tahrirlandi', details: 'Pepperoni — narx 95 000', userId: 's1', userName: 'Azizbek Karimov' },
      { id: 'l4', at: daysAgoAt(1, 21, 10), type: 'payment', action: "To'lov qaytarildi", details: '#1288 · 85 000 so\'m', userId: 's2', userName: 'Dilshod Rahimov' },
    ],
    settings,
    tenants: [
      { id: 'r1', name: 'RestroPOS Restoran', owner: 'Azizbek Karimov', plan: 'Pro', branches: 4, status: 'active', createdAt: '2025-01-15' },
      { id: 'r2', name: 'Somsa House', owner: 'Ulug‘bek Sobirov', plan: 'Standard', branches: 2, status: 'active', createdAt: '2025-04-02' },
      { id: 'r3', name: 'Bahor Kafe', owner: 'Nilufar Qosimova', plan: 'Starter', branches: 1, status: 'active', createdAt: '2025-07-19' },
      { id: 'r4', name: "Navro'z Choyxona", owner: 'Akmal Yo‘ldoshev', plan: 'Standard', branches: 3, status: 'suspended', createdAt: '2025-02-11' },
      { id: 'r5', name: 'Green Bowl', owner: 'Sevara Aminova', plan: 'Pro', branches: 2, status: 'active', createdAt: '2026-01-08' },
    ],
    plans: [
      { id: 'Starter', price: 300000, features: ['1 filial', 'POS + Oshxona', '5 ta xodim'] },
      { id: 'Standard', price: 700000, features: ['3 ta filial', 'Ombor + Xaridlar', 'CRM & Loyalty', '20 ta xodim'] },
      { id: 'Pro', price: 1500000, features: ['Cheksiz filial', 'Barcha modullar', 'Onlayn & QR menyu', 'API integratsiya'] },
    ],
  };
}
