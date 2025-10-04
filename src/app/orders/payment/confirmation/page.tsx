"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PaymentInstructions from '@/components/PaymentInstruction';
import TicketDisplay from '@/components/TicketDisplay';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CheckCircle2 } from 'lucide-react';
import { saveBookingLengkap, updatePaymentStatus, type SaveBookingRequest, type TiketQRData } from '@/lib/supabase/queries';

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
  returnTicketData?: TicketData;
  isPulangPergi: boolean;
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
  paymentStatus?: 'menunggu_pembayaran' | 'terkonfirmasi' | 'dibatalkan' | 'kadaluarsa';
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
    qrCodeValue: `http://localhost:3000/booking-code/${bookingCode}`
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
                        bankName: bankName,
                        paymentStatus: 'menunggu_pembayaran' // Set status awal sebagai menunggu_pembayaran
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

    // Fungsi untuk menyimpan data tiket ke database Supabase
    const saveTicketToDatabase = async (paymentData: PaymentData) => {
        try {
            console.log('Starting to save booking to database...');
            
            // Validasi data yang diperlukan
            if (!paymentData.bookingCode) {
                console.error('Booking code is required');
                return false;
            }
            
            // Convert paymentDeadline (duration in seconds) to actual deadline timestamp
            const deadlineString = paymentData.paymentDeadline 
                ? new Date(Date.now() + paymentData.paymentDeadline * 1000).toISOString()
                : undefined;
            
            console.log('💰 Payment deadline:', {
                durationSeconds: paymentData.paymentDeadline,
                deadlineISO: deadlineString
            });
            
            // Siapkan data QR Code
            const qrCodeData: TiketQRData = {
                // Booking Info
                booking_code: paymentData.bookingCode,
                payment_code: paymentData.paymentCode,
                payment_deadline: deadlineString,
                
                // Data Kereta
                train_name: paymentData.orderData.ticketData.trainName,
                train_number: paymentData.orderData.ticketData.trainNumber,
                train_class: paymentData.orderData.ticketData.class,
                
                // Rute & Jadwal
                origin: paymentData.orderData.ticketData.origin,
                destination: paymentData.orderData.ticketData.destination,
                departure_date: paymentData.orderData.ticketData.departureDate,
                departure_time: paymentData.orderData.ticketData.departureTime,
                arrival_time: paymentData.orderData.ticketData.arrivalTime,
                duration: paymentData.orderData.ticketData.duration,
                
                // Data Pemesan
                booker_name: paymentData.orderData.bookingData.nama,
                booker_gender: paymentData.orderData.bookingData.gender,
                booker_identity_type: paymentData.orderData.bookingData.tipeIdentitas,
                booker_identity_number: paymentData.orderData.bookingData.nomorIdentitas,
                booker_phone: paymentData.orderData.bookingData.noHP,
                booker_email: paymentData.orderData.bookingData.email,
                booker_address: paymentData.orderData.bookingData.alamat || '',
                
                // Data Penumpang
                passengers_data: paymentData.orderData.passengersData,
                passenger_count: paymentData.orderData.ticketData.passengers,
                adult_count: paymentData.orderData.ticketData.adults,
                child_count: paymentData.orderData.ticketData.children,
                
                // Harga
                price_per_ticket: paymentData.orderData.ticketData.price,
                total_price: paymentData.orderData.ticketData.totalPrice,
                
                // Status
                payment_status: paymentData.paymentStatus || 'menunggu_pembayaran',
                
                // QR Code
                qr_code_url: `http://localhost:3000/booking-code/${paymentData.bookingCode}`,
                
                // Tambahan
                facilities: paymentData.orderData.ticketData.facilities,
                payment_method: paymentData.paymentMethod,
                payment_bank: paymentData.bankName
            };
            
            // Siapkan data penumpang (disabilitas check dari isDifabel)
            const passengersForDB = paymentData.orderData.passengersData.map((p: any) => ({
                nama: p.nama,
                nomorIdentitas: p.nomorIdentitas,
                disabilitas: paymentData.orderData.ticketData.isDifabel || false, // Ambil dari ticketData
                selectedSeat: p.selectedSeat,
                selectedSeatReturn: p.selectedSeatReturn // Add return seat
            }));
            
            // Siapkan request untuk save booking - DEPARTURE TICKET
            const saveRequest: SaveBookingRequest = {
                bookingCode: paymentData.bookingCode,
                paymentCode: paymentData.paymentCode,
                paymentDeadline: deadlineString,
                totalPrice: paymentData.orderData.isPulangPergi && paymentData.orderData.returnTicketData
                    ? paymentData.orderData.ticketData.totalPrice + paymentData.orderData.returnTicketData.totalPrice
                    : paymentData.orderData.ticketData.totalPrice,
                paymentStatus: paymentData.paymentStatus || 'menunggu_pembayaran',
                
                trainName: paymentData.orderData.ticketData.trainName,
                origin: paymentData.orderData.ticketData.origin,
                destination: paymentData.orderData.ticketData.destination,
                departureDate: paymentData.orderData.ticketData.departureDate,
                departureTime: paymentData.orderData.ticketData.departureTime,
                
                passengers: passengersForDB,
                qrCodeData: qrCodeData
            };
            
            // Simpan tiket berangkat ke database
            console.log('💾 Saving departure ticket to database...');
            const result = await saveBookingLengkap(saveRequest);
            
            if (!result.success) {
                console.error('❌ Gagal menyimpan tiket berangkat ke database:', result.error);
                return false;
            }
            
            console.log('✅ Tiket berangkat berhasil disimpan ke database!', result.pemesananId);
            
            // Simpan tiket pulang jika PP
            if (paymentData.orderData.isPulangPergi && paymentData.orderData.returnTicketData) {
                console.log('💾 Saving return ticket to database...');
                
                // Generate booking code untuk tiket pulang (dengan suffix -R)
                const returnBookingCode = `${paymentData.bookingCode}-R`;
                
                // Siapkan QR Code data untuk tiket pulang
                const returnQrCodeData: TiketQRData = {
                    booking_code: returnBookingCode,
                    payment_code: paymentData.paymentCode,
                    payment_deadline: deadlineString,
                    
                    train_name: paymentData.orderData.returnTicketData.trainName,
                    train_number: paymentData.orderData.returnTicketData.trainNumber,
                    train_class: paymentData.orderData.returnTicketData.class,
                    
                    origin: paymentData.orderData.returnTicketData.origin,
                    destination: paymentData.orderData.returnTicketData.destination,
                    departure_date: paymentData.orderData.returnTicketData.departureDate,
                    departure_time: paymentData.orderData.returnTicketData.departureTime,
                    arrival_time: paymentData.orderData.returnTicketData.arrivalTime,
                    duration: paymentData.orderData.returnTicketData.duration,
                    
                    booker_name: paymentData.orderData.bookingData.nama,
                    booker_gender: paymentData.orderData.bookingData.gender,
                    booker_identity_type: paymentData.orderData.bookingData.tipeIdentitas,
                    booker_identity_number: paymentData.orderData.bookingData.nomorIdentitas,
                    booker_phone: paymentData.orderData.bookingData.noHP,
                    booker_email: paymentData.orderData.bookingData.email,
                    booker_address: paymentData.orderData.bookingData.alamat || '',
                    
                    passengers_data: paymentData.orderData.passengersData.map((p: any) => ({
                        ...p,
                        selectedSeat: p.selectedSeatReturn // Use return seat for return ticket
                    })),
                    passenger_count: paymentData.orderData.returnTicketData.passengers,
                    adult_count: paymentData.orderData.returnTicketData.adults,
                    child_count: paymentData.orderData.returnTicketData.children,
                    
                    price_per_ticket: paymentData.orderData.returnTicketData.price,
                    total_price: paymentData.orderData.returnTicketData.totalPrice,
                    
                    payment_status: paymentData.paymentStatus || 'menunggu_pembayaran',
                    qr_code_url: `http://localhost:3000/booking-code/${returnBookingCode}`,
                    
                    facilities: paymentData.orderData.returnTicketData.facilities,
                    payment_method: paymentData.paymentMethod,
                    payment_bank: paymentData.bankName
                };
                
                // Passengers dengan seat pulang
                const passengersReturnForDB = paymentData.orderData.passengersData.map((p: any) => ({
                    nama: p.nama,
                    nomorIdentitas: p.nomorIdentitas,
                    disabilitas: paymentData.orderData.returnTicketData!.isDifabel || false,
                    selectedSeat: p.selectedSeatReturn // Use return seat
                }));
                
                const returnSaveRequest: SaveBookingRequest = {
                    bookingCode: returnBookingCode,
                    paymentCode: paymentData.paymentCode,
                    paymentDeadline: deadlineString,
                    totalPrice: paymentData.orderData.returnTicketData.totalPrice,
                    paymentStatus: paymentData.paymentStatus || 'menunggu_pembayaran',
                    
                    trainName: paymentData.orderData.returnTicketData.trainName,
                    origin: paymentData.orderData.returnTicketData.origin,
                    destination: paymentData.orderData.returnTicketData.destination,
                    departureDate: paymentData.orderData.returnTicketData.departureDate,
                    departureTime: paymentData.orderData.returnTicketData.departureTime,
                    
                    passengers: passengersReturnForDB,
                    qrCodeData: returnQrCodeData
                };
                
                const returnResult = await saveBookingLengkap(returnSaveRequest);
                
                if (!returnResult.success) {
                    console.error('❌ Gagal menyimpan tiket pulang ke database:', returnResult.error);
                    // Don't return false here, departure ticket is already saved
                } else {
                    console.log('✅ Tiket pulang berhasil disimpan ke database!', returnResult.pemesananId);
                }
            }
            
            // Simpan ke localStorage juga sebagai backup
            const existingTickets = localStorage.getItem('ticketHistory');
            const ticketHistory = existingTickets ? JSON.parse(existingTickets) : [];
            
            ticketHistory.push({
                bookingCode: paymentData.bookingCode,
                createdAt: new Date().toISOString(),
                orderData: paymentData.orderData
            });
            
            localStorage.setItem('ticketHistory', JSON.stringify(ticketHistory));
            
            return true;
            
        } catch (error) {
            console.error('❌ Error in saveTicketToDatabase:', error);
            return false;
        }
    };

    const handlePaymentComplete = async () => {
        console.log("Pembayaran Selesai!");
        
        // Update payment status in database dan localStorage
        if (paymentData?.bookingCode) {
            try {
                // Update di database
                console.log('Updating payment status in database...');
                const { error: dbError } = await updatePaymentStatus(paymentData.bookingCode, 'terkonfirmasi');
                
                if (dbError) {
                    console.error('Error updating payment status in database:', dbError);
                } else {
                    console.log('✅ Payment status updated to TERKONFIRMASI in database');
                }
                
                // Update di localStorage
                const storedPaymentData = localStorage.getItem('paymentData');
                if (storedPaymentData) {
                    const parsed = JSON.parse(storedPaymentData);
                    if (parsed.orderData) {
                        // Update status ke 'terkonfirmasi'
                        parsed.paymentStatus = 'terkonfirmasi';
                        localStorage.setItem('paymentData', JSON.stringify(parsed));
                        console.log('✅ Payment status updated to TERKONFIRMASI in localStorage');
                    }
                }
            } catch (error) {
                console.error('Error updating payment status:', error);
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
            // Untuk PP, simpan 2 item terpisah (berangkat dan pulang)
            const bookingItems = [];
            
            // Item untuk tiket berangkat
            const departureHistoryItem = {
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
                status: 'completed',
                tripType: paymentData.orderData.isPulangPergi ? 'berangkat' : 'sekali-jalan'
            };
            
            bookingItems.push(departureHistoryItem);
            
            // Item untuk tiket pulang (jika PP)
            if (paymentData.orderData.isPulangPergi && paymentData.orderData.returnTicketData) {
                const returnHistoryItem = {
                    id: `${Date.now()}-return`,
                    bookingCode: `${paymentData.bookingCode || bookingCode}-R`,
                    trainName: paymentData.orderData.returnTicketData.trainName,
                    trainNumber: paymentData.orderData.returnTicketData.trainNumber,
                    origin: paymentData.orderData.returnTicketData.origin,
                    destination: paymentData.orderData.returnTicketData.destination,
                    departureDate: paymentData.orderData.returnTicketData.departureDate,
                    departureTime: paymentData.orderData.returnTicketData.departureTime,
                    arrivalTime: paymentData.orderData.returnTicketData.arrivalTime,
                    passengerName: paymentData.orderData.passengersData[0]?.nama || paymentData.orderData.bookingData.nama,
                    totalPrice: paymentData.orderData.returnTicketData.totalPrice,
                    passengers: paymentData.orderData.returnTicketData.passengers,
                    class: paymentData.orderData.returnTicketData.class,
                    paymentMethod: paymentData.paymentMethod,
                    bankName: paymentData.bankName,
                    completedAt: new Date().toISOString(),
                    status: 'completed',
                    tripType: 'pulang'
                };
                
                bookingItems.push(returnHistoryItem);
            }
            
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
            
            // Add new bookings to history (tiket pulang dulu, baru tiket berangkat agar urutan benar)
            bookingItems.reverse().forEach(item => {
                bookingHistory.unshift(item);
            });
            
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

    // Generate return ticket data jika PP
    const returnTicketData = paymentData?.orderData.isPulangPergi && paymentData?.orderData.returnTicketData
        ? convertToTicketFormat({
            ...paymentData.orderData,
            ticketData: paymentData.orderData.returnTicketData
          }, `${paymentData.bookingCode || bookingCode}-R`)
        : null;

    return (
        <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen p-4 md:p-8">
            <div className={`mx-auto ${paymentData?.orderData.isPulangPergi && isPaid ? 'max-w-6xl' : 'max-w-2xl'}`}>
                <Button 
                    variant="outline" 
                    onClick={handleBackClick}
                    className="mb-6 bg-white/90 backdrop-blur-md hover:bg-white"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {isPaid ? 'Selesai' : 'Kembali'}
                </Button>
                
                {isPaid ? (
                    <div className="space-y-6">
                        {/* Grid Layout untuk Tiket - Bersebelahan di layar besar */}
                        <div className={`grid gap-6 ${paymentData?.orderData.isPulangPergi && returnTicketData ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                            {/* Tiket Berangkat */}
                            <div className="flex flex-col">
                                <div className="text-center mb-3">
                                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                        TIKET BERANGKAT
                                    </span>
                                </div>
                                <TicketDisplay ticket={ticketData} variant="departure" />
                            </div>

                            {/* Tiket Pulang - jika PP */}
                            {paymentData?.orderData.isPulangPergi && returnTicketData && (
                                <div className="flex flex-col">
                                    <div className="text-center mb-3">
                                        <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                                            <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                                            TIKET PULANG
                                        </span>
                                    </div>
                                    <TicketDisplay ticket={returnTicketData} variant="return" />
                                </div>
                            )}
                        </div>

                        {/* Tombol Aksi */}
                        <div className="flex flex-col sm:flex-row gap-3 mt-6">
                            <Button 
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                onClick={() => router.push(`/booking-code/${paymentData.bookingCode || bookingCode}`)}
                            >
                                Lihat Detail & Cetak Tiket
                            </Button>
                            <Button 
                                variant="outline" 
                                className="flex-1"
                                onClick={() => router.push('/')}
                            >
                                Kembali ke Beranda
                            </Button>
                        </div>
                    </div>
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
                                    <p className="text-gray-600 mb-4">
                                        {paymentData?.orderData.isPulangPergi 
                                            ? 'Tiket berangkat dan pulang Anda telah dikonfirmasi dan siap ditampilkan.'
                                            : 'Tiket Anda telah dikonfirmasi dan siap ditampilkan.'
                                        }
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => { setShowSuccessModal(false); setIsPaid(true); }}>
                                            Lihat Tiket
                                        </Button>
                                        <Button variant="outline" className="flex-1" onClick={() => router.push('/')}>Kembali ke Beranda</Button>
                                    </div>
                                </div>
                                {paymentData && (
                                    <div className="bg-gray-50 px-6 py-4 text-sm text-left grid gap-1">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Kode Booking</span>
                                            <span className="font-medium">{paymentData.bookingCode || bookingCode}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Tipe Tiket</span>
                                            <span className="font-medium">{paymentData.orderData.isPulangPergi ? 'Pulang-Pergi' : 'Sekali Jalan'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Kereta Berangkat</span>
                                            <span className="font-medium truncate max-w-[170px] text-right">{paymentData.orderData.ticketData.trainName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Rute Berangkat</span>
                                            <span className="font-medium text-right">{paymentData.orderData.ticketData.origin} → {paymentData.orderData.ticketData.destination}</span>
                                        </div>
                                        {paymentData.orderData.isPulangPergi && paymentData.orderData.returnTicketData && (
                                            <>
                                                <div className="border-t border-gray-300 my-2"></div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Kereta Pulang</span>
                                                    <span className="font-medium truncate max-w-[170px] text-right">{paymentData.orderData.returnTicketData.trainName}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Rute Pulang</span>
                                                    <span className="font-medium text-right">{paymentData.orderData.returnTicketData.origin} → {paymentData.orderData.returnTicketData.destination}</span>
                                                </div>
                                            </>
                                        )}
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