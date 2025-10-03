# Update: Insert Data ke Tabel Tiket

## Overview
Sistem sekarang sudah diupdate untuk menyimpan data tiket ke tabel `tiket` dengan struktur kolom yang baru setelah payment confirmation.

---

## 📋 Struktur Tabel Tiket (Database)

```sql
CREATE TABLE tiket (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_penumpang uuid,        -- Foreign key ke tabel penumpang (opsional)
  id_jadwal uuid,           -- Foreign key ke tabel jadwal
  id_kursi uuid,            -- Foreign key ke tabel kursi (opsional)
  data_qr_code text,        -- JSON string berisi semua data tiket
  dibuat_pada timestamptz DEFAULT NOW()
);
```

---

## 🔄 Perubahan Yang Dilakukan

### 1. **Interface TypeScript** (`src/lib/supabase/queries.ts`)

#### A. Interface `Tiket` (Struktur Database)
```typescript
export interface Tiket {
  id?: string;                    // uuid (Primary Key)
  id_penumpang?: string;          // uuid (foreign key)
  id_jadwal?: string;             // uuid (foreign key)
  id_kursi?: string;              // uuid (foreign key)
  data_qr_code: string;           // text (JSON string)
  dibuat_pada?: string;           // timestamptz
}
```

#### B. Interface `TiketQRData` (Data dalam JSON)
```typescript
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
  passengers_data: any[];
  passenger_count: number;
  adult_count: number;
  child_count: number;
  
  // Harga
  price_per_ticket: number;
  total_price: number;
  
  // Status
  payment_status?: 'pending' | 'paid' | 'cancelled';
  booking_status?: 'active' | 'cancelled' | 'completed';
  
  // Tambahan
  qr_code_url?: string;
  facilities?: string[];
  seat_numbers?: string[];
  wagon_number?: string;
  payment_method?: string;
  payment_bank?: string;
}
```

---

### 2. **Fungsi Database** (`src/lib/supabase/queries.ts`)

#### A. `saveTiket()` - Insert Data Tiket
```typescript
export async function saveTiket(
  tiketData: Omit<Tiket, 'id' | 'dibuat_pada'>
): Promise<{ data: Tiket | null; error: any }> {
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
```

**Cara Pakai:**
```typescript
const tiketData = {
  id_jadwal: "uuid-jadwal",
  data_qr_code: JSON.stringify(qrCodeData)
};

const { data, error } = await saveTiket(tiketData);
```

#### B. `getTiketByBookingCode()` - Ambil Data Tiket
```typescript
export async function getTiketByBookingCode(
  bookingCode: string
): Promise<{ data: TiketQRData | null; error: any }> {
  const supabase = createClient();
  
  // Query dengan filter JSON
  const { data, error } = await supabase
    .from('tiket')
    .select('*')
    .eq('data_qr_code->booking_code', bookingCode)
    .single();

  if (error) {
    return { data: null, error };
  }

  // Parse JSON dari data_qr_code
  const qrData = typeof data.data_qr_code === 'string' 
    ? JSON.parse(data.data_qr_code) 
    : data.data_qr_code;
    
  return { data: qrData as TiketQRData, error: null };
}
```

**Cara Pakai:**
```typescript
const { data, error } = await getTiketByBookingCode("ABC123");
// data akan berisi TiketQRData (sudah di-parse dari JSON)
```

#### C. `updatePaymentStatus()` - Update Status Pembayaran
```typescript
export async function updatePaymentStatus(
  bookingCode: string, 
  status: 'pending' | 'paid' | 'cancelled'
): Promise<{ data: Tiket | null; error: any }> {
  const supabase = createClient();
  
  // 1. Ambil data tiket saat ini
  const { data: currentData, error: fetchError } = await supabase
    .from('tiket')
    .select('*')
    .eq('data_qr_code->booking_code', bookingCode)
    .single();

  if (fetchError || !currentData) {
    return { data: null, error: fetchError };
  }

  // 2. Parse QR data
  const currentQRData = typeof currentData.data_qr_code === 'string'
    ? JSON.parse(currentData.data_qr_code)
    : currentData.data_qr_code;

  // 3. Update payment status
  currentQRData.payment_status = status;

  // 4. Save kembali sebagai JSON string
  const { data, error } = await supabase
    .from('tiket')
    .update({ 
      data_qr_code: JSON.stringify(currentQRData)
    })
    .eq('id', currentData.id)
    .select()
    .single();

  return { data, error };
}
```

