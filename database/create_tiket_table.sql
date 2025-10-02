-- SQL script untuk membuat tabel tiket di Supabase
-- Jalankan script ini di Supabase SQL Editor

CREATE TABLE IF NOT EXISTS tiket (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_code VARCHAR(20) UNIQUE NOT NULL,
    
    -- Data Kereta
    train_id VARCHAR(50),
    train_name VARCHAR(100) NOT NULL,
    train_number VARCHAR(20) NOT NULL,
    train_class VARCHAR(20) NOT NULL,
    
    -- Rute & Jadwal
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    departure_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    duration VARCHAR(20),
    
    -- Data Pemesan
    booker_name VARCHAR(100) NOT NULL,
    booker_gender VARCHAR(10) NOT NULL,
    booker_identity_type VARCHAR(20) NOT NULL,
    booker_identity_number VARCHAR(50) NOT NULL,
    booker_phone VARCHAR(20) NOT NULL,
    booker_email VARCHAR(100) NOT NULL,
    booker_address TEXT,
    
    -- Data Penumpang (JSON untuk menyimpan array penumpang)
    passengers_data JSONB NOT NULL,
    passenger_count INTEGER NOT NULL,
    adult_count INTEGER NOT NULL,
    child_count INTEGER NOT NULL DEFAULT 0,
    
    -- Harga
    price_per_ticket DECIMAL(12,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    
    -- Status
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
    booking_status VARCHAR(20) DEFAULT 'active' CHECK (booking_status IN ('active', 'cancelled', 'completed')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    payment_code VARCHAR(50),
    payment_deadline TIMESTAMPTZ
);

-- Index untuk optimasi query
CREATE INDEX IF NOT EXISTS idx_tiket_booking_code ON tiket(booking_code);
CREATE INDEX IF NOT EXISTS idx_tiket_payment_status ON tiket(payment_status);
CREATE INDEX IF NOT EXISTS idx_tiket_booking_status ON tiket(booking_status);
CREATE INDEX IF NOT EXISTS idx_tiket_departure_date ON tiket(departure_date);
CREATE INDEX IF NOT EXISTS idx_tiket_booker_email ON tiket(booker_email);

-- Trigger untuk auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tiket_updated_at 
    BEFORE UPDATE ON tiket 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - opsional, sesuaikan dengan kebutuhan auth
-- ALTER TABLE tiket ENABLE ROW LEVEL SECURITY;

-- Contoh policy untuk RLS (uncomment jika diperlukan)
-- CREATE POLICY "Users can view their own tickets" ON tiket 
--     FOR SELECT USING (booker_email = auth.jwt() ->> 'email');

-- CREATE POLICY "Users can insert their own tickets" ON tiket 
--     FOR INSERT WITH CHECK (booker_email = auth.jwt() ->> 'email');