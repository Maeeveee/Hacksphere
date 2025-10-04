"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, MapPin, Train, Users, CreditCard, Wifi, Utensils, Zap, Bed, Star, CheckCircle, AlertTriangle, Edit3, MapPin as Location } from "lucide-react";
import UserMenu from "@/components/UserMenu";
import { getOccupiedSeats } from "@/lib/supabase/queries";
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
  selectedSeatReturn?: SeatConfig; // For return trip in PP bookings
}

interface SeatData {
  wagon: string;
  row: number;
  column: string;
  seatNumber: string;
  isOccupied: boolean;
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

function SummaryContent() {
  const router = useRouter();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [currentPassengerIndex, setCurrentPassengerIndex] = useState<number>(-1);
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [occupiedSeatsReturn, setOccupiedSeatsReturn] = useState<string[]>([]);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  const [isReturnTrip, setIsReturnTrip] = useState(false); // Track which trip's seat is being selected

  // Load order data from localStorage
  useEffect(() => {
    const storedOrderData = localStorage.getItem('orderData');
    if (storedOrderData) {
      try {
        const parsedData = JSON.parse(storedOrderData);
        setOrderData(parsedData);
      } catch (error) {
        console.error('Error loading order data:', error);
        router.push('/orders');
      }
    } else {
      router.push('/orders');
    }
    setIsLoading(false);
  }, [router]);

  // Fetch occupied seats from database when order data is loaded
  useEffect(() => {
    const fetchOccupiedSeats = async () => {
      if (!orderData?.ticketData) return;
      
      setIsLoadingSeats(true);
      try {
        // Fetch occupied seats for departure ticket
        const { data, error } = await getOccupiedSeats(
          orderData.ticketData.trainName,
          orderData.ticketData.class,
          orderData.ticketData.departureDate,
          orderData.ticketData.departureTime
        );

        if (error) {
          console.error('Error fetching occupied seats:', error);
          setOccupiedSeats([]);
        } else {
          setOccupiedSeats(data || []);
          console.log('📍 Loaded occupied seats from database (Departure):', data);
        }

        // Fetch occupied seats for return ticket if PP
        if (orderData.isPulangPergi && orderData.returnTicketData) {
          const { data: returnData, error: returnError } = await getOccupiedSeats(
            orderData.returnTicketData.trainName,
            orderData.returnTicketData.class,
            orderData.returnTicketData.departureDate,
            orderData.returnTicketData.departureTime
          );

          if (returnError) {
            console.error('Error fetching return occupied seats:', returnError);
            setOccupiedSeatsReturn([]);
          } else {
            setOccupiedSeatsReturn(returnData || []);
            console.log('📍 Loaded occupied seats from database (Return):', returnData);
          }
        }
      } catch (err) {
        console.error('Exception fetching occupied seats:', err);
        setOccupiedSeats([]);
        setOccupiedSeatsReturn([]);
      } finally {
        setIsLoadingSeats(false);
      }
    };

    fetchOccupiedSeats();
  }, [orderData]);

  // Auto-assign seats for passengers who don't have seats yet
  useEffect(() => {
    const autoAssignSeats = async () => {
      if (!orderData || isLoadingSeats) return;

      let needsUpdate = false;
      const updatedPassengers = [...orderData.passengersData];

      // Auto-assign DEPARTURE seats for passengers without selectedSeat
      const passengersNeedingDepartureSeats = updatedPassengers.filter(
        p => !p.selectedSeat || !p.selectedSeat.seatNumber
      );

      if (passengersNeedingDepartureSeats.length > 0 && occupiedSeats.length > 0) {
        console.log(`🎲 Auto-assigning ${passengersNeedingDepartureSeats.length} departure seats...`);
        
        // Combine occupied seats from database + seats already selected in this session
        const sessionOccupiedSeats = updatedPassengers
          .filter(p => p.selectedSeat && p.selectedSeat.seatNumber)
          .map(p => p.selectedSeat!.seatNumber);

        const allOccupiedSeats = [...new Set([...occupiedSeats, ...sessionOccupiedSeats])];
        
        console.log('🪑 Occupied departure seats:', allOccupiedSeats);
        
        // Generate random adjacent seats
        const randomSeats = randomizeAdjacentSeats(
          orderData.ticketData.class,
          allOccupiedSeats,
          passengersNeedingDepartureSeats.length
        );

        if (randomSeats.length >= passengersNeedingDepartureSeats.length) {
          let seatIndex = 0;
          updatedPassengers.forEach(passenger => {
            if (!passenger.selectedSeat || !passenger.selectedSeat.seatNumber) {
              passenger.selectedSeat = randomSeats[seatIndex];
              console.log(`✅ Assigned departure seat ${randomSeats[seatIndex].seatNumber} to ${passenger.nama}`);
              seatIndex++;
              needsUpdate = true;
            }
          });
        }
      }

      // Auto-assign RETURN seats for PP bookings
      if (orderData.isPulangPergi && orderData.returnTicketData) {
        const passengersNeedingReturnSeats = updatedPassengers.filter(
          p => !p.selectedSeatReturn || !p.selectedSeatReturn.seatNumber
        );

        if (passengersNeedingReturnSeats.length > 0 && occupiedSeatsReturn.length > 0) {
          console.log(`🎲 Auto-assigning ${passengersNeedingReturnSeats.length} return seats...`);
          
          // Combine occupied seats from database + seats already selected in this session
          const sessionOccupiedSeatsReturn = updatedPassengers
            .filter(p => p.selectedSeatReturn && p.selectedSeatReturn.seatNumber)
            .map(p => p.selectedSeatReturn!.seatNumber);

          const allOccupiedSeatsReturn = [...new Set([...occupiedSeatsReturn, ...sessionOccupiedSeatsReturn])];
          
          console.log('🪑 Occupied return seats:', allOccupiedSeatsReturn);
          
          // Generate random adjacent seats for return trip
          const randomSeatsReturn = randomizeAdjacentSeats(
            orderData.returnTicketData.class,
            allOccupiedSeatsReturn,
            passengersNeedingReturnSeats.length
          );

          if (randomSeatsReturn.length >= passengersNeedingReturnSeats.length) {
            let seatIndex = 0;
            updatedPassengers.forEach(passenger => {
              if (!passenger.selectedSeatReturn || !passenger.selectedSeatReturn.seatNumber) {
                passenger.selectedSeatReturn = randomSeatsReturn[seatIndex];
                console.log(`✅ Assigned return seat ${randomSeatsReturn[seatIndex].seatNumber} to ${passenger.nama}`);
                seatIndex++;
                needsUpdate = true;
              }
            });
          }
        }
      }

      // Update state and localStorage if changes were made
      if (needsUpdate) {
        const updatedOrderData = {
          ...orderData,
          passengersData: updatedPassengers
        };
        setOrderData(updatedOrderData);
        localStorage.setItem('orderData', JSON.stringify(updatedOrderData));
        
        console.log('🎫 All passengers now have seats assigned');
      }
    };

    autoAssignSeats();
  }, [orderData, occupiedSeats, occupiedSeatsReturn, isLoadingSeats]);

  // Seat selection functions
  const handleSeatSelection = async (passengerIndex: number, forReturnTrip: boolean = false) => {
    setCurrentPassengerIndex(passengerIndex);
    setIsReturnTrip(forReturnTrip);
    setShowSeatModal(true);
    
    // Refresh occupied seats data saat modal dibuka
    if (orderData?.ticketData) {
      setIsLoadingSeats(true);
      try {
        const ticketToUse = forReturnTrip && orderData.returnTicketData 
          ? orderData.returnTicketData 
          : orderData.ticketData;

        console.log(`🔄 Refreshing seat data from database for ${forReturnTrip ? 'Return' : 'Departure'} trip...`);
        const { data, error } = await getOccupiedSeats(
          ticketToUse.trainName,
          ticketToUse.class,
          ticketToUse.departureDate,
          ticketToUse.departureTime
        );

        if (error) {
          console.error('❌ Error refreshing occupied seats:', error);
        } else {
          if (forReturnTrip) {
            setOccupiedSeatsReturn(data || []);
          } else {
            setOccupiedSeats(data || []);
          }
          console.log(`✅ Seat data refreshed for ${forReturnTrip ? 'Return' : 'Departure'}. Occupied seats:`, data);
        }
      } catch (err) {
        console.error('❌ Exception refreshing occupied seats:', err);
      } finally {
        setIsLoadingSeats(false);
      }
    }
  };

  const generateSeatMap = () => {
    if (!orderData?.ticketData) return [];
    
    // Use the correct ticket data based on which trip's seat is being selected
    const ticketToUse = isReturnTrip && orderData.returnTicketData 
      ? orderData.returnTicketData 
      : orderData.ticketData;
    
    // Different configurations based on train class
    const classConfig = {
      'eksekutif': { rows: 15, seatsPerRow: 4, wagon: 'EKS-A', spacing: 'luxury' },
      'bisnis': { rows: 18, seatsPerRow: 4, wagon: 'BIS-A', spacing: 'comfort' },
      'ekonomi': { rows: 20, seatsPerRow: 4, wagon: 'EKO-A', spacing: 'standard' }
    };
    
    const config = classConfig[ticketToUse.class?.toLowerCase() as keyof typeof classConfig] || classConfig.ekonomi;
    const columns = ['A', 'B', 'C', 'D'];
    const seats: SeatData[][] = [];

    // Use correct occupied seats based on trip type
    const currentOccupiedSeats = isReturnTrip ? occupiedSeatsReturn : occupiedSeats;
    console.log(`🪑 Generating seat map for ${isReturnTrip ? 'Return' : 'Departure'} trip with occupied seats from DB:`, currentOccupiedSeats);

    for (let row = 1; row <= config.rows; row++) {
      const rowSeats: SeatData[] = [];
      for (let col = 0; col < config.seatsPerRow; col++) {
        const column = columns[col];
        const seatNumber = `${row}${column}`;
        
        // Check if seat is occupied in database OR selected by passengers in current session
        let isOccupied = currentOccupiedSeats.includes(seatNumber);
        
        // Also check if seat is selected by other passengers in this session
        if (isReturnTrip) {
          // For return trip, check selectedSeatReturn
          isOccupied = isOccupied || orderData.passengersData.some(p => 
            p.selectedSeatReturn?.seatNumber === seatNumber
          );
        } else {
          // For departure trip, check selectedSeat
          isOccupied = isOccupied || orderData.passengersData.some(p => 
            p.selectedSeat?.seatNumber === seatNumber
          );
        }
        
        rowSeats.push({
          wagon: config.wagon,
          row,
          column,
          seatNumber,
          isOccupied
        });
      }
      seats.push(rowSeats);
    }
    return seats;
  };

  const handleSeatSelect = (seat: SeatData) => {
    if (seat.isOccupied || currentPassengerIndex === -1 || !orderData) return;

    // Convert SeatData to SeatConfig format
    const seatConfig: SeatConfig = {
      wagon: seat.wagon,
      row: seat.row,
      column: seat.column,
      seatNumber: seat.seatNumber,
      isOccupied: seat.isOccupied
    };

    const updatedPassengers = [...orderData.passengersData];
    
    // Update the correct seat field based on trip type
    if (isReturnTrip) {
      updatedPassengers[currentPassengerIndex] = {
        ...updatedPassengers[currentPassengerIndex],
        selectedSeatReturn: seatConfig
      };
      console.log(`✅ Updated return seat for ${updatedPassengers[currentPassengerIndex].nama}: ${seatConfig.seatNumber}`);
    } else {
      updatedPassengers[currentPassengerIndex] = {
        ...updatedPassengers[currentPassengerIndex],
        selectedSeat: seatConfig
      };
      console.log(`✅ Updated departure seat for ${updatedPassengers[currentPassengerIndex].nama}: ${seatConfig.seatNumber}`);
    }
    
    const updatedOrderData = {
      ...orderData,
      passengersData: updatedPassengers
    };
    
    setOrderData(updatedOrderData);
    localStorage.setItem('orderData', JSON.stringify(updatedOrderData));
    setShowSeatModal(false);
    setCurrentPassengerIndex(-1);
    setIsReturnTrip(false);
  };

  const handleProceedToPayment = () => {
    if (!orderData) return;

    // Validate all passengers have selected seats for departure trip
    for (let i = 0; i < orderData.passengersData.length; i++) {
      const passenger = orderData.passengersData[i];
      if (!passenger.selectedSeat) {
        alert(`Mohon pilih kursi berangkat untuk penumpang ${i + 1}`);
        return;
      }
    }

    // If PP, validate all passengers have selected seats for return trip
    if (orderData.isPulangPergi && orderData.returnTicketData) {
      for (let i = 0; i < orderData.passengersData.length; i++) {
        const passenger = orderData.passengersData[i];
        if (!passenger.selectedSeatReturn) {
          alert(`Mohon pilih kursi pulang untuk penumpang ${i + 1}`);
          return;
        }
      }
    }

    // Navigate to payment page
    router.push('/orders/payment');
  };

  const handleBackToOrders = () => {
    router.push('/orders');
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

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat ringkasan pemesanan...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Data Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-4">Silakan kembali ke halaman pemesanan</p>
          <Button onClick={() => router.push('/orders')} className="bg-blue-600 hover:bg-blue-700">
            Kembali ke Pemesanan
          </Button>
        </div>
      </div>
    );
  }

