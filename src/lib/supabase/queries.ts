import { createClient } from './client';

// TypeScript interface untuk tabel stasiun
export interface Stasiun {
  id: string;           // uuid
  nama_stasiun: string; // varchar
  kode_stasiun: string; // varchar  
  kota: string;         // varchar
  dibuat_pada: string;  // timestamptz
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