# RestroPOS — Restoran boshqaruv tizimi (Frontend)

React 18 + Vite + Tailwind CSS. Barcha 16 modul ishlaydi, ma'lumotlar `localStorage`da saqlanadi (backend ulash uchun tayyor tuzilma).

## Ishga tushirish

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build -> dist/
```

**Kirish:** istalgan xodimni tanlang, PIN — `1111`.

## Modullar

| # | Modul | Yo'l | Rollar |
|---|-------|------|--------|
| 1 | Management Dashboard | `/` | admin, manager |
| 2 | POS — Kassa terminali | `/pos` | admin, manager, cashier |
| 3 | Ofitsiant paneli | `/waiter` | admin, manager, waiter |
| 4 | Oshxona (KDS) | `/kitchen` | admin, manager, chef |
| 5 | Ombor (Inventory) | `/inventory` | admin, manager, warehouse, chef |
| 6 | Xodimlar va rollar | `/staff` | admin, manager |
| 7 | Moliya va hisobotlar | `/finance` | admin, manager |
| 8 | Onlayn buyurtmalar & QR menyu | `/online`, `/qr/:tableId` | admin, manager, cashier |
| 9 | Menyu boshqaruvi | `/menu` | admin, manager, chef |
| 10 | Xaridlar (Purchasing) | `/purchasing` | admin, manager, warehouse |
| 11 | CRM & Loyalty | `/crm` | admin, manager, cashier |
| 12 | Bronlar (Reservations) | `/reservations` | admin, manager, cashier, waiter |
| 13 | Oshxona va bar stansiyalari | `/stations` | admin, manager, chef |
| 14 | Filiallar | `/branches` | admin |
| 15 | Audit loglar | `/audit` | admin, manager |
| 16 | Sozlamalar & SaaS (Super Admin) | `/settings` | admin |
| + | Kassir (smena, to'lov, qaytarish) | `/cashier` | admin, manager, cashier |

## Asosiy oqim

1. **POS / Ofitsiant / QR** buyurtma yaratadi → pozitsiyalar oshxonaga "Yangi" holatida tushadi.
2. **KDS**: Yangi → Tayyorlanmoqda → Tayyor → Berildi (stansiya bo'yicha filtr, kechikish ogohlantirishi).
3. **Kassir**: smena ochadi, to'lov qabul qiladi (naqd/karta/Click/Payme, chegirma, qaytim, chek chop etish).
4. To'lovdan keyin **retsept bo'yicha ombordan avtomatik ayiriladi**, mijozga bonus ball yoziladi.
5. Har bir amal **audit log**ga yoziladi.
6. Bir nechta tab ochilsa (masalan KDS ekrani va QR menyu) ma'lumotlar real vaqtda sinxronlanadi.

## Tuzilma

```
src/
├── App.jsx                 # Routing + rol bo'yicha himoya
├── main.jsx
├── index.css               # Tailwind + umumiy klasslar (.card, .input, .tbl)
├── context/
│   ├── AppContext.jsx      # Global state (useReducer + localStorage + tab sinxroni)
│   ├── reducer.js          # Barcha biznes-logika (buyurtma, to'lov, ombor, smena...)
│   └── ToastContext.jsx
├── data/
│   ├── mockData.js         # Demo ma'lumotlar (30 kunlik savdo tarixi bilan)
│   ├── navigation.js       # Menyu, rollar, ruxsatlar
│   └── labels.js           # Status va yorliqlar
├── components/
│   ├── layout/             # Sidebar, Topbar, Layout
│   ├── orders/             # PaymentModal, Receipt, MenuPicker
│   └── ui/                 # Button, Badge, Modal, Tabs, StatCard, ...
├── hooks/useNow.js
├── utils/                  # format (pul, sana, calcOrder), tables
└── pages/                  # 19 ta sahifa
```

## Backend ulash

Barcha o'zgarishlar `context/reducer.js` dagi action'lar orqali o'tadi (`CREATE_ORDER`, `PAY_ORDER`, `STOCK_MOVE`, ...). Backend ulashda shu action'larni API chaqiruvlariga (masalan, `api/orders.js`) almashtirish va `mockData.js` o'rniga serverdan yuklash yetarli.

Demo ma'lumotlarni tiklash: **Sozlamalar → Demo ma'lumotlarni tiklash**.

## Deploy

`vercel.json` SPA rewrites bilan tayyor — Vercel'ga to'g'ridan-to'g'ri yuklash mumkin.
