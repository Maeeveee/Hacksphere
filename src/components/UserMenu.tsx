"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Menu,
  History
} from 'lucide-react';
import BookingHistory from '@/components/BookingHistory';

export default function UserMenu() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenHistory = () => {
    setIsHistoryOpen(true);
    setIsMenuOpen(false);
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="bg-white/90 backdrop-blur-md hover:bg-white border border-gray-200 shadow-sm"
        >
          <Menu className="w-4 h-4" />
        </Button>

        {isMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-lg z-50">
            <div className="py-1">
              <button
                onClick={handleOpenHistory}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <History className="w-4 h-4 mr-2" />
                Riwayat Pemesanan
              </button>
            </div>
          </div>
        )}
      </div>

      <BookingHistory 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
      />
    </>
  );
}