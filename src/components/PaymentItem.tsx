// src/components/PaymentItem.tsx
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation'; // Import useRouter

interface PaymentItemProps {
    bankName: string;
    logoSrc: string;
    instructions?: React.ReactNode;
}

export default function PaymentItem({ bankName, logoSrc, instructions }: PaymentItemProps) {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter(); // Inisialisasi router

    const handlePayment = () => {
        // Arahkan ke halaman konfirmasi
        // Di aplikasi nyata, Anda mungkin akan membuat pesanan dulu dan mendapatkan ID pesanan
        router.push('/payment/confirmation');
    };

    return (
        <div className="border-b">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors"
            >
                <Image src={logoSrc} alt={`${bankName} logo`} width={80} height={25} className="object-contain" />
                <span className={`transform transition-transform ${isOpen ? 'rotate-90' : 'rotate-0'}`}>{'>'}</span>
            </button>
            {isOpen && (
                <div className="p-4 bg-gray-50">
                    {instructions}
                    {/* Modifikasi tombol ini */}
                    <Button 
                        onClick={handlePayment} 
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                    >
                        Bayar dengan {bankName}
                    </Button>
                </div>
            )}
        </div>
    );
}