---

### 3. **Confirmation Page** (`src/app/orders/payment/confirmation/page.tsx`)

#### Fungsi `saveTicketToDatabase()`

```typescript
const saveTicketToDatabase = async (paymentData: PaymentData) => {
  try {
    const { orderData, bookingCode, paymentCode } = paymentData;
    const { ticketData, bookingData, passengersData } = orderData;

    // 1. Siapkan data lengkap untuk QR Code
    const qrCodeData: TiketQRData = {
      // Booking Info
      booking_code: bookingCode,
      payment_code: paymentCode,
      payment_deadline: new Date(Date.now() + paymentDeadline * 1000).toISOString(),
      
      // Data Kereta
      train_id: ticketData.trainId,
      train_name: ticketData.trainName,
      train_number: ticketData.trainNumber,
      train_class: ticketData.class,
      
      // Rute & Jadwal
      origin: ticketData.origin,
      destination: ticketData.destination,
      departure_date: ticketData.departureDate,
      departure_time: ticketData.departureTime,
      arrival_time: ticketData.arrivalTime,
      duration: ticketData.duration,
      
      // Data Pemesan
      booker_name: bookingData.nama,
      booker_gender: bookingData.gender,
      booker_identity_type: bookingData.tipeIdentitas,
      booker_identity_number: bookingData.nomorIdentitas,
      booker_phone: bookingData.noHP,
      booker_email: bookingData.email,
      booker_address: bookingData.alamat,
      
      // Data Penumpang
      passengers_data: passengersData,
      passenger_count: ticketData.passengers,
      adult_count: ticketData.adults,
      child_count: ticketData.children,
      
      // Harga
      price_per_ticket: ticketData.price,
      total_price: ticketData.totalPrice,
      
      // Status
      payment_status: 'pending',
      booking_status: 'active',
      
      // QR Code URL
      qr_code_url: `http://localhost:3000/booking-code/${bookingCode}`,
      
      // Tambahan
      facilities: ticketData.facilities || [],
      payment_method: paymentData.paymentMethod || 'transfer',
      payment_bank: paymentData.bankName || 'Bank'
    };

    // 2. Data untuk insert ke tabel tiket
    const tiketData: Omit<Tiket, 'id' | 'dibuat_pada'> = {
      id_penumpang: undefined,           // Set jika ada tabel penumpang
      id_jadwal: ticketData.trainId,     // ID dari jadwal kereta
      id_kursi: undefined,               // Set jika ada tabel kursi
      data_qr_code: JSON.stringify(qrCodeData)  // Simpan sebagai JSON string
    };

    // 3. Insert ke database
    const { data, error } = await saveTiket(tiketData);
    
    if (error) {
      console.error('Error saving ticket:', error);
      return false;
    }
    
    console.log('Ticket saved successfully:', data);
    return true;
    
  } catch (error) {
    console.error('Error in saveTicketToDatabase:', error);
    return false;
  }
};
```

---

### 4. **Booking Code Page** (`src/app/booking-code/[code]/page.tsx`)

Halaman ini sudah diupdate untuk:
- ✅ Fetch data dari database menggunakan `getTiketByBookingCode()`
- ✅ Parse data JSON dari `data_qr_code`
- ✅ Fallback ke localStorage jika tidak ada di database
- ✅ Display semua informasi tiket

---

## 📊 Flow Data

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Booking & Pilih Metode Pembayaran              │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Confirmation Page                                    │
│    - Generate booking_code (6 karakter)                 │
│    - Generate payment_code                              │
│    - Siapkan qrCodeData (TiketQRData)                  │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Save to Database                                     │
│    INSERT INTO tiket (                                  │
│      id_jadwal,                                         │
│      data_qr_code  -- JSON.stringify(qrCodeData)       │
│    )                                                    │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Generate QR Code                                     │
│    URL: http://localhost:3000/booking-code/ABC123      │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 5. User Scan QR Code                                    │
│    → Open booking-code/[code]/page.tsx                 │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Fetch from Database                                  │
│    getTiketByBookingCode("ABC123")                     │
│    → Parse data_qr_code JSON                           │
│    → Return TiketQRData                                │
└───────────────────┬─────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Display Ticket Details                               │
│    - Train info                                         │
│    - Passenger info                                     │
│    - Payment status                                     │
│    - All booking details                                │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Contoh Data yang Disimpan

### Database Record (Tabel `tiket`)
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "id_penumpang": null,
  "id_jadwal": "abc-123-def-456",
  "id_kursi": null,
  "data_qr_code": "{\"booking_code\":\"ABC123\",\"train_name\":\"Argo Bromo\",\"origin\":\"Jakarta\",\"destination\":\"Surabaya\",\"booker_name\":\"John Doe\",\"passengers_data\":[...],\"payment_status\":\"pending\",...}",
  "dibuat_pada": "2025-10-03T10:30:00Z"
}
```

