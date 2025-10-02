"use client";

import { useState, useEffect, useRef } from 'react';
import { getAllStasiun, searchStasiun, type Stasiun } from '@/lib/supabase/queries';
import { Input } from '@/components/ui/input';
import { ChevronDown, MapPin } from 'lucide-react';

interface StasiunSelectorProps {
  placeholder?: string;
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  excludeStasiun?: string; // Nama stasiun yang harus dikecualikan dari daftar
}

export default function StasiunSelector({ 
  placeholder = "Pilih stasiun...", 
  value = "", 
  onChange,
  className = "",
  excludeStasiun
}: StasiunSelectorProps) {
  const [stasiuns, setStasiuns] = useState<Stasiun[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && stasiuns.length === 0) {
      loadStasiuns();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Update stasiun list when excludeStasiun changes
  useEffect(() => {
    if (stasiuns.length > 0) {
      if (searchTerm.trim() === '') {
        loadStasiuns();
      } else {
        handleSearch(searchTerm);
      }
    }
  }, [excludeStasiun]);

  const loadStasiuns = async () => {
    setLoading(true);
    const { data, error } = await getAllStasiun();
    
    if (!error) {
      // Filter out excluded stasiun
      const filteredData = (data || []).filter(stasiun => 
        !excludeStasiun || stasiun.nama_stasiun !== excludeStasiun
      );
      setStasiuns(filteredData);
    }
    
    setLoading(false);
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    onChange(term);
    
    if (term.trim() === '') {
      loadStasiuns();
      return;
    }

    setLoading(true);
    const { data, error } = await searchStasiun(term);
    
    if (!error) {
      // Filter out excluded stasiun
      const filteredData = (data || []).filter(stasiun => 
        !excludeStasiun || stasiun.nama_stasiun !== excludeStasiun
      );
      setStasiuns(filteredData);
    }
    
    setLoading(false);
  };

  const handleStasiunSelect = (stasiun: Stasiun) => {
    setSearchTerm(stasiun.nama_stasiun);
    onChange(stasiun.nama_stasiun);
    setIsOpen(false);
  };

  const handleInputClick = () => {
    setIsOpen(true);
    if (stasiuns.length === 0) {
      loadStasiuns();
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          onClick={handleInputClick}
          className="w-full pr-10 cursor-pointer"
          autoComplete="off"
        />
        <ChevronDown 
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Memuat...</span>
            </div>
          ) : stasiuns.length > 0 ? (
            <div className="py-1">
              {stasiuns.map((stasiun) => (
                <div
                  key={stasiun.id}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                  onClick={() => handleStasiunSelect(stasiun)}
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div>
                      <div className="font-medium text-gray-800 text-sm">
                        {stasiun.nama_stasiun}
                      </div>
                      <div className="text-xs text-gray-500">
                        {stasiun.kota} • {stasiun.kode_stasiun}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-6 text-center text-gray-500 text-sm">
              {searchTerm ? 'Tidak ada stasiun ditemukan' : 'Mulai mengetik untuk mencari stasiun'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}