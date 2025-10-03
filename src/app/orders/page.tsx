"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, MapPin, Train, Users, CreditCard, Wifi, Utensils, Zap, Bed, Star, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import UserMenu from "@/components/UserMenu";
import OCRScanner from "@/components/OCRScanner";
import { randomizeAdjacentSeats, type SeatConfig } from "@/lib/seatUtils";

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
  selectedSeat?: SeatConfig;
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



function OrderFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [bookingData, setBookingData] = useState<BookingFormData>({
    gender: "",
    nama: "",
    tipeIdentitas: "",
    nomorIdentitas: "",
    noHP: "",
    email: "",
    alamat: "",
  });

  const [passengersData, setPassengersData] = useState<PassengerData[]>([]);
  const [useBookingDataForPassenger, setUseBookingDataForPassenger] = useState(false);
  const [showFacilities, setShowFacilities] = useState(false);

  // Load ticket data from URL params or localStorage
  useEffect(() => {
    // First check if there's existing order data in localStorage (from payment page navigation back)
    const existingOrderData = localStorage.getItem('orderData');
    if (existingOrderData) {
      try {
        const parsedData = JSON.parse(existingOrderData);
        if (parsedData.ticketData && parsedData.bookingData && parsedData.passengersData) {
          // Additional validation for ticket data completeness
          const ticketData = parsedData.ticketData;
          if (ticketData.trainName && ticketData.origin && ticketData.destination && 
              ticketData.departureTime && ticketData.price && ticketData.departureDate) {
            setTicketData(parsedData.ticketData);
            setBookingData(parsedData.bookingData);
            setPassengersData(parsedData.passengersData);
            setUseBookingDataForPassenger(parsedData.useBookingDataForPassenger || false);
            return; // Exit early if data loaded from localStorage
          } else {
            console.error('Incomplete ticket data in localStorage');
            localStorage.removeItem('orderData');
          }
        }
      } catch (error) {
        console.error('Error loading existing order data:', error);
        localStorage.removeItem('orderData');
      }
    }

    // Otherwise, load from URL params
    const ticketDataParam = searchParams?.get('ticketData');
    if (ticketDataParam) {
      try {
        const parsedTicketData = JSON.parse(decodeURIComponent(ticketDataParam));
        
        // Validate required ticket data fields
        if (!parsedTicketData.trainName || !parsedTicketData.origin || !parsedTicketData.destination || 
            !parsedTicketData.departureTime || !parsedTicketData.price || !parsedTicketData.departureDate) {
          console.error('Incomplete ticket data from URL params');
          alert('Data tiket tidak lengkap. Silakan pilih tiket kembali.');
          router.push('/tickets');
          return;
        }
        
        setTicketData(parsedTicketData);
        
        // Initialize passengers data based on ticket data
        const passengers: PassengerData[] = [];
        
        // Add adults
        for (let i = 0; i < parsedTicketData.adults; i++) {
          passengers.push({
            gender: "",
            nama: "",
            tipeIdentitas: "",
            nomorIdentitas: "",
            ageCategory: 'adult'
          });
        }
        
        // Add children
        for (let i = 0; i < parsedTicketData.children; i++) {
          passengers.push({
            gender: "",
            nama: "",
            tipeIdentitas: "",
            nomorIdentitas: "",
            ageCategory: 'child'
          });
        }
        
        setPassengersData(passengers);
      } catch (error) {
        console.error('Error parsing ticket data:', error);
        // Redirect back to tickets page if data is invalid
        alert('Data tiket tidak valid. Silakan pilih tiket kembali.');
        router.push('/tickets');
        return;
      }
    } else {
      // No ticket data found, redirect to tickets page
      console.log('No ticket data found, redirecting to tickets page');
      router.push('/tickets');
      return;
    }
  }, [searchParams, router]);

  // Add timeout to redirect if no ticket data is loaded
  useEffect(() => {
    if (!ticketData) {
      const timeout = setTimeout(() => {
        console.log('Timeout: No ticket data loaded, redirecting to tickets page');
        router.push('/tickets');
      }, 5000); // 5 seconds timeout

      return () => clearTimeout(timeout);
    }
  }, [ticketData, router]);

  // Handle auto-fill checkbox
  const handleAutoFillChange = (checked: boolean) => {
    setUseBookingDataForPassenger(checked);
    if (checked && passengersData.length > 0) {
      // Auto-fill first passenger (usually the main passenger)
      const updatedPassengers = [...passengersData];
      updatedPassengers[0] = {
        ...updatedPassengers[0],
        gender: bookingData.gender,
        nama: bookingData.nama,
        tipeIdentitas: bookingData.tipeIdentitas,
        nomorIdentitas: bookingData.nomorIdentitas,
      };
      setPassengersData(updatedPassengers);
    }
  };

  // Input validation function
  const validateInput = (field: string, value: string): string => {
    switch (field) {
      case 'nomorIdentitas':
        // Only allow numbers for identity numbers
        return value.replace(/[^0-9]/g, '');
      case 'noHP':
        // Only allow numbers and plus sign for phone numbers
        return value.replace(/[^0-9+]/g, '');
      case 'email':
        // Allow email characters (letters, numbers, @, ., -, _)
        return value.replace(/[^a-zA-Z0-9@._-]/g, '').toLowerCase();
      case 'nama':
        // Only allow letters and spaces for names
        return value.replace(/[^a-zA-Z\s]/g, '');
      case 'alamat':
        // Allow letters, numbers, spaces, and common punctuation for addresses
        return value.replace(/[^a-zA-Z0-9\s.,/-]/g, '');
      default:
        return value;
    }
  };

  const handleBookingDataChange = (field: keyof BookingFormData, value: string) => {
    const validatedValue = validateInput(field, value);
    setBookingData(prev => ({ ...prev, [field]: validatedValue }));
    
    // Auto-update first passenger data if checkbox is checked
    if (useBookingDataForPassenger && passengersData.length > 0) {
      const relevantFields = ['gender', 'nama', 'tipeIdentitas', 'nomorIdentitas'];
      if (relevantFields.includes(field)) {
        const updatedPassengers = [...passengersData];
        updatedPassengers[0] = {
          ...updatedPassengers[0],
          [field]: validatedValue
        };
        setPassengersData(updatedPassengers);
      }
    }
  };

  const handlePassengerDataChange = (passengerIndex: number, field: keyof PassengerData, value: string) => {
    if (field === 'ageCategory') return; // Age category is set automatically
    
    const validatedValue = validateInput(field, value);
    const updatedPassengers = [...passengersData];
    updatedPassengers[passengerIndex] = {
      ...updatedPassengers[passengerIndex],
      [field]: validatedValue
    };
    setPassengersData(updatedPassengers);
  };

  // OCR data extraction handler
  const handleOCRDataExtracted = (passengerIndex: number, ocrData: { nama?: string; nomorIdentitas?: string; tipeIdentitas?: 'nik' | 'paspor'; gender?: string }) => {
    const updatedPassengers = [...passengersData];
    const currentPassenger = updatedPassengers[passengerIndex];
    
    // Update passenger data with OCR results
    if (ocrData.nama) {
      currentPassenger.nama = ocrData.nama;
    }
    if (ocrData.nomorIdentitas) {
      currentPassenger.nomorIdentitas = ocrData.nomorIdentitas;
    }
    if (ocrData.tipeIdentitas) {
      currentPassenger.tipeIdentitas = ocrData.tipeIdentitas;
    }
    if (ocrData.gender) {
      currentPassenger.gender = ocrData.gender;
    }
    
    updatedPassengers[passengerIndex] = currentPassenger;
    setPassengersData(updatedPassengers);
  };

  // OCR data extraction handler for booking data
  const handleBookingOCRDataExtracted = (ocrData: { nama?: string; nomorIdentitas?: string; tipeIdentitas?: 'nik' | 'paspor'; gender?: string }) => {
    const updatedBookingData = { ...bookingData };
    
    // Update booking data with OCR results
    if (ocrData.nama) {
      updatedBookingData.nama = ocrData.nama;
    }
    if (ocrData.nomorIdentitas) {
      updatedBookingData.nomorIdentitas = ocrData.nomorIdentitas;
    }
    if (ocrData.tipeIdentitas) {
      updatedBookingData.tipeIdentitas = ocrData.tipeIdentitas;
    }
    if (ocrData.gender) {
      updatedBookingData.gender = ocrData.gender;
    }
    
    setBookingData(updatedBookingData);
    
    // Auto-update first passenger data if checkbox is checked
    if (useBookingDataForPassenger && passengersData.length > 0) {
      const updatedPassengers = [...passengersData];
      updatedPassengers[0] = {
        ...updatedPassengers[0],
        nama: ocrData.nama || updatedPassengers[0].nama,
        nomorIdentitas: ocrData.nomorIdentitas || updatedPassengers[0].nomorIdentitas,
        tipeIdentitas: ocrData.tipeIdentitas || updatedPassengers[0].tipeIdentitas,
        gender: ocrData.gender || updatedPassengers[0].gender,
      };
      setPassengersData(updatedPassengers);
    }
  };

  const handleProceedToSummary = () => {
    // Validate ticket data exists
    if (!ticketData) {
      alert("Data tiket tidak ditemukan. Silakan pilih tiket kembali.");
      router.push('/tickets');
      return;
    }
    
    if (!bookingData.nama.trim()) {
      alert("Mohon isi nama pemesan");
      return;
    }
    if (!bookingData.tipeIdentitas) {
      alert("Mohon pilih tipe identitas");
      return;
    }
    if (!bookingData.nomorIdentitas.trim()) {
      alert("Mohon isi nomor identitas");
      return;
    }
    if (bookingData.tipeIdentitas === 'nik' && bookingData.nomorIdentitas.length !== 16) {
      alert("NIK harus terdiri dari 16 digit");
      return;
    }
    if (!bookingData.noHP.trim()) {
      alert("Mohon isi nomor HP");
      return;
    }
    if (bookingData.noHP.length < 10 || bookingData.noHP.length > 15) {
      alert("Nomor HP harus terdiri dari 10-15 digit");
      return;
    }
    if (!bookingData.email.trim()) {
      alert("Mohon isi email");
      return;  
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.email)) {
      alert("Format email tidak valid");
      return;
    }

    // Validate passengers data exists
    if (!passengersData || passengersData.length === 0) {
      alert("Data penumpang tidak ditemukan. Silakan refresh halaman.");
      return;
    }
    
    // Validasi data semua penumpang
    for (let i = 0; i < passengersData.length; i++) {
      const passenger = passengersData[i];
      if (!passenger.nama.trim()) {
        alert(`Mohon isi nama penumpang ${i + 1}`);
        return;
      }
      if (!passenger.gender) {
        alert(`Mohon pilih jenis kelamin penumpang ${i + 1}`);
        return;
      }
      if (!passenger.tipeIdentitas) {
        alert(`Mohon pilih tipe identitas penumpang ${i + 1}`);
        return;
      }
      if (!passenger.nomorIdentitas.trim()) {
        alert(`Mohon isi nomor identitas penumpang ${i + 1}`);
        return;
      }
      if (passenger.tipeIdentitas === 'nik' && passenger.nomorIdentitas.length !== 16) {
        alert(`NIK penumpang ${i + 1} harus terdiri dari 16 digit`);
        return;
      }
    }

    // Auto-assign seats untuk penumpang yang belum punya selectedSeat
    const passengersWithSeats = passengersData.map((passenger, index) => {
      if (!passenger.selectedSeat || !passenger.selectedSeat.seatNumber) {
        console.log(`🎲 Auto-assigning seat for passenger ${index + 1}: ${passenger.nama}`);
        return passenger; // Will be assigned later in batch
      }
      return passenger;
    });

    // Get occupied seats from passengers yang sudah pilih
    const occupiedSeats = passengersData
      .filter(p => p.selectedSeat && p.selectedSeat.seatNumber)
      .map(p => p.selectedSeat!.seatNumber);

    // Count passengers yang belum punya seat
    const passengersNeedingSeats = passengersData.filter(
      p => !p.selectedSeat || !p.selectedSeat.seatNumber
    );

    if (passengersNeedingSeats.length > 0) {
      console.log(`🎲 Auto-assigning ${passengersNeedingSeats.length} seats...`);
      
      // Generate random adjacent seats
      const randomSeats = randomizeAdjacentSeats(
        ticketData.class,
        occupiedSeats,
        passengersNeedingSeats.length
      );

      if (randomSeats.length < passengersNeedingSeats.length) {
        alert('Kursi tidak tersedia cukup. Silakan pilih manual atau kurangi jumlah penumpang.');
        return;
      }

      // Assign random seats to passengers
      let seatIndex = 0;
      passengersData.forEach(passenger => {
        if (!passenger.selectedSeat || !passenger.selectedSeat.seatNumber) {
          passenger.selectedSeat = randomSeats[seatIndex];
          console.log(`✅ Assigned ${randomSeats[seatIndex].seatNumber} to ${passenger.nama}`);
          seatIndex++;
        }
      });

      console.log('🎫 All passengers now have seats:', passengersData.map(p => ({
        name: p.nama,
        seat: p.selectedSeat?.seatNumber
      })));
    }

    // Prepare data untuk summary
    const orderData = {
      ticketData,
      bookingData,
      passengersData,
      useBookingDataForPassenger
    };

    try {
      // Store order data in localStorage for summary page
      localStorage.setItem('orderData', JSON.stringify(orderData));
      
      console.log("Order Data:", orderData);
      
      // Navigate to summary page
      router.push('/summary');
    } catch (error) {
      console.error('Error saving order data:', error);
      alert('Terjadi kesalahan saat menyimpan data. Silakan coba lagi.');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const getFacilityIcon = (facility: string) => {
    switch (facility.toLowerCase()) {
      case 'ac':
        return <Zap className="w-3 h-3" />;
      case 'makanan':
      case 'meals':
        return <Utensils className="w-3 h-3" />;
      case 'wifi':
        return <Wifi className="w-3 h-3" />;
      case 'colokan listrik':
      case 'power':
        return <Zap className="w-3 h-3" />;
      case 'selimut':
      case 'blanket':
        return <Bed className="w-3 h-3" />;
      default:
        return <Star className="w-3 h-3" />;
    }
  };

  const getClassBadgeColor = (trainClass: string) => {
    switch (trainClass?.toLowerCase()) {
      case 'eksekutif':
        return 'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300 shadow-sm';
      case 'bisnis':
        return 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300 shadow-sm';
      case 'ekonomi':
        return 'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300 shadow-sm';
      default:
        return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 border-gray-300 shadow-sm';
    }
  };

  if (!ticketData) {
    return (
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data tiket...</p>
          <p className="mt-2 text-sm text-gray-500">Jika halaman tidak termuat dalam 5 detik, Anda akan diarahkan ke halaman pilih tiket</p>
          <button 
            onClick={() => router.push('/tickets')} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Pilih Tiket Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Header with Back Button and User Menu */}
        <div className="flex justify-between items-center mb-4 sm:mb-6 gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              if (ticketData) {
                const params = new URLSearchParams({
                  origin: ticketData.origin,
                  destination: ticketData.destination,
                  adults: ticketData.adults.toString(),
                  children: ticketData.children.toString(),
                  departureDate: ticketData.departureDate,
                  isDifabel: ticketData.isDifabel.toString(),
                  isPulangPergi: ticketData.isPulangPergi.toString()
                });
                router.push(`/tickets?${params.toString()}`);
              } else {
                router.push('/tickets');
              }
            }}
            className="bg-white/90 backdrop-blur-md hover:bg-white"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Kembali ke Daftar Tiket</span>
            <span className="sm:hidden">Kembali</span>
          </Button>
          <UserMenu />
        </div>

        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Form Pemesanan Tiket Kereta Api</h1>
          <p className="text-xs sm:text-sm text-gray-600">Lengkapi data pemesanan dan data penumpang untuk melanjutkan</p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-3">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            
            {/* Data Pemesanan */}
            <div className="shadow-lg bg-white hover:shadow-xl transition-all duration-300 overflow-hidden rounded-lg">
              <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-gray-100 p-4 sm:p-6 rounded-t-lg">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-base sm:text-xl font-bold text-gray-800 truncate">Data Pemesanan</div>
                      <div className="text-xs sm:text-sm text-gray-600 truncate">Masukkan data pemesan tiket</div>
                    </div>
                  </div>
                  
                  {/* OCR Scanner Button for Booking Data */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <OCRScanner
                      passengerIndex={-1}
                      onDataExtracted={handleBookingOCRDataExtracted}
                    />
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="booker-gender" className="text-xs sm:text-sm font-medium text-gray-700">Jenis Kelamin</Label>
                    <Select value={bookingData.gender} onValueChange={(value) => handleBookingDataChange('gender', value)}>
                      <SelectTrigger className="mt-1 h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tuan">Tuan</SelectItem>
                        <SelectItem value="nona">Nona</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="booker-name" className="text-xs sm:text-sm font-medium text-gray-700">Nama Pemesan</Label>
                    <Input
                      id="booker-name"
                      type="text"
                      value={bookingData.nama}
                      onChange={(e) => handleBookingDataChange('nama', e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500 mt-1">Hanya huruf dan spasi</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="booker-id-type" className="text-xs sm:text-sm font-medium text-gray-700">Tipe Identitas</Label>
                    <Select value={bookingData.tipeIdentitas} onValueChange={(value) => handleBookingDataChange('tipeIdentitas', value)}>
                      <SelectTrigger className="mt-1 h-9 sm:h-10 text-xs sm:text-sm">
                        <SelectValue placeholder="Pilih tipe identitas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nik">NIK (KTP)</SelectItem>
                        <SelectItem value="paspor">Paspor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="booker-id-number" className="text-xs sm:text-sm font-medium text-gray-700">Nomor Identitas</Label>
                    <Input
                      id="booker-id-number"
                      type="text"
                      value={bookingData.nomorIdentitas}
                      onChange={(e) => handleBookingDataChange('nomorIdentitas', e.target.value)}
                      placeholder="Masukkan nomor identitas"
                      className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                      maxLength={20}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {bookingData.tipeIdentitas === 'nik' ? 'NIK: 16 digit angka' : 'Hanya angka'}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="booker-phone" className="text-xs sm:text-sm font-medium text-gray-700">No. HP Pemesan</Label>
                  <Input
                    id="booker-phone"
                    type="tel"
                    value={bookingData.noHP}
                    onChange={(e) => handleBookingDataChange('noHP', e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                    maxLength={15}
                    minLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: 10-15 digit angka</p>
                </div>

                <div>
                  <Label htmlFor="booker-email" className="text-xs sm:text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    id="booker-email"
                    type="email"
                    value={bookingData.email}
                    onChange={(e) => handleBookingDataChange('email', e.target.value)}
                    placeholder="Contoh: nama@email.com"
                    className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="booker-address" className="text-xs sm:text-sm font-medium text-gray-700">Alamat Lengkap</Label>
                  <Input
                    id="booker-address"
                    value={bookingData.alamat}
                    onChange={(e) => handleBookingDataChange('alamat', e.target.value)}
                    placeholder="Masukkan alamat lengkap"
                    className="mt-1 h-9 sm:h-10 text-xs sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Checkbox Auto-fill */}
            <div className="shadow-lg bg-white hover:shadow-xl transition-all duration-300 rounded-lg">
              <div className="p-4 sm:p-6">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Checkbox
                    id="auto-fill"
                    checked={useBookingDataForPassenger}
                    onCheckedChange={handleAutoFillChange}
                  />
                  <Label htmlFor="auto-fill" className="text-xs sm:text-sm font-medium text-gray-700">
                    Gunakan data pemesan sebagai penumpang pertama
                  </Label>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-6 sm:ml-7">Centang jika pemesan adalah penumpang pertama</p>
              </div>
            </div>

            {/* Data Penumpang - Dynamic sections */}
            {passengersData.map((passenger, index) => (
              <div key={index} className="shadow-lg bg-white hover:shadow-xl transition-all duration-300 overflow-hidden rounded-lg">
                <div className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-b border-gray-100 p-4 sm:p-6 rounded-t-lg">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-base sm:text-xl font-bold text-gray-800 flex items-center gap-2 flex-wrap">
                          <span>Data Penumpang {index + 1}</span>
                          {passenger.ageCategory === 'child' && (
                            <Badge className="bg-orange-100 text-orange-800 text-xs">Anak-anak</Badge>
                          )}
                          {passenger.ageCategory === 'adult' && (
                            <Badge className="bg-blue-100 text-blue-800 text-xs">Dewasa</Badge>
                          )}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 truncate">
                          Masukkan data penumpang sesuai identitas resmi
                        </div>
                      </div>
                    </div>
                    
                    {/* OCR Scanner Button */}
                    {!(useBookingDataForPassenger && index === 0) && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <OCRScanner
                          passengerIndex={index}
                          onDataExtracted={(data) => handleOCRDataExtracted(index, data)}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor={`passenger-${index}-gender`} className="text-xs sm:text-sm font-medium text-gray-700">Jenis Kelamin</Label>
                      <Select 
                        value={passenger.gender} 
                        onValueChange={(value) => handlePassengerDataChange(index, 'gender', value)}
                        disabled={useBookingDataForPassenger && index === 0}
                      >
                        <SelectTrigger className={`mt-1 h-9 sm:h-10 text-xs sm:text-sm ${useBookingDataForPassenger && index === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                          <SelectValue placeholder="Pilih jenis kelamin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tuan">Tuan</SelectItem>
                          <SelectItem value="nona">Nona</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`passenger-${index}-name`} className="text-xs sm:text-sm font-medium text-gray-700">Nama Penumpang</Label>
                      <Input
                        id={`passenger-${index}-name`}
                        type="text"
                        value={passenger.nama}
                        onChange={(e) => handlePassengerDataChange(index, 'nama', e.target.value)}
                        disabled={useBookingDataForPassenger && index === 0}
                        placeholder="Masukkan nama lengkap"
                        className={`mt-1 h-9 sm:h-10 text-xs sm:text-sm ${useBookingDataForPassenger && index === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        maxLength={50}
                      />
                      {!(useBookingDataForPassenger && index === 0) && (
                        <p className="text-xs text-gray-500 mt-1">Hanya huruf dan spasi</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor={`passenger-${index}-id-type`} className="text-xs sm:text-sm font-medium text-gray-700">Tipe Identitas</Label>
                      <Select 
                        value={passenger.tipeIdentitas} 
                        onValueChange={(value) => handlePassengerDataChange(index, 'tipeIdentitas', value)}
                        disabled={useBookingDataForPassenger && index === 0}
                      >
                        <SelectTrigger className={`mt-1 h-9 sm:h-10 text-xs sm:text-sm ${useBookingDataForPassenger && index === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                          <SelectValue placeholder="Pilih tipe identitas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nik">NIK (KTP)</SelectItem>
                          <SelectItem value="paspor">Paspor</SelectItem>
                          {passenger.ageCategory === 'child' && (
                            <SelectItem value="kartu-keluarga">Kartu Keluarga</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`passenger-${index}-id-number`} className="text-xs sm:text-sm font-medium text-gray-700">Nomor Identitas</Label>
                      <Input
                        id={`passenger-${index}-id-number`}
                        type="text"
                        value={passenger.nomorIdentitas}
                        onChange={(e) => handlePassengerDataChange(index, 'nomorIdentitas', e.target.value)}
                        disabled={useBookingDataForPassenger && index === 0}
                        placeholder="Masukkan nomor identitas"
                        className={`mt-1 h-9 sm:h-10 text-xs sm:text-sm ${useBookingDataForPassenger && index === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        maxLength={20}
                      />
                      {!(useBookingDataForPassenger && index === 0) && (
                        <p className="text-xs text-gray-500 mt-1">
                          {passenger.tipeIdentitas === 'nik' ? 'NIK: 16 digit angka' : 'Hanya angka'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Ketentuan Reservasi */}
            <div className="shadow-lg bg-white hover:shadow-xl transition-all duration-300 overflow-hidden rounded-lg">
              <div className="bg-gradient-to-r from-orange-50/50 to-amber-50/50 border-b border-gray-100 p-4 sm:p-6 rounded-t-lg">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-600 to-amber-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base sm:text-xl font-bold text-gray-800 truncate">Ketentuan & Syarat Reservasi</div>
                    <div className="text-xs sm:text-sm text-gray-600 truncate">Harap baca dan pahami syarat dan ketentuan</div>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-700">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <p>Tunjukkan identitas asli saat check-in sesuai dengan data yang didaftarkan</p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <p>Check-in paling lambat 30 menit sebelum keberangkatan untuk kereta jarak jauh</p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <p>Pembatalan tiket dapat dilakukan maksimal 3 jam sebelum keberangkatan</p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <p>Tiket yang sudah dibeli tidak dapat diubah jadwal atau rute perjalanan</p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <p>Pastikan data yang dimasukkan sudah benar dan sesuai dengan identitas resmi</p>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
                    <p>Penumpang anak-anak harus didampingi oleh orang dewasa</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Ticket Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-4 sm:top-8 shadow-xl bg-white overflow-hidden rounded-lg">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6 rounded-t-lg">
                <div className="flex items-center gap-2 text-white">
                  <Train className="w-4 h-4 sm:w-5 sm:h-5"/>
                  <span className="text-base sm:text-lg font-semibold">Ringkasan Pemesanan</span>
                </div>
              </div>
              <div className="p-0">
                {/* Train Info */}
                <div className="p-3 sm:p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0 pr-2 sm:pr-3">
                      <h3 className="font-bold text-base sm:text-lg text-gray-800 mb-1 break-words leading-tight">
                        {ticketData.trainName || 'Nama Kereta Tidak Tersedia'}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${getClassBadgeColor(ticketData.class)} font-medium text-xs px-2 py-1`}>
                          {ticketData.class}
                        </Badge>
                        <span className="text-xs text-gray-600">{ticketData.trainNumber}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-gray-600">Tanggal</div>
                      <div className="font-semibold text-xs sm:text-sm text-gray-800">
                        {new Date(ticketData.departureDate).toLocaleDateString('id-ID', { 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2.5 sm:p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1 min-w-0">
                        <div className="text-lg sm:text-xl font-bold text-gray-800">{ticketData.departureTime || '--:--'}</div>
                        <div className="text-xs font-medium text-gray-600 mt-1 break-words px-1">{ticketData.origin || 'Stasiun Asal'}</div>
                      </div>
                      <div className="flex-shrink-0 mx-1.5 sm:mx-2 flex items-center justify-center">
                        <div className="flex items-center gap-0.5 sm:gap-1 text-xs text-gray-600">
                          <div className="w-2 sm:w-3 h-0.5 bg-gray-300"></div>
                          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                          <div className="w-2 sm:w-3 h-0.5 bg-gray-300"></div>
                        </div>
                      </div>
                      <div className="text-center flex-1 min-w-0">
                        <div className="text-lg sm:text-xl font-bold text-gray-800">{ticketData.arrivalTime || '--:--'}</div>
                        <div className="text-xs font-medium text-gray-600 mt-1 break-words px-1">{ticketData.destination || 'Stasiun Tujuan'}</div>
                      </div>
                    </div>
                    <div className="text-center text-xs text-gray-600 mt-2">
                      Durasi: {ticketData.duration}
                    </div>
                  </div>
                </div>

                {/* Facilities */}
                <div className="border-b border-gray-100">
                  <button
                    onClick={() => setShowFacilities(!showFacilities)}
                    className="w-full flex items-center justify-between text-left hover:bg-gray-50 px-3 sm:px-4 py-3 sm:py-4 transition-colors"
                  >
                    <h4 className="font-semibold text-xs sm:text-sm text-gray-800">Fasilitas Tersedia</h4>
                    {showFacilities ? (
                      <ChevronUp className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    )}
                  </button>
                  
                  <div className={`overflow-hidden transition-all duration-300 ${showFacilities ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                        {ticketData.facilities.map((facility: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-md whitespace-nowrap flex-shrink-0">
                            <div className="text-blue-600 flex-shrink-0">
                              {getFacilityIcon(facility)}
                            </div>
                            <span>{facility}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passenger Info */}
                <div className="p-3 sm:p-4 border-b border-gray-100">
                  <h4 className="font-semibold text-xs sm:text-sm text-gray-800 mb-2">Detail Penumpang</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">Total Penumpang</span>
                      <span className="font-medium text-xs sm:text-sm">{ticketData.passengers} Orang</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">Dewasa</span>
                      <span className="font-medium">{ticketData.adults} Orang</span>
                    </div>
                    {ticketData.children > 0 && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-600">Anak-anak</span>
                        <span className="font-medium">{ticketData.children} Orang</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price */}
                <div className="p-3 sm:p-4">
                  <div className="space-y-1 sm:space-y-1.5 mb-2 sm:mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Harga per tiket</span>
                      <span className="font-medium">{formatPrice(ticketData.price)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Jumlah penumpang</span>
                      <span className="font-medium">{ticketData.passengers}x</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-2 sm:pt-3 mb-3 sm:mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs sm:text-sm font-semibold text-gray-800">Total Harga</span>
                      <span className="text-base sm:text-lg font-bold text-blue-600">
                        {formatPrice(ticketData.totalPrice)}
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleProceedToSummary}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 h-9 sm:h-auto"
                  >
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Lanjutkan ke Ringkasan
                  </Button>
                  
                  <div className="text-xs text-gray-500 text-center mt-2">
                    Pembayaran aman & terpercaya
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat form pemesanan...</p>
        </div>
      </div>
    }>
      <OrderFormContent />
    </Suspense>
  );
}
