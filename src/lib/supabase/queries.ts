import { createClient } from './client';

// TypeScript interface untuk tabel stasiun
export interface Stasiun {
  id: string;           // uuid
  nama_stasiun: string; // varchar
  kode_stasiun: string; // varchar  
  kota: string;         // varchar
  dibuat_pada: string;  // timestamptz
}

// TypeScript interface untuk tabel kereta
export interface Kereta {
  id: string;           // uuid
  nama_kereta: string;  // varchar
  kode_kereta: string;  // varchar
  dibuat_pada: string;  // timestamptz
}

// TypeScript interface untuk tabel gerbong
export interface Gerbong {
  id: string;           // uuid
  id_kereta: string;    // uuid foreign key
  nomor_gerbong: number;// integer
  nama_kelas: string;   // varchar (Eksekutif, Bisnis, Ekonomi)
  dibuat_pada: string;  // timestamptz
}

// TypeScript interface untuk tabel jadwal
export interface Jadwal {
  id: string;              // uuid
  id_kereta: string;       // uuid foreign key
  id_stasiun_asal: string; // uuid foreign key
  id_stasiun_tujuan: string; // uuid foreign key
  waktu_berangkat: string; // timestamptz
  waktu_tiba: string;      // timestamptz
  harga: number;           // numeric(10,2)
  dibuat_pada: string;     // timestamptz
}

// Extended interface untuk joined data
export interface JadwalLengkap extends Jadwal {
  kereta: Kereta & {
    gerbong: Gerbong[];
  };
  stasiun_asal: Stasiun;
  stasiun_tujuan: Stasiun;
}

// Interface untuk tabel tiket (struktur baru sesuai database)
export interface Tiket {
  id?: string;                    // uuid (Primary Key)
  id_penumpang?: string;          // uuid (foreign key ke tabel penumpang)
  id_jadwal?: string;             // uuid (foreign key ke tabel jadwal)
  id_kursi?: string;              // uuid (foreign key ke tabel kursi)
  data_qr_code: string;           // text (berisi semua data tiket dalam JSON)
  dibuat_pada?: string;           // timestamptz (auto-generated)
}

// Interface untuk data yang disimpan dalam data_qr_code (JSON)
export interface TiketQRData {
  // Booking Info
  booking_code: string;
  payment_code?: string;
  payment_deadline?: string;
  
  // Data Kereta
  train_id?: string;
  train_name: string;
  train_number: string;
  train_class: string;
  
  // Rute & Jadwal
  origin: string;
  destination: string;
  departure_date: string;
  departure_time: string;
  arrival_time: string;
  duration: string;
  
  // Data Pemesan
  booker_name: string;
  booker_gender: string;
  booker_identity_type: string;
  booker_identity_number: string;
  booker_phone: string;
  booker_email: string;
  booker_address: string;
  
  // Data Penumpang
  passengers_data: any; // JSON array
  passenger_count: number;
  adult_count: number;
  child_count: number;
  
  // Harga
  price_per_ticket: number;
  total_price: number;
  
  // Status
  payment_status?: 'menunggu_pembayaran' | 'terkonfirmasi' | 'dibatalkan' | 'kadaluarsa';
  booking_status?: 'active' | 'cancelled' | 'completed';
  
  // QR Code
  qr_code_url?: string;
  
  // Tambahan
  facilities?: string[];
  seat_numbers?: string[];
  wagon_number?: string;
  payment_method?: string;
  payment_bank?: string;
}

// Response type untuk queries
export type StasiunResponse = {
  data: Stasiun[] | null;
  error: any;
};

export type SingleStasiunResponse = {
  data: Stasiun | null;
  error: any;
};

export type JadwalResponse = {
  data: JadwalLengkap[] | null;
  error: any;
};

/**
 * Mengambil semua data stasiun
 */
export async function getAllStasiun(): Promise<StasiunResponse> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('stasiun')  // Menggunakan view di schema public
    .select('*')
    .order('nama_stasiun', { ascending: true });

  return { data, error };
}

