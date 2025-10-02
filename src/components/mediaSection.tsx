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
      </div>
    </div>
  );
}