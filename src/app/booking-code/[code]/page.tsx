"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Train, MapPin, Clock, User, CreditCard, CheckCircle, Wifi, Utensils, Zap, Bed, Calendar } from "lucide-react";
import UserMenu from "@/components/UserMenu";
import { getTiketByBookingCode, type TiketQRData } from "@/lib/supabase/queries";

interface TicketInfo {
  trainName: string;
  trainNumber: string;
  bookingCode: string;
  passengerName: string;
  origin: string;
  destination: string;
  departureDate: string;
  arrivalDate: string;
  seatClass: string;
  seatNumber: string;
  qrCodeValue: string;
  ticketData?: any;
  bookingData?: any;
  passengersData?: any[];
  paymentStatus?: string;
  totalPrice?: number;
}

export default function BookingCodePage() {
  const params = useParams();
  const router = useRouter();
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bookingCode = params?.code as string;

  useEffect(() => {
    if (!bookingCode) {
      setError("Kode booking tidak valid");
      setIsLoading(false);
      return;
    }

    // Get ticket data from database OR localStorage
    const fetchTicketData = async () => {
      try {
        console.log('🔍 Fetching ticket data for booking code:', bookingCode);
        
        // STEP 1: Coba ambil dari database dulu
        const { data: dbData, error: dbError } = await getTiketByBookingCode(bookingCode);
        
        if (dbData && !dbError) {
          console.log('✅ Ticket found in DATABASE:', dbData);
          console.log('📋 Seat info from DB:', {
            passengers: dbData.passengers_data?.length,
            seats: dbData.passengers_data?.map((p: any) => p.selectedSeat?.seatNumber)
          });
          const ticketInfo = convertTiketToTicketInfo(dbData);
          console.log('🎫 Converted ticket info:', ticketInfo);
          setTicketInfo(ticketInfo);
          setIsLoading(false);
          return;
        } else {
          console.log('ℹ️ Ticket not found in database, checking localStorage...');
          if (dbError) {
            console.log('Database error:', dbError);
          }
        }
        
        // STEP 2: Kalau tidak ada di database, cek di localStorage (paymentData)
        const storedPaymentData = localStorage.getItem('paymentData');
        
        if (storedPaymentData) {
          const paymentData = JSON.parse(storedPaymentData);
          
          if (paymentData.bookingCode === bookingCode) {
            console.log('✅ Ticket found in LOCALSTORAGE (paymentData)');
            const ticketInfo = generateTicketInfoFromLocalStorage(paymentData);
            setTicketInfo(ticketInfo);
            setIsLoading(false);
            return;
          }
        }
        
        // STEP 3: Cek di ticketHistory (riwayat tiket)
        const storedHistory = localStorage.getItem('ticketHistory');
        if (storedHistory) {
          const ticketHistory = JSON.parse(storedHistory);
          const foundTicket = ticketHistory.find((t: any) => t.bookingCode === bookingCode);
          
          if (foundTicket) {
            console.log('✅ Ticket found in LOCALSTORAGE (ticketHistory)');
            // Reconstruct payment data format
            const paymentData = {
              bookingCode: foundTicket.bookingCode,
              orderData: foundTicket.orderData,
              paymentMethod: foundTicket.orderData?.paymentMethod || 'transfer',
              bankName: foundTicket.orderData?.bankName || 'Bank'
            };
            
            const ticketInfo = generateTicketInfoFromLocalStorage(paymentData);
            setTicketInfo(ticketInfo);
            setIsLoading(false);
            return;
          }
        }
        
        // STEP 4: Tidak ditemukan di mana pun
        console.log('❌ Ticket not found anywhere');
        setError("Kode booking tidak ditemukan. Silakan lakukan pembayaran terlebih dahulu.");
        setIsLoading(false);
        
      } catch (err) {
        console.error("Error fetching ticket:", err);
        setError("Gagal memuat data tiket");
        setIsLoading(false);
      }
    };

    fetchTicketData();
  }, [bookingCode]);

  // Helper function to convert TiketQRData (from database) to TicketInfo
  const convertTiketToTicketInfo = (tiket: TiketQRData): TicketInfo => {
    const getStationCode = (stationName: string): string => {
      const stationCodes: { [key: string]: string } = {
        'Jakarta': 'GMR',
        'Bandung': 'BD',
        'Surabaya': 'SB',
        'Yogyakarta': 'YK',
        'Semarang': 'SMG',
        'Solo': 'SLO',
        'Malang': 'ML',
        'Cirebon': 'CN',
        'Purwokerto': 'PWT',
        'Jember': 'JR'
      };
      return stationCodes[stationName] || 'N/A';
    };

    const formatDateTime = (date: string, time: string): string => {
      if (!date || !time) return 'N/A';
      const dateObj = new Date(date);
      const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
      const formattedDate = dateObj.toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
      return `${dayName}, ${formattedDate} - ${time}`;
    };

    const getSeatInfo = (className: string): string => {
      const seatNumbers: { [key: string]: string } = {
        'Eksekutif': '2A-12',
        'Bisnis': '3B-15',
        'Ekonomi': '4C-20',
        'Ekonomi Premium': '3D-18'
      };
      return seatNumbers[className] || 'N/A';
    };
    
    // Fungsi untuk mendapatkan seat number dari passengers_data
    const getActualSeatNumbers = (passengersData: any[]): string => {
      if (!passengersData || passengersData.length === 0) {
        return 'N/A';
      }
      
      const seats = passengersData
        .map(p => p.selectedSeat?.seatNumber)
        .filter(s => s)
        .join(', ');
      
      return seats || 'N/A';
    };

    const originCode = getStationCode(tiket.origin);
    const destinationCode = getStationCode(tiket.destination);

    // Parse passengers data
    const passengersData = tiket.passengers_data;

    const firstPassenger = passengersData && passengersData.length > 0 
      ? passengersData[0].nama 
      : tiket.booker_name;

    return {
      trainName: tiket.train_name,
      trainNumber: tiket.train_number,
      bookingCode: tiket.booking_code,
      passengerName: firstPassenger.toUpperCase(),
      origin: `${tiket.origin} (${originCode})`,
      destination: `${tiket.destination} (${destinationCode})`,
      departureDate: formatDateTime(tiket.departure_date, tiket.departure_time),
      arrivalDate: formatDateTime(tiket.departure_date, tiket.arrival_time),
      seatClass: `${tiket.train_class} (${tiket.train_class.substring(0, 3).toUpperCase()})`,
      seatNumber: getActualSeatNumbers(passengersData), // Ambil seat number asli dari JSON
      qrCodeValue: tiket.qr_code_url || `http://localhost:3000/booking-code/${tiket.booking_code}`,
      paymentStatus: tiket.payment_status,
      totalPrice: tiket.total_price,
      passengersData: passengersData,
      ticketData: {
        trainName: tiket.train_name,
        trainNumber: tiket.train_number,
        origin: tiket.origin,
        destination: tiket.destination,
        departureDate: tiket.departure_date,
        departureTime: tiket.departure_time,
        arrivalTime: tiket.arrival_time,
        class: tiket.train_class,
        price: tiket.price_per_ticket,
        passengers: tiket.passenger_count,
        facilities: tiket.facilities || []
      },
      bookingData: {
        nama: tiket.booker_name,
        email: tiket.booker_email,
        noHP: tiket.booker_phone
      }
    };
  };

  // Helper function to generate TicketInfo from localStorage
  const generateTicketInfoFromLocalStorage = (paymentData: any): TicketInfo => {
    const { orderData } = paymentData;
    const { ticketData, bookingData, passengersData } = orderData;
    
    const firstPassenger = passengersData && passengersData.length > 0 
      ? passengersData[0].nama 
      : bookingData?.nama || 'PENUMPANG';

    const getStationCode = (stationName: string): string => {
      const stationCodes: { [key: string]: string } = {
        'Jakarta': 'GMR',
        'Bandung': 'BD',
        'Surabaya': 'SB',
        'Yogyakarta': 'YK',
        'Semarang': 'SMG',
        'Solo': 'SLO',
        'Malang': 'ML',
        'Cirebon': 'CN',
        'Purwokerto': 'PWT',
        'Jember': 'JR'
      };
      return stationCodes[stationName] || 'N/A';
    };

    const formatDateTime = (date: string, time: string): string => {
      if (!date || !time) return 'N/A';
      const dateObj = new Date(date);
      const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
      const formattedDate = dateObj.toLocaleDateString('id-ID', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
      return `${dayName}, ${formattedDate} - ${time}`;
    };

    const getSeatInfo = (className: string): string => {
      const seatNumbers: { [key: string]: string } = {
        'Eksekutif': '2A-12',
        'Bisnis': '3B-15',
        'Ekonomi': '4C-20',
        'Ekonomi Premium': '3D-18'
      };
      return seatNumbers[className] || 'N/A';
    };

    const originCode = getStationCode(ticketData.origin);
    const destinationCode = getStationCode(ticketData.destination);

    return {
      trainName: ticketData.trainName || 'Kereta Api',
      trainNumber: ticketData.trainNumber || 'N/A',
      bookingCode: paymentData.bookingCode,
      passengerName: firstPassenger.toUpperCase(),
      origin: `${ticketData.origin} (${originCode})`,
      destination: `${ticketData.destination} (${destinationCode})`,
      departureDate: formatDateTime(ticketData.departureDate, ticketData.departureTime),
      arrivalDate: formatDateTime(ticketData.departureDate, ticketData.arrivalTime),
      seatClass: `${ticketData.class} (${ticketData.class.substring(0, 3).toUpperCase()})`,
      seatNumber: getSeatInfo(ticketData.class),
      qrCodeValue: `http://localhost:3000/booking-code/${paymentData.bookingCode}`,
      ticketData,
      bookingData,
      passengersData
    };
  };

  const getFacilityIcon = (facility: string) => {
    switch (facility.toLowerCase()) {
      case 'wifi': return <Wifi className="w-4 h-4" />;
      case 'makanan': return <Utensils className="w-4 h-4" />;
      case 'stop kontak': return <Zap className="w-4 h-4" />;
      case 'ac': return <Bed className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <UserMenu />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Memuat data tiket...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !ticketInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
        <UserMenu />
        <div className="container mx-auto px-4 py-8">
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="mb-6 hover:bg-blue-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Beranda
          </Button>

          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-12 text-center">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-10 h-10 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Tiket Tidak Ditemukan</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={() => router.push('/')} className="bg-blue-600 hover:bg-blue-700">
                Kembali ke Beranda
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      <UserMenu />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button
            onClick={() => router.push('/')}
            variant="outline"
            className="mb-4 hover:bg-blue-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Beranda
          </Button>
          
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Detail Tiket</h1>
              <p className="text-gray-600">Kode Booking: <span className="font-bold text-blue-600">{bookingCode}</span></p>
            </div>
            <div className="flex gap-2 flex-wrap">
              {ticketInfo.paymentStatus === 'paid' ? (
                <Badge className="bg-green-500 text-white px-4 py-2 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Lunas
                </Badge>
              ) : ticketInfo.paymentStatus === 'pending' ? (
                <Badge className="bg-yellow-500 text-white px-4 py-2 text-sm">
                  <Clock className="w-4 h-4 mr-2" />
                  Menunggu Pembayaran
                </Badge>
              ) : (
                <Badge className="bg-green-500 text-white px-4 py-2 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Tiket Valid
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Ticket Card */}
        <Card className="max-w-4xl mx-auto shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Train className="w-8 h-8" />
                <div>
                  <CardTitle className="text-2xl">{ticketInfo.trainName}</CardTitle>
                  <p className="text-blue-100 text-sm">Nomor: {ticketInfo.trainNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-blue-100">Kelas</p>
                <p className="text-xl font-bold">{ticketInfo.seatClass}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8">
            {/* Journey Info */}
            <div className="mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Departure */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-5 h-5" />
                    <span className="font-semibold">Keberangkatan</span>
                  </div>
                  <div className="ml-7">
                    <p className="text-xl font-bold text-gray-900">{ticketInfo.origin}</p>
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <Clock className="w-4 h-4" />
                      <p className="text-sm">{ticketInfo.departureDate}</p>
                    </div>
                  </div>
                </div>

                {/* Arrival */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-5 h-5" />
                    <span className="font-semibold">Tujuan</span>
                  </div>
                  <div className="ml-7">
                    <p className="text-xl font-bold text-gray-900">{ticketInfo.destination}</p>
                    <div className="flex items-center gap-2 text-gray-600 mt-1">
                      <Clock className="w-4 h-4" />
                      <p className="text-sm">{ticketInfo.arrivalDate}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mb-6"></div>

            {/* Passenger & Seat Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="w-5 h-5" />
                  <span className="font-semibold">Nama Penumpang</span>
                </div>
                <p className="ml-7 text-lg font-medium text-gray-900">{ticketInfo.passengerName}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-600">
                  <CreditCard className="w-5 h-5" />
                  <span className="font-semibold">Nomor Kursi</span>
                </div>
                <p className="ml-7 text-lg font-medium text-gray-900">{ticketInfo.seatNumber}</p>
              </div>
            </div>

            {/* Facilities */}
            {ticketInfo.ticketData?.facilities && ticketInfo.ticketData.facilities.length > 0 && (
              <>
                <div className="border-t border-gray-200 pt-6 mb-6"></div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Fasilitas
                  </h3>
                  <div className="flex flex-wrap gap-2 ml-7">
                    {ticketInfo.ticketData.facilities.map((facility: string, index: number) => (
                      <Badge key={index} variant="outline" className="px-3 py-1.5">
                        <span className="mr-1.5">{getFacilityIcon(facility)}</span>
                        {facility}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Passengers List */}
            {ticketInfo.passengersData && ticketInfo.passengersData.length > 0 && (
              <>
                <div className="border-t border-gray-200 pt-6 mb-6 mt-6"></div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Daftar Penumpang ({ticketInfo.passengersData.length})
                  </h3>
                  <div className="ml-7 space-y-2">
                    {ticketInfo.passengersData.map((passenger: any, index: number) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{passenger.nama}</p>
                          <p className="text-sm text-gray-600">
                            {passenger.tipeIdentitas}: {passenger.nomorIdentitas}
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {passenger.ageCategory === 'adult' ? 'Dewasa' : 'Anak'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Booking Info */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Informasi Booking</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Kode Booking</p>
                    <p className="font-bold text-blue-600 text-lg">{ticketInfo.bookingCode}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Total Pembayaran</p>
                    <p className="font-bold text-gray-900">
                      Rp {(ticketInfo.totalPrice || (ticketInfo.ticketData?.price * (ticketInfo.ticketData?.passengers || 1)) || 0).toLocaleString('id-ID')}
                    </p>
                  </div>
                  {ticketInfo.paymentStatus && (
                    <div>
                      <p className="text-gray-600">Status Pembayaran</p>
                      <p className="font-bold capitalize">
                        {ticketInfo.paymentStatus === 'paid' ? 'Lunas' : ticketInfo.paymentStatus === 'pending' ? 'Menunggu Pembayaran' : ticketInfo.paymentStatus}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8">
              <Button 
                onClick={() => window.print()} 
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Cetak Tiket
              </Button>
              <Button 
                onClick={() => router.push('/')} 
                variant="outline"
                className="flex-1"
              >
                Kembali ke Beranda
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="max-w-4xl mx-auto mt-6">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Catatan:</span> Harap tunjukkan tiket ini dan identitas diri yang sesuai saat check-in di stasiun.
                Datang minimal 30 menit sebelum keberangkatan.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