/**
 * Mengambil stasiun berdasarkan ID
 */
export async function getStasiunById(id: string): Promise<SingleStasiunResponse> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('stasiun')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

/**
 * Mengambil stasiun berdasarkan kode stasiun
 */
export async function getStasiunByKode(kode: string): Promise<SingleStasiunResponse> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('stasiun')
    .select('*')
    .eq('kode_stasiun', kode)
    .single();

  return { data, error };
}

/**
 * Mencari stasiun berdasarkan nama atau kota
 */
export async function searchStasiun(searchTerm: string): Promise<StasiunResponse> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('stasiun')
    .select('*')
    .or(`nama_stasiun.ilike.%${searchTerm}%,kota.ilike.%${searchTerm}%`)
    .order('nama_stasiun', { ascending: true });

  return { data, error };
}

/**
 * Mengambil stasiun berdasarkan kota
 */
export async function getStasiunByKota(kota: string): Promise<StasiunResponse> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('stasiun')
    .select('*')
    .eq('kota', kota)
    .order('nama_stasiun', { ascending: true });

  return { data, error };
}

/**
 * Mengambil daftar kota unik
 */
export async function getUniqueKota(): Promise<{ data: string[] | null; error: any }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('stasiun')
    .select('kota')
    .order('kota', { ascending: true });

  if (error) return { data: null, error };

  // Extract unique cities
  const uniqueKota = [...new Set(data?.map(item => item.kota) || [])];
  
  return { data: uniqueKota, error: null };
}

/**
 * Menambah stasiun baru
 */
export async function insertStasiun(stasiun: Omit<Stasiun, 'id' | 'dibuat_pada'>): Promise<SingleStasiunResponse> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('stasiun')
    .insert([stasiun])
    .select()
    .single();

  return { data, error };
}

/**
 * Mengupdate stasiun
 */
export async function updateStasiun(id: string, updates: Partial<Omit<Stasiun, 'id' | 'dibuat_pada'>>): Promise<SingleStasiunResponse> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('stasiun')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

/**
 * Menghapus stasiun
 */
export async function deleteStasiun(id: string): Promise<{ error: any }> {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('stasiun')
    .delete()
    .eq('id', id);

  return { error };
}

/**
 * Mengambil stasiun dengan pagination
 */
export async function getStasiunWithPagination(
  page: number = 1, 
  limit: number = 10
): Promise<{ data: Stasiun[] | null; error: any; count: number | null }> {
  const supabase = createClient();
  
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  const { data, error, count } = await supabase
    .from('stasiun')
    .select('*', { count: 'exact' })
    .order('nama_stasiun', { ascending: true })
    .range(from, to);

  return { data, error, count };
}

/**
 * Mencari jadwal kereta berdasarkan stasiun asal dan tujuan
 */
