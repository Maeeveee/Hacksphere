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

// Interface untuk tabel tiket
export interface Tiket {
  id?: string;
  booking_code: string;
  
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
  passengers_data: any; // JSON
  passenger_count: number;
  adult_count: number;
  child_count: number;
  
  // Harga
  price_per_ticket: number;
  total_price: number;
  
  // Status
  payment_status?: 'pending' | 'paid' | 'cancelled';
  booking_status?: 'active' | 'cancelled' | 'completed';
  
  // Metadata
  created_at?: string;
  updated_at?: string;
  payment_code?: string;
  payment_deadline?: string;
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
export async function saveTiket(tiketData: Omit<Tiket, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: Tiket | null; error: any }> {
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
export async function getTiketByBookingCode(bookingCode: string): Promise<{ data: Tiket | null; error: any }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tiket')
    .select('*')
    .eq('booking_code', bookingCode)
    .single();

  if (error) {
    console.error('Error getting tiket:', error);
    return { data: null, error };
  }

  return { data: data as Tiket, error: null };
}

// Fungsi untuk update status pembayaran
export async function updatePaymentStatus(bookingCode: string, status: 'pending' | 'paid' | 'cancelled'): Promise<{ data: Tiket | null; error: any }> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('tiket')
    .update({ 
      payment_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('booking_code', bookingCode)
    .select()
    .single();

  if (error) {
    console.error('Error updating payment status:', error);
    return { data: null, error };
  }

  return { data: data as Tiket, error: null };
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