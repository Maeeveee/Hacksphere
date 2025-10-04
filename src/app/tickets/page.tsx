"use client";

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, Calendar, ArrowLeft, Train, Wifi, Utensils, Zap, Star, ChevronRight, Bed, Loader2, ChevronDown, ChevronUp, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { searchJadwalKereta, type JadwalLengkap } from '@/lib/supabase/queries';
import UserMenu from '@/components/UserMenu';

interface TicketSearchParams {
    origin: string;
    destination: string;
    adults: number;
    children: number;
    departureDate: string;
    isDifabel: boolean;
    isPulangPergi: boolean;
    returnDate?: string;
    returnOrigin?: string;
    returnDestination?: string;
}

interface TrainTicket {
    id: string;
    trainName: string;
    trainNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    class: string;
    price: number;
    availableSeats: number;
    facilities: string[];
}

// Helper function untuk extract jam dan menit dari timestamp
const extractTime = (timestamp: string): string => {
    // Ambil bagian waktu dari ISO string (YYYY-MM-DDTHH:MM:SS)
    if (timestamp.includes('T')) {
        const timePart = timestamp.split('T')[1];
        return timePart.substring(0, 5); // Ambil HH:MM
    }
    // Fallback untuk format lain
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
};

// Convert JadwalLengkap to TrainTicket format
const convertJadwalToTrainTicket = (jadwalList: JadwalLengkap[]): TrainTicket[] => {
    return jadwalList.map((jadwal) => {
        // Debug untuk melihat format data dari database
        const departureTime = new Date(jadwal.waktu_berangkat);
        const arrivalTime = new Date(jadwal.waktu_tiba);
        
        console.log('🔍 Debug berbagai format waktu:', {
            '1_raw_from_db': jadwal.waktu_berangkat,
            '2_extracted_time': extractTime(jadwal.waktu_berangkat),
            '3_js_date_object': departureTime.toString(),
            '4_locale_string': departureTime.toLocaleString('id-ID'),
            '5_time_only': departureTime.toLocaleTimeString('id-ID'),
            '6_utc_string': departureTime.toISOString(),
            '7_hours_minutes': `${departureTime.getHours()}:${departureTime.getMinutes().toString().padStart(2, '0')}`
        });
        
        // Extract waktu langsung dari timestamp
        const departureTimeFormatted = extractTime(jadwal.waktu_berangkat);
        const arrivalTimeFormatted = extractTime(jadwal.waktu_tiba);
        
        // Calculate duration
        const durationMs = arrivalTime.getTime() - departureTime.getTime();
        const durationHours = Math.floor(durationMs / (1000 * 60 * 60));
        const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        const duration = `${durationHours}j ${durationMinutes}m`;

        // Get primary class from first gerbong
        const primaryClass = jadwal.kereta.gerbong?.[0]?.nama_kelas || 'Ekonomi';
        
        // Calculate available seats (estimate based on gerbong count)
        const availableSeats = jadwal.kereta.gerbong ? jadwal.kereta.gerbong.length * 20 : 40;

        // Default facilities based on class
        const facilities = primaryClass === 'Eksekutif' 
            ? ['AC', 'Makanan', 'WiFi', 'Colokan Listrik', 'Selimut']
            : primaryClass === 'Bisnis'
            ? ['AC', 'WiFi', 'Colokan Listrik']
            : ['AC'];

        return {
            id: jadwal.id,
            trainName: jadwal.kereta.nama_kereta,
            trainNumber: jadwal.kereta.kode_kereta,
            origin: jadwal.stasiun_asal.nama_stasiun,
            destination: jadwal.stasiun_tujuan.nama_stasiun,
            departureTime: departureTimeFormatted,
            arrivalTime: arrivalTimeFormatted,
            duration: duration,
            class: primaryClass,
            price: jadwal.harga,
            availableSeats: availableSeats,
            facilities: facilities
        };
    });
};

function TicketPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [tickets, setTickets] = useState<TrainTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedFacilities, setExpandedFacilities] = useState<Set<string>>(new Set());
    const [selectedDate, setSelectedDate] = useState<string>('');
    
    const ticketSearchParams: TicketSearchParams = {
        origin: searchParams?.get('origin') || '',
        destination: searchParams?.get('destination') || '',
        adults: parseInt(searchParams?.get('adults') || '1'),
        children: parseInt(searchParams?.get('children') || '0'),
        departureDate: selectedDate || searchParams?.get('departureDate') || '',
        isDifabel: searchParams?.get('isDifabel') === 'true',
        isPulangPergi: searchParams?.get('isPulangPergi') === 'true',
        returnDate: searchParams?.get('returnDate') || undefined,
        returnOrigin: searchParams?.get('returnOrigin') || undefined,
        returnDestination: searchParams?.get('returnDestination') || undefined,
    };

    // Check if this is return trip selection page
    const isReturnTrip = searchParams?.get('isReturnTrip') === 'true';
    const [departureTicket, setDepartureTicket] = useState<any>(null);

    // Load departure ticket if this is return trip page
    useEffect(() => {
        if (isReturnTrip) {
            const saved = localStorage.getItem('departureTicket');
            if (saved) {
                setDepartureTicket(JSON.parse(saved));
            }
        }
    }, [isReturnTrip]);

    // Initialize selected date from URL params
    useEffect(() => {
        const dateFromParams = searchParams?.get('departureDate');
        
        if (dateFromParams && !selectedDate) {
            setSelectedDate(dateFromParams);
        }
    }, [searchParams, selectedDate]);

    // Generate array of dates (only from today onwards, up to 14 days ahead)
    const generateDateRange = () => {
        const dates: Date[] = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset to midnight for accurate comparison
        
        // Untuk return trip, gunakan returnDate dari params jika ada
        // Untuk departure trip, gunakan selectedDate
        let baseDate: Date;
        let minDate: Date; // Minimum date yang bisa dipilih
        
        if (isReturnTrip) {
            // Di return page, departureDate di URL adalah tanggal return yang diinput user
            const returnDateParam = searchParams?.get('departureDate');
            baseDate = returnDateParam ? new Date(returnDateParam) : new Date();
            
            // Minimum date adalah yang lebih besar antara: hari ini atau tanggal berangkat
            if (departureTicket && departureTicket.departureDate) {
                const departureDateObj = new Date(departureTicket.departureDate);
                departureDateObj.setHours(0, 0, 0, 0);
                minDate = departureDateObj > today ? departureDateObj : today;
            } else {
                minDate = today;
            }
        } else {
            baseDate = selectedDate ? new Date(selectedDate) : new Date();
            minDate = today;
        }
        baseDate.setHours(0, 0, 0, 0);
        
        // Pastikan baseDate tidak lebih awal dari minDate
        const startDate = baseDate < minDate ? minDate : baseDate;
        
        // Generate dates: 7 days before selected date (but not before minDate) and 7 days after
        for (let i = -7; i <= 7; i++) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + i);
            
            // Only add dates that are >= minDate
            if (date >= minDate) {
                dates.push(date);
            }
        }
        
        // If we don't have enough dates (because some were in the past), add more future dates
        while (dates.length < 15) {
            const lastDate: Date = dates[dates.length - 1];
            const nextDate: Date = new Date(lastDate);
            nextDate.setDate(lastDate.getDate() + 1);
            dates.push(nextDate);
        }
        
        return dates;
    };

    const formatDateForDisplay = (date: Date) => {
        // Fix timezone offset issue - use local date instead of UTC
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const fullDate = `${year}-${month}-${day}`;
        
        return {
            day: date.toLocaleDateString('id-ID', { weekday: 'short' }),
            date: date.getDate(),
            month: date.toLocaleDateString('id-ID', { month: 'short' }),
            fullDate: fullDate
        };
    };

    const handleDateSelect = (dateString: string) => {
        // Validasi: untuk return trip, tidak boleh pilih tanggal lebih awal dari departure
        if (isReturnTrip && departureTicket && departureTicket.departureDate) {
            const selectedDateObj = new Date(dateString);
            const departureDateObj = new Date(departureTicket.departureDate);
            selectedDateObj.setHours(0, 0, 0, 0);
            departureDateObj.setHours(0, 0, 0, 0);
            
            if (selectedDateObj < departureDateObj) {
                // Jangan izinkan pilih tanggal lebih awal dari departure
                console.warn('⚠️ Tanggal pulang tidak boleh lebih awal dari tanggal berangkat');
                return;
            }
        }
        
        setSelectedDate(dateString);
        // Update URL with new date
        const params = new URLSearchParams(window.location.search);
        params.set('departureDate', dateString);
        router.push(`/tickets?${params.toString()}`);
    };

    const totalPassengers = ticketSearchParams.adults + ticketSearchParams.children;

    // Check if we have valid search params
    const hasValidSearch = ticketSearchParams.origin && ticketSearchParams.destination && ticketSearchParams.departureDate;

    // Fetch tickets data from database
    useEffect(() => {
        const fetchTickets = async () => {
            if (!hasValidSearch) {
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                console.log('Searching for:', {
                    origin: ticketSearchParams.origin,
                    destination: ticketSearchParams.destination,
                    date: ticketSearchParams.departureDate
                });

                const { data, error } = await searchJadwalKereta(
                    ticketSearchParams.origin,
                    ticketSearchParams.destination,
                    ticketSearchParams.departureDate
                );

                console.log('Database response:', { data, error });

                if (error) {
                    console.error('Database error:', error);
                    setError('Gagal mengambil data jadwal kereta. Periksa koneksi database.');
                    setTickets([]);
                } else if (data && data.length > 0) {
                    console.log('Found', data.length, 'tickets from database');
                    const convertedTickets = convertJadwalToTrainTicket(data);
                    setTickets(convertedTickets);
                } else {
                    console.log('No data found in database');
                    setTickets([]);
                }
            } catch (err) {
                console.error('Error fetching tickets:', err);
                setError('Terjadi kesalahan saat mengambil data jadwal kereta.');
                setTickets([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTickets();
    }, [ticketSearchParams.origin, ticketSearchParams.destination, ticketSearchParams.departureDate, hasValidSearch]);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    const getClassBadgeColor = (trainClass: string) => {
        switch (trainClass.toLowerCase()) {
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

    // Show message if no valid search data
    if (!hasValidSearch) {
        return (
            <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen">
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="flex justify-between items-center mb-6">
                        <Button 
                            variant="outline" 
                            onClick={() => router.push('/')}
                            className="bg-white/90 backdrop-blur-md hover:bg-white"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Kembali ke Beranda
                        </Button>
                        <UserMenu />
                    </div>
                    
                    <div className="shadow-lg border border-slate-200/60 bg-white/90 backdrop-blur-md rounded-xl">
                        <div className="text-center py-12 p-6">
                            <div className="text-gray-400 mb-4">
                                <MapPin className="w-16 h-16 mx-auto" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                Data pencarian tidak valid
                            </h3>
                            <p className="text-gray-600 mb-4">
                                Silakan lakukan pencarian tiket terlebih dahulu
                            </p>
                            <Button 
                                onClick={() => router.push('/')}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Mulai Pencarian
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen">
            <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-8">
                {/* Header with Back Button and User Menu */}
                <div className="flex justify-between items-center mb-3 sm:mb-6 gap-1.5 sm:gap-2">
                    <Button 
                        variant="outline" 
                        onClick={() => router.back()}
                        className="bg-white/90 backdrop-blur-md hover:bg-white text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"
                    >
                        <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Kembali ke Pencarian</span>
                        <span className="sm:hidden">Kembali</span>
                    </Button>
                    <UserMenu />
                </div>

                {/* Search Summary */}
                <div className="mb-3 sm:mb-4 shadow-xl border border-slate-200/60 bg-gradient-to-r from-white/95 to-blue-50/95 backdrop-blur-md overflow-hidden rounded-lg sm:rounded-xl">
                    <div className={`${isReturnTrip ? 'bg-orange-500' : 'bg-blue-500'} text-white p-3 sm:p-6`}>
                        <h2 className="text-sm sm:text-xl font-bold flex items-center gap-1.5 sm:gap-3 flex-wrap">
                            <div className="w-7 h-7 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                                {isReturnTrip ? (
                                    <ChevronLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                                ) : (
                                    <MapPin className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                                )}
                            </div>
                            <span className="flex-1 min-w-0">
                                {isReturnTrip ? 'Pilih Tiket Pulang' : 'Hasil Pencarian Tiket'}
                            </span>
                            <Badge className="bg-white/20 text-white text-xs flex-shrink-0 px-1.5 sm:px-2">
                                {tickets.length} kereta
                            </Badge>
                        </h2>
                        {isReturnTrip && departureTicket && (
                            <p className="text-xs sm:text-sm text-white/90 mt-2">
                                ✓ Tiket berangkat: {departureTicket.trainName} • {departureTicket.departureTime}
                            </p>
                        )}
                    </div>
                    <div className="pb-3 sm:pb-6 bg-white p-2 sm:p-6">
                        <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            {/* Rute - Full Width */}
                            <div className={`col-span-2 bg-white/80 p-2.5 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border ${isReturnTrip ? 'border-orange-100' : 'border-blue-100'}`}>
                                <div className="flex items-center gap-1.5 sm:gap-3">
                                    <div className={`w-6 h-6 sm:w-8 sm:h-8 ${isReturnTrip ? 'bg-orange-100' : 'bg-blue-100'} rounded-full flex items-center justify-center flex-shrink-0`}>
                                        <MapPin className={`w-2.5 h-2.5 sm:w-4 sm:h-4 ${isReturnTrip ? 'text-orange-600' : 'text-blue-600'}`} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-medium text-gray-500 uppercase mb-0.5">{isReturnTrip ? 'Rute Pulang' : 'Rute'}</div>
                                        <div className="font-bold text-gray-800 flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm">
                                            <span className="truncate">{ticketSearchParams.origin || 'Asal'}</span>
                                            <ChevronRight className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                            <span className="truncate">{ticketSearchParams.destination || 'Tujuan'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Penumpang - Half Width */}
                            <div className="bg-white/80 p-2.5 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border border-purple-100">
                                <div className="flex items-center gap-1.5 sm:gap-3">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Users className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-purple-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-medium text-gray-500 uppercase mb-0.5">Penumpang</div>
                                        <div className="font-bold text-gray-800 text-xs sm:text-sm truncate">
                                            {ticketSearchParams.adults} Dewasa{ticketSearchParams.children > 0 ? `, ${ticketSearchParams.children} Anak` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Opsi - Half Width */}
                            <div className="bg-white/80 p-2.5 sm:p-4 rounded-lg sm:rounded-xl shadow-sm border border-orange-100">
                                <div className="flex items-center gap-1.5 sm:gap-3">
                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Star className="w-2.5 h-2.5 sm:w-4 sm:h-4 text-orange-600" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-xs font-medium text-gray-500 uppercase mb-0.5">Opsi</div>
                                        <div className="flex gap-1 flex-wrap">
                                            {ticketSearchParams.isDifabel && (
                                                <Badge variant="outline" className="text-xs bg-blue-50 border-blue-200 text-blue-700">Difabel</Badge>
                                            )}
                                            {ticketSearchParams.isPulangPergi && (
                                                <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">Pulang-Pergi</Badge>
                                            )}
                                            {!ticketSearchParams.isDifabel && !ticketSearchParams.isPulangPergi && (
                                                <span className="text-xs text-gray-500">Standar</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Date Slider */}
                <div className="mb-3 sm:mb-6 shadow-lg border border-slate-200/60 bg-white/95 backdrop-blur-md rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                            <h3 className="text-xs sm:text-sm font-semibold text-gray-700">
                                {isReturnTrip ? 'Pilih Tanggal Pulang' : 'Pilih Tanggal Keberangkatan'}
                            </h3>
                        </div>
                        {isReturnTrip && departureTicket && (
                            <div className="text-[10px] sm:text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-md">
                                Min: {new Date(departureTicket.departureDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </div>
                        )}
                    </div>
                    <div className="relative mt-2 sm:mt-3">
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 pb-2">
                            <div className="flex gap-2 sm:gap-3">
                                {generateDateRange().map((date, index) => {
                                    const dateInfo = formatDateForDisplay(date);
                                    const isSelected = dateInfo.fullDate === selectedDate;
                                    const isToday = dateInfo.fullDate === new Date().toISOString().split('T')[0];
                                    
                                    // Check if date is disabled (untuk return trip, tidak boleh lebih awal dari departure)
                                    let isDisabled = false;
                                    if (isReturnTrip && departureTicket && departureTicket.departureDate) {
                                        const currentDateObj = new Date(dateInfo.fullDate);
                                        const departureDateObj = new Date(departureTicket.departureDate);
                                        currentDateObj.setHours(0, 0, 0, 0);
                                        departureDateObj.setHours(0, 0, 0, 0);
                                        isDisabled = currentDateObj < departureDateObj;
                                    }
                                    
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => !isDisabled && handleDateSelect(dateInfo.fullDate)}
                                            disabled={isDisabled}
                                            className={`flex-shrink-0 flex flex-col items-center justify-center p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-200 min-w-[60px] sm:min-w-[80px] ${
                                                isDisabled
                                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                                                    : isSelected 
                                                    ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg scale-105' 
                                                    : isToday
                                                    ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 hover:bg-blue-100'
                                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                                            }`}
                                        >
                                            <div className="text-[10px] sm:text-xs font-medium uppercase mb-0.5">
                                                {dateInfo.day}
                                            </div>
                                            <div className="text-lg sm:text-2xl font-bold">
                                                {dateInfo.date}
                                            </div>
                                            <div className="text-[10px] sm:text-xs mt-0.5">
                                                {dateInfo.month}
                                            </div>
                                            {isToday && !isSelected && !isDisabled && (
                                                <div className="text-[8px] sm:text-[10px] mt-0.5 font-semibold">
                                                    Hari ini
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                    {loading ? (
                        <div className="shadow-lg border border-gray-200 bg-white rounded-lg sm:rounded-xl">
                            <div className="p-6 sm:p-8 text-center">
                                <div className="flex items-center justify-center gap-3">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    <span className="text-gray-700 font-medium">Mencari jadwal kereta...</span>
                                </div>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="shadow-lg border border-red-200 bg-red-50 rounded-xl">
                            <div className="p-8 text-center">
                                <div className="text-red-700 font-medium mb-2">❌ Database Error</div>
                                <div className="text-red-600 text-sm mb-4">{error}</div>
                                <div className="text-gray-600 text-xs mb-4">
                                    Pastikan database sudah ter-setup dengan benar dan memiliki data jadwal kereta.
                                </div>
                                <Button 
                                    onClick={() => window.location.reload()}
                                    variant="outline"
                                    className="border-red-300 text-red-700 hover:bg-red-100"
                                >
                                    Coba Lagi
                                </Button>
                            </div>
                        </div>
                    ) : tickets.length === 0 ? (
                        <div className="shadow-lg border border-gray-200 bg-white rounded-xl">
                            <div className="p-8 text-center">
                                <Train className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <div className="text-gray-700 font-medium mb-2">Tidak ada jadwal kereta ditemukan</div>
                                <div className="text-gray-500 text-sm mb-4">
                                    Tidak ada kereta yang beroperasi untuk rute {ticketSearchParams.origin} → {ticketSearchParams.destination} pada tanggal yang dipilih.
                                </div>
                                <Button 
                                    onClick={() => router.push('/')}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    Coba Rute Lain
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3 sm:space-y-4">
                        {(() => {
                            // Filter tickets untuk return trip jika tanggal sama dengan departure
                            let filteredTickets = tickets;
                            
                            if (isReturnTrip && departureTicket) {
                                const departureDate = departureTicket.departureDate; // Format: YYYY-MM-DD
                                const returnDate = ticketSearchParams.departureDate; // Di return page, ini adalah return date
                                
                                // Jika tanggal sama, filter berdasarkan jam
                                if (departureDate === returnDate) {
                                    const departureArrivalTime = departureTicket.arrivalTime; // Format: HH:MM
                                    
                                    filteredTickets = tickets.filter(ticket => {
                                        // Compare jam keberangkatan return dengan jam kedatangan departure
                                        const [depHour, depMin] = departureArrivalTime.split(':').map(Number);
                                        const [retHour, retMin] = ticket.departureTime.split(':').map(Number);
                                        
                                        const depTimeInMinutes = depHour * 60 + depMin;
                                        const retTimeInMinutes = retHour * 60 + retMin;
                                        
                                        // Return ticket harus berangkat setelah departure ticket tiba
                                        return retTimeInMinutes > depTimeInMinutes;
                                    });
                                    
                                    console.log('🔍 Filter return tickets pada tanggal sama:', {
                                        departureDate,
                                        returnDate,
                                        departureArrivalTime,
                                        totalTickets: tickets.length,
                                        filteredTickets: filteredTickets.length
                                    });
                                }
                            }
                            
                            return filteredTickets.length === 0 ? (
                                <div className="shadow-lg border border-gray-200 bg-white rounded-xl">
                                    <div className="p-8 text-center">
                                        <Train className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <div className="text-gray-700 font-medium mb-2">Tidak ada jadwal kereta yang tersedia</div>
                                        <div className="text-gray-500 text-sm mb-4">
                                            {isReturnTrip && departureTicket && departureTicket.departureDate === ticketSearchParams.departureDate
                                                ? `Tidak ada kereta yang berangkat setelah jam ${departureTicket.arrivalTime} (waktu kedatangan tiket berangkat).`
                                                : `Tidak ada kereta yang beroperasi untuk rute ${ticketSearchParams.origin} → ${ticketSearchParams.destination} pada tanggal yang dipilih.`
                                            }
                                        </div>
                                        <Button 
                                            onClick={() => router.push('/')}
                                            className="bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            Coba Tanggal Lain
                                        </Button>
                                    </div>
                                </div>
                            ) : filteredTickets.map((ticket: TrainTicket) => (
                        <div key={ticket.id} className="group shadow-md sm:shadow-lg border border-gray-200 bg-white hover:shadow-xl transition-all duration-300 overflow-hidden rounded-lg sm:rounded-xl">
                            <div className="p-0">
                                {/* Header Section */}
                                <div className="px-2 sm:px-4 py-1.5 sm:py-2 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30">
                                    <div className="flex items-center justify-between gap-1 sm:gap-2">
                                        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                                            <Badge className={`${getClassBadgeColor(ticket.class)} font-medium text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 flex-shrink-0`}>
                                                {ticket.class}
                                            </Badge>
                                            <h3 className="font-bold text-xs sm:text-base text-gray-800 truncate">{ticket.trainName}</h3>
                                            <span className="text-[10px] sm:text-xs text-gray-500 truncate">({ticket.trainNumber})</span>
                                        </div>
                                        <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-gray-600 flex-shrink-0">
                                            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${ticket.availableSeats > 20 ? 'bg-green-500' : ticket.availableSeats > 10 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                            <span className="hidden sm:inline">{ticket.availableSeats} kursi</span>
                                            <span className="sm:hidden">{ticket.availableSeats}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Content - 3 Columns Layout */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 p-2 sm:p-4">
                                    {/* Kolom 1: Jadwal & Jam Keberangkatan */}
                                    <div className="lg:col-span-1">
                                        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-gray-600 mb-2">
                                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                                            <span className="font-medium">{ticket.duration}</span>
                                        </div>
                                        
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2 sm:p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="text-center flex-1">
                                                    <div className="text-lg sm:text-xl font-bold text-gray-800">{ticket.departureTime}</div>
                                                    <div className="text-[10px] sm:text-xs text-gray-600 font-medium bg-white px-2 py-1 rounded-md mt-1 truncate">
                                                        {ticket.origin}
                                                    </div>
                                                </div>
                                                <div className="flex-shrink-0 flex items-center relative">
                                                    <div className="w-8 sm:w-12 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400"></div>
                                                    <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                                            <Train className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-center flex-1">
                                                    <div className="text-lg sm:text-xl font-bold text-gray-800">{ticket.arrivalTime}</div>
                                                    <div className="text-[10px] sm:text-xs text-gray-600 font-medium bg-white px-2 py-1 rounded-md mt-1 truncate">
                                                        {ticket.destination}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Kolom 2: Fasilitas */}
                                    <div className="lg:col-span-1">
                                        <div className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Fasilitas</div>
                                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                            {ticket.facilities.map((facility, index) => (
                                                <div key={index} className="flex items-center gap-1 bg-gray-50 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md hover:bg-blue-50 transition-colors">
                                                    <div className="text-blue-600 flex-shrink-0">
                                                        {getFacilityIcon(facility)}
                                                    </div>
                                                    <span className="text-[10px] sm:text-xs font-medium text-gray-700">{facility}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Kolom 3: Harga & Tombol Pesan */}
                                    <div className="lg:col-span-1 flex flex-col justify-center gap-2 sm:gap-3">
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 sm:p-4 rounded-lg text-center">
                                            <div className='flex flex-row items-center justify-center'>
                                                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                                {formatPrice(ticket.price)}
                                            </div>
                                            <div className="text-[15px] sm:text-xs text-gray-600 mt-2">/orang</div>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => {
                                                // Create ticket data with passenger info
                                                const ticketData = {
                                                    ...ticket,
                                                    passengers: totalPassengers,
                                                    adults: ticketSearchParams.adults,
                                                    children: ticketSearchParams.children,
                                                    departureDate: ticketSearchParams.departureDate,
                                                    totalPrice: ticket.price * totalPassengers,
                                                    isDifabel: ticketSearchParams.isDifabel,
                                                    isPulangPergi: ticketSearchParams.isPulangPergi
                                                };

                                                // Jika ini return trip page, kirim kedua tiket ke orders
                                                if (isReturnTrip && departureTicket) {
                                                    // Create return ticket data
                                                    const returnTicketData = {
                                                        ...ticketData,
                                                        isPulangPergi: false // Set false untuk return ticket individual
                                                    };
                                                    
                                                    // Gabungkan kedua tiket untuk dikirim ke orders
                                                    const combinedData = {
                                                        departureTicket: departureTicket,
                                                        returnTicket: returnTicketData,
                                                        isPulangPergi: true
                                                    };
                                                    
                                                    // Clean up localStorage
                                                    localStorage.removeItem('departureTicket');
                                                    
                                                    // Navigate to orders with both tickets
                                                    const queryString = new URLSearchParams({
                                                        ticketData: JSON.stringify(combinedData)
                                                    }).toString();
                                                    
                                                    router.push(`/orders?${queryString}`);
                                                } else if (ticketSearchParams.isPulangPergi) {
                                                    // Jika PP (departure trip), save dan redirect ke halaman pilih tiket pulang
                                                    localStorage.setItem('departureTicket', JSON.stringify(ticketData));
                                                    
                                                    // Redirect to return ticket selection page
                                                    const returnParams = new URLSearchParams({
                                                        origin: ticketSearchParams.returnOrigin || ticketSearchParams.destination || '',
                                                        destination: ticketSearchParams.returnDestination || ticketSearchParams.origin || '',
                                                        adults: ticketSearchParams.adults.toString(),
                                                        children: ticketSearchParams.children.toString(),
                                                        departureDate: ticketSearchParams.returnDate || '',
                                                        isDifabel: ticketSearchParams.isDifabel.toString(),
                                                        isPulangPergi: 'false',
                                                        isReturnTrip: 'true' // Flag untuk tanda ini halaman pilih tiket pulang
                                                    });
                                                    
                                                    router.push(`/tickets?${returnParams.toString()}`);
                                                } else {
                                                    // Navigate to orders with ticket data (one-way)
                                                    const queryString = new URLSearchParams({
                                                        ticketData: JSON.stringify(ticketData)
                                                    }).toString();
                                                    
                                                    router.push(`/orders?${queryString}`);
                                                }
                                            }}
                                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 group"
                                        >
                                            <span className="hidden sm:inline">
                                                {isReturnTrip ? 'Pilih Tiket Pulang' : ticketSearchParams.isPulangPergi ? 'Pilih Tiket Berangkat' : 'Pesan Sekarang'}
                                            </span>
                                            <span className="sm:hidden">Pesan</span>
                                            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 group-hover:translate-x-1 transition-transform inline-block" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))})()}
                    </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function TicketsPage() {
    return (
        <Suspense fallback={
            <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat hasil pencarian...</p>
                </div>
            </div>
        }>
            <TicketPageContent />
        </Suspense>
    );
}