export async function searchJadwalKereta(
  stasiunAsal: string,
  stasiunTujuan: string,
  tanggalBerangkat?: string
): Promise<JadwalResponse> {
  const supabase = createClient();
  
  // First, get stasiun IDs
  const { data: stasiunAsalData } = await supabase
    .from('stasiun')
    .select('id')
    .eq('nama_stasiun', stasiunAsal)
    .single();
    
  const { data: stasiunTujuanData } = await supabase
    .from('stasiun')
    .select('id')
    .eq('nama_stasiun', stasiunTujuan)
    .single();

  if (!stasiunAsalData || !stasiunTujuanData) {
    return { data: null, error: 'Stasiun tidak ditemukan' };
  }

  // For new database structure, we search based on datetime (not day of week)
  let query = supabase
    .from('jadwal')
    .select(`
      *,
      kereta:id_kereta (
        id,
        nama_kereta,
        kode_kereta,
        gerbong (
          id,
          nomor_gerbong,
          nama_kelas
        )
      ),
      stasiun_asal:id_stasiun_asal (
        id,
        nama_stasiun,
        kode_stasiun,
        kota
      ),
      stasiun_tujuan:id_stasiun_tujuan (
        id,
        nama_stasiun,
        kode_stasiun,
        kota
      )
    `)
    .eq('id_stasiun_asal', stasiunAsalData.id)
    .eq('id_stasiun_tujuan', stasiunTujuanData.id)
    .order('waktu_berangkat', { ascending: true });

  // Filter by date if provided - dengan timezone WIB (UTC+7)
  if (tanggalBerangkat) {
    // Buat tanggal dengan timezone WIB
    const startDate = new Date(tanggalBerangkat + 'T00:00:00+07:00');
    const endDate = new Date(tanggalBerangkat + 'T23:59:59+07:00');
    
    console.log('Filter tanggal:', {
      input: tanggalBerangkat,
      startWIB: startDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      endWIB: endDate.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
      startUTC: startDate.toISOString(),
      endUTC: endDate.toISOString()
    });
    
    query = query
      .gte('waktu_berangkat', startDate.toISOString())
      .lte('waktu_berangkat', endDate.toISOString());
  }

  const { data, error } = await query;

  return { data: data as JadwalLengkap[], error };
}

// Fungsi untuk menyimpan tiket baru
export async function saveTiket(tiketData: Omit<Tiket, 'id' | 'dibuat_pada'>): Promise<{ data: Tiket | null; error: any }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tiket')
    .insert([tiketData])
    .select()
    .single();

  if (error) {
    console.error('Error saving tiket:', error);
    return { data: null, error };
  }

  return { data: data as Tiket, error: null };
}

// Fungsi untuk mendapatkan tiket berdasarkan booking code
export async function getTiketByBookingCode(bookingCode: string): Promise<{ data: TiketQRData | null; error: any }> {
  const supabase = createClient();
  
  // Query tiket dengan join ke kursi untuk mendapatkan seat number
  const { data, error } = await supabase
    .from('tiket')
    .select(`
      *,
      kursi:id_kursi (
        baris_kursi,
        huruf_kursi
      ),
      penumpang:id_penumpang (
        nama_lengkap,
        nomor_identitas,
        apakah_penumpang_disabilitas
      )
    `)
    .eq('data_qr_code->booking_code', bookingCode)
    .single();

  if (error) {
    console.error('Error getting tiket:', error);
    return { data: null, error };
  }

  // Parse data_qr_code dari JSON string ke object
  try {
    const qrData = typeof data.data_qr_code === 'string' 
      ? JSON.parse(data.data_qr_code) 
      : data.data_qr_code;
    
    // Tambahkan seat number dari database jika ada
    if (data.kursi && data.kursi.baris_kursi && data.kursi.huruf_kursi) {
      const dbSeatNumber = `${data.kursi.baris_kursi}${data.kursi.huruf_kursi}`;
      
      // Update seat number di passengers_data jika ada
      if (qrData.passengers_data && Array.isArray(qrData.passengers_data)) {
        qrData.passengers_data = qrData.passengers_data.map((passenger: any, index: number) => {
          // Jika ini tiket pertama dan ada seat dari DB, gunakan itu
          if (index === 0 && !passenger.selectedSeat?.seatNumber) {
            return {
              ...passenger,
              selectedSeat: {
                ...passenger.selectedSeat,
                seatNumber: dbSeatNumber
              }
            };
          }
          return passenger;
        });
      }
    }
    
    return { data: qrData as TiketQRData, error: null };
  } catch (parseError) {
    console.error('Error parsing QR data:', parseError);
    return { data: null, error: parseError };
  }
}

