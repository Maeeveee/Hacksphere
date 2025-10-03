# Sistem Kursi Dinamis dari Database

## Overview
Sistem pemilihan kursi sekarang mengambil data kursi yang sudah terpesan secara real-time dari database Supabase, bukan lagi menggunakan mock data statis.

## Perubahan yang Dilakukan

### 1. **File: `src/lib/supabase/queries.ts`**

#### Fungsi Baru: `getOccupiedSeats()`
```typescript
export async function getOccupiedSeats(
  trainName: string,
  trainClass: string,
  departureDate: string,
  departureTime: string
): Promise<{ data: string[] | null; error: any }>
```

**Deskripsi:**
- Mengambil data kursi yang sudah terpesan dari tabel `tiket`
- Filter berdasarkan: `train_name`, `train_class`, `departure_date`, `departure_time`
- Hanya mengambil tiket dengan status `pending` atau `paid` (tidak termasuk `cancelled`)
- Mengekstrak nomor kursi dari JSON field `passengers_data`
- Return array string nomor kursi: `["1A", "2B", "3C", ...]`

**Cara Kerja:**
1. Query database dengan filter schedule kereta yang spesifik
2. Loop semua tiket yang ditemukan
3. Parse `passengers_data` JSON untuk setiap tiket
4. Extract `selectedSeat.seatNumber` dari setiap passenger
5. Kumpulkan semua nomor kursi dalam array
6. Return array nomor kursi yang sudah terpesan

#### Fungsi Tambahan: `getOccupiedSeatsDetailed()`
```typescript
export async function getOccupiedSeatsDetailed(
  trainName: string,
  trainClass: string,
  departureDate: string,
  departureTime: string
): Promise<{ data: OccupiedSeat[] | null; error: any }>
```

**Deskripsi:**
- Versi detail dari `getOccupiedSeats()`
- Return array objek dengan informasi lengkap: `seatNumber`, `passengerName`, `bookingCode`
- Berguna untuk debugging atau tampilan admin

#### Interface Baru: `OccupiedSeat`
```typescript
export interface OccupiedSeat {
  seatNumber: string;      // e.g., "1A"
  passengerName: string;   // Nama penumpang
  bookingCode: string;     // Kode booking tiket
}
```

---

### 2. **File: `src/app/summary/page.tsx`**

#### Import Baru
```typescript
import { getOccupiedSeats } from "@/lib/supabase/queries";
```

#### State Baru
```typescript
const [isLoadingSeats, setIsLoadingSeats] = useState(false);
```
- Untuk tracking status loading saat fetch data kursi dari database

#### useEffect Baru: Fetch Occupied Seats
```typescript
useEffect(() => {
  const fetchOccupiedSeats = async () => {
    if (!orderData?.ticketData) return;
    
    setIsLoadingSeats(true);
    try {
      const { data, error } = await getOccupiedSeats(
        orderData.ticketData.trainName,
        orderData.ticketData.class,
        orderData.ticketData.departureDate,
        orderData.ticketData.departureTime
      );

      if (error) {
        console.error('Error fetching occupied seats:', error);
        setOccupiedSeats([]);
      } else {
        setOccupiedSeats(data || []);
        console.log('📍 Loaded occupied seats from database:', data);
      }
    } catch (err) {
      console.error('Exception fetching occupied seats:', err);
      setOccupiedSeats([]);
    } finally {
      setIsLoadingSeats(false);
    }
  };

  fetchOccupiedSeats();
}, [orderData]);
```

**Cara Kerja:**
- Trigger saat `orderData` dimuat/berubah
- Async fetch data kursi terpesan dari database
- Update state `occupiedSeats` dengan data dari database
- Handle error dengan fallback ke empty array
- Set `isLoadingSeats` untuk UI loading indicator

#### Update: `generateSeatMap()` Function
**SEBELUM (Mock Data):**
```typescript
// Generate some random occupied seats for demo
const randomOccupiedSeats = orderData.ticketData.class?.toLowerCase() === 'eksekutif' 
  ? ['1A', '2B', '4C', '6D', '8A', '10B'] 
  : orderData.ticketData.class?.toLowerCase() === 'bisnis'
  ? ['1A', '1B', '3C', '5D', '7A', '9B', '12C', '15D']
  : ['1A', '1B', '3C', '5D', '7A', '9B', '12C', '15D', '18A', '19B'];

const isOccupied = randomOccupiedSeats.includes(seatNumber) || 
                  occupiedSeats.includes(seatNumber) ||
                  orderData.passengersData.some(p => p.selectedSeat?.seatNumber === seatNumber);
```

**SESUDAH (Database Real-time):**
```typescript
// Gunakan data dari database (occupiedSeats state)
// Data ini sudah di-fetch dari database melalui getOccupiedSeats()
console.log('🪑 Generating seat map with occupied seats from DB:', occupiedSeats);

const isOccupied = occupiedSeats.includes(seatNumber) ||
                  orderData.passengersData.some(p => p.selectedSeat?.seatNumber === seatNumber);
```

**Perubahan:**
- ❌ Hapus mock data `randomOccupiedSeats`
- ✅ Gunakan `occupiedSeats` state yang di-fetch dari database
- ✅ Cek occupied berdasarkan: database + session current

#### Update: Modal Header dengan Loading Indicator
```typescript
<div className="flex items-center gap-3">
  <h3 className="text-xl font-bold">Pilih Kursi Penumpang</h3>
  {isLoadingSeats && (
    <div className="flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs">
      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      Memuat data kursi...
    </div>
  )}
</div>
<p className="text-blue-100 text-sm">...</p>
{!isLoadingSeats && occupiedSeats.length > 0 && (
  <p className="text-blue-200 text-xs mt-1">
    📊 {occupiedSeats.length} kursi sudah terpesan dari database
  </p>
)}
```

