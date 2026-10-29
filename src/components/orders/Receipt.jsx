import { useApp } from '../../context/AppContext';
import { calcOrder, fmtDateTime, fmtNum } from '../../utils/format';
import { ORDER_TYPES, PAYMENT_LABELS } from '../../data/labels';

export default function Receipt({ order, copy }) {
  const { state } = useApp();
  if (!order) return null;
  const { settings } = state;
  const c = order.total != null
    ? { subtotal: order.subtotal, discountAmount: order.discountAmount || 0, service: order.service || 0, deliveryFee: order.deliveryFee || 0, vat: order.vat || 0, tip: order.tip || 0, total: order.total }
    : calcOrder(order, settings);
  const table = state.tables.find((t) => t.id === order.tableId);
  const cashier = state.staff.find((s) => s.id === order.cashierId);
  const waiter = state.staff.find((s) => s.id === order.waiterId);
  const items = order.items.filter((i) => i.status !== 'cancelled');
  const change = order.payment && order.payment.received > c.total ? order.payment.received - c.total : 0;

  return (
    <div className="print-area font-mono text-[13px] text-slate-800 bg-white">
      <div className="text-center mb-3">
        {(copy ?? (order.printCount || 0) > 0) && (
          <div className="inline-block mb-1 px-3 py-0.5 border-2 border-slate-500 text-slate-600 font-bold text-xs tracking-widest rotate-[-3deg]">NUSXA</div>
        )}
        <div className="font-bold text-base">{settings.restaurantName}</div>
        <div className="text-xs text-slate-500">{settings.address}</div>
        <div className="text-xs text-slate-500">{settings.phone}</div>
        <div className="text-xs mt-1">{settings.receiptHeader}</div>
      </div>
      <div className="border-t border-dashed border-slate-300 py-2 space-y-0.5 text-xs">
        <Row l="Chek" r={`#${order.number}`} />
        <Row l="Sana" r={fmtDateTime(order.paidAt || order.createdAt)} />
        <Row l="Turi" r={ORDER_TYPES[order.type]} />
        {table && <Row l="Stol" r={table.name} />}
        {waiter && <Row l="Ofitsiant" r={waiter.name} />}
        {cashier && <Row l="Kassir" r={cashier.name} />}
      </div>
      <div className="border-t border-dashed border-slate-300 py-2 space-y-1">
        {items.map((i) => (
          <div key={i.id}>
            <div>{i.name}</div>
            <Row l={`  ${i.qty} x ${fmtNum(i.price)}`} r={fmtNum(i.qty * i.price)} />
          </div>
        ))}
      </div>
      <div className="border-t border-dashed border-slate-300 py-2 space-y-0.5">
        <Row l="Oraliq summa" r={fmtNum(c.subtotal)} />
        {c.discountAmount > 0 && <Row l={`Chegirma (${order.discount}%)`} r={`-${fmtNum(c.discountAmount)}`} />}
        {c.service > 0 && <Row l={`Xizmat haqi (${settings.serviceFee}%)`} r={fmtNum(c.service)} />}
        {c.vat > 0 && <Row l={`QQS (${settings.vatRate}%)`} r={fmtNum(c.vat)} />}
        {c.deliveryFee > 0 && <Row l="Yetkazib berish" r={fmtNum(c.deliveryFee)} />}
        {c.tip > 0 && <Row l="Choy puli" r={fmtNum(c.tip)} />}
        {order.pointsUsed > 0 && <Row l="Bonus ball" r={`-${fmtNum(order.pointsUsed)} ball`} />}
        <div className="flex justify-between font-bold text-base pt-1">
          <span>JAMI</span>
          <span>{fmtNum(c.total)} so'm</span>
        </div>
        {order.payment && order.payment.method !== 'mixed' && <Row l="To'lov turi" r={PAYMENT_LABELS[order.payment.method] || order.payment.method} />}
        {order.payment?.method === 'mixed' && order.payment.splits?.map((sp, i) => (
          <Row key={i} l={PAYMENT_LABELS[sp.method] || sp.method} r={fmtNum(sp.amount)} />
        ))}
        {order.payment?.method === 'cash' && order.payment.received > 0 && <Row l="Berildi" r={fmtNum(order.payment.received)} />}
        {change > 0 && <Row l="Qaytim" r={fmtNum(change)} />}
      </div>
      <div className="border-t border-dashed border-slate-300 pt-2 text-center text-xs text-slate-500">{settings.receiptFooter}</div>
    </div>
  );
}

function Row({ l, r }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="whitespace-pre">{l}</span>
      <span className="text-right">{r}</span>
    </div>
  );
}