### Parsed `data_qr_code` (TiketQRData)
```json
{
  "booking_code": "ABC123",
  "payment_code": "PAY123456789",
  "payment_deadline": "2025-10-03T11:35:00Z",
  "train_name": "Argo Bromo",
  "train_number": "ARG-001",
  "train_class": "Eksekutif",
  "origin": "Jakarta",
  "destination": "Surabaya",
  "departure_date": "2025-10-05",
  "departure_time": "08:00",
  "arrival_time": "14:30",
  "booker_name": "John Doe",
  "booker_email": "john@example.com",
  "passengers_data": [
    {
      "nama": "John Doe",
      "tipeIdentitas": "KTP",
      "nomorIdentitas": "1234567890",
      "ageCategory": "adult"
    }
  ],
  "passenger_count": 1,
  "adult_count": 1,
  "child_count": 0,
  "price_per_ticket": 200000,
  "total_price": 200000,
  "payment_status": "pending",
  "booking_status": "active",
  "qr_code_url": "http://localhost:3000/booking-code/ABC123",
  "facilities": ["WiFi", "Makanan", "AC"],
  "payment_method": "transfer",
  "payment_bank": "BCA"
}
```

---

## ✅ Testing

### 1. Test Insert Data
```bash
# 1. Jalankan development server
npm run dev

# 2. Lakukan booking tiket
# 3. Pilih metode pembayaran
# 4. Lihat console log: "Ticket saved successfully"
# 5. Check database Supabase - tabel tiket harus ada row baru
```

### 2. Test Retrieve Data
```bash
# 1. Dari confirmation page, copy booking code (misal: ABC123)
# 2. Buka browser: http://localhost:3000/booking-code/ABC123
# 3. Data tiket harus tampil lengkap dari database
```

### 3. Test Update Status
```bash
# Simulasi pembayaran selesai
# → Payment status akan update dari 'pending' ke 'paid'
# → Data di database akan ter-update
```

---

## 🔧 Query Supabase untuk Testing

### Lihat semua tiket
```sql
SELECT 
  id,
  id_jadwal,
  data_qr_code::json->>'booking_code' as booking_code,
  data_qr_code::json->>'train_name' as train_name,
  data_qr_code::json->>'booker_name' as booker_name,
  data_qr_code::json->>'payment_status' as payment_status,
  dibuat_pada
FROM tiket
ORDER BY dibuat_pada DESC;
```

### Cari tiket berdasarkan booking code
```sql
SELECT *
FROM tiket
WHERE data_qr_code::json->>'booking_code' = 'ABC123';
```

### Lihat detail QR data
```sql
SELECT 
  data_qr_code::json
FROM tiket
WHERE id = 'your-uuid-here';
```

---

## 📝 Notes

1. **Foreign Keys**: Saat ini `id_penumpang` dan `id_kursi` di-set `undefined`. Jika Anda punya tabel `penumpang` dan `kursi`, set nilai yang sesuai.

2. **JSON Query**: Supabase/PostgreSQL support query JSON dengan operator `->` dan `->>`:
   - `->` : Mendapatkan JSON object
   - `->>` : Mendapatkan text value

3. **Performance**: Index pada `data_qr_code->>'booking_code'` direkomendasikan untuk performa lebih baik:
   ```sql
   CREATE INDEX idx_tiket_booking_code 
   ON tiket ((data_qr_code->>'booking_code'));
   ```

4. **Migration**: Jika ada data lama dengan struktur berbeda, buat script migration terpisah.

---

## 🚀 Next Steps

- [ ] Add index untuk JSON query
- [ ] Implement relasi dengan tabel `jadwal`, `penumpang`, `kursi`
- [ ] Add validation di frontend sebelum save
- [ ] Implement retry mechanism jika save gagal
- [ ] Add error tracking/monitoring

---

Semua sudah siap! Data tiket sekarang akan otomatis tersimpan ke database setelah konfirmasi pembayaran. 🎫✨
