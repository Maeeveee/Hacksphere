// src/components/PaymentOptions.tsx
"use client";

import { useState } from 'react';
import PaymentItem from './PaymentItem';
import { Card, CardContent } from './ui/card';

// --- DATA DUMMY UNTUK CONTOH ---
const paymentMethods = {
    atm: [
        { bankName: 'BNI' as const, logoSrc: 'https://placehold.co/100x30/005A9E/FFFFFF?text=BNI&font=sans' },
        { bankName: 'BRI' as const, logoSrc: 'https://placehold.co/100x30/00529C/FFFFFF?text=BRI&font=sans' },
        { bankName: 'Mandiri' as const, logoSrc: 'https://placehold.co/100x30/003D79/FFFFFF?text=Mandiri&font=sans' },
        { bankName: 'BTN' as const, logoSrc: 'https://placehold.co/100x30/00A79D/FFFFFF?text=BTN&font=sans' },
        { bankName: 'Bank Lainnya' as const, logoSrc: 'https://placehold.co/100x30/708090/FFFFFF?text=Lainnya&font=sans' },
    ],
    retail: [
        { bankName: 'Indomaret' as const, logoSrc: 'https://placehold.co/100x30/004B8C/FFFFFF?text=Indomaret&font=sans' },
        { bankName: 'Alfamart' as const, logoSrc: 'https://placehold.co/100x30/D41A2D/FFFFFF?text=Alfamart&font=sans' },
    ]
};

const paymentInstructions = (
    <div className="text-sm text-slate-700 space-y-2 prose prose-sm max-w-none">
      <p className="font-bold">Pembayaran via ATM</p>
      <ol>
          <li>Pilih Bahasa, kemudian masukkan PIN ATM</li>
          <li>Pilih menu <strong>Pembayaran / Bayar</strong></li>
          <li>Pilih menu <strong>Tiket Kereta Api</strong></li>
          <li>Masukkan Kode Pembayaran: <strong className="text-blue-600">882910283736</strong></li>
          <li>Cek data pemesanan, jika sesuai tekan <strong>Benar/Lanjut</strong></li>
          <li>Transaksi berhasil, simpan struk pembayaran</li>
      </ol>
    </div>
);
// ------------------------------------


export default function PaymentOptions() {
  const [activeTab, setActiveTab] = useState('atm');

  const TabButton = ({ id, children }: {id: string, children: React.ReactNode}) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex-1 py-3 px-2 text-center text-sm font-semibold transition-all duration-300 relative ${
        activeTab === id 
          ? 'text-blue-600' 
          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
      }`}
    >
      {children}
      {activeTab === id && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full"></span>
      )}
    </button>
  );

  return (
    <Card className="w-full shadow-xl border-slate-200/60 rounded-xl overflow-hidden">
      <div className="flex border-b border-slate-200 bg-slate-50/50">
        <TabButton id="atm">ATM / MOBILE / INTERNET BANKING</TabButton>
        <TabButton id="retail">GERAI RETAIL</TabButton>
      </div>

      <CardContent className="p-0">
        {activeTab === 'atm' && (
          <div>
            {paymentMethods.atm.map(method => (
                <PaymentItem key={method.bankName} {...method} instructions={paymentInstructions} />
            ))}
          </div>
        )}
        {activeTab === 'retail' && (
          <div>
            {paymentMethods.retail.map(method => (
                <PaymentItem key={method.bankName} {...method} instructions={
                    <p className='p-4 text-center text-slate-500 text-sm'>Instruksi pembayaran untuk {method.bankName} akan segera tersedia.</p>
                } />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
