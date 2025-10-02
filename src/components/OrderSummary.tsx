// src/components/OrderSummary.tsx
import { ArrowRight } from "lucide-react";

// Helper untuk format Rupiah
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper untuk format Tanggal dan Waktu
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
}

// Tipe untuk props 'order'
interface Order {
    totalPrice: number;
    train: { name: string; number: string; class: string; subclass: string; };
    passengers: { name: string; type: string; price: number; }[];
    discounts: { name: string; amount: number; }[];
    trip: { origin: string; destination: string; departure: string; arrival: string; };
    seat: { wagon: string; number: string; };
}

interface OrderSummaryProps {
    order: Order;
}

export default function OrderSummary({ order }: OrderSummaryProps) {
  const totalPassengers = order.passengers.length;

  return (
    <div className="w-full max-w-sm mx-auto shadow-xl border border-slate-200/60 overflow-hidden rounded-xl">
      {/* Header Biru */}
      <div className="bg-blue-500 text-white p-5">
        <h2 className="text-2xl font-bold">Total {formatCurrency(order.totalPrice)}</h2>
      </div>

      {/* Konten Putih */}
      <div className="space-y-4 bg-white text-slate-800 p-5">
        
        {/* Detail Kereta */}
        <div>
          <h3 className="font-bold text-base text-slate-900">{order.train.name} ({order.train.number})</h3>
          <p className="text-sm text-slate-500">{order.train.class} - {order.train.subclass}</p>
        </div>

        {/* Detail Harga */}
        <div className="border-t border-slate-200/80 pt-4 space-y-1">
          {order.passengers.map((p, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span>{`1 ${p.type}`}</span>
              <span className="font-medium">{formatCurrency(p.price)}</span>
            </div>
          ))}
          {order.discounts.map((d, index) => (
             <div key={index} className="flex justify-between text-sm text-slate-500">
                <span>{d.name}</span>
                <span>{formatCurrency(d.amount)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold pt-2 text-base">
            <span>Harga Total</span>
            <span>{formatCurrency(order.totalPrice)}</span>
          </div>
        </div>
        
        {/* Rute Perjalanan */}
        <div className="border-t border-slate-200/80 pt-4 space-y-3">
          <div className="flex items-center justify-between text-center">
            <div>
              <p className="font-bold text-slate-900">{order.trip.origin}</p>
              <p className="text-xs text-slate-500">{formatDate(order.trip.departure)}, {formatTime(order.trip.departure)}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0 mx-2" />
            <div className="text-right">
              <p className="font-bold text-slate-900">{order.trip.destination}</p>
              <p className="text-xs text-slate-500">{formatDate(order.trip.arrival)}, {formatTime(order.trip.arrival)}</p>
            </div>
          </div>
          <div className="text-xs bg-blue-100 text-blue-800 font-semibold py-1 px-2.5 rounded-full w-fit">
            {order.seat.wagon}, {order.seat.number}
          </div>
          {order.passengers.map((p, index) => (
             <p key={index} className="text-sm text-slate-600 font-medium pt-1">{index + 1}. {p.name}</p>
          ))}
        </div>

      </div>
    </div>
  );
}
