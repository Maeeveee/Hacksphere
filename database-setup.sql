-- Mengatur search_path ke skema public
SET search_path TO public;

-- ========= TIPE DATA ENUM =========
-- Membuat tipe data custom untuk status pemesanan agar data konsisten.
DROP TYPE IF EXISTS status_pemesanan; -- Hapus tipe jika sudah ada untuk menghindari error saat menjalankan ulang
CREATE TYPE status_pemesanan AS ENUM (
  'menunggu_pembayaran',
  'terkonfirmasi',
  'dibatalkan',
  'kadaluarsa'
);

-- ========= PEMBUATAN TABEL =========
-- Hapus tabel jika sudah ada untuk memastikan pembuatan ulang yang bersih
DROP TABLE IF EXISTS tiket, penumpang, pemesanan, jadwal, kursi, gerbong, kereta, stasiun CASCADE;

-- Tabel untuk menyimpan informasi stasiun kereta.
CREATE TABLE stasiun (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_stasiun VARCHAR(255) NOT NULL,
  kode_stasiun VARCHAR(10) NOT NULL UNIQUE,
  kota VARCHAR(255) NOT NULL,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel untuk menyimpan informasi setiap kereta.
CREATE TABLE kereta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kereta VARCHAR(255) NOT NULL,
  kode_kereta VARCHAR(20) UNIQUE,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel untuk mendefinisikan gerbong-gerbong pada setiap kereta.
CREATE TABLE gerbong (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_kereta UUID NOT NULL REFERENCES kereta(id),
  nomor_gerbong INT NOT NULL,
  nama_kelas VARCHAR(50) NOT NULL,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(id_kereta, nomor_gerbong)
);

-- Tabel untuk mendefinisikan denah kursi pada setiap gerbong.
CREATE TABLE kursi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_gerbong UUID NOT NULL REFERENCES gerbong(id) ON DELETE CASCADE,
  baris_kursi INT NOT NULL,
  huruf_kursi CHAR(1) NOT NULL,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(id_gerbong, baris_kursi, huruf_kursi)
);

-- Tabel untuk jadwal perjalanan kereta yang spesifik.
CREATE TABLE jadwal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_kereta UUID NOT NULL REFERENCES kereta(id),
  id_stasiun_asal UUID NOT NULL REFERENCES stasiun(id),
  id_stasiun_tujuan UUID NOT NULL REFERENCES stasiun(id),
  waktu_berangkat TIMESTAMPTZ NOT NULL,
  waktu_tiba TIMESTAMPTZ NOT NULL,
  harga NUMERIC(10, 2) NOT NULL,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel untuk transaksi pemesanan.
CREATE TABLE pemesanan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kode_pemesanan VARCHAR(20) NOT NULL UNIQUE,
  status status_pemesanan NOT NULL DEFAULT 'menunggu_pembayaran',
  total_harga NUMERIC(10, 2) NOT NULL,
  kode_pembayaran VARCHAR(50),
  batas_waktu_pembayaran TIMESTAMPTZ,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel untuk menyimpan data setiap penumpang dalam satu pemesanan.
CREATE TABLE penumpang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_pemesanan UUID NOT NULL REFERENCES pemesanan(id) ON DELETE CASCADE,
  nama_lengkap VARCHAR(255) NOT NULL,
  nomor_identitas VARCHAR(50) NOT NULL,
  apakah_penumpang_disabilitas BOOLEAN NOT NULL DEFAULT false,
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabel yang merepresentasikan tiket final, menghubungkan penumpang, jadwal, dan kursi.
CREATE TABLE tiket (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_penumpang UUID NOT NULL REFERENCES penumpang(id) ON DELETE CASCADE,
  id_jadwal UUID NOT NULL REFERENCES jadwal(id),
  id_kursi UUID REFERENCES kursi(id), -- Bisa kosong untuk penumpang disabilitas
  data_qr_code TEXT UNIQUE, -- Untuk membuat QR Code saat check-in
  dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT kursi_unik_per_jadwal UNIQUE (id_jadwal, id_kursi)
);

-- ========= PENGISIAN DATA DUMMY GABUNGAN =========

