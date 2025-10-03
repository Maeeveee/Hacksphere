"use client";

import { useState, useRef, useEffect } from "react";

export default function MediaSection() {
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleError = () => {
        setVideoError(true);
        console.error('Video failed to load:', '/background.mp4');
      };

      video.addEventListener('error', handleError);

      video.load();

      return () => {
        video.removeEventListener('error', handleError);
      };
    }
  }, []);

  return (
    <div className="w-full h-full">
      <div className="relative w-full h-full bg-black overflow-hidden">
        
        {/* KAI Logo - Top Left */}
        <div className="absolute top-4 left-4 z-20 pointer-events-auto">
          <img 
            src="/kai-logo.png" 
            alt="Kereta Api Indonesia" 
            className="h-10 md:h-12 w-auto drop-shadow-lg hover:scale-105 transition-transform duration-200"
          />
        </div>

        {/* Video Background */}
        <video 
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          style={{ display: videoError ? 'none' : 'block' }}
        >
          <source 
            src="/background.mp4" 
            type="video/mp4" 
          />
          Your browser does not support the video tag.
        </video>

        {/* Fallback State - Only shown on error */}
        {videoError && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
            <div className="text-center">
              <p className="text-white text-sm">Video tidak dapat dimuat</p>
              <p className="text-gray-400 text-xs mt-2">
                Pastikan file background.mp4 ada di folder public
              </p>
            </div>
          </div>
        )}

        {/* Dark overlay for better text readability */}
        {!videoError && (
          <div className="absolute inset-0 bg-black/80 pointer-events-none"></div>
        )}

        {/* Highlight Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center px-4 sm:px-6 max-w-4xl">
            {/* Main Headline - Always visible */}
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 md:mb-6 leading-tight">
              Jelajahi Indonesia dengan 
              <span className="text-orange-500"> Kereta Api</span>
            </h1>
            
            {/* Subtitle - Hidden on mobile, visible on tablet and up */}
            <p className="hidden sm:block text-base md:text-xl lg:text-2xl text-gray-200 mb-4 md:mb-8 leading-relaxed">
              Nikmati perjalanan yang nyaman, aman, dan terpercaya ke seluruh destinasi impian Anda
            </p>
            
            {/* Feature badges - Hidden on mobile, visible on md and up */}
            <div className="hidden md:flex flex-wrap gap-3 lg:gap-4 justify-center items-end text-white/90">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 lg:px-4 py-2 rounded-lg">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span className="text-xs lg:text-sm font-medium">Booking Online</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 lg:px-4 py-2 rounded-lg">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span className="text-xs lg:text-sm font-medium">Harga Terjangkau</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 lg:px-4 py-2 rounded-lg">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span className="text-xs lg:text-sm font-medium">Perjalanan Nyaman</span>
              </div>
            </div>
          </div>
        </div>
    
      </div>
    </div>
  );
}