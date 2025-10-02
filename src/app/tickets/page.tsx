"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Users, Calendar, ArrowLeft, Train, Wifi, Utensils, Zap, Star, ChevronRight, Bed } from "lucide-react";
import { useRouter } from "next/navigation";

interface TicketSearchParams {
    origin: string;
    destination: string;
    adults: number;
    children: number;
    departureDate: string;
    isDifabel: boolean;
    isPulangPergi: boolean;
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

// Sample data - In real app, this would come from API
const generateSampleTickets = (searchParams: TicketSearchParams): TrainTicket[] => {
    const baseTrains = [
        {
            trainName: "Argo Bromo Anggrek",
            trainNumber: "KA 1",
            class: "Eksekutif",
            basePrice: 350000,
            facilities: ["AC", "Makanan", "WiFi", "Colokan Listrik"]
        },
        {
            trainName: "Bima",
            trainNumber: "KA 2",
            class: "Bisnis",
            basePrice: 250000,
            facilities: ["AC", "Makanan", "WiFi"]
        },
        {
            trainName: "Gaya Baru Malam Selatan",
            trainNumber: "KA 3",
            class: "Ekonomi",
            basePrice: 150000,
            facilities: ["AC", "WiFi"]
        },
        {
            trainName: "Fajar Utama",
            trainNumber: "KA 4",
            class: "Bisnis",
            basePrice: 280000,
            facilities: ["AC", "Makanan", "WiFi", "Selimut"]
        }
    ];

    return baseTrains.map((train, index) => ({
        id: `ticket-${index + 1}`,
        ...train,
        origin: searchParams.origin,
        destination: searchParams.destination,
        departureTime: `${6 + index * 2}:${30 + index * 15}`,
        arrivalTime: `${10 + index * 2}:${45 + index * 15}`,
        duration: `${4 + index}j ${15 + index * 10}m`,
        price: train.basePrice + (index * 25000),
        availableSeats: Math.floor(Math.random() * 50) + 10
    }));
};

function TicketPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const ticketSearchParams: TicketSearchParams = {
        origin: searchParams?.get('origin') || '',
        destination: searchParams?.get('destination') || '',
        adults: parseInt(searchParams?.get('adults') || '1'),
        children: parseInt(searchParams?.get('children') || '0'),
        departureDate: searchParams?.get('departureDate') || '',
        isDifabel: searchParams?.get('isDifabel') === 'true',
        isPulangPergi: searchParams?.get('isPulangPergi') === 'true'
    };

    const tickets = generateSampleTickets(ticketSearchParams);
    const totalPassengers = ticketSearchParams.adults + ticketSearchParams.children;

    // Check if we have valid search params
    const hasValidSearch = ticketSearchParams.origin && ticketSearchParams.destination && ticketSearchParams.departureDate;

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
                    <Button 
                        variant="outline" 
                        onClick={() => router.push('/')}
                        className="mb-6 bg-white/90 backdrop-blur-md hover:bg-white"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Beranda
                    </Button>
                    
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-md">
                        <CardContent className="text-center py-12">
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
                        </CardContent>
                    </Card>
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
                    Kembali ke Pencarian
                </Button>

