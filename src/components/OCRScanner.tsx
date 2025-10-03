"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Camera, Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import Tesseract from 'tesseract.js';

interface OCRResult {
  nama?: string;
  nomorIdentitas?: string;
  tipeIdentitas?: 'nik' | 'paspor';
  gender?: string;
}

interface OCRScannerProps {
  onDataExtracted: (data: OCRResult) => void;
  passengerIndex: number;
}

interface CustomAlertProps {
  type: 'success' | 'error' | 'info';
  message: string;
  details?: string;
  onClose: () => void;
}

// Custom Alert Component
function CustomAlert({ type, message, details, onClose }: CustomAlertProps) {
  const bgColor = type === 'success' ? 'bg-green-50' : type === 'error' ? 'bg-red-50' : 'bg-blue-50';
  const textColor = type === 'success' ? 'text-green-800' : type === 'error' ? 'text-red-800' : 'text-blue-800';
  const borderColor = type === 'success' ? 'border-green-200' : type === 'error' ? 'border-red-200' : 'border-blue-200';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;
  const iconColor = type === 'success' ? 'text-green-600' : type === 'error' ? 'text-red-600' : 'text-blue-600';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
      <div className={`${bgColor} ${borderColor} border-2 rounded-lg max-w-md w-full p-6 shadow-2xl`}>
        <div className="flex items-start gap-4">
          <Icon className={`w-6 h-6 ${iconColor} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <h3 className={`text-lg font-semibold ${textColor} mb-2`}>{message}</h3>
            {details && (
              <div className={`text-sm ${textColor} whitespace-pre-line`}>
                {details}
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <Button
            onClick={onClose}
            className={`${type === 'success' ? 'bg-green-600 hover:bg-green-700' : type === 'error' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OCRScanner({ onDataExtracted, passengerIndex: _passengerIndex }: OCRScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [showExtractedText, setShowExtractedText] = useState(false);
  const [alertData, setAlertData] = useState<{ type: 'success' | 'error' | 'info'; message: string; details?: string } | null>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  // Token to re-run effect when a new MediaStream is acquired (since ref mutation alone doesn't trigger re-render)
  const [streamToken, setStreamToken] = useState(0);
  const [videoTimeout, setVideoTimeout] = useState(false);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [cameraError, setCameraError] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const showAlert = useCallback((type: 'success' | 'error' | 'info', message: string, details?: string) => {
    setAlertData({ type, message, details });
  }, []);

  const closeAlert = () => {
    setAlertData(null);
  };

  const processOCR = async (imageFile: File | string | Blob) => {
    setIsProcessing(true);
    try {
      const result = await Tesseract.recognize(imageFile, 'ind+eng');
      
      const text = result.data.text;
      setExtractedText(text);
      
      // Parse the extracted text for Indonesian ID card
      const extractedData = parseIdentityDocument(text);
      
      if (extractedData.nama || extractedData.nomorIdentitas || extractedData.gender) {
        // Build success details
        const details = [
          extractedData.nama ? `Nama: ${extractedData.nama}` : '',
          extractedData.nomorIdentitas ? `NIK: ${extractedData.nomorIdentitas}` : '',
          extractedData.gender ? `Jenis Kelamin: ${extractedData.gender === 'tuan' ? 'Tuan (Laki-laki)' : 'Nona (Perempuan)'}` : ''
        ].filter(Boolean).join('\n');
        
        onDataExtracted(extractedData);
        stopCamera();
        
        // Show success alert
        setTimeout(() => {
          showAlert('success', 'Data Berhasil Diekstrak!', details);
        }, 100);
      } else {
        showAlert('error', 'Gagal Mengenali Data', 'Tidak dapat mengenali data identitas.\nPastikan gambar jelas dan dalam bahasa Indonesia.\n\nTips:\n• Pastikan pencahayaan cukup\n• Hindari bayangan pada dokumen\n• Posisikan KTP secara horizontal');
      }
    } catch (error) {
      showAlert('error', 'Terjadi Kesalahan', 'Terjadi kesalahan saat memproses gambar.\nSilakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseIdentityDocument = (text: string): OCRResult => {
    const result: OCRResult = {};
    
    // Convert to uppercase for better matching
    const upperText = text.toUpperCase();

    const FIELD_KEYWORDS = /(INDONESIA|REPUBLIK|ID|CARD|KTP|NIK|NAMA|NAME|TEMPAT|LAHIR|TTL|JENIS|KELAMIN|ALAMAT|AGAMA|STATUS|PEKERJAAN|KEWARGANEGARAAN|BERLAKU|HINGGA|SELAMANYA)/gi;
    const LOCATION_KEYWORDS = /(JAKARTA|BANDUNG|SURABAYA|MEDAN|SEMARANG|YOGYAKARTA|MALANG|SOLO|BEKASI|TANGERANG|DEPOK|BOGOR|BANTEN|JAWA|SUMATERA|KALIMANTAN|SULAWESI|PAPUA|BALI|LOMBOK|ACEH|RIAU|JAMBI|BENGKULU|LAMPUNG|BANGKA|BELITUNG|UTARA|SELATAN|TIMUR|BARAT|TENGAH|PUSAT|KOTA|KABUPATEN|PROVINSI|DAERAH|ISTIMEWA|DESA|KELURAHAN|KECAMATAN|KAMPUNG)/gi;

    const cleanNameCandidate = (candidate: string): string | null => {
      if (!candidate) return null;

      let name = candidate.replace(/\d+/g, ' ').replace(/[^a-zA-Z\s]/g, ' ');
      name = name.replace(FIELD_KEYWORDS, ' ');
      name = name.replace(LOCATION_KEYWORDS, ' ');
      name = name.replace(/\s+/g, ' ').trim();

      if (!name) return null;

      const words = name.split(/\s+/).filter(Boolean);
      if (name.length < 6 || name.length > 50) return null;
      if (words.length < 2) return null;
      if (!words.every(word => /^[A-Z]+$/i.test(word) && word.length >= 2)) return null;

      return name;
    };
    
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
    
    // Extract Gender and map to appropriate title
    const genderPatterns = [
      /(?:JENIS\s+KELAMIN\s*[:\-]?\s*)(LAKI[-\s]*LAKI|PEREMPUAN)/i,
      /(?:KELAMIN\s*[:\-]?\s*)(LAKI[-\s]*LAKI|PEREMPUAN)/i,
      /(?:GENDER\s*[:\-]?\s*)(LAKI[-\s]*LAKI|PEREMPUAN|MALE|FEMALE)/i,
    ];
    
    for (const pattern of genderPatterns) {
      const genderMatch = upperText.match(pattern);
      if (genderMatch && genderMatch[1]) {
        const gender = genderMatch[1].replace(/[-\s]/g, '').toUpperCase();
        if (gender.includes('LAKI') || gender === 'MALE') {
          result.gender = 'tuan';
        } else if (gender.includes('PEREMPUAN') || gender === 'FEMALE') {
          result.gender = 'nona';
        }
        break;
      }
    }
    
    // Extract Name - more precise patterns for Indonesian ID cards
    const namePatterns = [
      /NAMA\s*[:\-]?\s*([A-Z][A-Z\s]{5,48}?)(?=\s*\n\s*(?:TEMPAT|TTL|LAHIR|JENIS|KELAMIN|ALAMAT|AGAMA|STATUS|PEKERJAAN|KEWARGANEGARAAN|NIK|\d{16}|\d{2}[-/]\d{2}[-/]\d{4}))/i,
      /NAMA\s*[:\-]?\s*\n\s*([A-Z][A-Z\s]{5,48}?)(?=\s*\n)/i,
      /NAMA\s*[:\-]\s*([A-Z][A-Z\s]{5,48}?)(?=\s*(?:TEMPAT|TTL|LAHIR|JENIS|KELAMIN|NIK|\d{2}[-/]\d{2}[-/]\d{4}|\n))/i
    ];

    for (const pattern of namePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const cleaned = cleanNameCandidate(match[1]);
        if (cleaned) {
          result.nama = cleaned;
          break;
        }
      }
    }

    // Fallback: look around NIK line for potential names (usually located before NIK)
    if (result.nomorIdentitas && !result.nama) {
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
      const nikIndex = lines.findIndex(line => line.includes(result.nomorIdentitas!));

      if (nikIndex !== -1) {
        const searchOffsets = [-5, -4, -3, -2, -1];
        for (const offset of searchOffsets) {
          const targetIndex = nikIndex + offset;
          if (targetIndex < 0 || targetIndex >= lines.length) continue;

          const line = lines[targetIndex];
          if (!line || line.length < 3) continue;

          // Skip lines that look like field labels or contain dates / numeric data
          if (/^(NAMA|NAME|NIK|TEMPAT|TTL|LAHIR|JENIS|KELAMIN|ALAMAT|AGAMA|STATUS|PEKERJAAN|KEWARGANEGARAAN|BERLAKU|PROVINSI|KABUPATEN|KOTA)\b/i.test(line)) continue;
          if (/\d{2}[-/]\d{2}[-/]\d{4}|\d{16}|[:\-]/.test(line)) continue;

          const cleaned = cleanNameCandidate(line);
          if (cleaned) {
            result.nama = cleaned;
            break;
          }
        }
      }
    }

    // Final fallback: scan all lines for uppercase sequences resembling names
    if (!result.nama) {
      const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
      for (const line of lines) {
        if (line.length < 6) continue;
        const cleaned = cleanNameCandidate(line);
        if (cleaned) {
          result.nama = cleaned;
          break;
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
    setExtractedText('');
    setShowExtractedText(false);
    
    // Langsung tampilkan modal kamera dan sembunyikan modal pilihan
    setIsOpen(false);
    setShowCamera(true);
    setCameraError('');
    setIsVideoReady(false);

    // Hanya hentikan track lama tanpa menutup modal agar <video> tetap ada
    const releasePreviousStream = () => {
      if (streamRef.current) {
        try { streamRef.current.getTracks().forEach(t => t.stop()); } catch {}
        streamRef.current = null;
      }
    };

    try {
      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported');
      }

      // Jangan panggil stopCamera() karena itu menutup modal; hanya rilis track
      releasePreviousStream();

      // Strategy list (cascading fallbacks)
      const variants: MediaStreamConstraints[] = [];
      if (selectedDeviceId) {
        variants.push({ video: { deviceId: { exact: selectedDeviceId } } });
      }
      variants.push(
        { video: { facingMode: { ideal: 'environment' } } },
        { video: { facingMode: { ideal: 'user' } } },
        { video: true }
      );

      let lastError: any = null;
      for (const c of variants) {
        try {
          const s = await navigator.mediaDevices.getUserMedia(c);
          streamRef.current = s;
          setStreamToken(t => t + 1);
          break;
        } catch (e) {
          lastError = e;
        }
      }

      if (!streamRef.current) {
        throw lastError || new Error('Tidak bisa mendapatkan stream kamera');
      }

      // Enumerate devices (labels may be empty until permission granted)
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter(d => d.kind === 'videoinput');
        setAvailableCameras(cams);
        if (!selectedDeviceId && cams.length > 1) {
          // keep first environment-like camera if available
          const env = cams.find(c => /back|rear|environment/i.test(c.label));
          if (env) setSelectedDeviceId(env.deviceId);
        }
      } catch (e) {
        /* ignore enumeration failure */
      }
    } catch (error: any) {
      setCameraError(
        (error && error.name === 'NotAllowedError') ? 'Akses kamera ditolak. Izinkan kamera di pengaturan browser.' :
        (error && error.name === 'NotReadableError') ? 'Kamera sedang dipakai aplikasi lain.' :
        (error && error.name === 'NotFoundError') ? 'Tidak ada perangkat kamera terdeteksi.' :
        'Gagal menginisialisasi kamera.'
      );
      // Tetap biarkan modal terbuka agar user bisa lihat instruksi & pilih upload
    }
  };

  useEffect(() => {
    if (!showCamera) {
      setIsVideoReady(false);
      setVideoTimeout(false);
      return;
    }

    const videoElement = videoRef.current;
    const stream = streamRef.current;

    if (!videoElement || !stream) {
      return;
    }

    const handleLoadedMetadata = () => {
      videoElement.play().then(() => {
        setIsVideoReady(true);
      }).catch(err => {
        showAlert('error', 'Gagal Memutar Video', 'Tidak dapat memutar video kamera. Silakan coba lagi.');
      });
    };

    // Ensure attributes for mobile Safari / general autoplay policies
    videoElement.setAttribute('playsinline', 'true');
    videoElement.muted = true;
    try {
      videoElement.srcObject = stream;
    } catch (err) {
      // @ts-ignore legacy fallback
      videoElement.src = window.URL.createObjectURL(stream);
    }

    // Sometimes immediate play fails before metadata; attempt proactive play after microtask
    setTimeout(() => {
      if (!isVideoReady) {
        videoElement.play().catch(() => {});
      }
    }, 150);

    if (videoElement.readyState >= 2) {
      handleLoadedMetadata();
    } else {
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    }

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      try { videoElement.pause(); } catch {}
      videoElement.srcObject = null;
      setIsVideoReady(false);
    };
  }, [showCamera, showAlert, streamToken]);

  // Timer to detect if video taking too long to become ready
  useEffect(() => {
    if (showCamera && streamRef.current && !isVideoReady) {
      const id = setTimeout(() => {
        if (!isVideoReady) {
          setVideoTimeout(true);
        }
      }, 4000);
      return () => clearTimeout(id);
    } else {
      setVideoTimeout(false);
    }
  }, [showCamera, isVideoReady, streamToken]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
    setIsVideoReady(false);
    setCameraError('');
  };

  const switchCamera = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (!deviceId) return;
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const s = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } });
      streamRef.current = s;
      setStreamToken(t => t + 1);
      setCameraError('');
    } catch (e) {
      setCameraError('Gagal mengganti kamera.');
    }
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
    setExtractedText('');
    setShowExtractedText(false);
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={startCamera}
          disabled={isProcessing}
          className="border-blue-500 text-blue-600 hover:bg-blue-50"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Camera className="w-4 h-4 mr-2" />
          )}
          Kamera
        </Button>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="border-green-500 text-green-600 hover:bg-green-50"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Custom Alert */}
      {alertData && (
        <CustomAlert
          type={alertData.type}
          message={alertData.message}
          details={alertData.details}
          onClose={closeAlert}
        />
      )}

      {/* Camera Preview Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Preview Kamera</h3>
                <p className="text-sm text-gray-500">Pastikan dokumen terlihat jelas sebelum memotret</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={stopCamera}
                disabled={isProcessing}
                className="rounded-full"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] flex items-center justify-center">
              {!!cameraError && (
                <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded z-10 max-w-[55%] text-right">
                  {cameraError}
                </div>
              )}
              
              <video
                ref={el => { videoRef.current = el; }}
                autoPlay
                playsInline
                muted
                width={640}
                height={480}
                className="w-full h-full object-contain bg-black"
                style={{ transform: 'scaleX(1)', objectFit: 'contain' }}
              />
              <canvas ref={canvasRef} className="hidden" />

              {isVideoReady && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative w-[82%] max-w-[430px] aspect-[1585/1000]">
                    {/* Border frame */}
                    <div className="absolute inset-0 rounded-md border-[3px] border-white/95 shadow-[0_0_0_2000px_rgba(0,0,0,0.22)]" />
                    {/* Corner accents */}
                    <div className="absolute -top-0.5 -left-0.5 w-6 h-6 border-t-4 border-l-4 border-white/95 rounded-tl-sm" />
                    <div className="absolute -top-0.5 -right-0.5 w-6 h-6 border-t-4 border-r-4 border-white/95 rounded-tr-sm" />
                    <div className="absolute -bottom-0.5 -left-0.5 w-6 h-6 border-b-4 border-l-4 border-white/95 rounded-bl-sm" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 border-b-4 border-r-4 border-white/95 rounded-br-sm" />
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold tracking-wider text-white/90">
                      POSISIKAN KTP DALAM FRAME
                    </div>
                  </div>
                </div>
              )}
              
              {!isVideoReady && (
                <div className="absolute inset-0 bg-black/70 text-white flex flex-col items-center justify-center gap-2 text-sm">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Menyalakan kamera...</span>
                  <span className="text-xs mt-2">
                    {streamRef.current ? 'Stream tersedia, memuat video...' : 'Menunggu izin kamera...'}
                  </span>
                  {videoTimeout && (
                    <div className="mt-3 text-xs text-center px-4">
                      <p className="font-semibold text-red-300 mb-1">Video belum tampil.</p>
                      <p>Coba tutup lalu buka lagi kamera atau pilih perangkat lain (klik kanan site icon & izinkan kamera).</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {availableCameras.length > 1 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-600">Pilih Kamera</label>
                <select
                  className="w-full border rounded-md px-2 py-2 text-sm"
                  value={selectedDeviceId}
                  onChange={e => switchCamera(e.target.value)}
                >
                  <option value="">(Otomatis)</option>
                  {availableCameras.map(c => (
                    <option key={c.deviceId} value={c.deviceId}>{c.label || 'Kamera ' + c.deviceId.slice(0,6)}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={capturePhoto}
                disabled={isProcessing || !isVideoReady}
                className="h-12 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Memproses
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 mr-2" />
                    Ambil Foto
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={stopCamera}
                disabled={isProcessing}
                className="h-12"
              >
                Batal
              </Button>
              {/* Re-Attach debug button removed */}
            </div>

            <p className="text-xs text-gray-500 text-center">
              Kamera akan otomatis mati setelah foto berhasil diambil.
            </p>
          </div>
        </div>
      )}
    </>
  );
}