# Database Setup untuk Hacksphere - Sistem Pemesanan Tiket Kereta API

## Langkah-langkah Setup Database

### 1. Buka Supabase Dashboard
- Pergi ke [https://supabase.com](https://supabase.com)
- Login ke akun Anda
- Pilih project: **Hacksphere** (atau buat baru jika belum ada)

### 2. Jalankan SQL Script
1. Di Supabase Dashboard, pilih **SQL Editor** dari sidebar kiri
2. Klik **New query**
3. Copy seluruh isi file `database-setup.sql` 
4. Paste ke SQL Editor
5. Klik **RUN** untuk menjalankan script

### 3. Verifikasi Tabel Berhasil Dibuat
Setelah menjalankan script, periksa di **Table Editor**:
- ✅ Tabel `stasiun` (10 data stasiun)
- ✅ Tabel `kereta` (10 data kereta)  
- ✅ Tabel `jadwal` (10+ data jadwal)

### 4. Struktur Database

#### Tabel `stasiun`
- `id` (UUID, Primary Key)
- `nama_stasiun` (VARCHAR)
- `kode_stasiun` (VARCHAR, Unique)
- `kota` (VARCHAR)
- `dibuat_pada` (TIMESTAMPTZ)

#### Tabel `kereta`
- `id` (UUID, Primary Key)
- `nama_kereta` (VARCHAR)
- `kode_kereta` (VARCHAR, Unique)
- `dibuat_pada` (TIMESTAMPTZ)

#### Tabel `gerbong`
- `id` (UUID, Primary Key)
- `id_kereta` (UUID, Foreign Key → kereta.id)
- `nomor_gerbong` (INTEGER)
- `nama_kelas` (VARCHAR: Eksekutif/Bisnis/Ekonomi)
- `dibuat_pada` (TIMESTAMPTZ)

#### Tabel `kursi`
- `id` (UUID, Primary Key)
- `id_gerbong` (UUID, Foreign Key → gerbong.id)
- `baris_kursi` (INTEGER)
- `huruf_kursi` (CHAR)
- `dibuat_pada` (TIMESTAMPTZ)

#### Tabel `jadwal`
- `id` (UUID, Primary Key)
- `id_kereta` (UUID, Foreign Key → kereta.id)
- `id_stasiun_asal` (UUID, Foreign Key → stasiun.id)
- `id_stasiun_tujuan` (UUID, Foreign Key → stasiun.id)
- `waktu_berangkat` (TIMESTAMPTZ)
- `waktu_tiba` (TIMESTAMPTZ)
- `harga` (NUMERIC)
- `dibuat_pada` (TIMESTAMPTZ)

#### Tabel `pemesanan`
- `id` (UUID, Primary Key)
- `kode_pemesanan` (VARCHAR, Unique)
- `status` (ENUM: menunggu_pembayaran/terkonfirmasi/dibatalkan/kadaluarsa)
- `total_harga` (NUMERIC)
- `kode_pembayaran` (VARCHAR)
- `batas_waktu_pembayaran` (TIMESTAMPTZ)
- `dibuat_pada` (TIMESTAMPTZ)

#### Tabel `penumpang`
- `id` (UUID, Primary Key)
- `id_pemesanan` (UUID, Foreign Key → pemesanan.id)
- `nama_lengkap` (VARCHAR)
- `nomor_identitas` (VARCHAR)
- `apakah_penumpang_disabilitas` (BOOLEAN)
- `dibuat_pada` (TIMESTAMPTZ)

#### Tabel `tiket`
- `id` (UUID, Primary Key)
- `id_penumpang` (UUID, Foreign Key → penumpang.id)
- `id_jadwal` (UUID, Foreign Key → jadwal.id)
- `id_kursi` (UUID, Foreign Key → kursi.id)
- `data_qr_code` (TEXT, Unique)
- `dibuat_pada` (TIMESTAMPTZ)

### 5. Data Sample yang Tersedia

#### Stasiun (9 stasiun):
- Stasiun Gambir (Jakarta) - GMR
- Stasiun Surabaya Gubeng (Surabaya) - SGU
- Stasiun Bandung (Bandung) - BD
- Stasiun Yogyakarta (Yogyakarta) - YK
- Stasiun Malang (Malang) - ML
- Stasiun Semarang Tawang (Semarang) - SMT
- Stasiun Cirebon (Cirebon) - CN
- Stasiun Solo Balapan (Solo) - SLO
- Stasiun Bekasi (Bekasi) - BKS

#### Kereta (5 kereta):
- **Argo Bromo Anggrek** (KA-01) - 2 Gerbong Eksekutif
- **Taksaka** (KA-02) - 1 Eksekutif, 1 Bisnis
- **Malabar** (KA-03) - 1 Eksekutif, 1 Bisnis, 1 Ekonomi
- **Argo Lawu** (KA-04) - 2 Gerbong Eksekutif
- **Brawijaya** (KA-05) - 1 Eksekutif, 1 Bisnis

#### Rute Tersedia (11 jadwal):
- **Gambir → Surabaya Gubeng** (KA-01)
- **Gambir → Yogyakarta** (KA-02)
- **Bandung → Malang** (KA-03)
- **Gambir → Solo Balapan** (KA-04)
- **Malang → Gambir** (KA-05)
- **Solo Balapan → Gambir** (KA-04)
- **Gambir → Malang** (KA-05)
- **Gambir → Semarang Tawang** (KA-01)
- **Gambir → Cirebon** (KA-02)
- **Surabaya Gubeng → Bandung** (KA-03)
- **Solo Balapan → Bandung** (KA-04)

#### Sample Pemesanan (3 transaksi):
- **KAI-BOOK-001**: Terkonfirmasi (2 penumpang)
- **KAI-BOOK-002**: Menunggu Pembayaran (1 penumpang)
- **KAI-BOOK-003**: Dibatalkan (1 penumpang)

### 6. Testing Database Connection

Setelah setup database selesai:

1. **Test Form Input Stasiun**:
   - Buka aplikasi di `http://localhost:3001`
   - Coba ketik di field "Stasiun Asal" → harus muncul dropdown stasiun
   - Coba ketik di field "Stasiun Tujuan" → harus muncul dropdown stasiun

2. **Test Search Tickets**:
   - Pilih: Stasiun Gambir → Stasiun Surabaya Gubeng
   - Pilih tanggal: 3-5 hari dari sekarang
   - Klik "Cari Tiket"
   - Harus muncul hasil tiket kereta (bukan error)

### 7. Troubleshooting

#### Jika Error "relation does not exist":
- Pastikan script SQL sudah dijalankan dengan benar
- Periksa di Table Editor apakah tabel sudah terbuat
- Jalankan ulang script jika perlu

#### Jika Error "connection timeout":
- Periksa environment variables di `.env`:
  ```
  NEXT_PUBLIC_SUPABASE_URL=https://qyhvvcyoedaobwdclabu.supabase.co
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
  ```

#### Jika Form Stasiun Loading Terus:
- Periksa Network tab di browser dev tools
- Pastikan API Supabase tidak error 404 atau 401

### 8. Menambah Data Lebih Banyak

Untuk menambah stasiun baru:
```sql
INSERT INTO public.stasiun (nama_stasiun, kode_stasiun, kota) VALUES
('Stasiun Baru', 'SBR', 'Kota Baru');
```

Untuk menambah kereta baru:
```sql
INSERT INTO public.kereta (nama_kereta, nomor_kereta, kelas, fasilitas) VALUES
('Kereta Baru', '99001', 'Eksekutif', '["AC", "WiFi", "Makanan"]');
```

Untuk menambah jadwal baru, gunakan query dengan JOIN untuk mendapatkan ID stasiun dan kereta.

---

## Status Database
- ✅ **Setup Complete**: Database siap digunakan dengan struktur lengkap
- ✅ **Sample Data**: 9 stasiun, 5 kereta, 11 gerbong, 11 jadwal, 3 pemesanan
- ✅ **API Integration**: Terhubung dengan aplikasi Next.js
- ✅ **Form Testing**: Dropdown stasiun berfungsi
- ✅ **Search Testing**: Pencarian tiket berfungsi dengan data real
- ✅ **Advanced Features**: Sistem kursi, gerbong, dan pemesanan terintegrasi
