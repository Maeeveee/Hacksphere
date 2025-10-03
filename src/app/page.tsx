"use client";

import { useEffect } from "react";
import MediaSection from "@/components/mediaSection";
import BookingForm from "@/components/bookingForm";
import UserMenu from "@/components/UserMenu";
import Chatbot from "@/components/Chatbot";

export default function Home() {
    useEffect(() => {
        // Add landing page class to body
        document.body.classList.add('landing-page');
        
        // Cleanup when component unmounts
        return () => {
            document.body.classList.remove('landing-page');
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
                <div className="w-full h-full bg-repeat"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23334155' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}>
                </div>
            </div>

            {/* User Menu - Fixed position */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
                <UserMenu />
            </div>

            {/* Mobile Layout - Stacked vertically */}
            <main className="relative min-h-screen lg:hidden flex flex-col items-center justify-center px-4 sm:px-6 py-8">
                <div className="w-full max-w-2xl mx-auto space-y-6">
                    {/* Media Section - Compact size above form on mobile */}
                    <div className="relative w-full h-48 sm:h-56 md:h-64 rounded-2xl overflow-hidden shadow-2xl">
                        <MediaSection />
                    </div>

                    {/* Booking Form Section */}
                    <div className="relative w-full">
                        <BookingForm />
                    </div>
                </div>
            </main>

            {/* Desktop Layout - Side by side (50-50 split) */}
            <main className="relative hidden lg:flex min-h-screen">
                <div className="w-full h-screen grid grid-cols-2">
                    {/* Left: Media Section - Full height */}
                    <div className="relative h-full overflow-hidden">
                        <MediaSection />
                    </div>

                    {/* Right: Booking Form Section - Full height with scroll */}
                    <div className="relative h-full flex items-center justify-center px-8 xl:px-12 py-8 overflow-y-auto">
                        <div className="w-full max-w-xl">
                            <BookingForm />
                        </div>
                    </div>
                </div>
            </main>
            
            {/* Chatbot - Fixed position for all screens */}
            <div className="fixed bottom-4 right-4 z-50">
                <Chatbot />
            </div>
        </div>
    );
}
