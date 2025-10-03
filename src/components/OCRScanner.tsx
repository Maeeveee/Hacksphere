"use client";

import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Camera, Upload, X, Loader2, Eye, EyeOff } from 'lucide-react';
import Tesseract from 'tesseract.js';

interface OCRResult {
  nama?: string;
  nomorIdentitas?: string;
  tipeIdentitas?: 'nik' | 'paspor';
}

interface OCRScannerProps {
  onDataExtracted: (data: OCRResult) => void;
  passengerIndex: number;
}

export default function OCRScanner({ onDataExtracted, passengerIndex }: OCRScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [showExtractedText, setShowExtractedText] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const processOCR = async (imageFile: File | string | Blob) => {
    setIsProcessing(true);
    try {
      const result = await Tesseract.recognize(imageFile, 'ind+eng', {
        logger: m => console.log(m)
      });
      
      const text = result.data.text;
      setExtractedText(text);
      
      // Parse the extracted text for Indonesian ID card
      const extractedData = parseIdentityDocument(text);
      
      if (extractedData.nama || extractedData.nomorIdentitas) {
        // Show success message with extracted data
        const successMessage = `Data berhasil diekstrak!\n${extractedData.nama ? `Nama: ${extractedData.nama}\n` : ''}${extractedData.nomorIdentitas ? `NIK: ${extractedData.nomorIdentitas}` : ''}`;
        
        onDataExtracted(extractedData);
        setIsOpen(false);
        stopCamera();
        
        // Show success toast instead of alert
        setTimeout(() => {
          alert(successMessage);
        }, 100);
      } else {
        alert('Tidak dapat mengenali data identitas. Pastikan gambar jelas dan dalam bahasa Indonesia.');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Terjadi kesalahan saat memproses gambar. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseIdentityDocument = (text: string): OCRResult => {
    const result: OCRResult = {};
    
    // Convert to uppercase for better matching
    const upperText = text.toUpperCase();
    
    // Extract NIK (16 digits) - more robust pattern
    const nikPatterns = [
      /\b(\d{16})\b/,
      /NIK\s*[:\-]?\s*(\d{16})/i,
      /(?:NOMOR|NO)\s*[:\-]?\s*(\d{16})/i
    ];
    
    for (const pattern of nikPatterns) {
      const nikMatch = text.match(pattern);
      if (nikMatch && nikMatch[1]) {
        result.nomorIdentitas = nikMatch[1];
        result.tipeIdentitas = 'nik';
        break;
      }
    }
    
    // Extract Name - improved patterns for Indonesian names
    const namePatterns = [
      /(?:NAMA\s*[:\-]?\s*)([A-Z][A-Z\s]{2,}?)(?:\s*\n|$)/i,
      /(?:NAME\s*[:\-]?\s*)([A-Z][A-Z\s]{2,}?)(?:\s*\n|$)/i,
      /^([A-Z][A-Z\s]{2,})\s*$/m,
      /\n([A-Z][A-Z\s]{2,})\n/,
    ];
    
    for (const pattern of namePatterns) {
      const nameMatch = text.match(pattern);
      if (nameMatch && nameMatch[1]) {
        let name = nameMatch[1].trim();
        
        // Clean up the name more thoroughly
        name = name.replace(/\d+/g, '').replace(/[^\w\s]/g, ' ').trim();
        name = name.replace(/\b(INDONESIA|REPUBLIK|ID|CARD|KTP|NIK|NAMA|NAME|TEMPAT|LAHIR|JENIS|KELAMIN|ALAMAT|AGAMA|STATUS|PEKERJAAN|KEWARGANEGARAAN|BERLAKU)\b/gi, '').trim();
        name = name.replace(/\s+/g, ' ').trim();
        
        // Validate name (should be 2-50 characters, only letters and spaces)
        if (name.length > 2 && name.length < 50 && /^[A-Z\s]+$/i.test(name)) {
          result.nama = name;
          break;
        }
      }
    }
    
    // If we found NIK but no name, try context-based extraction
    if (result.nomorIdentitas && !result.nama) {
      const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      const nikLine = lines.findIndex(line => line.includes(result.nomorIdentitas!));
      
      // Check lines around NIK for potential names
      const searchRange = [-3, -2, -1, 1, 2, 3];
      for (const offset of searchRange) {
        const lineIndex = nikLine + offset;
        if (lineIndex >= 0 && lineIndex < lines.length) {
          const line = lines[lineIndex];
          
          // Skip lines that look like other ID card fields
          if (!/\b(TEMPAT|LAHIR|JENIS|KELAMIN|ALAMAT|AGAMA|STATUS|PEKERJAAN|KEWARGANEGARAAN|BERLAKU|\d{2}[\/\-]\d{2}[\/\-]\d{4})\b/i.test(line)) {
            const cleanedLine = line.replace(/[^a-zA-Z\s]/g, ' ').replace(/\s+/g, ' ').trim();
            
            if (cleanedLine.length > 2 && cleanedLine.length < 50 && /^[A-Z\s]+$/i.test(cleanedLine)) {
              result.nama = cleanedLine;
              break;
            }
          }
        }
      }
    }
    
    return result;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processOCR(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Camera error:', error);
      alert('Tidak dapat mengakses kamera. Silakan gunakan opsi upload file.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (context) {
        context.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const imageUrl = URL.createObjectURL(blob);
            setCapturedImage(imageUrl);
            processOCR(blob);
          }
        }, 'image/jpeg', 0.8);
      }
      
      stopCamera();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    stopCamera();
    setCapturedImage(null);
    setExtractedText('');
    setShowExtractedText(false);
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={isProcessing}
        className="border-blue-500 text-blue-600 hover:bg-blue-50 relative"
      >
        {isProcessing ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Camera className="w-4 h-4 mr-2" />
        )}
        {isProcessing ? 'Memproses...' : 'Scan ID'}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Scan Dokumen Identitas</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {isProcessing && (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Memproses gambar...</p>
                <p className="text-xs text-gray-500 mt-2">Proses ini mungkin memerlukan beberapa detik</p>
              </div>
            )}

            {!isProcessing && !showCamera && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Pilih metode untuk memindai dokumen identitas (KTP):
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    onClick={startCamera}
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    variant="outline"
                  >
                    <Camera className="w-6 h-6" />
                    <span className="text-xs">Ambil Foto</span>
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-20 flex flex-col items-center justify-center space-y-2"
                    variant="outline"
                  >
                    <Upload className="w-6 h-6" />
                    <span className="text-xs">Upload File</span>
                  </Button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="text-xs text-gray-500 mt-4 p-3 bg-blue-50 rounded-lg">
                  <strong>Tips untuk hasil terbaik:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    <li>Pastikan pencahayaan cukup</li>
                    <li>Dokumen harus jelas dan tidak blur</li>
                    <li>Hindari bayangan pada dokumen</li>
                    <li>Posisikan dokumen secara horizontal</li>
                  </ul>
                </div>

                {extractedText && (
                  <div className="mt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowExtractedText(!showExtractedText)}
                      className="w-full"
                    >
                      {showExtractedText ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                      {showExtractedText ? 'Sembunyikan' : 'Lihat'} Teks yang Terdeteksi
                    </Button>
                    
                    {showExtractedText && (
                      <div className="mt-2 p-3 bg-gray-50 rounded text-xs max-h-32 overflow-y-auto">
                        <pre className="whitespace-pre-wrap">{extractedText}</pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {showCamera && (
              <div className="space-y-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full rounded-lg"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={capturePhoto}
                    className="flex-1"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Ambil Foto
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={stopCamera}
                  >
                    Batal
                  </Button>
                </div>
                
                <p className="text-xs text-gray-500 text-center">
                  Posisikan KTP dalam frame dan pastikan semua teks terlihat jelas
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}