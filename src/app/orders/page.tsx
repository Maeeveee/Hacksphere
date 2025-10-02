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
import { ArrowLeft, Clock, MapPin, Train, Users, CreditCard, Wifi, Utensils, Zap, Bed, Star, CheckCircle, AlertCircle } from "lucide-react";

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

// Sample ticket data for fallback
const getSampleTicketData = (): TicketData => ({
  trainId: "1",
  trainName: "Argo Parahyangan",
  trainNumber: "ARGO 205",
  origin: "Jakarta",
  destination: "Bandung",
  departureTime: "08:00",
  arrivalTime: "11:30",
  duration: "3h 30m",
  class: "Eksekutif",
  price: 200000,
  facilities: ["WiFi", "AC", "Makanan"],
  availableSeats: 50,
  passengers: 1,
  adults: 1,
  children: 0,
  departureDate: "2024-01-15",
  totalPrice: 200000,
  isDifabel: false,
  isPulangPergi: false
});

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

  // Load ticket data from URL params
  useEffect(() => {
    const ticketDataParam = searchParams?.get('ticketData');
    if (ticketDataParam) {
      try {
        const parsedTicketData = JSON.parse(decodeURIComponent(ticketDataParam));
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
        // Fallback to sample data
        setTicketData(getSampleTicketData());
        setPassengersData([{
          gender: "",
          nama: "",
          tipeIdentitas: "",
          nomorIdentitas: "",
          ageCategory: 'adult'
        }]);
      }
    } else {
      // Fallback to sample data
      setTicketData(getSampleTicketData());
      setPassengersData([{
        gender: "",
        nama: "",
        tipeIdentitas: "",
        nomorIdentitas: "",
        ageCategory: 'adult'
      }]);
    }
  }, [searchParams]);

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

  const handleProceedToPayment = () => {
    
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
    router.push('/orders/payment');
    
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

    // Prepare data untuk payment
    const orderData = {
      ticketData,
      bookingData,
      passengersData,
      useBookingDataForPassenger
    };

    console.log("Order Data:", orderData);
    alert("Data berhasil disimpan! Lanjut ke pembayaran...");
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
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Button 
          variant="outline" 
          onClick={() => router.back()}
          className="mb-6 bg-white/90 backdrop-blur-md hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Daftar Tiket
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Form Pemesanan Tiket Kereta Api</h1>
          <p className="text-gray-600">Lengkapi data pemesanan dan data penumpang untuk melanjutkan</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Data Pemesanan */}
            <Card className="shadow-lg border border-gray-200 bg-white hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b border-gray-100">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-800">Data Pemesanan</div>
                    <div className="text-sm text-gray-600">Masukkan data pemesan tiket</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="booker-gender" className="text-sm font-medium text-gray-700">Jenis Kelamin</Label>
                    <Select value={bookingData.gender} onValueChange={(value) => handleBookingDataChange('gender', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tuan">Tuan</SelectItem>
                        <SelectItem value="nyonya">Nyonya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="booker-name" className="text-sm font-medium text-gray-700">Nama Pemesan</Label>
                    <Input
                      id="booker-name"
                      type="text"
                      value={bookingData.nama}
                      onChange={(e) => handleBookingDataChange('nama', e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      className="mt-1"
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500 mt-1">Hanya huruf dan spasi</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="booker-id-type" className="text-sm font-medium text-gray-700">Tipe Identitas</Label>
                    <Select value={bookingData.tipeIdentitas} onValueChange={(value) => handleBookingDataChange('tipeIdentitas', value)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Pilih tipe identitas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nik">NIK (KTP)</SelectItem>
                        <SelectItem value="paspor">Paspor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="booker-id-number" className="text-sm font-medium text-gray-700">Nomor Identitas</Label>
                    <Input
                      id="booker-id-number"
                      type="text"
                      value={bookingData.nomorIdentitas}
                      onChange={(e) => handleBookingDataChange('nomorIdentitas', e.target.value)}
                      placeholder="Masukkan nomor identitas"
                      className="mt-1"
                      maxLength={20}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {bookingData.tipeIdentitas === 'nik' ? 'NIK: 16 digit angka' : 'Hanya angka'}
                    </p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="booker-phone" className="text-sm font-medium text-gray-700">No. HP Pemesan</Label>
                  <Input
                    id="booker-phone"
                    type="tel"
                    value={bookingData.noHP}
                    onChange={(e) => handleBookingDataChange('noHP', e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="mt-1"
                    maxLength={15}
                    minLength={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format: 10-15 digit angka</p>
                </div>

                <div>
                  <Label htmlFor="booker-email" className="text-sm font-medium text-gray-700">Email</Label>
                  <Input
                    id="booker-email"
                    type="email"
                    value={bookingData.email}
                    onChange={(e) => handleBookingDataChange('email', e.target.value)}
                    placeholder="Contoh: nama@email.com"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="booker-address" className="text-sm font-medium text-gray-700">Alamat Lengkap</Label>
                  <Input
                    id="booker-address"
                    value={bookingData.alamat}
                    onChange={(e) => handleBookingDataChange('alamat', e.target.value)}
                    placeholder="Masukkan alamat lengkap"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Checkbox Auto-fill */}
            <Card className="shadow-lg border border-gray-200 bg-white hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="auto-fill"
                    checked={useBookingDataForPassenger}
                    onCheckedChange={handleAutoFillChange}
                  />
                  <Label htmlFor="auto-fill" className="text-sm font-medium text-gray-700">
                    Gunakan data pemesan sebagai penumpang pertama
                  </Label>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-6">Centang jika pemesan adalah penumpang pertama</p>
              </CardContent>
            </Card>

            {/* Data Penumpang - Dynamic sections */}
            {passengersData.map((passenger, index) => (
              <Card key={index} className="shadow-lg border border-gray-200 bg-white hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-green-50/50 to-emerald-50/50 border-b border-gray-100">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="text-xl font-bold text-gray-800">
                        Data Penumpang {index + 1}
                        {passenger.ageCategory === 'child' && (
                          <Badge className="ml-2 bg-orange-100 text-orange-800 text-xs">Anak-anak</Badge>
                        )}
                        {passenger.ageCategory === 'adult' && (
                          <Badge className="ml-2 bg-blue-100 text-blue-800 text-xs">Dewasa</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        Masukkan data penumpang sesuai identitas resmi
                      </div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`passenger-${index}-gender`} className="text-sm font-medium text-gray-700">Jenis Kelamin</Label>
                      <Select 
                        value={passenger.gender} 
                        onValueChange={(value) => handlePassengerDataChange(index, 'gender', value)}
                        disabled={useBookingDataForPassenger && index === 0}
                      >
                        <SelectTrigger className={`mt-1 ${useBookingDataForPassenger && index === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                          <SelectValue placeholder="Pilih jenis kelamin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tuan">Tuan</SelectItem>
                          <SelectItem value="nyonya">Nyonya</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor={`passenger-${index}-name`} className="text-sm font-medium text-gray-700">Nama Penumpang</Label>
                      <Input
                        id={`passenger-${index}-name`}
                        type="text"
                        value={passenger.nama}
                        onChange={(e) => handlePassengerDataChange(index, 'nama', e.target.value)}
                        disabled={useBookingDataForPassenger && index === 0}
                        placeholder="Masukkan nama lengkap"
                        className={`mt-1 ${useBookingDataForPassenger && index === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        maxLength={50}
                      />
                      {!(useBookingDataForPassenger && index === 0) && (
                        <p className="text-xs text-gray-500 mt-1">Hanya huruf dan spasi</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor={`passenger-${index}-id-type`} className="text-sm font-medium text-gray-700">Tipe Identitas</Label>
                      <Select 
                        value={passenger.tipeIdentitas} 
                        onValueChange={(value) => handlePassengerDataChange(index, 'tipeIdentitas', value)}
                        disabled={useBookingDataForPassenger && index === 0}
                      >
                        <SelectTrigger className={`mt-1 ${useBookingDataForPassenger && index === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
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
                      <Label htmlFor={`passenger-${index}-id-number`} className="text-sm font-medium text-gray-700">Nomor Identitas</Label>
                      <Input
                        id={`passenger-${index}-id-number`}
                        type="text"
                        value={passenger.nomorIdentitas}
                        onChange={(e) => handlePassengerDataChange(index, 'nomorIdentitas', e.target.value)}
                        disabled={useBookingDataForPassenger && index === 0}
                        placeholder="Masukkan nomor identitas"
                        className={`mt-1 ${useBookingDataForPassenger && index === 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        maxLength={20}
                      />
                      {!(useBookingDataForPassenger && index === 0) && (
                        <p className="text-xs text-gray-500 mt-1">
                          {passenger.tipeIdentitas === 'nik' ? 'NIK: 16 digit angka' : 'Hanya angka'}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Ketentuan Reservasi */}
            <Card className="shadow-lg border border-gray-200 bg-white hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-orange-50/50 to-amber-50/50 border-b border-gray-100">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-amber-600 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-800">Ketentuan & Syarat Reservasi</div>
                    <div className="text-sm text-gray-600">Harap baca dan pahami syarat dan ketentuan</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Tunjukkan identitas asli saat check-in sesuai dengan data yang didaftarkan</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Check-in paling lambat 30 menit sebelum keberangkatan untuk kereta jarak jauh</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Pembatalan tiket dapat dilakukan maksimal 3 jam sebelum keberangkatan</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Tiket yang sudah dibeli tidak dapat diubah jadwal atau rute perjalanan</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Pastikan data yang dimasukkan sudah benar dan sesuai dengan identitas resmi</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Penumpang anak-anak harus didampingi oleh orang dewasa</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Ticket Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8 shadow-xl border border-gray-200 bg-white overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Train className="w-5 h-5"/>
                  Ringkasan Pemesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Train Info */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-3">
                      <h3 className="font-bold text-lg text-gray-800 mb-1 break-words leading-tight">{ticketData.trainName}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${getClassBadgeColor(ticketData.class)} font-medium text-xs px-2 py-1`}>
                          {ticketData.class}
                        </Badge>
                        <span className="text-xs text-gray-600">{ticketData.trainNumber}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-gray-600">Tanggal</div>
                      <div className="font-semibold text-sm text-gray-800">
                        {new Date(ticketData.departureDate).toLocaleDateString('id-ID', { 
                          day: 'numeric', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Schedule */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1 min-w-0">
                        <div className="text-xl font-bold text-gray-800">{ticketData.departureTime}</div>
                        <div className="text-xs font-medium text-gray-600 mt-1 break-words px-1">{ticketData.origin}</div>
                      </div>
                      <div className="flex-shrink-0 mx-2 flex items-center justify-center">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <div className="w-3 h-0.5 bg-gray-300"></div>
                          <Clock className="w-3 h-3" />
                          <div className="w-3 h-0.5 bg-gray-300"></div>
                        </div>
                      </div>
                      <div className="text-center flex-1 min-w-0">
                        <div className="text-xl font-bold text-gray-800">{ticketData.arrivalTime}</div>
                        <div className="text-xs font-medium text-gray-600 mt-1 break-words px-1">{ticketData.destination}</div>
                      </div>
                    </div>
                    <div className="text-center text-xs text-gray-600 mt-2">
                      Durasi: {ticketData.duration}
                    </div>
                  </div>
                </div>

                {/* Facilities */}
                <div className="p-4 border-b border-gray-100">
                  <h4 className="font-semibold text-sm text-gray-800 mb-2">Fasilitas Tersedia</h4>
                  <div className="grid grid-cols-1 gap-1.5">
                    {ticketData.facilities.map((facility: string, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded-md">
                        <div className="text-blue-600 flex-shrink-0">
                          {getFacilityIcon(facility)}
                        </div>
                        <span className="truncate">{facility}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Passenger Info */}
                <div className="p-4 border-b border-gray-100">
                  <h4 className="font-semibold text-sm text-gray-800 mb-2">Detail Penumpang</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">Total Penumpang</span>
                      <span className="font-medium text-sm">{ticketData.passengers} Orang</span>
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
                <div className="p-4">
                  <div className="space-y-1.5 mb-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Harga per tiket</span>
                      <span className="font-medium">{formatPrice(ticketData.price)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Jumlah penumpang</span>
                      <span className="font-medium">{ticketData.passengers}x</span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-800">Total Harga</span>
                      <span className="text-lg font-bold text-blue-600">
                        {formatPrice(ticketData.totalPrice)}
                      </span>
                    </div>
                  </div>

                  <Button 
                    onClick={handleProceedToPayment}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2.5 text-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Lanjut ke Pembayaran
                  </Button>
                  
                  <div className="text-xs text-gray-500 text-center mt-2">
                    Pembayaran aman & terpercaya
                  </div>
                </div>
              </CardContent>
            </Card>
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
