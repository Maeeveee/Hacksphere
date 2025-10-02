"use client";

import { useEffect } from "react";
import MediaSection from "@/components/mediaSection";
import BookingForm from "@/components/bookingForm";
import UserMenu from "@/components/UserMenu";

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
        
        
        <div className="h-screen overflow-hidden bg-white">
            <main className="flex h-screen">
                <div className="grid lg:grid-cols-2 w-full h-full">
                    <div className="relative order-2 lg:order-1 h-full">
                        <MediaSection />
                    </div>

                    <div className="relative order-1 lg:order-2 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center px-8 h-full">
                        <div className="absolute inset-0 opacity-5">
                            <div className="w-full h-full bg-repeat"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23334155' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                                }}>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 z-50 pt-6 px-6">
                            <UserMenu />
                        </div>
                        <div className="relative z-10 w-full max-w-lg">
                            <BookingForm />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