                {/* Search Summary */}
                <Card className="mb-8 shadow-xl border-0 bg-gradient-to-r from-white/95 to-blue-50/95 backdrop-blur-md overflow-hidden">
                    <CardHeader className="pb-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                        <CardTitle className="text-xl font-bold text-gray-800 flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                                <MapPin className="w-5 h-5 text-white" />
                            </div>
                            Hasil Pencarian Tiket
                            <Badge className="bg-blue-100 text-blue-800 text-xs">
                                {tickets.length} kereta ditemukan
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-6">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white/80 p-4 rounded-xl shadow-sm border border-blue-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-gray-500 uppercase">Rute</div>
                                        <div className="font-bold text-gray-800 flex items-center gap-2">
                                            <span className="text-sm">{ticketSearchParams.origin || 'Stasiun Asal'}</span>
                                            <ChevronRight className="w-3 h-3 text-gray-400" />
                                            <span className="text-sm">{ticketSearchParams.destination || 'Stasiun Tujuan'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white/80 p-4 rounded-xl shadow-sm border border-green-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                        <Calendar className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-gray-500 uppercase">Tanggal</div>
                                        <div className="font-bold text-gray-800 text-sm">
                                            {ticketSearchParams.departureDate ? 
                                                new Date(ticketSearchParams.departureDate).toLocaleDateString('id-ID', { 
                                                    weekday: 'short', 
                                                    day: 'numeric', 
                                                    month: 'short' 
                                                }) 
                                                : 'Tidak dipilih'
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white/80 p-4 rounded-xl shadow-sm border border-purple-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                        <Users className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-gray-500 uppercase">Penumpang</div>
                                        <div className="font-bold text-gray-800 text-sm">
                                            {ticketSearchParams.adults} Dewasa{ticketSearchParams.children > 0 ? `, ${ticketSearchParams.children} Anak` : ''}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-white/80 p-4 rounded-xl shadow-sm border border-orange-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                        <Star className="w-4 h-4 text-orange-600" />
                                    </div>
                                    <div>
                                        <div className="text-xs font-medium text-gray-500 uppercase">Opsi</div>
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
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    {tickets.map((ticket) => (
                        <Card key={ticket.id} className="group shadow-lg border border-gray-200 bg-white hover:shadow-xl transition-all duration-300 overflow-hidden">
                            <CardContent className="p-0">
                                {/* Header Section - Simplified */}
                                <div className="px-6 py-3 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50/30">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge className={`${getClassBadgeColor(ticket.class)} font-medium text-sm px-3 py-1`}>
                                                {ticket.class}
                                            </Badge>
                                            <span className="text-sm text-gray-600 font-medium">{ticket.trainNumber}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <div className={`w-2 h-2 rounded-full ${ticket.availableSeats > 20 ? 'bg-green-500' : ticket.availableSeats > 10 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                            <span>{ticket.availableSeats} kursi tersisa</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Main Content */}
                                <div className="px-6 py-6">
                                    {/* Main Content Grid - 3 Columns */}
                                    <div className="grid lg:grid-cols-3 gap-6">
                                        {/* Left Column - Train Name & Schedule */}
                                        <div className="lg:col-span-1 space-y-4">
                                            {/* Train Name Only */}
                                            <div>
                                                <h3 className="font-bold text-xl text-gray-800 group-hover:text-blue-700 transition-colors mb-1">
                                                    {ticket.trainName}
                                                </h3>
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Clock className="w-4 h-4 text-blue-500" />
                                                    <span className="font-medium">{ticket.duration}</span>
                                                </div>
                                            </div>

                                            {/* Schedule Timeline */}
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-gray-800">{ticket.departureTime}</div>
                                                        <div className="text-sm text-gray-600 font-medium bg-white px-3 py-1.5 rounded-lg mt-2">
                                                            {ticket.origin}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 flex items-center relative mx-4">
                                                        <div className="w-full h-0.5 bg-gradient-to-r from-blue-400 to-indigo-400"></div>
                                                        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                                                                <Train className="w-4 h-4 text-white" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-2xl font-bold text-gray-800">{ticket.arrivalTime}</div>
                                                        <div className="text-sm text-gray-600 font-medium bg-white px-3 py-1.5 rounded-lg mt-2">
                                                            {ticket.destination}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Middle Column - Facilities */}
                                        <div className="lg:col-span-1">
                                            <div className="text-sm font-semibold text-gray-700 mb-3">Fasilitas Tersedia</div>
                                            <div className="grid grid-cols-1 gap-2">
                                                {ticket.facilities.map((facility, index) => (
                                                    <div key={index} className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                                                        <div className="text-blue-600 flex-shrink-0">
                                                            {getFacilityIcon(facility)}
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700">{facility}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Right Column - Price & Action */}
                                        <div className="lg:col-span-1 flex flex-col justify-center items-center space-y-4">
                                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl w-full text-center">
                                                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                                    {formatPrice(ticket.price * totalPassengers)}
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1 font-medium">
                                                    {totalPassengers} {totalPassengers === 1 ? 'penumpang' : 'penumpang'}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {formatPrice(ticket.price)} per orang
                                                </div>
                                            </div>
                                            <Button 
                                                onClick={() => router.push('/orders')}
                                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                                            >
                                                <span>Pilih Kereta</span>
                                                <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                            <div className="text-xs text-gray-500 text-center">Pembayaran aman & terpercaya</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* No tickets found */}
                {tickets.length === 0 && (
                    <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-md">
                        <CardContent className="text-center py-12">
                            <div className="text-gray-400 mb-4">
                                <Clock className="w-16 h-16 mx-auto" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                Tidak ada kereta tersedia
                            </h3>
                            <p className="text-gray-600">
                                Coba ubah tanggal keberangkatan atau rute perjalanan
                            </p>
                        </CardContent>
                    </Card>
                )}
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