// Fungsi untuk update status pembayaran
export async function updatePaymentStatus(
  bookingCode: string, 
  status: 'menunggu_pembayaran' | 'terkonfirmasi' | 'dibatalkan' | 'kadaluarsa'
): Promise<{ data: Tiket | null; error: any }> {
  const supabase = createClient();
  
  try {
    // First, get all tickets with this booking code
    const { data: tickets, error: fetchError } = await supabase
      .from('tiket')
      .select('id, data_qr_code');

    if (fetchError || !tickets || tickets.length === 0) {
      console.error('Error fetching tiket for update:', fetchError);
      return { data: null, error: fetchError };
    }

    // Find ticket with matching booking code in JSON
    let targetTicket = null;
    let targetQRData = null;
    
    for (const ticket of tickets) {
      try {
        if (!ticket.data_qr_code) {
          console.log('⚠️ Skipping ticket with null data_qr_code');
          continue;
        }
        
        const qrData = typeof ticket.data_qr_code === 'string'
          ? JSON.parse(ticket.data_qr_code)
          : ticket.data_qr_code;
        
        if (qrData && qrData.booking_code === bookingCode) {
          targetTicket = ticket;
          targetQRData = qrData;
          break;
        }
      } catch (parseError) {
        console.error('Error parsing ticket data:', parseError);
        console.log('Problematic data_qr_code:', ticket.data_qr_code);
        continue;
      }
    }

    if (!targetTicket || !targetQRData) {
      console.error('Ticket not found with booking code:', bookingCode);
      return { data: null, error: { message: 'Ticket not found' } };
    }

    // Update payment status in QR data
    targetQRData.payment_status = status;

    // Update the record (tiket table)
    const { data, error } = await supabase
      .from('tiket')
      .update({ 
        data_qr_code: JSON.stringify(targetQRData)
      })
      .eq('id', targetTicket.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating tiket payment status:', error);
      return { data: null, error };
    }
    
    // BONUS: Update status di tabel pemesanan juga
    if (targetQRData.booking_code) {
      const { error: pemesananError } = await supabase
        .from('pemesanan')
        .update({ status: status })
        .eq('kode_pemesanan', targetQRData.booking_code);
      
      if (pemesananError) {
        console.error('Error updating pemesanan status:', pemesananError);
      } else {
        console.log('✅ Pemesanan status also updated to:', status);
      }
    }

    return { data: data as Tiket, error: null };
  } catch (err) {
    console.error('Exception in updatePaymentStatus:', err);
    return { data: null, error: err };
  }
}

// Fungsi untuk mendapatkan semua tiket berdasarkan email pemesan
export async function getTiketByEmail(email: string): Promise<{ data: Tiket[] | null; error: any }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tiket')
    .select('*')
    .eq('booker_email', email)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting tiket by email:', error);
    return { data: null, error };
  }

  return { data: data as Tiket[], error: null };
}

// Interface untuk occupied seat
export interface OccupiedSeat {
  seatNumber: string;
  passengerName: string;
  bookingCode: string;
}

