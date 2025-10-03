"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PaymentInstructions from '@/components/PaymentInstruction';
import TicketDisplay from '@/components/TicketDisplay';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { saveTiket, updatePaymentStatus, type Tiket } from '@/lib/supabase/queries';
import { CheckCircle2 } from 'lucide-react';

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
    const [showSuccessModal, setShowSuccessModal] = useState(false);

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
                    
                    // Save ticket to database
                    saveTicketToDatabase(payment).then(success => {
                        if (success) {
                            console.log('Ticket data saved to database successfully');
                        } else {
                            console.error('Failed to save ticket data to database');
                        }
                    });
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

    // Fungsi untuk menyimpan data tiket ke database
    const saveTicketToDatabase = async (paymentData: PaymentData) => {
        try {
            const { orderData, bookingCode: bCode, paymentCode: pCode } = paymentData;
            const { ticketData, bookingData, passengersData } = orderData;

            const tiketData: Omit<Tiket, 'id' | 'created_at' | 'updated_at'> = {
                booking_code: bCode || bookingCode,
                
                // Data Kereta
                train_id: ticketData.trainId,
                train_name: ticketData.trainName,
                train_number: ticketData.trainNumber,
                train_class: ticketData.class,
                
                // Rute & Jadwal
                origin: ticketData.origin,
                destination: ticketData.destination,
                departure_date: ticketData.departureDate,
                departure_time: ticketData.departureTime,
                arrival_time: ticketData.arrivalTime,
                duration: ticketData.duration,
                
                // Data Pemesan
                booker_name: bookingData.nama,
                booker_gender: bookingData.gender,
                booker_identity_type: bookingData.tipeIdentitas,
                booker_identity_number: bookingData.nomorIdentitas,
                booker_phone: bookingData.noHP,
                booker_email: bookingData.email,
                booker_address: bookingData.alamat,
                
                // Data Penumpang
                passengers_data: passengersData,
                passenger_count: ticketData.passengers,
                adult_count: ticketData.adults,
                child_count: ticketData.children,
                
                // Harga
                price_per_ticket: ticketData.price,
                total_price: ticketData.totalPrice,
                
                // Status
                payment_status: 'pending',
                booking_status: 'active',
                
                // Metadata
                payment_code: pCode,
                payment_deadline: new Date(Date.now() + ((paymentData.paymentDeadline || paymentDeadlineInSeconds) * 1000)).toISOString()
            };

            const { data, error } = await saveTiket(tiketData);
            
            if (error) {
                console.error('Error saving ticket to database:', error);
                return false;
            }
            
            console.log('Ticket saved successfully:', data);
            return true;
            
        } catch (error) {
            console.error('Error in saveTicketToDatabase:', error);
            return false;
        }
    };

    const handlePaymentComplete = async () => {
        console.log("Pembayaran Selesai!");
        
        // Update payment status in database
        if (paymentData?.bookingCode) {
            try {
                const { data, error } = await updatePaymentStatus(paymentData.bookingCode, 'paid');
                if (error) {
                    console.error('Error updating payment status:', error);
                } else {
                    console.log('Payment status updated successfully:', data);
                }
            } catch (error) {
                console.error('Error in updatePaymentStatus:', error);
            }
        }
        
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
            
            // Save to booking history
            const bookingHistoryItem = {
                id: Date.now().toString(),
                bookingCode: paymentData.bookingCode || bookingCode,
                trainName: paymentData.orderData.ticketData.trainName,
                trainNumber: paymentData.orderData.ticketData.trainNumber,
                origin: paymentData.orderData.ticketData.origin,
                destination: paymentData.orderData.ticketData.destination,
                departureDate: paymentData.orderData.ticketData.departureDate,
                departureTime: paymentData.orderData.ticketData.departureTime,
                arrivalTime: paymentData.orderData.ticketData.arrivalTime,
                passengerName: paymentData.orderData.passengersData[0]?.nama || paymentData.orderData.bookingData.nama,
                totalPrice: paymentData.orderData.ticketData.totalPrice,
                passengers: paymentData.orderData.ticketData.passengers,
                class: paymentData.orderData.ticketData.class,
                paymentMethod: paymentData.paymentMethod,
                bankName: paymentData.bankName,
                completedAt: new Date().toISOString(),
                status: 'completed'
            };
            
            // Get existing booking history
            const existingHistory = localStorage.getItem('bookingHistory');
            let bookingHistory = [];
            
            if (existingHistory) {
                try {
                    bookingHistory = JSON.parse(existingHistory);
                } catch (error) {
                    console.error('Error parsing booking history:', error);
                    bookingHistory = [];
                }
            }
            
            // Add new booking to history
            bookingHistory.unshift(bookingHistoryItem); // Add to beginning of array
            
            // Keep only last 50 bookings to prevent localStorage from getting too large
            if (bookingHistory.length > 50) {
                bookingHistory = bookingHistory.slice(0, 50);
            }
            
            // Save updated history
            localStorage.setItem('bookingHistory', JSON.stringify(bookingHistory));
        }

        // Show success modal instead of default alert
        setShowSuccessModal(true);
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
                {showSuccessModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setShowSuccessModal(false)} />
                        <div className="relative z-10 w-full max-w-md origin-center animate-scale-in">
                            <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
                                <div className="p-6 text-center">
                                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-50 flex items-center justify-center">
                                        <CheckCircle2 className="h-10 w-10 text-green-500" />
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Pembayaran Berhasil</h2>
                                    <p className="text-gray-600 mb-4">Tiket Anda telah dikonfirmasi dan siap ditampilkan.</p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => { setShowSuccessModal(false); setIsPaid(true); }}>
                                            Lihat Tiket
                                        </Button>
                                        <Button variant="outline" className="flex-1" onClick={() => router.push('/')}>Kembali ke Beranda</Button>
                                    </div>
                                </div>
                                {paymentData && (
                                    <div className="bg-gray-50 px-6 py-4 text-sm text-left grid gap-1">
                                        <div className="flex justify-between"><span className="text-gray-500">Kode Booking</span><span className="font-medium">{paymentData.bookingCode || bookingCode}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Kereta</span><span className="font-medium truncate max-w-[170px] text-right">{paymentData.orderData.ticketData.trainName}</span></div>
                                        <div className="flex justify-between"><span className="text-gray-500">Rute</span><span className="font-medium">{paymentData.orderData.ticketData.origin} → {paymentData.orderData.ticketData.destination}</span></div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <style jsx>{`
                            .animate-fade-in { animation: fadeIn .25s ease; }
                            .animate-scale-in { animation: scaleIn .25s ease; }
                            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                            @keyframes scaleIn { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: scale(1); } }
                        `}</style>
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