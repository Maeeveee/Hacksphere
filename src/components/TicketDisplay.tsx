"use client";

import { QRCodeSVG } from "qrcode.react";
import { Train, ArrowRight, Clock, MapPin, User, Tag } from 'lucide-react';

interface TicketData {
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
}

const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
};


export default function TicketDisplay({ ticket }: { ticket: TicketData }) {
    return (
        <div className="w-full max-w-sm mx-auto bg-white rounded-xl shadow-2xl overflow-hidden border-0">
            {/* Header Biru */}
            <div className="bg-blue-800 text-white p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-lg font-bold">{ticket.trainName} ({ticket.trainNumber})</p>
                        <p className="text-xs opacity-80">Kode Pemesanan: <span className="font-semibold">{ticket.bookingCode}</span></p>
                    </div>
                     <Train className="w-8 h-8 opacity-90"/>
                </div>
                <div className="flex justify-between items-center mt-4">
                    <div>
                        <p className="text-2xl font-bold">{formatTime(ticket.departureDate)}</p>
                        <p className="text-sm">{ticket.origin}</p>
                        <p className="text-xs opacity-80">{formatDate(ticket.departureDate)}</p>
                    </div>
                    <ArrowRight className="w-6 h-6 mx-2"/>
                     <div>
                        <p className="text-2xl font-bold text-right">{formatTime(ticket.arrivalDate)}</p>
                        <p className="text-sm text-right">{ticket.destination}</p>
                        <p className="text-xs opacity-80 text-right">{formatDate(ticket.arrivalDate)}</p>
                    </div>
                </div>
            </div>

             {/* Konten Putih */}
            <div className="p-6 space-y-4 text-center bg-white">
                 <div className="grid grid-cols-2 gap-4 text-left">
                    <div>
                         <p className="text-xs text-gray-500">Penumpang</p>
                         <p className="font-bold text-gray-800">{ticket.passengerName}</p>
                    </div>
                     <div>
                         <p className="text-xs text-gray-500">No. Kursi</p>
                         <p className="font-bold text-gray-800">{ticket.seatNumber}</p>
                    </div>
                 </div>

                <div className="flex justify-center my-4">
                     <QRCodeSVG 
                        value={ticket.qrCodeValue}
                        size={180} 
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="Q"
                        includeMargin={true}
                        className="border border-gray-200 rounded-lg"
                    />
                </div>
                <p className="text-sm font-semibold text-gray-700">Pindai kode ini di gerbang</p>
            </div>
        </div>
    );
}