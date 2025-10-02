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
    });

    useEffect(() => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            try {
                const parsedData = JSON.parse(savedData);
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

        const params = new URLSearchParams({
            origin: bookingData.origin,
            destination: bookingData.destination,
            adults: bookingData.adults.toString(),
            children: bookingData.children.toString(),
            departureDate: bookingData.departureDate,
            isDifabel: bookingData.isDifabel.toString(),
            isPulangPergi: bookingData.isPulangPergi.toString()
        });

        router.push(`/tickets?${params.toString()}`);
    };

    const handleInputChange = (field: keyof BookingData, value: string | number | boolean) => {
        setBookingData(prev => ({
            ...prev,
            [field]: value
        }));
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
        };
        setBookingData(emptyData);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <>
            <div className="w-full max-w-md mx-auto">
                <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md">
                <CardHeader className="text-center bg-white/95 rounded-t-lg border-b border-gray-100">
                    <CardTitle className="text-lg font-bold text-gray-800">
                        Pesan Tiket Kereta Api
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-sm">
                        Cari dan pesan tiket perjalanan Anda
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-5">
                    <form onSubmit={handleSubmit} className="space-y-2">
                        {/* Origin */}
                        <div className="space-y-2">
                            <Label htmlFor="origin" className="text-sm font-semibold text-gray-800">
                                Stasiun Asal
                            </Label>
                            <StasiunSelector
                                value={bookingData.origin}
                                onChange={(value) => handleInputChange("origin", value)}
                                placeholder="Cari stasiun asal..."
                                className="w-full"
                            />
                        </div>

                        {/* Destination */}
                        <div className="space-y-2">
                            <Label htmlFor="destination" className="text-sm font-semibold text-gray-800">
                                Stasiun Tujuan
                            </Label>
                            <StasiunSelector
                                value={bookingData.destination}
                                onChange={(value) => handleInputChange("destination", value)}
                                placeholder="Cari stasiun tujuan..."
                                className="w-full"
                            />
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
                                className="w-full h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                                required
                            />
                        </div>

                        {/* Passengers */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-800">
                                Jumlah Penumpang
                            </Label>
                            <div className="grid grid-cols-2 gap-3">
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
                                        className="w-full h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
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
                                        className="w-full h-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Checkbox Options */}
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <Label className="text-sm font-semibold text-gray-800">
                                    Kebutuhan Khusus
                                </Label>
                                <Label className="text-sm font-semibold text-gray-800">
                                    Paket
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
                                        className="text-sm text-gray-700 font-medium cursor-pointer"
                                    >
                                        Difabel
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="pulangPergi"
                                        checked={bookingData.isPulangPergi}
                                        onCheckedChange={(checked) => handleInputChange("isPulangPergi", checked as boolean)}
                                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                    />
                                    <Label
                                        htmlFor="pulangPergi"
                                        className="text-sm text-gray-700 font-medium cursor-pointer"
                                    >
                                        Pulang - Pergi
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-3 mt-5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={clearForm}
                                className="h-10 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-all duration-300"
                            >
                                Hapus
                            </Button>
                            <Button
                                type="submit"
                                className="h-10 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
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