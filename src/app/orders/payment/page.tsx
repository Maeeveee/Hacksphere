// src/pages/paymentPage.tsx
import OrderSummary from "@/components/OrderSummary";
import PaymentOptions from "@/components/PaymentOptions";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// --- DATA DUMMY UNTUK CONTOH ---
const dummyOrderData = {
  totalPrice: 65000,
  train: {
    name: "ARJUNA EKSPRES",
    number: "66F",
    class: "Eksekutif",
    subclass: "AA",
  },
  passengers: [
    { name: "RANGGA PUTRA SYANANDA BUDHI", type: "Dewasa", price: 65000 },
  ],
  discounts: [
    { name: "Discount Channel", amount: 0 },
  ],
  trip: {
    origin: "Malang",
    destination: "Surabaya Gubeng",
    departure: "2025-09-29T05:30:00",
    arrival: "2025-09-29T07:29:00",
  },
  seat: {
    wagon: "EKS-J",
    number: "2C",
  },
};
// ------------------------------------


export default function PaymentPage() {
  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        
        {/* Header Halaman */}
        <div className="flex items-center mb-6">
           <Button variant="outline" className="rounded-full h-10 w-10 p-0 mr-4 bg-white/80 backdrop-blur-sm">
             <ArrowLeft className="h-5 w-5 text-gray-700" />
           </Button>
           <h1 className="text-3xl font-bold text-slate-800">Pembayaran</h1>
        </div>

        {/* Konten Utama */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Kolom Kiri - Opsi Pembayaran */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <PaymentOptions />
          </div>

          {/* Kolom Kanan - Ringkasan Pesanan */}
          <div className="lg:col-span-1 order-1 lg:order-2 sticky top-8">
            <OrderSummary order={dummyOrderData} />
          </div>

        </main>
      </div>
    </div>
  );
}