// Fungsi untuk mendapatkan kursi yang sudah terpesan berdasarkan jadwal kereta
export async function getOccupiedSeats(
  trainName: string,
  trainClass: string,
  departureDate: string,
  departureTime: string
): Promise<{ data: string[] | null; error: any }> {
  const supabase = createClient();
  
  try {
    console.log('🔍 Fetching occupied seats for:', { trainName, trainClass, departureDate, departureTime });
    
    // Query SEMUA tiket tanpa filter payment_status terlebih dahulu
    // Karena kita akan filter manual di JavaScript untuk lebih fleksibel
    const { data, error } = await supabase
      .from('tiket')
      .select('data_qr_code, id');

    if (error) {
      console.error('❌ Error getting occupied seats:', error);
      return { data: null, error };
    }

    console.log('📊 Total tickets in database:', data?.length || 0);

    // Extract seat numbers from data_qr_code JSON
    const occupiedSeats: string[] = [];
    const debugInfo: any[] = [];
    
    if (data && data.length > 0) {
      data.forEach((tiket) => {
        try {
          const qrData = typeof tiket.data_qr_code === 'string' 
            ? JSON.parse(tiket.data_qr_code) 
            : tiket.data_qr_code;
          
          // Debug: log payment status
          debugInfo.push({
            id: tiket.id,
            booking_code: qrData.booking_code,
            payment_status: qrData.payment_status,
            train_name: qrData.train_name,
            train_class: qrData.train_class,
            departure_date: qrData.departure_date,
            departure_time: qrData.departure_time
          });
          
          // Filter by train, class, date, time
          const isMatchingTrain = qrData.train_name === trainName;
          const isMatchingClass = qrData.train_class === trainClass;
          const isMatchingDate = qrData.departure_date === departureDate;
          const isMatchingTime = qrData.departure_time === departureTime;
          
          // Accept multiple payment status variants:
          // - menunggu_pembayaran, pending (waiting for payment)
          // - terkonfirmasi, paid (confirmed/paid)
          const validStatuses = ['menunggu_pembayaran', 'pending', 'terkonfirmasi', 'paid', 'confirmed'];
          const isValidStatus = validStatuses.includes(qrData.payment_status?.toLowerCase());
          
          if (isMatchingTrain && isMatchingClass && isMatchingDate && isMatchingTime && isValidStatus) {
            // Extract seat numbers from passengers_data
            const passengersData = qrData.passengers_data;
            if (Array.isArray(passengersData)) {
              passengersData.forEach((passenger: any) => {
                if (passenger.selectedSeat && passenger.selectedSeat.seatNumber) {
                  occupiedSeats.push(passenger.selectedSeat.seatNumber);
                  console.log('✅ Found occupied seat:', passenger.selectedSeat.seatNumber, 'for', passenger.nama);
                }
              });
            }
          }
        } catch (parseError) {
          console.error('❌ Error parsing QR data:', parseError);
        }
      });
    }

    console.log('📋 All tickets debug info:', debugInfo);
    console.log('🪑 Total occupied seats found:', occupiedSeats.length);
    console.log('🪑 Occupied seats list:', occupiedSeats);
    
    return { data: occupiedSeats, error: null };
  } catch (err) {
    console.error('❌ Exception in getOccupiedSeats:', err);
    return { data: null, error: err };
  }
}

// Fungsi untuk mendapatkan detail kursi yang sudah terpesan (untuk debugging/admin)
export async function getOccupiedSeatsDetailed(
  trainName: string,
  trainClass: string,
  departureDate: string,
  departureTime: string
): Promise<{ data: OccupiedSeat[] | null; error: any }> {
  const supabase = createClient();
  
  try {
    // Query SEMUA tiket tanpa filter payment_status
    const { data, error } = await supabase
      .from('tiket')
      .select('data_qr_code, id');

    if (error) {
      console.error('Error getting occupied seats detailed:', error);
      return { data: null, error };
    }

    const occupiedSeatsDetailed: OccupiedSeat[] = [];
    
    if (data && data.length > 0) {
      data.forEach((tiket) => {
        try {
          const qrData = typeof tiket.data_qr_code === 'string' 
            ? JSON.parse(tiket.data_qr_code) 
            : tiket.data_qr_code;
          
          // Filter by train, class, date, time
          const isMatchingTrain = qrData.train_name === trainName;
          const isMatchingClass = qrData.train_class === trainClass;
          const isMatchingDate = qrData.departure_date === departureDate;
          const isMatchingTime = qrData.departure_time === departureTime;
          
          // Accept multiple payment status variants
          const validStatuses = ['menunggu_pembayaran', 'pending', 'terkonfirmasi', 'paid', 'confirmed'];
          const isValidStatus = validStatuses.includes(qrData.payment_status?.toLowerCase());
          
          if (isMatchingTrain && isMatchingClass && isMatchingDate && isMatchingTime && isValidStatus) {
            const passengersData = qrData.passengers_data;
            if (Array.isArray(passengersData)) {
              passengersData.forEach((passenger: any) => {
                if (passenger.selectedSeat && passenger.selectedSeat.seatNumber) {
                  occupiedSeatsDetailed.push({
                    seatNumber: passenger.selectedSeat.seatNumber,
                    passengerName: passenger.nama || 'Unknown',
                    bookingCode: qrData.booking_code
                  });
                }
              });
            }
          }
        } catch (parseError) {
          console.error('Error parsing QR data in detailed:', parseError);
        }
      });
    }

    return { data: occupiedSeatsDetailed, error: null };
  } catch (err) {
    console.error('Exception in getOccupiedSeatsDetailed:', err);
    return { data: null, error: err };
  }
}