-- 1. Isi Tabel Stasiun (Termasuk data tambahan)
INSERT INTO stasiun (nama_stasiun, kode_stasiun, kota) VALUES
('Stasiun Gambir', 'GMR', 'Jakarta'),
('Stasiun Surabaya Gubeng', 'SGU', 'Surabaya'),
('Stasiun Bandung', 'BD', 'Bandung'),
('Stasiun Yogyakarta', 'YK', 'Yogyakarta'),
('Stasiun Malang', 'ML', 'Malang'),
('Stasiun Semarang Tawang', 'SMT', 'Semarang'),
('Stasiun Cirebon', 'CN', 'Cirebon'),
('Stasiun Solo Balapan', 'SLO', 'Solo'),
('Stasiun Bekasi', 'BKS', 'Bekasi');

-- 2. Isi Tabel Kereta (Termasuk data tambahan)
INSERT INTO kereta (nama_kereta, kode_kereta) VALUES
('Argo Bromo Anggrek', 'KA-01'),
('Taksaka', 'KA-02'),
('Malabar', 'KA-03'),
('Argo Lawu', 'KA-04'),
('Brawijaya', 'KA-05');

-- 3. Isi Tabel Gerbong (Termasuk data tambahan)
INSERT INTO gerbong (id_kereta, nomor_gerbong, nama_kelas) VALUES
-- Gerbong KA-01
((SELECT id FROM kereta WHERE kode_kereta = 'KA-01'), 1, 'Eksekutif'),
((SELECT id FROM kereta WHERE kode_kereta = 'KA-01'), 2, 'Eksekutif'),
-- Gerbong KA-02
((SELECT id FROM kereta WHERE kode_kereta = 'KA-02'), 1, 'Eksekutif'),
((SELECT id FROM kereta WHERE kode_kereta = 'KA-02'), 2, 'Bisnis'),
-- Gerbong KA-03
((SELECT id FROM kereta WHERE kode_kereta = 'KA-03'), 1, 'Eksekutif'),
((SELECT id FROM kereta WHERE kode_kereta = 'KA-03'), 2, 'Bisnis'),
((SELECT id FROM kereta WHERE kode_kereta = 'KA-03'), 3, 'Ekonomi'),
-- Gerbong KA-04 (Argo Lawu)
((SELECT id FROM kereta WHERE kode_kereta = 'KA-04'), 1, 'Eksekutif'),
((SELECT id FROM kereta WHERE kode_kereta = 'KA-04'), 2, 'Eksekutif'),
-- Gerbong KA-05 (Brawijaya)
((SELECT id FROM kereta WHERE kode_kereta = 'KA-05'), 1, 'Eksekutif'),
((SELECT id FROM kereta WHERE kode_kereta = 'KA-05'), 2, 'Bisnis');

-- 4. Isi Tabel Kursi (Untuk semua gerbong)
INSERT INTO kursi (id_gerbong, baris_kursi, huruf_kursi)
SELECT g.id, b.baris, h.huruf
FROM gerbong g,
     generate_series(1, 5) AS b(baris),
     (VALUES ('A'), ('B'), ('C'), ('D')) AS h(huruf)
WHERE g.nama_kelas IN ('Eksekutif', 'Bisnis');

INSERT INTO kursi (id_gerbong, baris_kursi, huruf_kursi)
SELECT g.id, b.baris, h.huruf
FROM gerbong g,
     generate_series(1, 5) AS b(baris),
     (VALUES ('A'), ('B'), ('C'), ('D'), ('E')) AS h(huruf)
WHERE g.nama_kelas = 'Ekonomi';

