"use client";

import { useState, useRef, useEffect } from "react";

export default function MediaSection() {
  const [videoError, setVideoError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleLoadedData = () => {
        setVideoLoaded(true);
        setVideoError(false);
      };

      const handleError = () => {
        setVideoError(true);
        setVideoLoaded(false);
        console.error('Video failed to load:', '/background.mp4');
      };

      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('error', handleError);

      video.load();

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
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

        {/* Fallback/Loading State */}
        {(videoError || !videoLoaded) && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-full flex items-center justify-center">
                {!videoLoaded && !videoError ? (
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg 
                    className="w-10 h-10 text-white ml-1" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-white text-sm">
                {!videoLoaded && !videoError ? 'Loading video...' : 'Video tidak dapat dimuat'}
              </p>
              {videoError && (
                <p className="text-gray-400 text-xs mt-2">
                  Pastikan file background.mp4 ada di folder public
                </p>
              )}
            </div>
          </div>
        )}

        {/* Optional: Dark overlay for better text readability */}
        {videoLoaded && !videoError && (
          <div className="absolute inset-0 bg-black/80 pointer-events-none"></div>
        )}

        {/* Highlight Text Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center px-6 max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Jelajahi Indonesia dengan 
              <span className="text-orange-500"> Kereta Api</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 leading-relaxed">
              Nikmati perjalanan yang nyaman, aman, dan terpercaya ke seluruh destinasi impian Anda
            </p>
            <div className="flex flex-wrap gap-4 justify-center items-end text-white/90">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span className="text-sm font-medium">Booking Online</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span className="text-sm font-medium">Harga Terjangkau</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                <span className="text-sm font-medium">Perjalanan Nyaman</span>
              </div>
            </div>
          </div>
        </div>
    
      </div>
    </div>
  );
}