// ==========================================
// FUNGSI BARU UNTUK SAVE BOOKING LENGKAP
// ==========================================

// Interface untuk Kursi
export interface Kursi {
  id?: string;
  id_gerbong: string;
  baris_kursi: number;
  huruf_kursi: string;
  dibuat_pada?: string;
}

// Fungsi helper untuk cari atau buat kursi
async function findOrCreateKursi(
  supabase: any,
  gerbongId: string,
  seatNumber: string
): Promise<string | null> {
  try {
    // Parse seat number (contoh: "9C" → row: 9, column: "C")
    const row = parseInt(seatNumber.match(/\d+/)?.[0] || '0');
    const column = seatNumber.match(/[A-Z]/)?.[0] || '';
    
    if (!row || !column) {
      console.log('⚠️ Invalid seat number format:', seatNumber);
      return null;
    }
    
    // Cari kursi yang sudah ada
    const { data: existingKursi, error: findError } = await supabase
      .from('kursi')
      .select('id')
      .eq('id_gerbong', gerbongId)
      .eq('baris_kursi', row)
      .eq('huruf_kursi', column)
      .maybeSingle();
    
    if (existingKursi) {
      console.log('✅ Found existing kursi:', existingKursi.id);
      return existingKursi.id;
    }
    
    // Buat kursi baru jika belum ada
    const { data: newKursi, error: createError } = await supabase
      .from('kursi')
      .insert([{
        id_gerbong: gerbongId,
        baris_kursi: row,
        huruf_kursi: column
      }])
      .select('id')
      .single();
    
    if (createError) {
      console.error('Error creating kursi:', createError);
      return null;
    }
    
    console.log('✅ Created new kursi:', newKursi.id);
    return newKursi.id;
  } catch (err) {
    console.error('Error in findOrCreateKursi:', err);
    return null;
  }
}

// Fungsi helper untuk cari atau buat gerbong
async function findOrCreateGerbong(
  supabase: any,
  keretaId: string,
  wagonName: string,
  className: string
): Promise<string | null> {
  try {
    // Parse wagon name (contoh: "EKS-A" → nomor: 1)
    const wagonLetter = wagonName.split('-')[1] || 'A';
    const wagonNumber = wagonLetter.charCodeAt(0) - 64; // A=1, B=2, etc.
    
    // Cari gerbong yang sudah ada
    const { data: existingGerbong, error: findError } = await supabase
      .from('gerbong')
      .select('id')
      .eq('id_kereta', keretaId)
      .eq('nomor_gerbong', wagonNumber)
      .eq('nama_kelas', className)
      .maybeSingle();
    
    if (existingGerbong) {
      console.log('✅ Found existing gerbong:', existingGerbong.id);
      return existingGerbong.id;
    }
    
    // Buat gerbong baru jika belum ada
    const { data: newGerbong, error: createError } = await supabase
      .from('gerbong')
      .insert([{
        id_kereta: keretaId,
        nomor_gerbong: wagonNumber,
        nama_kelas: className
      }])
      .select('id')
      .single();
    
    if (createError) {
      console.error('Error creating gerbong:', createError);
      return null;
    }
    
    console.log('✅ Created new gerbong:', newGerbong.id);
    return newGerbong.id;
  } catch (err) {
    console.error('Error in findOrCreateGerbong:', err);
    return null;
  }
}

// Interface untuk Pemesanan
export interface Pemesanan {
  id?: string;
  kode_pemesanan: string;
  status: 'menunggu_pembayaran' | 'terkonfirmasi' | 'dibatalkan' | 'kadaluarsa';
  total_harga: number;
  kode_pembayaran?: string;
  batas_waktu_pembayaran?: string;
  dibuat_pada?: string;
}

