import { uid, calcOrder, fmtNum, toDateKey } from '../utils/format';
import { createInitialState } from '../data/mockData';
import { PAYMENT_LABELS, ONLINE_STATUS, RES_STATUS } from '../data/labels';

const now = () => new Date().toISOString();

function log(state, type, action, details = '') {
  const entry = {
    id: uid(),
    at: now(),
    type,
    action,
    details,
    userId: state.user?.id || null,
    userName: state.user?.name || 'Tizim',
  };
  // Audit log cheklovsiz saqlanadi (eski yozuvlar o'chirilmaydi)
  return { ...state, auditLogs: [entry, ...state.auditLogs] };
}

const upsert = (list, item) =>
  list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? { ...x, ...item } : x))
    : [...list, item];

const mapOrder = (state, id, fn) => ({
  ...state,
  orders: state.orders.map((o) => (o.id === id ? fn(o) : o)),
});

// Ingredient yetarli bo'lmasa taomni avtomatik stop-list qiladi (va yetarli bo'lsa, faqat
// avtomatik o'chirilgan taomlarni qaytaradi — qo'lda "Sotuvda emas" qilingan taomlarga tegmaydi).
function syncStopList(state) {
  const canMake = (m) =>
    (m.recipe || []).every((rc) => {
      const ing = state.inventory.find((i) => i.id === rc.ingredientId);
      return ing && ing.qty >= rc.qty;
    });
  const menu = state.menu.map((m) => {
    if (m.archived || !m.recipe?.length) return m;
    const ok = canMake(m);
    if (!ok && m.available) return { ...m, available: false, stopListAuto: true };
    if (ok && !m.available && m.stopListAuto) return { ...m, available: true, stopListAuto: false };
    return m;
  });
  return { ...state, menu };
}

function applyStock(state, ingredientId, delta, type, note, refId) {
  const ing = state.inventory.find((i) => i.id === ingredientId);
  if (!ing || !delta) return state;
  const move = {
    id: uid(),
    at: now(),
    ingredientId,
    name: ing.name,
    unit: ing.unit,
    type,
    qty: +delta.toFixed(3),
    note: note || '',
    refId: refId || null,
    userName: state.user?.name || 'Tizim',
  };
  // Qoldiq manfiy bo'lishi mumkin — bu "yetarli emas" holatini yashirmasdan ko'rsatadi
  return syncStopList({
    ...state,
    inventory: state.inventory.map((i) =>
      i.id === ingredientId ? { ...i, qty: +(i.qty + delta).toFixed(3) } : i
    ),
    stockMoves: [move, ...state.stockMoves].slice(0, 1500),
  });
}

const newItems = (items, status = 'new') => {
  const t = now();
  return items.map((i) => ({ note: '', ...i, id: uid(), status, addedAt: t }));
};

