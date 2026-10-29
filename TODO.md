# RestroPOS — to'liq ishlar ro'yxati (backend'siz)

> Progress tracker. `[x]` = bajarildi va tekshirildi, `[~]` = qisman/boshqa shaklda bajarildi (izoh bilan), `[ ]` = hali yo'q.
> Backend, json-server yoki tashqi API ishlatilmaydi — hammasi localStorage/IndexedDB'da.

## 1. Ma'lumot saqlash
- [ ] localStorage o'rniga IndexedDB (Dexie) — qasddan keyinga qoldirildi, pastdagi izohga qarang
- [x] Versiya migratsiyasi — yangilanishda ma'lumot o'chmasin (`AppContext.migrate()`, eski maydonlar saqlanadi)
- [x] JSON zaxira: eksport/import
- [ ] + kunlik avtomatik backup
- [x] Eski buyurtmalarni arxivlash (Sozlamalar → Zaxira nusxa, 90+ kunlik yopiq buyurtmalar)
- [x] BroadcastChannel tab sinxroni, bir vaqtda yozish konflikti (`savedAt` bo'yicha eskirgan yozuv e'tiborsiz qoldiriladi)
- [x] Saqlashda xato bo'lsa ogohlantirish (QuotaExceededError → toast)
- [~] Filiallar bo'yicha ma'lumotni ajratish — Dashboard, POS, Kitchen filtrlangan; Cashier/Waiter/Finance/CRM hali yo'q
- [x] Xodim, taomni o'chirish o'rniga arxivlash (mijozda delete action umuman yo'q edi)
- [x] Audit logni cheklovsiz saqlash, o'chirishlarda to'liq tafsilot
- [x] POS savati sahifa yangilanganda saqlanib qolishi (8 soat amal qiladi)
- [x] Qurilma soati orqaga ketsa aniqlash (5+ daqiqa orqaga ketsa ogohlantirish)

## 2. Pul va hisob-kitob
- [x] QQS 12% (sozlanadigan, chekda alohida qator) — Sozlamalar → Chek va soliq
- [x] Naqdni 100/500/1000 ga yaxlitlash (sozlanadigan, faqat naqd to'lovda)
- [ ] Taom bo'yicha chegirma
- [ ] Rol bo'yicha chegirma limiti
- [x] Qaytarishda bonus ball va jami xarid ham qaytishi (to'liq va qisman qaytarishda ham, brauzerda tasdiqlandi)
- [x] Qisman qaytarish (bitta taom) — Kassir → qisman qaytarish oynasi, ombor ham tiklanadi
- [x] Qaytarish joriy smenaga yozilishi (allaqachon shiftId orqali edi)
- [x] Smena ochilmasa to'lovni bloklash
- [x] Aralash to'lov (naqd + karta, istalgan usullar kombinatsiyasi) — To'lov oynasida "Aralash" turi
- [~] Hisobni bo'lish — teng bo'lish kalkulyatori bor (kishi boshiga summa), taom bo'yicha bo'lish yo'q
- [x] Bonus ball bilan to'lash (chegirmadan keyingi summadan ayiriladi)
- [x] Kampaniyalarni avtomatik qo'llash (faol va sana oralig'idagi kampaniya taklif qilinadi)
- [ ] Xizmat haqini buyurtma ochilganda qotirish
- [x] Naqdda "berilgan summa" majburiy
- [x] Choy puli (tips) — chekda alohida qator, smena hisobotiga kiradi
- [x] Smena davomida kassaga kirim/chiqim (inkassatsiya) — Kassir panelida Kirim/Chiqim tugmalari
- [x] Nasiya (mijoz qarzi) — to'lov turi sifatida, mijoz balansida kuzatiladi
- [ ] Tannarx (COGS) va haqiqiy foyda — Menu.jsx'da taom darajasida bor, umumiy hisobotda yo'q
- [x] X-hisobot va Z-hisobot — X endi smena yopmasdan ko'rish, Z smena yopilganda
- [x] Kunlik chek raqamlash, qayta chop etishda "NUSXA" belgisi

## 3. Buyurtma, zal, POS
- [ ] Variantlar (o'lcham) va modifikatorlar (qo'shimcha narx bilan)
- [ ] Combo / set menyu
- [x] Bitta taomga turli izohlar (alohida qator) — izohli va izohsiz qatorlar birlashmaydi, har biriga alohida izoh yozish mumkin edi
- [ ] Kurslar bo'yicha yuborish (oldin salat, keyin issiq)
- [ ] Stollarni birlashtirish
- [ ] Zal xaritasi muharriri: stol/zona qo'shish, drag & drop
- [~] Bitta stolda ikkita ochiq buyurtma muammosini hal qilish — POS/Waiter mavjud buyurtmaga qo'shadi, lekin reducer darajasida qattiq cheklov yo'q
- [x] Mehmonlar sonini o'zgartirish (Ofitsiant panelida +/- tugmalari)
- [x] Ofitsiant faqat o'z stollarini ko'rishi (sozlama) — Sozlamalar → Restoran
- [x] Pozitsiyani bekor qilishda sabab va tasdiq (Ofitsiant panelida)
- [x] Hisob so'ralgandan keyin taom qo'shilsa holat yangilanishi (billRequested avtomatik tozalanadi)
- [x] Chek raqami bo'yicha buyurtma qidirish va havola (Kassir → "Bugungi to'lovlar" qidiruv maydoni)
- [ ] Telefon orqali buyurtma va kuryerlar boshqaruvi
- [x] Shtrix-kod skaner va hotkey'lar

## 4. Oshxona (KDS)
- [x] Yangi buyurtmada ovozli signal
- [ ] "Tayyor"da qolib ketgan buyurtmalarni avtomatik yopish
- [x] Katta shrift / TV rejimi
- [x] Xato bosilgan bosqichni orqaga qaytarish (undo)
- [ ] Tayyorlash vaqti statistikasi (taom va stansiya bo'yicha)
- [x] Stop-list (qo'lda allaqachon bor edi; endi ingredient tugasa avtomatik, qo'lda ochilganda flag tozalanadi)
- [x] Stansiya bo'yicha oshxona tiketini chop etish (har bir tiket uchun alohida)

## 5. Ombor
- [x] Yetishmasa ogohlantirish (bor edi), manfiy qoldiqni ko'rsatish (endi 0'ga qisilmaydi)
- [ ] O'lchov birligi konvertatsiyasi (g ↔ kg, ml ↔ l)
- [x] Ayirish vaqtini sozlash (pishirilganda yoki to'lovda); bekor qilingan pishgan taom izohda "isrof" deb belgilanadi
- [ ] Yarim tayyor mahsulotlar (sous, xamir) retsepti
- [x] Xaridni qisman qabul qilish, tahrirlash (UPDATE_PURCHASE), bekor qilish (CANCEL_PURCHASE)
- [x] Inventarizatsiya hujjatlari tarixi (Kirim/Chiqim tabida "Tuzatish" filtri orqali)
- [ ] Partiya va yaroqlilik bo'yicha hisob (FIFO)
- [ ] Bir nechta ombor (oshxona, bar)
- [x] Yetkazib beruvchi narxlari tarixi (Yetkazib beruvchilar kartasida soat ikonkasi)

## 6. CRM va bonus
- [x] Telefon takrorlanishini tekshirish
- [x] POS'da mijozni telefon bo'yicha tez qidirish (ism/telefon bo'yicha qidiruvchi combobox)
- [~] Tug'ilgan kun eslatmasi (14 kun oldindan, CRM'da banner); avtomatik chegirma hali yo'q
- [x] Daraja nomlarini tahrirlash
- [x] Segmentlar (uzoq kelmagan, VIP)

## 7. Bronlar
- [x] Depozit (oldindan to'lov) — summasi saqlanadi va ro'yxatda ko'rsatiladi
- [ ] Stollar bandligi vaqt chizig'i (timeline)
- [x] O'tgan sanaga bron bermaslik
- [x] "Kelmadi" (no-show) holati
- [x] "Keldi" bosilganda buyurtma avtomatik ochilishi (mijoz telefon bo'yicha ham bog'lanadi)
- [x] Bron qilingan stolga POS'da ogohlantirish (allaqachon bor edi — getTableStatus)

## 8. Xodimlar
- [x] Rol ruxsatlarini interfeysdan sozlash (Xodimlar → Rollar va ruxsatlar, katakchani bosib yoqish/o'chirish)
- [x] Davomat (kelish/ketish) — login/logout orqali avtomatik yoziladi, "Davomat" tabida ko'rinadi
- [x] Maosh hisoblash (stavka + tips) — "Faoliyat" tabida davr uchun maosh ustuni
- [x] Ish grafigi muharriri (xodim tahrirlash oynasida schedule/workDays)

## 9. Hisobotlar
- [~] PDF va Excel eksport — CSV eksport bor (Moliya, Ombor, Xaridlar, Audit); PDF hali yo'q
- [x] Erkin sana oralig'i (Moliya → Erkin oraliq)
- [x] Menyu ABC tahlili (A/B/C guruhlar, kumulyativ ulush)
- [x] Davrlarni solishtirish (har bir statistik karta oldingi xuddi shu uzunlikdagi davr bilan solishtiriladi)
- [x] Xodim bo'yicha hisobot (Xodimlar → Faoliyat tabida allaqachon bor edi)
- [x] Dashboard tanlangan filial bo'yicha (branchId bo'yicha filtrlangan, Moliyada ham endi shunday)

## 10. Xavfsizlik (frontend darajasida)
- [x] PIN'ni hash qilish (WebCrypto SHA-256, eski ochiq PIN avtomatik ko'chiriladi)
- [x] Urinishlar limiti va vaqtinchalik blok (5 urinish → 60 soniya blok)
- [~] Har xodimga alohida PIN — infratuzilma tayyor (har kim o'z PIN'ini sozlashi mumkin); "1111 ni birinchi kirishda majburiy almashtirish" hali yo'q
- [~] Menejer PIN tasdig'i — qaytarish (refund) va pozitsiyani bekor qilishda bor; katta chegirma uchun hali yo'q
- [x] Faollik bo'lmasa avtomatik chiqish (20 daqiqa, sozlanmaydi hali)
- [x] Xodimni tez almashtirish (Topbar menyusi)
- [ ] Ruxsatni har bir amalda tekshirish (faqat sahifada emas)
- [ ] CSP va xavfsizlik header'lari

## 11. Chop etish va qurilmalar
- [ ] Web Serial/WebUSB orqali termoprinter (ESC/POS)
- [ ] Pul qutisini printer orqali ochish
- [ ] Chek shablonini sozlash (logo, maydonlar)
- [x] QR kod chop etish bugini tuzatish (endi faqat bitta stol QR kodi chop etiladi, butun sahifa emas)
- [ ] Ikkinchi monitorda mijoz ekrani

## 12. UX/UI
- [ ] Taomga rasm yuklash (siqib, IndexedDB'da)
- [ ] Emoji o'rniga ikon/rasm
- [x] Tungi rejim
- [ ] O'zbek (lotin, kirill) va rus tillari
- [ ] Tugmalar kamida 44px
- [ ] Planshet landscape va telefon uchun POS layout
- [ ] Qidiruvda o' / o‘ / o` farqini olib tashlash
- [ ] Forma xatolari maydon ostida, telefon maskasi, pul formatlash
- [x] O'chirishlarda tasdiq (ConfirmDialog allaqachon bor edi) — undo (qaytarish) hali yo'q
- [ ] Manfiy sonlarni bloklash (ba'zi joylarda min=0 bor, hammasida emas)
- [x] alert() o'rniga modal/toast (yagona joy — QRMenu — toastga o'tkazildi)
- [ ] Toastlar sonini cheklash
- [ ] Skeleton va bo'sh holatlar
- [ ] Accessibility: fokus, aria, klaviatura
- [x] 404 sahifa va sahifa sarlavhalari
- [ ] Tab va filtrlar URL'da
- [ ] Saqlanmagan o'zgarish ogohlantirishi
- [ ] Birinchi sozlash ustasi (restoran, stollar, menyu)
- [ ] Menyuni Excel'dan import

## 13. Arxitektura va kod sifati
- [ ] TypeScript
- [ ] Zustand store'lar (slice), selector va memo
- [ ] Ma'lumotni id bo'yicha normalizatsiya
- [ ] Biznes logikani services/ ga ajratish
- [ ] React Hook Form + Zod
- [ ] i18next va Intl formatlash
- [ ] Sahifalarni lazy load, grafik kutubxonani yengillashtirish
- [x] Error Boundary
- [ ] Umumiy Table (saralash, pagination, virtualizatsiya), Combobox, DatePicker
- [ ] Dizayn tokenlari (CSS variables)
- [ ] Bitta global soat (har sahifadagi useNow o'rniga)
- [ ] @/ import alias
- [ ] ESLint, Prettier, Husky
- [ ] Vitest, React Testing Library, Playwright
- [ ] GitHub Actions CI
- [ ] .env konfiguratsiya
- [ ] Storybook

## 14. PWA va ishonchlilik
- [x] Offline ishlash (Service Worker)
- [x] Kompyuter/planshetga o'rnatish
- [x] Yangi versiya chiqqanda xabar (pastki banner, "Yangilash" tugmasi bilan)
- [ ] Shriftni loyiha ichida saqlash (hali Google Fonts CDN'dan)
- [x] Lokal xato jurnali (Sozlamalar → Zaxira nusxa); Sentry ulanishi backend/DSN talab qiladi, qilinmadi

## Izoh: katta arxitektura qarorlari
13-bo'lim (TypeScript, Zustand, Storybook, Playwright/CI) ishlab turgan ilovani tubdan qayta yozishni talab qiladi.
Bu bandlar boshqa 180 ta funksiya ustida parallel ishlashni beqarorlashtirib qo'yishi mumkin, shuning uchun ular
oxirgi bosqichga qoldirildi va alohida qaror sifatida alohida taqdim etiladi.
