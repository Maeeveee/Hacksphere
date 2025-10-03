# QR Code Booking Feature

## Overview
Fitur QR Code memungkinkan pengguna untuk mengakses detail tiket mereka dengan mudah melalui pemindaian QR code.

## Struktur

### 1. Route Dynamic: `/booking-code/[code]`
- **File**: `src/app/booking-code/[code]/page.tsx`
- **Deskripsi**: Halaman untuk menampilkan detail tiket berdasarkan booking code
- **Parameter**: `[code]` - Booking code unik (contoh: 2G5JVA, ABC123)

### 2. Data Source
Halaman ini mengambil data dari **dua sumber** dengan prioritas:

#### a. Primary: Database Supabase (Recommended)
```typescript
const { data: tiket, error } = await getTiketByBookingCode(bookingCode);
```
- Menggunakan fungsi `getTiketByBookingCode` dari `@/lib/supabase/queries`
- Data persisten dan dapat diakses dari device mana saja
- Ideal untuk production

#### b. Fallback: localStorage
```typescript
const storedPaymentData = localStorage.getItem('paymentData');
```
- Digunakan jika data tidak ditemukan di database
- Data hanya tersimpan di browser yang sama
- Berguna untuk development/testing

### 3. QR Code URL Format

#### Development (Localhost)
```
http://localhost:3000/booking-code/2G5JVA
```

#### Production (Contoh)
```
https://yourdomain.com/booking-code/2G5JVA
```

**File yang menggunakan QR Code URL:**
1. `src/app/orders/payment/confirmation/page.tsx` (line ~153)
2. `src/components/BookingHistory.tsx` (line ~116)
3. `src/app/booking-code/[code]/page.tsx` (line ~124)

## Cara Kerja

### Flow Pembuatan Tiket
```
1. User melakukan booking
   ↓
2. User memilih metode pembayaran
   ↓
3. Halaman confirmation/page.tsx:
   - Generate booking code unik (6 karakter)
   - Generate QR code dengan URL: http://localhost:3000/booking-code/{code}
   - Simpan data ke localStorage
   - Simpan data ke database Supabase (via saveTiket)
   ↓
4. QR Code ditampilkan di tiket
```

### Flow Akses Tiket via QR Code
```
1. User scan QR code
   ↓
2. Browser membuka: http://localhost:3000/booking-code/2G5JVA
   ↓
3. Halaman booking-code/[code]/page.tsx:
   - Extract booking code dari URL params
   - Coba fetch data dari database (getTiketByBookingCode)
   - Jika tidak ada, fallback ke localStorage
   - Tampilkan detail tiket lengkap
```

## Informasi yang Ditampilkan

### Detail Tiket
- ✅ Nama Kereta & Nomor
- ✅ Kelas & Nomor Kursi
- ✅ Stasiun Keberangkatan (dengan kode stasiun)
- ✅ Stasiun Tujuan (dengan kode stasiun)
- ✅ Tanggal & Waktu Keberangkatan
- ✅ Tanggal & Waktu Kedatangan
- ✅ Nama Penumpang Utama
- ✅ Daftar Semua Penumpang (dengan detail identitas)
- ✅ Fasilitas Kereta
- ✅ Kode Booking
- ✅ Total Pembayaran
- ✅ Status Pembayaran (Lunas/Pending)

### Status Badge
```typescript
- 'paid' → Badge Hijau: "Lunas"
- 'pending' → Badge Kuning: "Menunggu Pembayaran"  
- default → Badge Hijau: "Tiket Valid"
```

### Action Buttons
1. **Cetak Tiket**: Trigger `window.print()` untuk print tiket
2. **Kembali ke Beranda**: Navigate ke homepage

## Database Schema (Tabel: tiket)

```sql
{
  id: uuid (Primary Key)
  booking_code: varchar (Unique)
  
  -- Data Kereta
  train_id: uuid
  train_name: varchar
  train_number: varchar
  train_class: varchar
  
  -- Rute & Jadwal
  origin: varchar
  destination: varchar
  departure_date: date
  departure_time: time
  arrival_time: time
  duration: varchar
  
  -- Data Pemesan
  booker_name: varchar
  booker_gender: varchar
  booker_identity_type: varchar
  booker_identity_number: varchar
  booker_phone: varchar
  booker_email: varchar
  booker_address: text
  
  -- Data Penumpang
  passengers_data: jsonb
  passenger_count: integer
  adult_count: integer
  child_count: integer
  
  -- Harga
  price_per_ticket: numeric
  total_price: numeric
  
  -- Status
  payment_status: enum ('pending', 'paid', 'cancelled')
  booking_status: enum ('active', 'cancelled', 'completed')
  
  -- Metadata
  created_at: timestamptz
  updated_at: timestamptz
  payment_code: varchar
  payment_deadline: timestamptz
}
```

## Fungsi Database yang Digunakan

### 1. `saveTiket(tiketData)`
- **File**: `src/lib/supabase/queries.ts`
- **Deskripsi**: Menyimpan data tiket baru ke database
- **Dipanggil di**: `src/app/orders/payment/confirmation/page.tsx` (line ~200)