  const { ticketData, bookingData, passengersData } = orderData;

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header with Back Button and User Menu */}
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="outline" 
            onClick={handleBackToOrders}
            className="bg-white/90 backdrop-blur-md hover:bg-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Form Pemesanan
          </Button>
          <UserMenu />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Ringkasan Pemesanan</h1>
          <p className="text-gray-600">Periksa kembali detail pemesanan dan pilih kursi sebelum melanjutkan pembayaran</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Summary Details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Trip Information - Tiket Berangkat */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                    <Train className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="text-xl font-bold text-gray-800">
                        {orderData.isPulangPergi ? 'Tiket Berangkat' : 'Informasi Perjalanan'}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">{ticketData.trainName} - {ticketData.trainNumber}</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Location className="w-5 h-5 text-green-600" />
                      <div>
                        <div className="text-sm text-gray-600">Stasiun Keberangkatan</div>
                        <div className="font-semibold text-gray-800">{ticketData.origin}</div>
                        <div className="text-sm text-gray-600">{ticketData.departureTime}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-red-600" />
                      <div>
                        <div className="text-sm text-gray-600">Stasiun Tujuan</div>
                        <div className="font-semibold text-gray-800">{ticketData.destination}</div>
                        <div className="text-sm text-gray-600">{ticketData.arrivalTime}</div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tanggal Keberangkatan:</span>
                      <span className="font-semibold">
                        {new Date(ticketData.departureDate).toLocaleDateString('id-ID', { 
                          day: 'numeric', 
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Durasi Perjalanan:</span>
                      <span className="font-semibold">{ticketData.duration}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Kelas:</span>
                      <Badge className={getClassBadgeColor(ticketData.class)}>
                        {ticketData.class}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trip Information - Tiket Pulang (Only for PP) */}
            {orderData.isPulangPergi && orderData.returnTicketData && (
              <Card className="shadow-lg">
                <CardHeader className="bg-gradient-to-r from-orange-50/50 to-amber-50/50">
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-amber-600 rounded-full flex items-center justify-center">
                      <Train className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <div className="text-xl font-bold text-gray-800">Tiket Pulang</div>
                      </div>
                      <div className="text-sm text-gray-600">{orderData.returnTicketData.trainName} - {orderData.returnTicketData.trainNumber}</div>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Location className="w-5 h-5 text-green-600" />
                        <div>
                          <div className="text-sm text-gray-600">Stasiun Keberangkatan</div>
                          <div className="font-semibold text-gray-800">{orderData.returnTicketData.origin}</div>
                          <div className="text-sm text-gray-600">{orderData.returnTicketData.departureTime}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-red-600" />
                        <div>
                          <div className="text-sm text-gray-600">Stasiun Tujuan</div>
                          <div className="font-semibold text-gray-800">{orderData.returnTicketData.destination}</div>
                          <div className="text-sm text-gray-600">{orderData.returnTicketData.arrivalTime}</div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tanggal Keberangkatan:</span>
                        <span className="font-semibold">
                          {new Date(orderData.returnTicketData.departureDate).toLocaleDateString('id-ID', { 
                            day: 'numeric', 
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Durasi Perjalanan:</span>
                        <span className="font-semibold">{orderData.returnTicketData.duration}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Kelas:</span>
                        <Badge className={getClassBadgeColor(orderData.returnTicketData.class)}>
                          {orderData.returnTicketData.class}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Booker Information */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50/50 to-emerald-50/50">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-800">Data Pemesan</div>
                    <div className="text-sm text-gray-600">Informasi kontak dan identitas pemesan</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Nama Pemesan</div>
                    <div className="font-semibold text-gray-800">{bookingData.nama}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Jenis Kelamin</div>
                    <div className="font-semibold text-gray-800 capitalize">{bookingData.gender}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Nomor HP</div>
                    <div className="font-semibold text-gray-800">{bookingData.noHP}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="font-semibold text-gray-800">{bookingData.email}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-600">Identitas</div>
                    <div className="font-semibold text-gray-800">
                      {bookingData.tipeIdentitas.toUpperCase()}: {bookingData.nomorIdentitas}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passengers Information with Seat Selection */}
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-purple-50/50 to-pink-50/50">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-800">Data Penumpang & Kursi</div>
                    <div className="text-sm text-gray-600">Daftar penumpang dan pilihan kursi</div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {passengersData.map((passenger, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-800">{passenger.nama}</h4>
                            <div className="flex items-center gap-2">
                              <Badge className={passenger.ageCategory === 'adult' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}>
                                {passenger.ageCategory === 'adult' ? 'Dewasa' : 'Anak-anak'}
                              </Badge>
                              <span className="text-sm text-gray-600 capitalize">{passenger.gender}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            {passenger.tipeIdentitas.toUpperCase()}: {passenger.nomorIdentitas}
                          </div>
                        </div>
                      </div>
                      
                      {/* Seat Selection - Tiket Berangkat */}
                      <div className="border-t border-gray-100 pt-4">
                        <div className="flex items-center gap-1 mb-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <h5 className="font-medium text-gray-800 text-sm">
                            Kursi {orderData.isPulangPergi ? 'Berangkat' : ''}
                          </h5>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">
                              {passenger.selectedSeat 
                                ? `Kursi: ${passenger.selectedSeat.seatNumber} (${passenger.selectedSeat.wagon})`
                                : 'Belum memilih kursi'
                              }
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {passenger.selectedSeat && (
                              <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm">
                                <CheckCircle className="w-4 h-4" />
                                <span>{passenger.selectedSeat.seatNumber}</span>
                              </div>
                            )}
                            <Button
                              onClick={() => handleSeatSelection(index, false)}
                              variant="outline"
                              className={`text-sm ${
                                passenger.selectedSeat
                                  ? 'border-blue-500 text-blue-600 hover:bg-blue-50'
                                  : 'border-orange-500 text-orange-600 hover:bg-orange-50'
                              }`}
                            >
                              <Edit3 className="w-3 h-3 mr-1" />
                              {passenger.selectedSeat ? 'Ganti' : 'Pilih'}
                            </Button>
                          </div>
                        </div>
                        {!passenger.selectedSeat && (
                          <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded">
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                            Wajib memilih kursi sebelum melanjutkan pembayaran
                          </p>
                        )}
                      </div>

                      {/* Seat Selection - Tiket Pulang (Only for PP) */}
                      {orderData.isPulangPergi && orderData.returnTicketData && (
                        <div className="border-t border-gray-100 pt-4 mt-4">
                          <div className="flex items-center gap-1 mb-2">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <h5 className="font-medium text-gray-800 text-sm">Kursi Pulang</h5>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">
                                {passenger.selectedSeatReturn 
                                  ? `Kursi: ${passenger.selectedSeatReturn.seatNumber} (${passenger.selectedSeatReturn.wagon})`
                                  : 'Belum memilih kursi'
                                }
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {passenger.selectedSeatReturn && (
                                <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-lg text-sm">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>{passenger.selectedSeatReturn.seatNumber}</span>
                                </div>
                              )}
                              <Button
                                onClick={() => handleSeatSelection(index, true)}
                                variant="outline"
                                className={`text-sm ${
                                  passenger.selectedSeatReturn
                                    ? 'border-orange-500 text-orange-600 hover:bg-orange-50'
                                    : 'border-orange-500 text-orange-600 hover:bg-orange-50'
                                }`}
                              >
                                <Edit3 className="w-3 h-3 mr-1" />
                                {passenger.selectedSeatReturn ? 'Ganti' : 'Pilih'}
                              </Button>
                            </div>
                          </div>
                          {!passenger.selectedSeatReturn && (
                            <p className="text-xs text-amber-600 mt-2 bg-amber-50 p-2 rounded">
                              <AlertTriangle className="w-3 h-3 inline mr-1" />
                              Wajib memilih kursi sebelum melanjutkan pembayaran
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Price Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 shadow-xl bg-white overflow-hidden rounded-lg">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
                <div className="flex items-center gap-2 text-white">
                  <CreditCard className="w-5 h-5"/>
                  <span className="text-lg font-semibold">Ringkasan Harga</span>
                </div>
                {orderData.isPulangPergi && (
                  <div className="mt-2 bg-white/20 px-3 py-1 rounded-full inline-block">
                    <span className="text-xs font-medium">Pulang-Pergi</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {/* Price Breakdown - Tiket Berangkat */}
                  <div className="space-y-3">
                    {orderData.isPulangPergi && (
                      <div className="flex items-center gap-1 mb-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs font-bold text-blue-900">Tiket Berangkat</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Harga per tiket</span>
                      <span className="font-medium">{formatPrice(ticketData.price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Jumlah penumpang</span>
                      <span className="font-medium">{ticketData.passengers}x</span>
                    </div>
                    {ticketData.children > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">- Dewasa ({ticketData.adults}x)</span>
                        <span className="text-gray-500">{formatPrice(ticketData.price * ticketData.adults)}</span>
                      </div>
                    )}
                    {ticketData.children > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">- Anak ({ticketData.children}x)</span>
                        <span className="text-gray-500">{formatPrice(Math.floor(ticketData.price * 0.75) * ticketData.children)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm pt-2 border-t">
                      <span className="text-gray-700 font-medium">Subtotal Berangkat</span>
                      <span className="font-semibold text-blue-600">{formatPrice(ticketData.totalPrice)}</span>
                    </div>
                  </div>

                  {/* Price Breakdown - Tiket Pulang (Only for PP) */}
                  {orderData.isPulangPergi && orderData.returnTicketData && (
                    <div className="space-y-3 border-t-2 border-dashed pt-4">
                      <div className="flex items-center gap-1 mb-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-xs font-bold text-orange-900">Tiket Pulang</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Harga per tiket</span>
                        <span className="font-medium">{formatPrice(orderData.returnTicketData.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Jumlah penumpang</span>
                        <span className="font-medium">{orderData.returnTicketData.passengers}x</span>
                      </div>
                      {orderData.returnTicketData.children > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">- Dewasa ({orderData.returnTicketData.adults}x)</span>
                          <span className="text-gray-500">{formatPrice(orderData.returnTicketData.price * orderData.returnTicketData.adults)}</span>
                        </div>
                      )}
                      {orderData.returnTicketData.children > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">- Anak ({orderData.returnTicketData.children}x)</span>
                          <span className="text-gray-500">{formatPrice(Math.floor(orderData.returnTicketData.price * 0.75) * orderData.returnTicketData.children)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm pt-2 border-t">
                        <span className="text-gray-700 font-medium">Subtotal Pulang</span>
                        <span className="font-semibold text-orange-600">{formatPrice(orderData.returnTicketData.totalPrice)}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t-2 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-800">Total Harga</span>
                      <span className="text-xl font-bold text-blue-600">
                        {formatPrice(
                          orderData.isPulangPergi && orderData.returnTicketData
                            ? ticketData.totalPrice + orderData.returnTicketData.totalPrice
                            : ticketData.totalPrice
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Facilities */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-sm text-gray-800 mb-2">Fasilitas Termasuk</h4>
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

                  {/* Payment Button */}
                  <div className="border-t pt-4">
                    <Button 
                      onClick={handleProceedToPayment}
                      disabled={
                        passengersData.some(p => !p.selectedSeat) ||
                        (orderData.isPulangPergi && passengersData.some(p => !p.selectedSeatReturn))
                      }
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 text-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Lanjut ke Pembayaran
                    </Button>
                    
                    {(passengersData.some(p => !p.selectedSeat) || 
                      (orderData.isPulangPergi && passengersData.some(p => !p.selectedSeatReturn))) && (
                      <p className="text-xs text-amber-600 text-center mt-2">
                        Pilih kursi untuk semua penumpang{orderData.isPulangPergi ? ' (berangkat & pulang)' : ''} terlebih dahulu
                      </p>
                    )}
                    
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

      {/* Seat Selection Modal */}
      {showSeatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className={`bg-gradient-to-r ${isReturnTrip ? 'from-orange-600 to-amber-600' : 'from-blue-600 to-indigo-600'} text-white p-6`}>
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 ${isReturnTrip ? 'bg-orange-300' : 'bg-blue-300'} rounded-full`}></div>
                      <h3 className="text-xl font-bold">
                        Pilih Kursi {isReturnTrip ? 'Pulang' : 'Berangkat'}
                      </h3>
                    </div>
                    {isLoadingSeats && (
                      <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Memuat data kursi...
                      </div>
                    )}
                  </div>
                  <p className={`${isReturnTrip ? 'text-orange-100' : 'text-blue-100'} text-sm`}>
                    {currentPassengerIndex >= 0 && passengersData[currentPassengerIndex]?.nama 
                      ? `Untuk: ${passengersData[currentPassengerIndex].nama}` 
                      : `Penumpang ${currentPassengerIndex + 1}`}
                  </p>
                  {!isLoadingSeats && (isReturnTrip ? occupiedSeatsReturn : occupiedSeats).length > 0 && (
                    <p className={`${isReturnTrip ? 'text-orange-200' : 'text-blue-200'} text-xs mt-1`}>
                      📊 {(isReturnTrip ? occupiedSeatsReturn : occupiedSeats).length} kursi sudah terpesan dari database
                    </p>
                  )}
                </div>
                <button 
                  onClick={() => {setShowSeatModal(false); setCurrentPassengerIndex(-1); setIsReturnTrip(false);}}
                  className="text-white hover:text-gray-300 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Train Info */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800">
                      {isReturnTrip && orderData.returnTicketData 
                        ? orderData.returnTicketData.trainName 
                        : ticketData?.trainName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Gerbong: {(() => {
                        const currentTicket = isReturnTrip && orderData.returnTicketData 
                          ? orderData.returnTicketData 
                          : ticketData;
                        const classConfig = {
                          'eksekutif': 'EKS-A',
                          'bisnis': 'BIS-A', 
                          'ekonomi': 'EKO-A'
                        };
                        return classConfig[currentTicket?.class?.toLowerCase() as keyof typeof classConfig] || 'EKO-A';
                      })()}
                    </p>
                  </div>
                  <Badge className={getClassBadgeColor(
                    isReturnTrip && orderData.returnTicketData 
                      ? orderData.returnTicketData.class 
                      : ticketData?.class || ''
                  )}>
                    {isReturnTrip && orderData.returnTicketData 
                      ? orderData.returnTicketData.class 
                      : ticketData?.class}
                  </Badge>
                </div>
              </div>

              {/* Legend */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-800 mb-3">Keterangan:</h4>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-500 rounded border"></div>
                    <span>Tersedia</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-500 rounded border"></div>
                    <span>Terisi</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded border"></div>
                    <span>Dipilih Penumpang Lain</span>
                  </div>
                </div>
              </div>

              {/* Seat Map */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="text-center mb-4">
                  <div className="inline-block bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                    DEPAN KERETA
                  </div>
                </div>
                
                <div className="space-y-2">
                  {generateSeatMap().map((row, rowIndex) => (
                    <div key={rowIndex} className="flex items-center justify-center gap-2">
                      {/* Row number */}
                      <div className="w-8 text-center text-sm font-semibold text-gray-600">
                        {rowIndex + 1}
                      </div>
                      
                      {/* Left side seats (A, B) */}
                      <div className="flex gap-1">
                        {row.slice(0, 2).map((seat, seatIndex) => (
                          <button
                            key={`${seat.row}${seat.column}`}
                            onClick={() => handleSeatSelect(seat)}
                            disabled={seat.isOccupied}
                            className={`w-8 h-8 rounded border-2 text-xs font-semibold transition-all ${
                              seat.isOccupied
                                ? 'bg-red-500 border-red-600 text-white cursor-not-allowed'
                                : passengersData.some(p => p.selectedSeat?.seatNumber === seat.seatNumber)
                                ? 'bg-blue-500 border-blue-600 text-white'
                                : 'bg-green-500 border-green-600 text-white hover:bg-green-600 cursor-pointer'
                            }`}
                          >
                            {seat.column}
                          </button>
                        ))}
                      </div>
                      
                      {/* Aisle space */}
                      <div className="w-6"></div>
                      
                      {/* Right side seats (C, D) */}
                      <div className="flex gap-1">
                        {row.slice(2, 4).map((seat, seatIndex) => (
                          <button
                            key={`${seat.row}${seat.column}`}
                            onClick={() => handleSeatSelect(seat)}
                            disabled={seat.isOccupied}
                            className={`w-8 h-8 rounded border-2 text-xs font-semibold transition-all ${
                              seat.isOccupied
                                ? 'bg-red-500 border-red-600 text-white cursor-not-allowed'
                                : passengersData.some(p => p.selectedSeat?.seatNumber === seat.seatNumber)
                                ? 'bg-blue-500 border-blue-600 text-white'
                                : 'bg-green-500 border-green-600 text-white hover:bg-green-600 cursor-pointer'
                            }`}
                          >
                            {seat.column}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="text-center mt-4">
                  <div className="inline-block bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold">
                    BELAKANG KERETA
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense fallback={
      <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat ringkasan pemesanan...</p>
        </div>
      </div>
    }>
      <SummaryContent />
    </Suspense>
  );
}