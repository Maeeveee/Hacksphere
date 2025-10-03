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
        // Pass payment method as query parameter to confirmation page
        const paymentMethod = bankName.toLowerCase().replace(/\s+/g, '_');
        router.push(`/orders/payment/confirmation?method=${paymentMethod}&bank=${encodeURIComponent(bankName)}`);
    };  

    return (
        <div className="border-b">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-4 text-left hover:bg-gray-50 transition-colors"
            >
                {/* <Image src={logoSrc} alt={`${bankName} logo`} width={80} height={25} className="object-contain" /> */}
                <span className={`transform transition-transform ${isOpen ? 'rotate-90' : 'rotate-0'}`}>{'>'}</span>
            </button>   
            {isOpen && (
                <div className="p-4 bg-gray-50">
                    {instructions}
                    {/* Modifikasi tombol ini */}
                    <Button 
                        onClick={handlePayment} 
                        className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:bg-gradient-to-l"
                    >
                        Bayar dengan {bankName}
                    </Button>
                </div>
            )}
        </div>
    );
}