export function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return { ...action.state, user: state.user };

    case 'STORAGE_WARNING':
      return { ...state, storageWarning: action.message };

    case 'CLOCK_WARNING_SEEN':
      return { ...state, clockWarning: false };

    case 'RESET':
      return log({ ...createInitialState(), user: state.user }, 'settings', "Demo ma'lumotlar tiklandi");

    case 'ARCHIVE_OLD_ORDERS': {
      const days = action.days || 90;
      const cutoff = Date.now() - days * 86400000;
      const toArchive = state.orders.filter((o) => o.status !== 'open' && new Date(o.createdAt).getTime() < cutoff);
      if (!toArchive.length) return state;
      const archiveIds = new Set(toArchive.map((o) => o.id));
      return log(
        {
          ...state,
          orders: state.orders.filter((o) => !archiveIds.has(o.id)),
          archivedOrders: [...toArchive, ...(state.archivedOrders || [])],
        },
        'settings',
        'Eski buyurtmalar arxivlandi',
        `${toArchive.length} ta buyurtma (${days} kundan eski)`
      );
    }

    case 'IMPORT_DATA':
      return log({ ...action.data, user: state.user }, 'settings', "Zaxiradan ma'lumotlar tiklandi", action.fileName || '');

    // ---------- Auth ----------
    case 'LOGIN': {
      const t = now();
      const today = toDateKey(t);
      const already = state.attendance.find((a) => a.staffId === action.user.id && a.date === today);
      const attendance = already
        ? state.attendance
        : [{ id: uid(), staffId: action.user.id, date: today, checkIn: t, checkOut: null }, ...state.attendance];
      return log({ ...state, user: action.user, attendance }, 'auth', 'Tizimga kirdi', `${action.user.name} (${action.user.role})`);
    }
    case 'LOGOUT': {
      const today = toDateKey(now());
      const attendance = state.user
        ? state.attendance.map((a) => (a.staffId === state.user.id && a.date === today && !a.checkOut ? { ...a, checkOut: now() } : a))
        : state.attendance;
      return { ...log({ ...state, attendance }, 'auth', 'Tizimdan chiqdi', state.user?.name || ''), user: null };
    }
    case 'SET_BRANCH':
      return { ...state, branchId: action.id };

    // ---------- Buyurtmalar ----------
    case 'CREATE_ORDER': {
      const number = state.orderSeq + 1;
      const { items, itemStatus = 'new', ...rest } = action.order;
      const order = {
        type: 'dine-in',
        source: 'pos',
        tableId: null,
        customerId: null,
        waiterId: state.user?.id || null,
        guests: 1,
        discount: 0,
        ...rest,
        id: rest.id || uid(),
        number,
        status: 'open',
        createdAt: now(),
        branchId: state.branchId,
        items: newItems(items, itemStatus),
      };
      const table = state.tables.find((t) => t.id === order.tableId);
      return log(
        { ...state, orderSeq: number, orders: [order, ...state.orders] },
        'order',
        'Buyurtma yaratildi',
        `#${number}${table ? ' · ' + table.name : ''} · ${items.length} ta pozitsiya`
      );
    }
    case 'ADD_ITEMS': {
      const o = state.orders.find((x) => x.id === action.orderId);
      // Hisob so'ralgandan keyin yangi taom qo'shilsa, hisob eskirgan bo'ladi — qayta so'ralishi kerak
      const s = mapOrder(state, action.orderId, (ord) => ({
        ...ord,
        items: [...ord.items, ...newItems(action.items)],
        billRequested: false,
      }));
      return log(s, 'order', "Taom qo'shildi", `#${o?.number} · ${action.items.length} ta pozitsiya`);
    }
    case 'SET_ITEMS_STATUS': {
      const t = now();
      const o = state.orders.find((x) => x.id === action.orderId);
      let s = mapOrder(state, action.orderId, (ord) => ({
        ...ord,
        items: ord.items.map((i) =>
          action.itemIds.includes(i.id) ? { ...i, status: action.status, [`${action.status}At`]: t } : i
        ),
      }));
      // "Pishirishda ayirish" sozlamasi yoqilgan bo'lsa, taom "Tayyorlanmoqda"ga o'tganda ombordan darhol ayiriladi
      if (action.status === 'cooking' && state.settings.stockDeductAt === 'cooking' && o) {
        action.itemIds.forEach((itemId) => {
          const item = o.items.find((i) => i.id === itemId);
          if (!item || item.stockDeducted) return;
          const m = s.menu.find((x) => x.id === item.menuId);
          (m?.recipe || []).forEach((rc) => {
            s = applyStock(s, rc.ingredientId, -rc.qty * item.qty, 'sale', `Pishirish #${o.number}`, o.id);
          });
          s = mapOrder(s, action.orderId, (ord) => ({
            ...ord,
            items: ord.items.map((i) => (i.id === itemId ? { ...i, stockDeducted: true } : i)),
          }));
        });
      }
      return s;
    }
    case 'REMOVE_ITEM': {
      const o = state.orders.find((x) => x.id === action.orderId);
      const it = o?.items.find((i) => i.id === action.itemId);
      const s = mapOrder(state, action.orderId, (ord) => ({
        ...ord,
        items: ord.items.map((i) => (i.id === action.itemId ? { ...i, status: 'cancelled' } : i)),
      }));
      const wasteNote = it?.stockDeducted ? " — ishlatilgan ingredientlar isrof hisoblanadi (tayyorlangan edi)" : '';
      const reasonNote = action.reason ? ` · Sabab: ${action.reason}` : '';
      return log(s, 'order', 'Pozitsiya bekor qilindi', `#${o?.number} · ${it?.name}${wasteNote}${reasonNote}`);
    }
    case 'MARK_PRINTED':
      return mapOrder(state, action.orderId, (o) => ({ ...o, printCount: (o.printCount || 0) + 1 }));

    case 'UPDATE_ORDER':
      return mapOrder(state, action.orderId, (o) => ({ ...o, ...action.patch }));

    case 'MOVE_ORDER': {
      const o = state.orders.find((x) => x.id === action.orderId);
      const from = state.tables.find((t) => t.id === o?.tableId);
      const to = state.tables.find((t) => t.id === action.tableId);
      return log(
        mapOrder(state, action.orderId, (ord) => ({ ...ord, tableId: action.tableId })),
        'order',
        "Stol o'zgartirildi",
        `#${o?.number} · ${from?.name || '-'} → ${to?.name}`
      );
    }
    case 'PAY_ORDER': {
      const o = state.orders.find((x) => x.id === action.orderId);
      if (!o || o.status !== 'open' || !state.currentShift) return state;
      const discount = action.discount ?? o.discount ?? 0;
      const tip = action.tip || 0;
      const c = calcOrder({ ...o, discount, tip }, state.settings);
      const pointsUsed = Math.min(action.pointsUsed || 0, c.total);
      const total = Math.max(0, (action.roundedTotal ?? c.total) - pointsUsed);
      const t = now();
      const payment =
        action.method === 'mixed'
          ? { method: 'mixed', splits: action.splits || [], received: total }
          : { method: action.method, received: action.received || total };
      let s = mapOrder(state, o.id, (ord) => ({
        ...ord,
        status: 'paid',
        paidAt: t,
        discount,
        subtotal: c.subtotal,
        discountAmount: c.discountAmount,
        service: c.service,
        deliveryFee: c.deliveryFee,
        vat: c.vat,
        tip,
        pointsUsed,
        total,
        payment,
        cashierId: state.user?.id || null,
        shiftId: state.currentShift?.id || null,
        billRequested: false,
      }));
      if (action.method === 'credit' && o.customerId) {
        s = { ...s, customers: s.customers.map((cu) => (cu.id === o.customerId ? { ...cu, debt: (cu.debt || 0) + total } : cu)) };
      }
      // Retsept bo'yicha ombordan avtomatik ayirish (pishirishda allaqachon ayirilganlar bundan mustasno)
      const need = {};
      o.items
        .filter((i) => i.status !== 'cancelled' && !i.stockDeducted)
        .forEach((i) => {
          const m = state.menu.find((x) => x.id === i.menuId);
          (m?.recipe || []).forEach((rc) => {
            need[rc.ingredientId] = (need[rc.ingredientId] || 0) + rc.qty * i.qty;
          });
        });
      Object.entries(need).forEach(([id, q]) => {
        s = applyStock(s, id, -q, 'sale', `Sotuv #${o.number}`, o.id);
      });
      // Loyalty ballari (sarflangan summa asosida, ishlatilgan ballar ayirib tashlanadi)
      if (o.customerId) {
        const pts = Math.floor((total * (state.settings.loyalty.pointsRate || 0)) / 100);
        s = {
          ...s,
          customers: s.customers.map((cu) =>
            cu.id === o.customerId
              ? { ...cu, points: Math.max(0, cu.points - pointsUsed) + pts, totalSpent: cu.totalSpent + total, visits: cu.visits + 1, lastVisit: t }
              : cu
          ),
        };
      }
      const pointsNote = pointsUsed ? ` · ${fmtNum(pointsUsed)} ball ishlatildi` : '';
      return log(s, 'payment', "To'lov qabul qilindi", `#${o.number} · ${fmtNum(total)} so'm · ${PAYMENT_LABELS[action.method] || action.method}${pointsNote}`);
    }
    case 'CANCEL_ORDER': {
      const o = state.orders.find((x) => x.id === action.orderId);
      return log(
        mapOrder(state, action.orderId, (ord) => ({ ...ord, status: 'cancelled', cancelReason: action.reason || '', cancelledAt: now() })),
        'order',
        'Buyurtma bekor qilindi',
        `#${o?.number}${action.reason ? ' · ' + action.reason : ''}`
      );
    }
    case 'REFUND_ORDER': {
      const o = state.orders.find((x) => x.id === action.orderId);
      if (!o || o.status !== 'paid') return state;
      let s = mapOrder(state, action.orderId, (ord) => ({ ...ord, status: 'refunded', refundReason: action.reason || '', refundedAt: now() }));
      // Haqiqiy taomga aylanmagan (hali ishlatilmagan) ingredientlarni omborga qaytarish
      o.items
        .filter((i) => i.status !== 'cancelled' && i.status !== 'refunded' && !i.stockDeducted)
        .forEach((i) => {
          const m = state.menu.find((x) => x.id === i.menuId);
          (m?.recipe || []).forEach((rc) => {
            s = applyStock(s, rc.ingredientId, rc.qty * i.qty, 'refund', `Qaytarish #${o.number}`, o.id);
          });
        });
      // Mijozga yozilgan bonus ball va jami xaridni qaytarish
      if (o.customerId) {
        const pts = Math.floor((o.total * (state.settings.loyalty.pointsRate || 0)) / 100);
        s = {
          ...s,
          customers: s.customers.map((cu) =>
            cu.id === o.customerId
              ? { ...cu, points: Math.max(0, cu.points - pts), totalSpent: Math.max(0, cu.totalSpent - o.total), visits: Math.max(0, cu.visits - 1) }
              : cu
          ),
        };
      }
      return log(s, 'payment', "To'lov qaytarildi", `#${o.number} · ${fmtNum(o.total)} so'm${action.reason ? ' · ' + action.reason : ''}`);
    }
    case 'PARTIAL_REFUND': {
      const o = state.orders.find((x) => x.id === action.orderId);
      const item = o?.items.find((i) => i.id === action.itemId);
      if (!o || !item || o.status !== 'paid' || item.status === 'cancelled' || item.status === 'refunded') return state;
      const itemSum = item.price * item.qty;
      let s = mapOrder(state, action.orderId, (ord) => ({
        ...ord,
        items: ord.items.map((i) => (i.id === action.itemId ? { ...i, status: 'refunded', refundReason: action.reason || '' } : i)),
      }));
      if (!item.stockDeducted) {
        const m = state.menu.find((x) => x.id === item.menuId);
        (m?.recipe || []).forEach((rc) => {
          s = applyStock(s, rc.ingredientId, rc.qty * item.qty, 'refund', `Qisman qaytarish #${o.number}`, o.id);
        });
      }
      // Qolgan faol pozitsiyalar asosida summalarni qayta hisoblash
      const updatedOrder = s.orders.find((x) => x.id === action.orderId);
      const c = calcOrder(updatedOrder, s.settings);
      s = mapOrder(s, action.orderId, (ord) => ({
        ...ord,
        subtotal: c.subtotal,
        discountAmount: c.discountAmount,
        service: c.service,
        vat: c.vat,
        total: c.total,
      }));
      if (o.customerId) {
        const pts = Math.floor((itemSum * (s.settings.loyalty.pointsRate || 0)) / 100);
        s = {
          ...s,
          customers: s.customers.map((cu) =>
            cu.id === o.customerId
              ? { ...cu, points: Math.max(0, cu.points - pts), totalSpent: Math.max(0, cu.totalSpent - itemSum) }
              : cu
          ),
        };
      }
      return log(s, 'payment', 'Pozitsiya qisman qaytarildi', `#${o.number} · ${item.name} · ${fmtNum(itemSum)} so'm${action.reason ? ' · ' + action.reason : ''}`);
    }
    case 'SET_ONLINE_STATUS': {
      const o = state.orders.find((x) => x.id === action.orderId);
      const t = now();
      const s = mapOrder(state, action.orderId, (ord) => ({
        ...ord,
        onlineStatus: action.status,
        status: action.status === 'rejected' ? 'cancelled' : ord.status,
        items:
          action.status === 'accepted'
            ? ord.items.map((i) => (i.status === 'pending' ? { ...i, status: 'new', addedAt: t } : i))
            : ord.items,
      }));
      return log(s, 'order', 'Onlayn buyurtma holati', `#${o?.number} → ${ONLINE_STATUS[action.status]?.label}`);
    }

    // ---------- Menyu ----------
    case 'SAVE_MENU_ITEM': {
      const isNew = !state.menu.some((m) => m.id === action.item.id);
      return log({ ...state, menu: upsert(state.menu, action.item) }, 'menu', isNew ? "Taom qo'shildi" : 'Taom tahrirlandi', action.item.name);
    }
    case 'DELETE_MENU_ITEM': {
      const m = state.menu.find((x) => x.id === action.id);
      return log(
        { ...state, menu: state.menu.map((x) => (x.id === action.id ? { ...x, archived: true, available: false } : x)) },
        'menu',
        "Taom arxivlandi",
        `${m?.name} — ${fmtNum(m?.price)} so'm`
      );
    }
    case 'SAVE_CATEGORY':
      return log({ ...state, categories: upsert(state.categories, action.category) }, 'menu', 'Kategoriya saqlandi', action.category.name);
    case 'DELETE_CATEGORY': {
      const c = state.categories.find((x) => x.id === action.id);
      const itemsInCat = state.menu.filter((m) => m.categoryId === action.id && !m.archived).length;
      return log(
        { ...state, categories: state.categories.filter((x) => x.id !== action.id) },
        'menu',
        "Kategoriya o'chirildi",
        `${c?.name}${itemsInCat ? ` — ${itemsInCat} ta taom shu kategoriyada edi` : ''}`
      );
    }
    case 'TOGGLE_STATION':
      return { ...state, stations: state.stations.map((s) => (s.id === action.id ? { ...s, active: !s.active } : s)) };

    // ---------- Ombor ----------
    case 'SAVE_INGREDIENT': {
      const isNew = !state.inventory.some((i) => i.id === action.item.id);
      return log({ ...state, inventory: upsert(state.inventory, action.item) }, 'inventory', isNew ? "Mahsulot qo'shildi" : 'Mahsulot tahrirlandi', action.item.name);
    }
    case 'STOCK_MOVE': {
      const ing = state.inventory.find((i) => i.id === action.ingredientId);
      if (!ing) return state;
      const delta = action.moveType === 'in' ? +action.qty : -action.qty;
      const label = action.moveType === 'in' ? 'Kirim' : action.moveType === 'waste' ? 'Isrof' : 'Chiqim';
      return log(applyStock(state, ing.id, delta, action.moveType, action.note), 'inventory', label, `${ing.name}: ${action.qty} ${ing.unit}`);
    }
    case 'INVENTORY_COUNT': {
      let s = state;
      let n = 0;
      Object.entries(action.counts).forEach(([id, actual]) => {
        const ing = s.inventory.find((i) => i.id === id);
        if (ing && actual !== '' && !Number.isNaN(+actual) && +actual !== ing.qty) {
          s = applyStock(s, id, +actual - ing.qty, 'adjust', 'Inventarizatsiya');
          n += 1;
        }
      });
      return log(s, 'inventory', 'Inventarizatsiya', `${n} ta mahsulot tuzatildi`);
    }

    // ---------- Xodimlar ----------
    case 'SAVE_STAFF': {
      const isNew = !state.staff.some((s) => s.id === action.item.id);
      return log({ ...state, staff: upsert(state.staff, action.item) }, 'staff', isNew ? "Xodim qo'shildi" : 'Xodim tahrirlandi', action.item.name);
    }
    case 'DELETE_STAFF': {
      const st = state.staff.find((s) => s.id === action.id);
      return log(
        { ...state, staff: state.staff.map((s) => (s.id === action.id ? { ...s, archived: true, status: 'inactive' } : s)) },
        'staff',
        'Xodim arxivlandi',
        `${st?.name} — ${st?.role || ''}`
      );
    }

    // ---------- Xaridlar ----------
    case 'SAVE_SUPPLIER':
      return log({ ...state, suppliers: upsert(state.suppliers, action.item) }, 'inventory', 'Yetkazib beruvchi saqlandi', action.item.name);
    case 'CREATE_PURCHASE': {
      const number = state.purchaseSeq + 1;
      const total = action.purchase.items.reduce((s, i) => s + i.qty * i.price, 0);
      const p = { ...action.purchase, id: uid(), number, createdAt: now(), status: 'ordered', paid: 0, total };
      const sup = state.suppliers.find((x) => x.id === p.supplierId);
      return log({ ...state, purchaseSeq: number, purchases: [p, ...state.purchases] }, 'inventory', 'Xarid buyurtmasi', `#${number} · ${sup?.name} · ${fmtNum(total)} so'm`);
    }
    case 'RECEIVE_PURCHASE': {
      const p = state.purchases.find((x) => x.id === action.id);
      if (!p || !['ordered', 'received'].includes(p.status)) return state;
      // action.qtyByIngredient bo'lsa — qisman qabul; bo'lmasa, qolgan hammasi to'liq qabul qilinadi
      const received = action.qtyByIngredient || Object.fromEntries(p.items.map((i) => [i.ingredientId, i.qty - (i.receivedQty || 0)]));
      let s = state;
      const items = p.items.map((i) => {
        const add = Math.max(0, Math.min(+received[i.ingredientId] || 0, i.qty - (i.receivedQty || 0)));
        if (add > 0) {
          s = applyStock(s, i.ingredientId, add, 'in', `Xarid #${p.number}`, p.id);
          s = { ...s, inventory: s.inventory.map((ing) => (ing.id === i.ingredientId ? { ...ing, cost: i.price } : ing)) };
        }
        return { ...i, receivedQty: (i.receivedQty || 0) + add };
      });
      const fullyReceived = items.every((i) => i.receivedQty >= i.qty);
      const status = fullyReceived ? (p.paid >= p.total ? 'paid' : 'received') : p.status;
      s = {
        ...s,
        purchases: s.purchases.map((x) => (x.id === p.id ? { ...x, items, status, receivedAt: fullyReceived ? now() : x.receivedAt, partialReceive: !fullyReceived } : x)),
      };
      return log(s, 'inventory', fullyReceived ? 'Xarid qabul qilindi' : 'Xarid qisman qabul qilindi', `#${p.number} · ${items.length} ta mahsulot`);
    }
    case 'CANCEL_PURCHASE': {
      const p = state.purchases.find((x) => x.id === action.id);
      if (!p || p.status !== 'ordered') return state;
      return log(
        { ...state, purchases: state.purchases.map((x) => (x.id === p.id ? { ...x, status: 'cancelled', cancelledAt: now() } : x)) },
        'inventory',
        'Xarid bekor qilindi',
        `#${p.number}`
      );
    }
    case 'UPDATE_PURCHASE': {
      const p = state.purchases.find((x) => x.id === action.id);
      if (!p || p.status !== 'ordered') return state;
      const total = action.items.reduce((s, i) => s + i.qty * i.price, 0);
      return log(
        { ...state, purchases: state.purchases.map((x) => (x.id === p.id ? { ...x, items: action.items, total } : x)) },
        'inventory',
        'Xarid buyurtmasi tahrirlandi',
        `#${p.number}`
      );
    }
    case 'PAY_PURCHASE': {
      const p = state.purchases.find((x) => x.id === action.id);
      if (!p) return state;
      if (p.status === 'cancelled') return state;
      const amount = Math.min(+action.amount, p.total - p.paid);
      if (amount <= 0) return state;
      const sup = state.suppliers.find((x) => x.id === p.supplierId);
      const s = {
        ...state,
        purchases: state.purchases.map((x) => {
          if (x.id !== p.id) return x;
          const paid = x.paid + amount;
          return { ...x, paid, status: paid >= x.total && x.status !== 'ordered' ? 'paid' : x.status };
        }),
        expenses: [
          { id: uid(), category: 'Xarid', amount, note: `Xarid #${p.number} · ${sup?.name}`, date: now(), userName: state.user?.name },
          ...state.expenses,
        ],
      };
      return log(s, 'finance', "Yetkazib beruvchiga to'lov", `#${p.number} · ${sup?.name} · ${fmtNum(amount)} so'm`);
    }

    // ---------- CRM ----------
    case 'SAVE_CUSTOMER': {
      const isNew = !state.customers.some((c) => c.id === action.item.id);
      return log({ ...state, customers: upsert(state.customers, action.item) }, 'crm', isNew ? "Mijoz qo'shildi" : 'Mijoz tahrirlandi', action.item.name);
    }
    case 'PAY_DEBT': {
      const cu = state.customers.find((c) => c.id === action.customerId);
      if (!cu || !cu.debt) return state;
      const amount = Math.min(+action.amount || 0, cu.debt);
      if (amount <= 0) return state;
      const s = {
        ...state,
        customers: state.customers.map((c) => (c.id === cu.id ? { ...c, debt: +(c.debt - amount).toFixed(2) } : c)),
      };
      return log(s, 'finance', "Nasiya to'landi", `${cu.name} · ${fmtNum(amount)} so'm`);
    }
    case 'SAVE_CAMPAIGN':
      return log({ ...state, campaigns: upsert(state.campaigns, action.item) }, 'crm', 'Kampaniya saqlandi', action.item.name);
    case 'DELETE_CAMPAIGN': {
      const camp = state.campaigns.find((c) => c.id === action.id);
      return log({ ...state, campaigns: state.campaigns.filter((c) => c.id !== action.id) }, 'crm', "Kampaniya o'chirildi", camp?.name);
    }

    // ---------- Bronlar ----------
    case 'SAVE_RESERVATION': {
      const isNew = !state.reservations.some((r) => r.id === action.item.id);
      return log(
        { ...state, reservations: upsert(state.reservations, action.item) },
        'reservation',
        isNew ? 'Bron qilindi' : 'Bron tahrirlandi',
        `${action.item.name} · ${action.item.date} ${action.item.time} · ${action.item.guests} kishi`
      );
    }
    case 'SET_RESERVATION_STATUS': {
      const r = state.reservations.find((x) => x.id === action.id);
      let s = { ...state, reservations: state.reservations.map((x) => (x.id === action.id ? { ...x, status: action.status } : x)) };
      // "Keldi" bosilganda, stolda ochiq buyurtma bo'lmasa — avtomatik ochiladi
      if (action.status === 'seated' && r) {
        const hasOpenOrder = s.orders.some((o) => o.tableId === r.tableId && o.status === 'open');
        if (!hasOpenOrder) {
          const number = s.orderSeq + 1;
          const customer = s.customers.find((c) => c.phone.replace(/\D/g, '') === r.phone.replace(/\D/g, ''));
          const order = {
            id: uid(), number, type: 'dine-in', source: 'pos', tableId: r.tableId,
            customerId: customer?.id || null, waiterId: null, guests: r.guests, discount: 0,
            status: 'open', createdAt: now(), branchId: s.branchId, items: [], reservationId: r.id,
          };
          s = { ...s, orderSeq: number, orders: [order, ...s.orders] };
        }
      }
      return log(s, 'reservation', 'Bron holati', `${r?.name} → ${RES_STATUS[action.status]?.label}`);
    }

    // ---------- Filiallar ----------
    case 'SAVE_BRANCH':
      return log({ ...state, branches: upsert(state.branches, action.item) }, 'settings', 'Filial saqlandi', action.item.name);

    // ---------- Smena / Moliya ----------
    case 'OPEN_SHIFT': {
      if (state.currentShift) return state;
      const sh = { id: uid(), cashierId: state.user?.id, cashierName: state.user?.name, openedAt: now(), openingCash: +action.openingCash || 0, cashMovements: [] };
      return log({ ...state, currentShift: sh }, 'finance', 'Smena ochildi', `Boshlang'ich kassa: ${fmtNum(sh.openingCash)} so'm`);
    }
    case 'CASH_MOVEMENT': {
      if (!state.currentShift) return state;
      const delta = action.moveType === 'in' ? +action.amount : -action.amount;
      if (!delta) return state;
      const mv = { id: uid(), at: now(), type: action.moveType, amount: Math.abs(delta), note: action.note || '', userName: state.user?.name };
      const sh = { ...state.currentShift, cashMovements: [...(state.currentShift.cashMovements || []), mv] };
      return log(
        { ...state, currentShift: sh },
        'finance',
        action.moveType === 'in' ? 'Kassaga kirim (inkassatsiya)' : 'Kassadan chiqim',
        `${fmtNum(Math.abs(delta))} so'm${action.note ? ' · ' + action.note : ''}`
      );
    }
    case 'CLOSE_SHIFT': {
      const sh = state.currentShift;
      if (!sh) return state;
      const list = state.orders.filter((o) => o.shiftId === sh.id && (o.status === 'paid' || o.status === 'refunded'));
      const byMethod = {};
      let total = 0;
      let refunds = 0;
      let cashRefunds = 0;
      list.forEach((o) => {
        const parts = o.payment.method === 'mixed' ? o.payment.splits : [{ method: o.payment.method, amount: o.total }];
        parts.forEach((p) => { byMethod[p.method] = (byMethod[p.method] || 0) + p.amount; });
        total += o.total;
        if (o.status === 'refunded') {
          refunds += o.total;
          if (o.payment.method === 'cash') cashRefunds += o.total;
        }
      });
      const cashIn = (sh.cashMovements || []).filter((m) => m.type === 'in').reduce((s, m) => s + m.amount, 0);
      const cashOut = (sh.cashMovements || []).filter((m) => m.type === 'out').reduce((s, m) => s + m.amount, 0);
      const expectedCash = sh.openingCash + (byMethod.cash || 0) - cashRefunds + cashIn - cashOut;
      const countedCash = +action.countedCash || 0;
      const closed = { ...sh, closedAt: now(), ordersCount: list.length, total, refunds, byMethod, cashIn, cashOut, expectedCash, countedCash, difference: countedCash - expectedCash };
      return log({ ...state, currentShift: null, shifts: [closed, ...state.shifts] }, 'finance', 'Smena yopildi', `Savdo: ${fmtNum(total)} so'm · Farq: ${fmtNum(closed.difference)} so'm`);
    }
    case 'ADD_EXPENSE': {
      const e = { ...action.item, id: uid(), date: action.item.date || now(), userName: state.user?.name };
      return log({ ...state, expenses: [e, ...state.expenses] }, 'finance', "Xarajat qo'shildi", `${e.category} · ${fmtNum(e.amount)} so'm`);
    }
    case 'DELETE_EXPENSE': {
      const exp = state.expenses.find((e) => e.id === action.id);
      return log(
        { ...state, expenses: state.expenses.filter((e) => e.id !== action.id) },
        'finance',
        "Xarajat o'chirildi",
        exp ? `${exp.category} — ${fmtNum(exp.amount)} so'm — ${exp.note || ''}` : ''
      );
    }

    // ---------- Sozlamalar ----------
    case 'UPDATE_SETTINGS':
      return log({ ...state, settings: { ...state.settings, ...action.patch } }, 'settings', 'Sozlamalar yangilandi', Object.keys(action.patch).join(', '));
    case 'SAVE_TENANT':
      return log({ ...state, tenants: upsert(state.tenants, action.item) }, 'settings', 'Restoran (SaaS) saqlandi', action.item.name);

    default:
      return state;
  }
}
