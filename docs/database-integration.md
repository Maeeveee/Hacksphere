# Implementasi Database Tiket - Documentation

## Overview
Implementasi penyimpanan data tiket ke database Supabase telah berhasil ditambahkan ke aplikasi. Data tiket akan otomatis disimpan saat user masuk ke halaman konfirmasi pembayaran, dan status pembayaran akan diupdate saat pembayaran selesai.

## Struktur Database

### Tabel: `tiket`
```sql
- id (UUID, Primary Key)
- booking_code (VARCHAR(20), UNIQUE, NOT NULL)

-- Data Kereta
- train_id (VARCHAR(50))
- train_name (VARCHAR(100), NOT NULL)
- train_number (VARCHAR(20), NOT NULL) 
- train_class (VARCHAR(20), NOT NULL)

-- Rute & Jadwal
- origin (VARCHAR(100), NOT NULL)
- destination (VARCHAR(100), NOT NULL)
- departure_date (DATE, NOT NULL)
- departure_time (TIME, NOT NULL)
- arrival_time (TIME, NOT NULL)
- duration (VARCHAR(20))

-- Data Pemesan
- booker_name (VARCHAR(100), NOT NULL)
- booker_gender (VARCHAR(10), NOT NULL)
- booker_identity_type (VARCHAR(20), NOT NULL)
- booker_identity_number (VARCHAR(50), NOT NULL)
- booker_phone (VARCHAR(20), NOT NULL)
- booker_email (VARCHAR(100), NOT NULL)
- booker_address (TEXT)

-- Data Penumpang
- passengers_data (JSONB, NOT NULL) - Array data penumpang termasuk kursi
- passenger_count (INTEGER, NOT NULL)
- adult_count (INTEGER, NOT NULL)
- child_count (INTEGER, DEFAULT 0)

-- Harga
- price_per_ticket (DECIMAL(12,2), NOT NULL)
- total_price (DECIMAL(12,2), NOT NULL)

-- Status
- payment_status (VARCHAR(20), DEFAULT 'pending') - pending/paid/cancelled
- booking_status (VARCHAR(20), DEFAULT 'active') - active/cancelled/completed

-- Metadata
- created_at (TIMESTAMPTZ, DEFAULT NOW())
- updated_at (TIMESTAMPTZ, DEFAULT NOW())
- payment_code (VARCHAR(50))
- payment_deadline (TIMESTAMPTZ)
```

## Fungsi Database yang Tersedia

### 1. `saveTiket(tiketData)`
Menyimpan data tiket baru ke database.
- **Input**: Data tiket (tanpa id, created_at, updated_at)
- **Return**: `{ data: Tiket | null, error: any }`
- **Usage**: Dipanggil otomatis saat user masuk ke halaman konfirmasi

### 2. `getTiketByBookingCode(bookingCode)`
Mengambil data tiket berdasarkan kode booking.
- **Input**: string booking code
- **Return**: `{ data: Tiket | null, error: any }`

### 3. `updatePaymentStatus(bookingCode, status)`
Update status pembayaran tiket.
- **Input**: booking code, status ('pending' | 'paid' | 'cancelled')
- **Return**: `{ data: Tiket | null, error: any }`
- **Usage**: Dipanggil otomatis saat pembayaran selesai

### 4. `getTiketByEmail(email)`
Mengambil semua tiket berdasarkan email pemesan.
- **Input**: string email
- **Return**: `{ data: Tiket[] | null, error: any }`
- **Usage**: Untuk riwayat pemesanan

## Flow Penyimpanan Data

### 1. Halaman Orders (/orders)
- User mengisi data pemesanan dan penumpang
- Data disimpan di localStorage sebagai 'orderData'

### 2. Halaman Payment (/orders/payment)  
- User memilih metode pembayaran
- Data orderData + payment info disimpan sebagai 'paymentData'

### 3. Halaman Confirmation (/orders/payment/confirmation) ⭐
- **STEP 1**: useEffect mengambil data dari localStorage
- **STEP 2**: Otomatis memanggil `saveTicketToDatabase()` 
- **STEP 3**: Data tiket disimpan ke database dengan status 'pending'
- **STEP 4**: Saat user klik "Selesaikan Pembayaran"
- **STEP 5**: Status diupdate ke 'paid' via `updatePaymentStatus()`

## Data yang Disimpan

### Data Penumpang (passengers_data - JSON)
```json
[
  {
    "gender": "male",
    "nama": "John Doe",
    "tipeIdentitas": "nik", 
    "nomorIdentitas": "1234567890123456",
    "ageCategory": "adult",
    "selectedSeat": {
      "wagon": "EKS-A",
      "row": 5,
      "column": "A", 
      "seatNumber": "5A",
      "isOccupied": false
    }
  }
]
```

### Status Tracking
- **payment_status**: 'pending' → 'paid' → 'completed'
- **booking_status**: 'active' → 'completed' atau 'cancelled'

## Setup Database

1. **Jalankan SQL Script**:
   ```bash
   # Di Supabase SQL Editor, jalankan:
   database/create_tiket_table.sql
   ```

2. **Verify Table Created**:
   ```sql
   SELECT * FROM tiket LIMIT 1;
   ```

## Error Handling

### Database Errors
- Semua fungsi database memiliki try-catch
- Error log di console untuk debugging
- Graceful fallback jika database tidak tersedia

### Validation
- Data wajib divalidasi sebelum disimpan
- Booking code harus unique
- Email format harus valid

## Integration Points

### File yang Dimodifikasi:
1. `src/lib/supabase/queries.ts` - Fungsi database
2. `src/app/orders/payment/confirmation/page.tsx` - Logic penyimpanan
3. `database/create_tiket_table.sql` - Schema database

### Dependencies:
- Supabase client (sudah ada)
- TypeScript interfaces
- UUID generation (auto via Supabase)

## Testing

### Manual Testing Checklist:
- [ ] Data tersimpan saat masuk ke halaman confirmation
- [ ] Status berubah ke 'paid' saat pembayaran selesai  
- [ ] Booking code unik untuk setiap pemesanan
- [ ] Data penumpang dan kursi tersimpan dengan benar
- [ ] Error handling bekerja jika database down

### Database Queries untuk Monitoring:
```sql
-- Lihat semua tiket
SELECT booking_code, booker_name, payment_status, created_at 
FROM tiket 
ORDER BY created_at DESC;

-- Count by status
SELECT payment_status, COUNT(*) 
FROM tiket 
GROUP BY payment_status;
```

## Security Considerations

- **Row Level Security**: Bisa diaktifkan untuk membatasi akses
- **Data Validation**: Input validation di aplikasi level
- **Personal Data**: Email dan identitas tersimpan (sesuai regulasi)
- **Payment Info**: Tidak menyimpan data sensitif kartu kredit

## Future Enhancements

1. **Notifikasi Email**: Kirim email konfirmasi setelah tiket tersimpan
2. **Export PDF**: Generate tiket PDF dari data database
3. **Analytics**: Dashboard untuk tracking pemesanan
4. **Sync dengan KAI**: Integrasi dengan sistem resmi KAI
5. **Refund System**: Sistem pembatalan dan pengembalian dana