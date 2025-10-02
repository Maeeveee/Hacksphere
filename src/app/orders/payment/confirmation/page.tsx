"use client";

import { useState } from 'react';
import PaymentInstructions from '@/components/PaymentInstruction';
import TicketDisplay from '@/components/TicketDisplay';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

// Contoh data tiket (di aplikasi nyata, ini akan datang dari state, context, atau URL)
const dummyTicketData = {
    trainName: "ARJUNA EKSPRES",
    trainNumber: "66F",
    bookingCode: "TTP52D7",
    passengerName: "RANGGA PUTRA SYANANDA BUDHI",
    origin: "Malang (ML)",
    destination: "Surabaya Gubeng (SGU)",
    departureDate: "2025-09-29T05:30:00",
    arrivalDate: "2025-09-29T07:29:00",
    seatClass: "Eksekutif (EKS)",
    seatNumber: "EKS-J, 2C",
    qrCodeValue: "https://booking.kai.id/booking-code/TTP52D7" // Data untuk di-encode di QR
};

export default function PaymentConfirmationPage() {
    const router = useRouter();
    // State untuk melacak status pembayaran
    const [isPaid, setIsPaid] = useState(false);

    // Durası countdown dalam detik (misal: 1 jam, 5 menit)
    const paymentDeadlineInSeconds = 1 * 3600 + 5 * 60; 

    const handlePaymentComplete = () => {
        // Di aplikasi nyata, Anda akan memverifikasi pembayaran dengan backend di sini
        // Untuk sekarang, kita hanya set state-nya
        console.log("Pembayaran Selesai!");
        setIsPaid(true);
    };

    return (
        <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <Button 
                    variant="outline" 
                    onClick={() => router.back()}
                    className="mb-6 bg-white/90 backdrop-blur-md hover:bg-white"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Kembali
                </Button>
                
                {isPaid ? (
                    <TicketDisplay ticket={dummyTicketData} />
                ) : (
                    <PaymentInstructions 
                        paymentCode="1213102363014" 
                        deadlineSeconds={paymentDeadlineInSeconds}
                        onPaymentComplete={handlePaymentComplete}
                    />
                )}
            </div>
        </div>
    );
}