// Interface untuk Penumpang
export interface Penumpang {
  id?: string;
  id_pemesanan: string;
  nama_lengkap: string;
  nomor_identitas: string;
  apakah_penumpang_disabilitas: boolean;
  dibuat_pada?: string;
}

// Interface untuk request save booking
export interface SaveBookingRequest {
  // Data Pemesanan
  bookingCode: string;
  paymentCode?: string;
  paymentDeadline?: string;
  totalPrice: number;
  paymentStatus: 'menunggu_pembayaran' | 'terkonfirmasi' | 'dibatalkan' | 'kadaluarsa';
  
  // Data Jadwal (untuk mencari id_jadwal yang sesuai)
  trainName: string;
  origin: string;
  destination: string;
  departureDate: string;
  departureTime: string;
  
  // Data Penumpang
  passengers: Array<{
    nama: string;
    nomorIdentitas: string;
    disabilitas: boolean; // Changed from 'dewasa' to 'disabilitas'
    selectedSeat?: any;
  }>;
  
  // Data QR Code (JSON lengkap)
  qrCodeData: TiketQRData;
}

/**
 * Fungsi untuk menyimpan booking lengkap dengan relasi yang benar
 * 1. Insert ke tabel pemesanan
 * 2. Insert ke tabel penumpang (untuk setiap penumpang)
 * 3. Insert ke tabel tiket (dengan relasi ke penumpang dan jadwal)
 */