-- 5. Isi Tabel Jadwal (Semua jadwal digabungkan)
INSERT INTO jadwal (id_kereta, id_stasiun_asal, id_stasiun_tujuan, waktu_berangkat, waktu_tiba, harga) VALUES
-- Jadwal Awal
((SELECT id FROM kereta WHERE kode_kereta = 'KA-01'), (SELECT id FROM stasiun WHERE kode_stasiun = 'GMR'), (SELECT id FROM stasiun WHERE kode_stasiun = 'SGU'), now() + interval '3 days' + interval '8 hours', now() + interval '3 days' + interval '16 hours', 650000.00),
((SELECT id FROM kereta WHERE kode_kereta = 'KA-02'), (SELECT id FROM stasiun WHERE kode_stasiun = 'GMR'), (SELECT id FROM stasiun WHERE kode_stasiun = 'YK'), now() + interval '4 days' + interval '9 hours', now() + interval '4 days' + interval '16 hours' + interval '30 minutes', 550000.00),
((SELECT id FROM kereta WHERE kode_kereta = 'KA-03'), (SELECT id FROM stasiun WHERE kode_stasiun = 'BD'), (SELECT id FROM stasiun WHERE kode_stasiun = 'ML'), now() + interval '5 days' + interval '16 hours', now() + interval '6 days' + interval '6 hours', 450000.00),
-- Jadwal Tambahan
((SELECT id FROM kereta WHERE kode_kereta = 'KA-04'), (SELECT id FROM stasiun WHERE kode_stasiun = 'GMR'), (SELECT id FROM stasiun WHERE kode_stasiun = 'SLO'), now() + interval '7 days' + interval '20 hours' + interval '30 minutes', now() + interval '8 days' + interval '4 hours', 620000.00),
((SELECT id FROM kereta WHERE kode_kereta = 'KA-05'), (SELECT id FROM stasiun WHERE kode_stasiun = 'ML'), (SELECT id FROM stasiun WHERE kode_stasiun = 'GMR'), now() + interval '7 days' + interval '16 hours', now() + interval '8 days' + interval '5 hours', 750000.00),
((SELECT id FROM kereta WHERE kode_kereta = 'KA-04'), (SELECT id FROM stasiun WHERE kode_stasiun = 'SLO'), (SELECT id FROM stasiun WHERE kode_stasiun = 'GMR'), now() + interval '9 days' + interval '08 hours', now() + interval '9 days' + interval '15 hours' + interval '30 minutes', 630000.00),
((SELECT id FROM kereta WHERE kode_kereta = 'KA-05'), (SELECT id FROM stasiun WHERE kode_stasiun = 'GMR'), (SELECT id FROM stasiun WHERE kode_stasiun = 'ML'), now() + interval '10 days' + interval '19 hours', now() + interval '11 days' + interval '8 hours', 780000.00),
((SELECT id FROM kereta WHERE kode_kereta = 'KA-01'), (SELECT id FROM stasiun WHERE kode_stasiun = 'GMR'), (SELECT id FROM stasiun WHERE kode_stasiun = 'SMT'), now() + interval '5 days' + interval '07 hours', now() + interval '5 days' + interval '13 hours', 480000.00),
((SELECT id FROM kereta WHERE kode_kereta = 'KA-02'), (SELECT id FROM stasiun WHERE kode_stasiun = 'GMR'), (SELECT id FROM stasiun WHERE kode_stasiun = 'CN'), now() + interval '6 days' + interval '10 hours', now() + interval '6 days' + interval '13 hours', 250000.00),
((SELECT id FROM kereta WHERE kode_kereta = 'KA-03'), (SELECT id FROM stasiun WHERE kode_stasiun = 'SGU'), (SELECT id FROM stasiun WHERE kode_stasiun = 'BD'), now() + interval '8 days' + interval '18 hours', now() + interval '9 days' + interval '07 hours', 510000.00),
((SELECT id FROM kereta WHERE kode_kereta = 'KA-04'), (SELECT id FROM stasiun WHERE kode_stasiun = 'SLO'), (SELECT id FROM stasiun WHERE kode_stasiun = 'BD'), now() + interval '10 days' + interval '11 hours', now() + interval '10 days' + interval '18 hours', 390000.00);

-- 6. Isi Tabel Pemesanan & Penumpang & Tiket (Hanya data transaksi awal)
DO $$
DECLARE
    -- Variabel untuk Pemesanan 1 (Terkonfirmasi)
    pemesanan1_id UUID;
    penumpang1_id UUID;
    penumpang2_id UUID;
    jadwal1_id UUID;
    kursi1_id UUID;
    kursi2_id UUID;

    -- Variabel untuk Pemesanan 2 (Menunggu Pembayaran)
    pemesanan2_id UUID;
    penumpang3_id UUID;
    jadwal2_id UUID;
    kursi3_id UUID;
    
    -- Variabel untuk Pemesanan 3 (Dibatalkan)
    pemesanan3_id UUID;

