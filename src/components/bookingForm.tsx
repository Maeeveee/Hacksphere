"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import StasiunSelector from "@/components/stasiunSelector";

interface BookingData {
    origin: string;
    destination: string;
    adults: number;
    children: number;
    departureDate: string;
    isDifabel: boolean;
    isPulangPergi: boolean;
    returnDate: string;
    returnOrigin: string;
    returnDestination: string;
}

const STORAGE_KEY = 'kai-booking-data';

export default function BookingForm() {
    const router = useRouter();
    const [bookingData, setBookingData] = useState<BookingData>({
        origin: "",
        destination: "",
        adults: 1,
        children: 0,
        departureDate: "",
        isDifabel: false,
        isPulangPergi: false,
        returnDate: "",
        returnOrigin: "",
        returnDestination: "",
    });
    const [validationMessage, setValidationMessage] = useState<string>("");

    useEffect(() => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
                
                // Validate departure date - if it's in the past, reset it
                const today = getTodayDate();
                if (parsedData.departureDate && parsedData.departureDate < today) {
                    parsedData.departureDate = "";
                }
                
                setBookingData(parsedData);
            } catch (error) {
                console.error('Error loading saved booking data:', error);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(bookingData));
    }, [bookingData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setValidationMessage("");

        // Validasi stasiun asal dan tujuan tidak boleh sama
        if (bookingData.origin && bookingData.destination && 
            bookingData.origin === bookingData.destination) {
            setValidationMessage('Stasiun asal dan tujuan tidak boleh sama!');
            return;
        }

        // Validasi tanggal tidak boleh di masa lalu
        if (bookingData.departureDate && bookingData.departureDate < getTodayDate()) {
            setValidationMessage('Tanggal keberangkatan tidak boleh di masa lalu!');
            return;
        }

        // Validasi pulang-pergi
        if (bookingData.isPulangPergi) {
            if (!bookingData.returnDate) {
                setValidationMessage('Tanggal pulang harus diisi untuk tiket pulang-pergi!');
                return;
            }
            
            // Tanggal pulang harus sama atau setelah tanggal berangkat (bisa hari yang sama, beda jam)
            if (bookingData.returnDate < bookingData.departureDate) {
                setValidationMessage('Tanggal pulang tidak boleh lebih awal dari tanggal keberangkatan!');
                return;
            }

            // Set default return origin/destination jika belum diisi (swap)
            if (!bookingData.returnOrigin) {
                setBookingData(prev => ({
                    ...prev,
                    returnOrigin: bookingData.destination,
                    returnDestination: bookingData.origin
                }));
            }
        }

        const params = new URLSearchParams({
            origin: bookingData.origin,
            destination: bookingData.destination,
            adults: bookingData.adults.toString(),
            children: bookingData.children.toString(),
            departureDate: bookingData.departureDate,
            isDifabel: bookingData.isDifabel.toString(),
            isPulangPergi: bookingData.isPulangPergi.toString(),
        });

        // Add return trip params if pulang-pergi
        if (bookingData.isPulangPergi && bookingData.returnDate) {
            params.set('returnDate', bookingData.returnDate);
            params.set('returnOrigin', bookingData.returnOrigin || bookingData.destination);
            params.set('returnDestination', bookingData.returnDestination || bookingData.origin);
        }

        router.push(`/tickets?${params.toString()}`);
    };

    const handleInputChange = (field: keyof BookingData, value: string | number | boolean) => {
        // Clear validation message when user starts typing
        if (validationMessage) {
            setValidationMessage("");
        }

        setBookingData(prev => {
            const newData = {
                ...prev,
                [field]: value
            };

            // Jika mengubah stasiun asal dan ternyata sama dengan tujuan, kosongkan tujuan
            if (field === 'origin' && value === prev.destination) {
                newData.destination = "";
            }
            
            // Jika mengubah stasiun tujuan dan ternyata sama dengan asal, kosongkan asal
            if (field === 'destination' && value === prev.origin) {
                newData.origin = "";
            }

            return newData;
        });
    };

    const clearForm = () => {
        const emptyData = {
            origin: "",
            destination: "",
            adults: 1,
            children: 0,
            departureDate: "",
            isDifabel: false,
            isPulangPergi: false,
            returnDate: "",
            returnOrigin: "",
            returnDestination: "",
        };
        setBookingData(emptyData);
        localStorage.removeItem(STORAGE_KEY);
    };

    // Get today's date in YYYY-MM-DD format for min date validation
    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    return (
        <>
            <div className="w-full mx-auto">
                <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md">
                <CardHeader className="text-center bg-white/95 rounded-t-lg border-b border-gray-100 px-4 py-4 sm:px-6 sm:py-5">
                    <CardTitle className="text-base sm:text-lg font-bold text-gray-800">
                        Pesan Tiket Kereta Api
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-xs sm:text-sm">
                        Cari dan pesan tiket perjalanan Anda
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-5">
                    {validationMessage && (
                        <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-xs sm:text-sm font-medium">{validationMessage}</p>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                        {/* Origin and Destination - Side by side on mobile, vertical on desktop */}
                        <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 sm:gap-3 lg:gap-0 lg:space-y-3">
                            {/* Origin */}
                            <div className="space-y-2">
                                <Label htmlFor="origin" className="text-xs sm:text-sm font-semibold text-gray-800">
                                    Stasiun Asal
                                </Label>
                                <StasiunSelector
                                    value={bookingData.origin}
                                    onChange={(value) => handleInputChange("origin", value)}
                                    placeholder="Cari stasiun asal..."
                                    className="w-full"
                                    excludeStasiun={bookingData.destination}
                                />
                            </div>

                            {/* Destination */}
                            <div className="space-y-2">
                                <Label htmlFor="destination" className="text-xs sm:text-sm font-semibold text-gray-800">
                                    Stasiun Tujuan
                                </Label>
                                <StasiunSelector
                                    value={bookingData.destination}
                                    onChange={(value) => handleInputChange("destination", value)}
                                    placeholder="Cari stasiun tujuan..."
                                    className="w-full"
                                    excludeStasiun={bookingData.origin}
                                />
                            </div>
                        </div>

                        {/* Departure Date */}
                        <div className="space-y-2">
                            <Label htmlFor="departureDate" className="text-sm font-semibold text-gray-800">
                                Tanggal Keberangkatan
                            </Label>
                            <Input
                                id="departureDate"
                                type="date"
                                value={bookingData.departureDate}
                                onChange={(e) => handleInputChange("departureDate", e.target.value)}
                                min={getTodayDate()}
                                className="w-full h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                                required
                            />
                        </div>

                        {/* Checkbox Options - Move before passengers */}
                        <div className="space-y-2 sm:space-y-3">
                            <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                <div>
                                    <Label className="text-xs sm:text-sm font-semibold text-gray-800 block mb-2">
                                        Kebutuhan Khusus
                                    </Label>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="difable"
                                            checked={bookingData.isDifabel}
                                            onCheckedChange={(checked) => handleInputChange("isDifabel", checked as boolean)}
                                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                        />
                                        <Label
                                            htmlFor="difable"
                                            className="text-xs sm:text-sm text-gray-700 font-medium cursor-pointer"
                                        >
                                            Difabel
                                        </Label>
                                    </div>
                                </div>

                                <div>
                                    <Label className="text-xs sm:text-sm font-semibold text-gray-800 block mb-2">
                                        Paket
                                    </Label>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox
                                            id="pulangPergi"
                                            checked={bookingData.isPulangPergi}
                                            onCheckedChange={(checked) => {
                                                handleInputChange("isPulangPergi", checked as boolean);
                                                // Auto-set return origin/destination (swap) when checked
                                                if (checked && bookingData.origin && bookingData.destination) {
                                                    setBookingData(prev => ({
                                                        ...prev,
                                                        isPulangPergi: true,
                                                        returnOrigin: prev.destination,
                                                        returnDestination: prev.origin
                                                    }));
                                                }
                                            }}
                                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                        />
                                        <Label
                                            htmlFor="pulangPergi"
                                            className="text-xs sm:text-sm text-gray-700 font-medium cursor-pointer"
                                        >
                                            Pulang - Pergi
                                        </Label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Return Trip Section - Show when PP is checked */}
                        {bookingData.isPulangPergi && (
                            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                    <Label className="text-sm font-bold text-blue-900">
                                        Perjalanan Pulang
                                    </Label>
                                </div>

                                {/* Return Route */}
                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                    <div className="space-y-2">
                                        <Label htmlFor="returnOrigin" className="text-xs sm:text-sm font-semibold text-gray-800">
                                            Dari
                                        </Label>
                                        <StasiunSelector
                                            value={bookingData.returnOrigin || bookingData.destination}
                                            onChange={(value) => handleInputChange("returnOrigin", value)}
                                            placeholder="Stasiun asal pulang..."
                                            className="w-full"
                                            excludeStasiun={bookingData.returnDestination}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="returnDestination" className="text-xs sm:text-sm font-semibold text-gray-800">
                                            Ke
                                        </Label>
                                        <StasiunSelector
                                            value={bookingData.returnDestination || bookingData.origin}
                                            onChange={(value) => handleInputChange("returnDestination", value)}
                                            placeholder="Stasiun tujuan pulang..."
                                            className="w-full"
                                            excludeStasiun={bookingData.returnOrigin}
                                        />
                                    </div>
                                </div>

                                {/* Return Date */}
                                <div className="space-y-2">
                                    <Label htmlFor="returnDate" className="text-sm font-semibold text-gray-800">
                                        Tanggal Pulang
                                    </Label>
                                    <Input
                                        id="returnDate"
                                        type="date"
                                        value={bookingData.returnDate}
                                        onChange={(e) => handleInputChange("returnDate", e.target.value)}
                                        min={bookingData.departureDate || getTodayDate()}
                                        className="w-full h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                                        required={bookingData.isPulangPergi}
                                    />
                                    <p className="text-xs text-gray-600 mt-1">
                                        Bisa pilih hari yang sama (tiket dengan jam berbeda)
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Passengers */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-800">
                                Jumlah Penumpang
                            </Label>
                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="adults" className="text-xs font-medium text-gray-600">
                                        Dewasa
                                    </Label>
                                    <Input
                                        id="adults"
                                        type="number"
                                        min="1"
                                        max="10"
                                        placeholder="1"
                                        value={bookingData.adults}
                                        onChange={(e) => handleInputChange("adults", parseInt(e.target.value) || 1)}
                                        className="w-full h-9 sm:h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-sm"
                                        required
                                    />
                                </div>

                                <div className="space-y-1">
                                    <Label htmlFor="children" className="text-xs font-medium text-gray-600">
                                        Anak-anak
                                    </Label>
                                    <Input
                                        id="children"
                                        type="number"
                                        min="0"
                                        max="10"
                                        placeholder="0"
                                        value={bookingData.children}
                                        onChange={(e) => handleInputChange("children", parseInt(e.target.value) || 0)}
                                        className="w-full h-9 sm:h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4 sm:mt-5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={clearForm}
                                className="h-9 sm:h-10 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all duration-300 text-sm"
                            >
                                Hapus
                            </Button>
                            <Button
                                type="submit"
                                className="h-9 sm:h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl text-sm"
                            >
                                Cari Tiket
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
        </>
    );
}