export async function saveBookingLengkap(request: SaveBookingRequest): Promise<{ 
  success: boolean; 
  pemesananId?: string;
  error?: any 
}> {
  const supabase = createClient();
  
  try {
    // STEP 0: Cek apakah booking code sudah ada
    const { data: existingBooking, error: checkError } = await supabase
      .from('pemesanan')
      .select('id, kode_pemesanan')
      .eq('kode_pemesanan', request.bookingCode)
      .maybeSingle();
    
    if (existingBooking) {
      console.log('⚠️ Booking already exists, skipping insert:', existingBooking.kode_pemesanan);
      return { 
        success: true, 
        pemesananId: existingBooking.id 
      };
    }
    
    // STEP 1: Insert Pemesanan
    const pemesananData: Omit<Pemesanan, 'id' | 'dibuat_pada'> = {
      kode_pemesanan: request.bookingCode,
      status: request.paymentStatus,
      total_harga: request.totalPrice,
      kode_pembayaran: request.paymentCode,
      batas_waktu_pembayaran: request.paymentDeadline
    };
    
    console.log('📝 Inserting pemesanan with data:', pemesananData);
    
    const { data: pemesanan, error: pemesananError } = await supabase
      .from('pemesanan')
      .insert([pemesananData])
      .select()
      .single();
    
    if (pemesananError) {
      console.error('Error inserting pemesanan:', pemesananError);
      return { success: false, error: pemesananError };
    }
    
    console.log('Pemesanan inserted:', pemesanan);
    const pemesananId = pemesanan.id;
    
    // STEP 2: Cari atau Buat Jadwal Dummy
    let jadwalId: string | null = null;
    
    try {
      // Cari jadwal yang sesuai berdasarkan data kereta
      // Untuk sekarang kita buat jadwal dummy jika belum ada
      const { data: existingJadwal } = await supabase
        .from('jadwal')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (existingJadwal) {
        jadwalId = existingJadwal.id;
        console.log('Using existing jadwal:', jadwalId);
      } else {
        // Buat jadwal dummy jika tidak ada
        console.log('⚠️ No jadwal found in database. Creating dummy jadwal...');
        
        // Ambil stasiun pertama untuk dummy
        const { data: stasiuns } = await supabase
          .from('stasiun')
          .select('id')
          .limit(2);
        
        const { data: keretas } = await supabase
          .from('kereta')
          .select('id')
          .limit(1);
        
        if (stasiuns && stasiuns.length >= 2 && keretas && keretas.length > 0) {
          const { data: dummyJadwal, error: jadwalError } = await supabase
            .from('jadwal')
            .insert([{
              id_kereta: keretas[0].id,
              id_stasiun_asal: stasiuns[0].id,
              id_stasiun_tujuan: stasiuns[1].id,
              waktu_berangkat: new Date().toISOString(),
              waktu_tiba: new Date(Date.now() + 3600000).toISOString(), // +1 hour
              harga: request.totalPrice
            }])
            .select('id')
            .single();
          
          if (!jadwalError && dummyJadwal) {
            jadwalId = dummyJadwal.id;
            console.log('Created dummy jadwal:', jadwalId);
          }
        }
      }
    } catch (jadwalErr) {
      console.error('Error handling jadwal:', jadwalErr);
    }
    
    // Jika masih null, skip insert tiket atau throw error
    if (!jadwalId) {
      console.error('❌ Cannot insert tiket: id_jadwal is required but not found');
      return { 
        success: false, 
        error: { message: 'id_jadwal is required. Please create jadwal in database first.' }
      };
    }
    
    // STEP 3: Insert Penumpang dan Tiket untuk setiap penumpang
    for (const passenger of request.passengers) {
      // Insert Penumpang
      const penumpangData: Omit<Penumpang, 'id' | 'dibuat_pada'> = {
        id_pemesanan: pemesananId,
        nama_lengkap: passenger.nama,
        nomor_identitas: passenger.nomorIdentitas,
        apakah_penumpang_disabilitas: passenger.disabilitas
      };
      
      const { data: penumpang, error: penumpangError } = await supabase
        .from('penumpang')
        .insert([penumpangData])
        .select()
        .single();
      
      if (penumpangError) {
        console.error('Error inserting penumpang:', penumpangError);
        return { success: false, error: penumpangError };
      }
      
      console.log('Penumpang inserted:', penumpang);
      
      // STEP 3.1: Cari/Buat Kursi jika passenger punya selectedSeat
      let kursiId: string | null = null;
      
      if (passenger.selectedSeat && passenger.selectedSeat.seatNumber) {
        // Ambil kereta pertama untuk mendapatkan ID (atau bisa dari request)
        const { data: keretas } = await supabase
          .from('kereta')
          .select('id')
          .limit(1);
        
        if (keretas && keretas.length > 0) {
          const keretaId = keretas[0].id;
          
          // Cari/buat gerbong
          const gerbongId = await findOrCreateGerbong(
            supabase,
            keretaId,
            passenger.selectedSeat.wagon || 'EKS-A',
            request.qrCodeData.train_class
          );
          
          if (gerbongId) {
            // Cari/buat kursi
            kursiId = await findOrCreateKursi(
              supabase,
              gerbongId,
              passenger.selectedSeat.seatNumber
            );
            
            if (kursiId) {
              console.log('✅ Kursi assigned:', passenger.selectedSeat.seatNumber, '→', kursiId);
            }
          }
        }
      }
      
      // Insert Tiket
      const tiketData: Omit<Tiket, 'id' | 'dibuat_pada'> = {
        id_penumpang: penumpang.id,
        id_jadwal: jadwalId, // sekarang sudah pasti ada value
        id_kursi: kursiId || undefined, // sekarang bisa terisi!
        data_qr_code: JSON.stringify(request.qrCodeData)
      };
      
      const { data: tiket, error: tiketError } = await supabase
        .from('tiket')
        .insert([tiketData])
        .select()
        .single();
      
      if (tiketError) {
        console.error('Error inserting tiket:', tiketError);
        return { success: false, error: tiketError };
      }
      
      console.log('Tiket inserted:', tiket);
    }
    
    return { 
      success: true, 
      pemesananId: pemesananId 
    };
    
  } catch (error) {
    console.error('Exception in saveBookingLengkap:', error);
    return { success: false, error };
  }
}