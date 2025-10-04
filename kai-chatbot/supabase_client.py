import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Muat variabel dari file .env
load_dotenv()

# Ambil URL dan Kunci dari environment variables
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")

# Pastikan variabel ada
if not url or not key:
    raise ValueError("Pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY sudah diatur di file .env")

# Inisialisasi Supabase client
supabase: Client = create_client(url, key)

print("✅ Koneksi ke Supabase berhasil dibuat.")