BEGIN
    -- == PROSES PEMESANAN 1 (2 Penumpang, Terkonfirmasi) ==
    INSERT INTO pemesanan (kode_pemesanan, status, total_harga, kode_pembayaran)
    VALUES ('KAI-BOOK-001', 'terkonfirmasi', 1300000.00, 'INV/20251002/001') RETURNING id INTO pemesanan1_id;

    INSERT INTO penumpang (id_pemesanan, nama_lengkap, nomor_identitas)
    VALUES (pemesanan1_id, 'Budi Santoso', '3216011010900001') RETURNING id INTO penumpang1_id;
    INSERT INTO penumpang (id_pemesanan, nama_lengkap, nomor_identitas)
    VALUES (pemesanan1_id, 'Citra Lestari', '3216012505920002') RETURNING id INTO penumpang2_id;
    
    SELECT id INTO jadwal1_id FROM jadwal WHERE id_kereta = (SELECT id FROM kereta WHERE kode_kereta = 'KA-01') LIMIT 1;
    SELECT id INTO kursi1_id FROM kursi WHERE baris_kursi = 1 AND huruf_kursi = 'A' AND id_gerbong IN (SELECT id FROM gerbong WHERE id_kereta = (SELECT id FROM kereta WHERE kode_kereta = 'KA-01')) LIMIT 1;
    SELECT id INTO kursi2_id FROM kursi WHERE baris_kursi = 1 AND huruf_kursi = 'B' AND id_gerbong IN (SELECT id FROM gerbong WHERE id_kereta = (SELECT id FROM kereta WHERE kode_kereta = 'KA-01')) LIMIT 1;

    INSERT INTO tiket (id_penumpang, id_jadwal, id_kursi, data_qr_code) VALUES (penumpang1_id, jadwal1_id, kursi1_id, 'QR-TICKET-BS-001');
    INSERT INTO tiket (id_penumpang, id_jadwal, id_kursi, data_qr_code) VALUES (penumpang2_id, jadwal1_id, kursi2_id, 'QR-TICKET-CL-002');


    -- == PROSES PEMESANAN 2 (1 Penumpang, Menunggu Pembayaran) ==
    INSERT INTO pemesanan (kode_pemesanan, status, total_harga, kode_pembayaran, batas_waktu_pembayaran)
    VALUES ('KAI-BOOK-002', 'menunggu_pembayaran', 550000.00, 'INV/20251002/002', now() + interval '1 hour') RETURNING id INTO pemesanan2_id;

    INSERT INTO penumpang (id_pemesanan, nama_lengkap, nomor_identitas)
    VALUES (pemesanan2_id, 'Agus Setiawan', '3578011508880003') RETURNING id INTO penumpang3_id;

    SELECT id INTO jadwal2_id FROM jadwal WHERE id_kereta = (SELECT id FROM kereta WHERE kode_kereta = 'KA-02') LIMIT 1;
    SELECT id INTO kursi3_id FROM kursi WHERE baris_kursi = 2 AND huruf_kursi = 'C' AND id_gerbong IN (SELECT id FROM gerbong WHERE id_kereta = (SELECT id FROM kereta WHERE kode_kereta = 'KA-02')) LIMIT 1;
    
    INSERT INTO tiket (id_penumpang, id_jadwal, id_kursi, data_qr_code) VALUES (penumpang3_id, jadwal2_id, kursi3_id, 'QR-TICKET-AS-003');


    -- == PROSES PEMESANAN 3 (1 Penumpang, Dibatalkan) ==
    INSERT INTO pemesanan (kode_pemesanan, status, total_harga)
    VALUES ('KAI-BOOK-003', 'dibatalkan', 450000.00) RETURNING id INTO pemesanan3_id;
    
    INSERT INTO penumpang (id_pemesanan, nama_lengkap, nomor_identitas)
    VALUES (pemesanan3_id, 'Dewi Anggraini', '3404012011950004');
    -- Tidak ada tiket yang dibuat untuk pemesanan yang dibatalkan.

END $$;