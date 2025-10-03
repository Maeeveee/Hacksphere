"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OrderSummary from "@/components/OrderSummary";
import PaymentOptions from "@/components/PaymentOptions";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import UserMenu from "@/components/UserMenu";

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


// Function to convert order data to the format expected by OrderSummary
const convertToOrderSummaryFormat = (orderData: OrderData) => {
  const { ticketData, bookingData, passengersData } = orderData;
  
  // Generate seat information based on class
  const getSeatInfo = (trainClass: string, index: number = 0) => {
    const seatPrefixes: { [key: string]: string } = {
      'eksekutif': 'EKS',
      'bisnis': 'BIS',
      'ekonomi': 'EKO'
    };
    
    const prefix = seatPrefixes[trainClass.toLowerCase()] || 'EKS';
    const wagonNumber = Math.floor(index / 20) + 1; // 20 seats per wagon
    const seatNumber = (index % 20) + 1;
    const seatLetter = String.fromCharCode(65 + (seatNumber % 4)); // A, B, C, D
    
    return {
      wagon: `${prefix}-${wagonNumber}`,
      number: `${Math.ceil(seatNumber / 2)}${seatLetter}`
    };
  };

  // Format departure and arrival times properly
  const formatDateTime = (date: string, time: string) => {
    // If time already includes seconds, use as is, otherwise add :00
    const formattedTime = time.includes(':') && time.split(':').length === 3 ? time : `${time}:00`;
    return `${date}T${formattedTime}`;
  };

  const seatInfo = getSeatInfo(ticketData.class);
  
  return {
    totalPrice: ticketData.totalPrice,
    train: {
      name: ticketData.trainName || 'Kereta Api',
      number: ticketData.trainNumber || 'N/A',
      class: ticketData.class || 'Eksekutif',
      subclass: ticketData.class === 'Eksekutif' ? 'AA' : 'A', 
    },
    passengers: passengersData.map((passenger, index) => ({
      name: passenger.nama ? passenger.nama.toUpperCase() : `PENUMPANG ${index + 1}`,
      type: passenger.ageCategory === 'adult' ? 'Dewasa' : 'Anak-anak',
      price: passenger.ageCategory === 'adult' ? ticketData.price : Math.floor(ticketData.price * 0.75) // Child discount
    })),
    discounts: [
      { name: "Discount Channel", amount: 0 },
    ],
    trip: {
      origin: ticketData.origin || 'Stasiun Asal',
      destination: ticketData.destination || 'Stasiun Tujuan',
      departure: formatDateTime(ticketData.departureDate, ticketData.departureTime),
      arrival: formatDateTime(ticketData.departureDate, ticketData.arrivalTime),
    },
    seat: seatInfo,
    bookingInfo: {
      bookerName: bookingData.nama || 'Pemesan',
      email: bookingData.email || '',
      phone: bookingData.noHP || '',
    }
  };
};

function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to get data from localStorage first (from the orders page)
    const storedOrderData = localStorage.getItem('orderData');
    
    if (storedOrderData) {
      try {
        const parsedOrderData = JSON.parse(storedOrderData);
        
        // Validate required data structure
        if (parsedOrderData.ticketData && parsedOrderData.bookingData && parsedOrderData.passengersData) {
          setOrderData(parsedOrderData);
          setIsLoading(false);
        } else {
          console.error('Invalid order data structure');
          router.push('/orders');
        }
      } catch (error) {
        console.error('Error parsing stored order data:', error);
        // Clear corrupted data and redirect
        localStorage.removeItem('orderData');
        router.push('/orders');
      }
    } else {
      // If no data found, redirect back to orders page
      console.log('No order data found, redirecting to orders page');
      router.push('/orders');
    }

    // Cleanup function to clear data when component unmounts
    return () => {
      // Only clear if user is navigating away from payment flow
      // Keep data when going back to summary or orders
      if (window.location.pathname !== '/orders/payment' && 
          !window.location.pathname.includes('/orders/payment/') &&
          window.location.pathname !== '/summary' &&
          window.location.pathname !== '/orders') {
        localStorage.removeItem('orderData');
      }
    };
  }, [router]);

  const handleBackClick = () => {
    // Don't clear localStorage when going back to summary page
    // so user can modify their seat selection if needed
    router.push('/summary');
  };

  if (isLoading) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data pembayaran...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Data pesanan tidak ditemukan</p>
          <Button onClick={() => router.push('/orders')} className="bg-blue-600 hover:bg-blue-700">
            Kembali ke Form Pemesanan
          </Button>
        </div>
      </div>
    );
  }

  const formattedOrderData = convertToOrderSummaryFormat(orderData);

  return (
    <div className="bg-slate-50 min-h-screen font-sans">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        
        {/* Header Halaman */}
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="outline" 
            onClick={handleBackClick}
            className="bg-white/90 backdrop-blur-md hover:bg-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Ringkasan
          </Button>
          <UserMenu />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pembayaran</h1>
          <p className="text-gray-600">Pilih metode pembayaran untuk menyelesaikan transaksi</p>
        </div>

        {/* Konten Utama */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Kolom Kiri - Opsi Pembayaran */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <PaymentOptions />
          </div>

          {/* Kolom Kanan - Ringkasan Pesanan */}
          <div className="lg:col-span-1 order-1 lg:order-2 sticky top-8">
            <OrderSummary order={formattedOrderData} />
          </div>

        </main>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat halaman pembayaran...</p>
        </div>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}