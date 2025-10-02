"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

interface PaymentInstructionsProps {
    paymentCode: string;
    deadlineSeconds: number;
    onPaymentComplete: () => void;
}

// Helper function untuk format waktu
const formatTime = (seconds: number): string => {
    if (seconds <= 0) return "00:00:00";
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

export default function PaymentInstructions({ paymentCode, deadlineSeconds, onPaymentComplete }: PaymentInstructionsProps) {
    const [timeLeft, setTimeLeft] = useState(deadlineSeconds);

    useEffect(() => {
        // Jangan jalankan timer jika waktu sudah habis
        if (timeLeft <= 0) return;

        // Set interval untuk mengurangi waktu setiap detik
        const timer = setInterval(() => {
            setTimeLeft(prevTime => prevTime - 1);
        }, 1000);

        // Cleanup function: hapus interval saat komponen di-unmount
        return () => clearInterval(timer);
    }, [timeLeft]);

    return (
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-md text-center">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-800">Selesaikan Pembayaran</CardTitle>
                <CardDescription>
                    Segera lakukan pembayaran sebelum batas waktu berakhir.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 px-8 py-10">
                <div className="bg-blue-600 text-white rounded-lg p-4">
                    <p className="text-sm uppercase">Kode Pembayaran</p>
                    <p className="text-3xl font-bold tracking-widest">{paymentCode}</p>
                </div>

                <div className="border border-red-200 bg-red-50 text-red-700 rounded-lg p-4">
                    <p className="text-sm font-semibold">Batas Waktu Pembayaran</p>
                    <div className="flex items-center justify-center gap-2 mt-2 text-3xl font-bold text-red-600">
                        <Clock className="w-8 h-8" />
                        <span>{formatTime(timeLeft)}</span>
                    </div>
                </div>

                <Button 
                    onClick={onPaymentComplete} 
                    disabled={timeLeft <= 0}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-6 text-lg rounded-xl shadow-lg transition-all"
                >
                    {timeLeft > 0 ? 'Selesaikan Pembayaran' : 'Waktu Habis'}
                </Button>
            </CardContent>
        </Card>
    );
}