### 2. `getTiketByBookingCode(bookingCode)`
- **File**: `src/lib/supabase/queries.ts`  
- **Deskripsi**: Mengambil data tiket berdasarkan booking code
- **Dipanggil di**: `src/app/booking-code/[code]/page.tsx`

### 3. `updatePaymentStatus(bookingCode, status)`
- **File**: `src/lib/supabase/queries.ts`
- **Deskripsi**: Update status pembayaran tiket
- **Status**: 'pending' | 'paid' | 'cancelled'

## Migration ke Production

Untuk deployment ke production, ubah URL QR code di 3 file berikut:

### 1. File: `src/app/orders/payment/confirmation/page.tsx`
```typescript
// Line ~153
// Sebelum:
qrCodeValue: `http://localhost:3000/booking-code/${bookingCode}`

// Sesudah:
qrCodeValue: `https://yourdomain.com/booking-code/${bookingCode}`
```

### 2. File: `src/components/BookingHistory.tsx`
```typescript
// Line ~116
// Sebelum:
return `http://localhost:3000/booking-code/${bookingCode}`;

// Sesudah:
return `https://yourdomain.com/booking-code/${bookingCode}`;
```

### 3. File: `src/app/booking-code/[code]/page.tsx`
```typescript
// Line ~124
// Sebelum:
qrCodeValue: `http://localhost:3000/booking-code/${tiket.booking_code}`

// Sesudah:
qrCodeValue: `https://yourdomain.com/booking-code/${tiket.booking_code}`
```

## Cara Test

### 1. Test Manual (Localhost)
```bash
# 1. Jalankan development server
npm run dev

# 2. Buka browser: http://localhost:3000
# 3. Lakukan booking tiket
# 4. Lanjut ke pembayaran
# 5. Scan QR code yang muncul (atau copy URL)
# 6. Paste URL di browser: http://localhost:3000/booking-code/YOUR_CODE
# 7. Verifikasi detail tiket tampil dengan benar
```

### 2. Test dengan QR Scanner
```
1. Install QR Scanner app di smartphone
2. Scan QR code yang ditampilkan di tiket
3. Browser akan membuka halaman detail tiket
4. Verifikasi semua informasi sesuai
```

### 3. Test Error Handling
```
# Test booking code tidak ada
http://localhost:3000/booking-code/INVALID

# Expected Result:
- Loading spinner → Error message
- "Tiket Tidak Ditemukan"
- Button "Kembali ke Beranda"
```

## Error States

### 1. Booking Code Tidak Valid
```typescript
if (!bookingCode) {
  setError("Kode booking tidak valid");
}
```

### 2. Data Tidak Ditemukan
```typescript
if (dbError || !tiket) {
  setError("Kode booking tidak ditemukan di database");
}
```

### 3. Error Parsing Data
```typescript
catch (err) {
  setError("Gagal memuat data tiket");
}
```

## UI Components

### Loading State
```tsx
<div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin">
```
- Spinner biru dengan animasi rotate
- Text: "Memuat data tiket..."

### Error State
```tsx
<div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
  <CreditCard className="w-10 h-10 text-red-600" />
</div>
```
- Icon merah dengan pesan error
- Button untuk kembali ke beranda

### Success State
```tsx
<Card className="max-w-4xl mx-auto shadow-xl">
  <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700">
    {/* Header dengan nama kereta */}
  </CardHeader>
  <CardContent>
    {/* Detail tiket lengkap */}
  </CardContent>
</Card>
```

## Responsive Design

- **Mobile**: Vertical stack, single column
- **Tablet (md)**: 2-column grid untuk info
- **Desktop (lg)**: Full layout dengan optimal spacing

### Breakpoints
```typescript
sm: 640px  // Small devices
md: 768px  // Medium devices  
lg: 1024px // Large devices
```

## Security Considerations

1. **Booking Code**: 6 karakter random (uppercase + numbers)
2. **Validasi**: Cek keberadaan di database sebelum tampilkan
3. **Error Handling**: Jangan expose internal error ke user
4. **CORS**: Pastikan API endpoint protected (Supabase RLS)

## Future Enhancements

- [ ] Add QR code download functionality
- [ ] Email ticket dengan QR code attached
- [ ] WhatsApp share ticket
- [ ] Offline mode dengan PWA
- [ ] Real-time status update (via Supabase Realtime)
- [ ] Barcode alternative untuk QR code
- [ ] Multi-language support
- [ ] Dark mode

## Troubleshooting

### QR Code tidak bisa di-scan
1. Pastikan QR code library (`qrcode.react`) ter-install
2. Check URL format di QR code benar
3. Verifikasi QR code size cukup besar (min 200x200px)

### Data tidak muncul setelah scan
1. Check database connection (Supabase)
2. Verifikasi booking code tersimpan di database
3. Check browser console untuk error
4. Test dengan localStorage fallback

### Error "Tiket Tidak Ditemukan"
1. Pastikan data sudah tersimpan ke database saat payment
2. Check `saveTiket` function dipanggil di confirmation page
3. Verifikasi booking_code di database match dengan URL

## Contact
Untuk pertanyaan atau issue, silakan hubungi tim development.
