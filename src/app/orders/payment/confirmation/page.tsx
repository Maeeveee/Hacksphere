"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PaymentInstructions from '@/components/PaymentInstruction';
import TicketDisplay from '@/components/TicketDisplay';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BookingFormData {
  gender: string;
  nama: string;
  tipeIdentitas: string;
  nomorIdentitas: string;
  noHP: string;
  email: string;
  alamat: string;
}

interface PassengerData {
  gender: string;
  nama: string;
  tipeIdentitas: string;
  nomorIdentitas: string;
  ageCategory: 'adult' | 'child';
}

interface TicketData {
  trainId: string;
  trainName: string;
  trainNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  class: string;
  price: number;
  facilities: string[];
  availableSeats: number;
  passengers: number;
  adults: number;
  children: number;
  departureDate: string;
  totalPrice: number;
  isDifabel: boolean;
  isPulangPergi: boolean;
}

interface OrderData {
  ticketData: TicketData;
  bookingData: BookingFormData;
  passengersData: PassengerData[];
  useBookingDataForPassenger: boolean;
}

interface PaymentData {
  orderData: OrderData;
  paymentMethod: string;
  paymentCode?: string;
  bookingCode?: string;
  paymentDeadline?: number;
  bankName?: string;
}

// Function to generate a booking code
const generateBookingCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Function to generate payment code based on order data
const generatePaymentCode = (orderData?: OrderData) => {
  if (!orderData) {
    return Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
  }
  
  // Create a more structured payment code
  const trainCode = orderData.ticketData.trainNumber.replace(/[^0-9]/g, '').substring(0, 3) || '001';
  const dateCode = new Date().getDate().toString().padStart(2, '0');
  const randomSuffix = Math.floor(1000000 + Math.random() * 9000000).toString();
  
  return `882${trainCode}${dateCode}${randomSuffix}`;
};

// Function to convert order data to ticket format
const convertToTicketFormat = (orderData: OrderData, bookingCode: string) => {
  const { ticketData, bookingData, passengersData } = orderData;
  
  // Get main passenger (first passenger or booker)
  const mainPassenger = passengersData.length > 0 ? passengersData[0] : null;
  const passengerName = mainPassenger ? mainPassenger.nama : bookingData.nama;
  
  // Generate seat information
  const getSeatInfo = (trainClass: string) => {
    const seatPrefixes: { [key: string]: string } = {
      'eksekutif': 'EKS',
      'bisnis': 'BIS',
      'ekonomi': 'EKO'
    };
    
    const prefix = seatPrefixes[trainClass.toLowerCase()] || 'EKS';
    const wagonLetter = String.fromCharCode(65 + Math.floor(Math.random() * 3)); // A, B, C
    const seatNumber = Math.floor(Math.random() * 20) + 1;
    const seatLetter = String.fromCharCode(65 + Math.floor(Math.random() * 4)); // A, B, C, D
    
    return `${prefix}-${wagonLetter}, ${seatNumber}${seatLetter}`;
  };

  // Format date and time
  const formatDateTime = (date: string, time: string) => {
    const formattedTime = time.includes(':') && time.split(':').length === 3 ? time : `${time}:00`;
    return `${date}T${formattedTime}`;
  };

  // Get station codes
  const getStationCode = (stationName: string) => {
    const codes: { [key: string]: string } = {
      'jakarta': 'JKT',
      'bandung': 'BD',
      'surabaya': 'SB',
      'surabaya gubeng': 'SGU',
      'yogyakarta': 'YK',
      'solo': 'SLO',
      'malang': 'ML',
      'semarang': 'SMG'
    };
    
    const key = stationName.toLowerCase();
    return codes[key] || stationName.substring(0, 3).toUpperCase();
  };

  const originCode = getStationCode(ticketData.origin);
  const destinationCode = getStationCode(ticketData.destination);

  return {
    trainName: ticketData.trainName || 'Kereta Api',
    trainNumber: ticketData.trainNumber || 'N/A',
    bookingCode: bookingCode,
    passengerName: passengerName ? passengerName.toUpperCase() : 'PENUMPANG',
    origin: `${ticketData.origin} (${originCode})`,
    destination: `${ticketData.destination} (${destinationCode})`,
    departureDate: formatDateTime(ticketData.departureDate, ticketData.departureTime),
    arrivalDate: formatDateTime(ticketData.departureDate, ticketData.arrivalTime),
    seatClass: `${ticketData.class} (${ticketData.class.substring(0, 3).toUpperCase()})`,
    seatNumber: getSeatInfo(ticketData.class),
    qrCodeValue: `https://booking.kai.id/booking-code/${bookingCode}`
  };
};

function PaymentConfirmationContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPaid, setIsPaid] = useState(false);
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [bookingCode] = useState(() => generateBookingCode());
    const [paymentCode] = useState(() => generatePaymentCode());

    // Default payment deadline (1 hour 5 minutes)
    const paymentDeadlineInSeconds = 1 * 3600 + 5 * 60; 

    useEffect(() => {
        // Try to get order data from localStorage
        const storedOrderData = localStorage.getItem('orderData');
        const paymentMethod = searchParams?.get('method') || 'transfer';
        const bankName = searchParams?.get('bank') || 'Bank';
        
        if (storedOrderData) {
            try {
                const parsedOrderData = JSON.parse(storedOrderData);
                
                if (parsedOrderData.ticketData && parsedOrderData.bookingData && parsedOrderData.passengersData) {
                    // Generate a more specific payment code based on order data
                    const specificPaymentCode = generatePaymentCode(parsedOrderData);
                    
                    const payment: PaymentData = {
                        orderData: parsedOrderData,
                        paymentMethod: paymentMethod,
                        paymentCode: specificPaymentCode,
                        bookingCode: bookingCode,
                        paymentDeadline: paymentDeadlineInSeconds,
                        bankName: bankName
                    };
                    
                    setPaymentData(payment);
                    setIsLoading(false);
                    
                    // Store payment data for future reference
                    localStorage.setItem('paymentData', JSON.stringify(payment));
                } else {
                    console.error('Invalid order data structure');
                    router.push('/orders');
                }
            } catch (error) {
                console.error('Error parsing stored order data:', error);
                localStorage.removeItem('orderData');
                router.push('/orders');
            }
        } else {
            // Try to get from payment data if returning to this page
            const storedPaymentData = localStorage.getItem('paymentData');
            if (storedPaymentData) {
                try {
                    const parsedPaymentData = JSON.parse(storedPaymentData);
                    setPaymentData(parsedPaymentData);
                    setIsLoading(false);
                } catch (error) {
                    console.error('Error parsing payment data:', error);
                    router.push('/orders/payment');
                }
            } else {
                console.log('No order data found, redirecting to payment page');
                router.push('/orders/payment');
            }
        }

        // Cleanup function
        return () => {
            // Clear order data when payment is complete
            if (isPaid) {
                localStorage.removeItem('orderData');
            }
        };
    }, [router, searchParams, paymentCode, bookingCode, paymentDeadlineInSeconds, isPaid]);

    const handlePaymentComplete = () => {
        console.log("Pembayaran Selesai!");
        setIsPaid(true);
        
        // Clear order data since payment is complete
        localStorage.removeItem('orderData');
        
        // Keep payment data for ticket display
        if (paymentData) {
            const completedPayment = { 
                ...paymentData, 
                completed: true,
                completedAt: new Date().toISOString()
            };
            localStorage.setItem('paymentData', JSON.stringify(completedPayment));
        }

        // Show success notification
        alert('Pembayaran berhasil! Tiket Anda telah dikonfirmasi.');
    };

    const handleBackClick = () => {
        if (isPaid) {
            // If payment is complete, go back to home or orders list
            router.push('/');
        } else {
            // If payment not complete, go back to payment page
            router.push('/orders/payment');
        }
    };

    if (isLoading) {
        return (
            <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat konfirmasi pembayaran...</p>
                </div>
            </div>
        );
    }

    if (!paymentData) {
        return (
            <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 mb-4">Data pembayaran tidak ditemukan</p>
                    <Button onClick={() => router.push('/orders/payment')} className="bg-blue-600 hover:bg-blue-700">
                        Kembali ke Pembayaran
                    </Button>
                </div>
            </div>
        );
    }

    const ticketData = convertToTicketFormat(paymentData.orderData, paymentData.bookingCode || bookingCode);

    return (
        <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <Button 
                    variant="outline" 
                    onClick={handleBackClick}
                    className="mb-6 bg-white/90 backdrop-blur-md hover:bg-white"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {isPaid ? 'Selesai' : 'Kembali'}
                </Button>
                
                {isPaid ? (
                    <TicketDisplay ticket={ticketData} />
                ) : (
                    <div className="space-y-4">
                        {paymentData.bankName && (
                            <div className="bg-white/90 backdrop-blur-md rounded-lg p-4 text-center">
                                <p className="text-sm text-gray-600">Metode Pembayaran Dipilih:</p>
                                <p className="text-lg font-semibold text-blue-600">{paymentData.bankName}</p>
                            </div>
                        )}
                        <PaymentInstructions 
                            paymentCode={paymentData.paymentCode || generatePaymentCode(paymentData.orderData)}
                            deadlineSeconds={paymentData.paymentDeadline || paymentDeadlineInSeconds}
                            onPaymentComplete={handlePaymentComplete}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function PaymentConfirmationPage() {
    return (
        <Suspense fallback={
            <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat halaman konfirmasi...</p>
                </div>
            </div>
        }>
            <PaymentConfirmationContent />
        </Suspense>
    );
}