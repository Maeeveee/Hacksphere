"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
    Calendar,
    Clock,
    MapPin,
    Train,
    Users,
    CreditCard,
    X,
    Ticket,
    ChevronRight,
    QrCode
} from 'lucide-react';

interface BookingHistoryItem {
    id: string;
    bookingCode: string;
    trainName: string;
    trainNumber: string;
    origin: string;
    destination: string;
    departureDate: string;
    departureTime: string;
    arrivalTime: string;
    passengerName: string;
    totalPrice: number;
    passengers: number;
    class: string;
    paymentMethod?: string;
    bankName?: string;
    completedAt: string;
    status: string;
}

interface BookingHistoryProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function BookingHistory({ isOpen, onClose }: BookingHistoryProps) {
    const [bookingHistory, setBookingHistory] = useState<BookingHistoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedQRCode, setSelectedQRCode] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadBookingHistory();
        }
    }, [isOpen]);

    const loadBookingHistory = () => {
        try {
            const storedHistory = localStorage.getItem('bookingHistory');
            if (storedHistory) {
                const parsedHistory = JSON.parse(storedHistory);
                setBookingHistory(parsedHistory);
            } else {
                setBookingHistory([]);
            }
        } catch (error) {
            console.error('Error loading booking history:', error);
            setBookingHistory([]);
        } finally {
            setIsLoading(false);
        }
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateTimeString: string) => {
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getClassBadgeColor = (trainClass: string) => {
        switch (trainClass?.toLowerCase()) {
            case 'eksekutif':
                return 'bg-purple-100 text-purple-800 border-purple-300';
            case 'bisnis':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            case 'ekonomi':
                return 'bg-green-100 text-green-800 border-green-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const generateQRCodeURL = (bookingCode: string) => {
        return `http://localhost:3000/booking-code/${bookingCode}`;
    };

    const showQRCode = (bookingCode: string) => {
        setSelectedQRCode(generateQRCodeURL(bookingCode));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-4xl max-h-[90vh] bg-white shadow-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <Ticket className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold text-gray-800">
                                Riwayat Pemesanan
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                                {bookingHistory.length} pemesanan ditemukan
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="hover:bg-gray-100"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : bookingHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <Ticket className="w-16 h-16 mb-4 text-gray-300" />
                            <h3 className="text-lg font-semibold mb-2">Belum Ada Riwayat Pemesanan</h3>
                            <p className="text-sm text-center">
                                Riwayat pemesanan Anda akan muncul di sini setelah Anda menyelesaikan pembayaran.
                            </p>
                        </div>
                    ) : (
                        <div className="h-[60vh] overflow-y-auto">
                            <div className="space-y-4 p-6">
                                {bookingHistory.map((booking) => (
                                    <Card key={booking.id} className="border border-gray-200 hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <Train className="w-6 h-6 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-lg text-gray-800">
                                                            {booking.trainName}
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            <Badge className={getClassBadgeColor(booking.class)}>
                                                                {booking.class}
                                                            </Badge>
                                                            <span className="text-sm text-gray-600">
                                                                {booking.trainNumber}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex flex-col items-end">
                                                    <div className="text-lg font-bold text-blue-600 mb-3">
                                                        {formatPrice(booking.totalPrice)}
                                                    </div>

                                                </div>
                                            </div>

                                            <div className="flex flex-row justify-between items-center gap-6 mb-3 px-3">
                                                {/* Column 1: Journey Information */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                                                        <span className="font-medium text-gray-800">{booking.origin}</span>
                                                        <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                                        <span className="font-medium text-gray-800">{booking.destination}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Calendar className="w-4 h-4 flex-shrink-0" />
                                                        <span>{formatDate(booking.departureDate)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Clock className="w-4 h-4 flex-shrink-0" />
                                                        <span className="font-medium">{booking.departureTime} - {booking.arrivalTime}</span>
                                                    </div>
                                                </div>

                                                {/* Column 2: Passenger & Payment Information */}
                                                <div className="space-y-3">
                                                    <div className="flex items-start gap-2 text-sm text-gray-600">
                                                        <Users className="w-4 h-4 flex-shrink-0" />
                                                        <span className="font-medium">{booking.passengerName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Ticket className="w-4 h-4 flex-shrink-0" />
                                                        <span className="font-mono font-medium">{booking.bookingCode}</span>
                                                    </div>
                                                    {booking.bankName && (
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <CreditCard className="w-4 h-4 flex-shrink-0" />
                                                            <span>{booking.bankName}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Column 3: QR Code & Passenger Count */}
                                                <div className="flex flex-col items-end justify-center space-y-3">
                                                    <Button
                                                        variant="ghost"
                                                        size="lg"
                                                        onClick={() => showQRCode(booking.bookingCode)}
                                                        className="p-4 h-16 w-16 hover:bg-blue-50 hover:border-blue-200 border-2 border-gray-200 rounded-xl transition-all duration-200"
                                                        title="Tampilkan QR Code"
                                                    >
                                                        <QrCode className="w-8 h-8 text-blue-600" />
                                                    </Button>
                                                    <div className="text-xs text-gray-500 text-center font-medium">
                                                        {booking.passengers} penumpang
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                                <div className="text-xs text-gray-500">
                                                    Dipesan pada {formatDateTime(booking.completedAt)}
                                                </div>
                                                <Badge className="bg-green-100 text-green-800 border-green-300">
                                                    {booking.status === 'completed' ? 'Selesai' : booking.status}
                                                </Badge>
                                            </div>


                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* QR Code Modal */}
            {selectedQRCode && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
                    <Card className="w-full max-w-sm bg-white shadow-2xl">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                            <CardTitle className="text-lg font-bold">QR Code Tiket</CardTitle>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedQRCode(null)}
                                className="hover:bg-gray-100"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center space-y-4">
                            <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedQRCode)}`}
                                    alt="QR Code"
                                    className="w-44 h-44"
                                />
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-2">
                                    Scan QR code ini untuk melihat detail tiket
                                </p>
                                <p className="text-xs text-gray-500 font-mono break-all">
                                    {selectedQRCode}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}