**Fitur:**
- Tampilkan spinner loading saat fetch data
- Tampilkan jumlah kursi terpesan dari database
- User feedback yang clear

---

## Flow Data Kursi

```
1. User membuka halaman Summary
   ↓
2. orderData dimuat dari localStorage
   ↓
3. useEffect trigger: fetchOccupiedSeats()
   ↓
4. Query database dengan:
   - trainName: "Argo Bromo Anggrek"
   - trainClass: "Eksekutif"
   - departureDate: "2025-10-31"
   - departureTime: "05:03"
   ↓
5. Database return tiket yang match criteria
   ↓
6. Extract seat numbers dari passengers_data JSON
   ↓
7. Update state: setOccupiedSeats(["1A", "2B", ...])
   ↓
8. generateSeatMap() menggunakan occupiedSeats
   ↓
9. Seat map render dengan:
   - 🟢 Hijau = Available
   - 🔴 Merah = Occupied (dari database)
   - 🔵 Biru = Selected (session saat ini)
```

---

## Database Schema

### Tabel: `tiket`
```sql
- id: uuid (primary key)
- booking_code: varchar
- train_name: varchar
- train_class: varchar
- departure_date: date
- departure_time: time
- passengers_data: jsonb  ← DATA KURSI ADA DI SINI
- payment_status: enum ('pending', 'paid', 'cancelled')
```

### Format `passengers_data` JSON:
```json
[
  {
    "nama": "John Doe",
    "gender": "tuan",
    "tipeIdentitas": "nik",
    "nomorIdentitas": "1234567890123456",
    "ageCategory": "adult",
    "selectedSeat": {
      "wagon": "EKS-A",
      "row": 1,
      "column": "A",
      "seatNumber": "1A",  ← NOMOR KURSI
      "isOccupied": false
    }
  }
]
```

---

## Testing

### Test Case 1: Kursi Kosong
```
1. Buka halaman summary
2. Klik "Pilih Kursi"
3. Verify: Semua kursi hijau (available) jika tidak ada booking
```

### Test Case 2: Ada Kursi Terpesan
```
1. Book tiket dengan kursi 1A, 2B
2. Simpan ke database
3. Buka booking baru untuk jadwal yang sama
4. Klik "Pilih Kursi"
5. Verify: Kursi 1A dan 2B berwarna merah (occupied)
6. Verify: Modal header menunjukkan "2 kursi sudah terpesan dari database"
```

### Test Case 3: Loading State
```
1. Buka halaman summary
2. Observe loading spinner di modal header
3. Verify: Spinner hilang setelah data dimuat
```

### Test Case 4: Error Handling
```
1. Disconnect database
2. Buka halaman summary
3. Verify: Error di console log
4. Verify: occupiedSeats fallback ke empty array []
5. Verify: Semua kursi available (tidak crash)
```

---

## Keuntungan Sistem Baru

✅ **Real-time Data**: Kursi yang sudah dibooking langsung terlihat merah
✅ **Tidak Ada Konflik**: Mencegah double booking kursi yang sama
✅ **Akurat**: Data langsung dari database, bukan mock
✅ **Scalable**: Query efisien dengan filter spesifik
✅ **User Feedback**: Loading indicator dan info jumlah kursi terpesan
✅ **Error Handling**: Graceful fallback jika database error

---

## Catatan Penting

⚠️ **Filter Query Harus Tepat**
Query filter menggunakan 4 parameter:
- `train_name` (exact match)
- `train_class` (exact match)  
- `departure_date` (exact match)
- `departure_time` (exact match)

Pastikan data ticketData di localStorage memiliki format yang konsisten!

⚠️ **Payment Status**
Hanya tiket dengan status `pending` atau `paid` yang dihitung sebagai occupied.
Tiket `cancelled` tidak dihitung.

⚠️ **Performance**
Query ini efisien karena:
- Menggunakan index pada kolom filter
- Hanya fetch field `passengers_data`
- Client-side parsing JSON (tidak di database)

---

## Future Enhancements

🔮 **Real-time Updates dengan Supabase Realtime**
```typescript
// Subscribe ke perubahan tabel tiket
const subscription = supabase
  .channel('tiket-changes')
  .on('postgres_changes', 
    { 
      event: '*', 
      schema: 'public', 
      table: 'tiket' 
    }, 
    (payload) => {
      fetchOccupiedSeats(); // Refresh data
    }
  )
  .subscribe();
```

🔮 **Seat Locking (Reserve Temporary)**
- Lock kursi selama 5 menit saat user memilih
- Release lock jika user tidak lanjut pembayaran
- Prevent race condition

🔮 **Seat Recommendation Algorithm**
- Auto suggest best seats berdasarkan:
  - Lokasi (depan/tengah/belakang)
  - Jendela vs gang
  - Dekat toilet/AC
  
---

## Troubleshooting

### Problem: Kursi tidak update setelah booking
**Solution:** 
- Check apakah data disimpan ke database
- Verify format `passengers_data` JSON
- Check console log: "📍 Loaded occupied seats from database"

### Problem: Semua kursi available padahal ada booking
**Solution:**
- Check filter query (trainName, class, date, time harus exact match)
- Verify payment_status = 'pending' atau 'paid'
- Check console error di browser

### Problem: Loading terus-menerus
**Solution:**
- Check koneksi database Supabase
- Verify Supabase credentials di `.env`
- Check network tab di browser DevTools

---

## Kontak
Jika ada pertanyaan atau issue, silakan check:
- Console log browser (F12)
- Network tab untuk request ke Supabase
- Database logs di Supabase dashboard
