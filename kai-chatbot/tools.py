import json
from datetime import datetime
from langchain_core.tools import tool
from pydantic import BaseModel, Field

# Model Pydantic tetap kita gunakan sebagai cetakan data yang solid
class ScheduleInput(BaseModel):
    origin: str = Field(description="Nama stasiun keberangkatan")
    destination: str = Field(description="Nama stasiun tujuan")
    departure_date: str = Field(description="Tanggal keberangkatan dalam format YYYY-MM-DD")

@tool
def get_train_schedule(tool_input: str) -> str:
    """
    Gunakan tool ini untuk mencari jadwal kereta api. 
    Input untuk tool ini HARUS berupa string JSON yang valid dengan kunci: 'origin', 'destination', dan 'departure_date'.
    """
    try:
        # ==================================================================
        # LANGKAH KRUSIAL: Parsing string JSON secara manual menjadi objek Pydantic
        # ==================================================================
        args = ScheduleInput.model_validate_json(tool_input)

        # Setelah parsing berhasil, sisa kode berjalan seperti biasa
        origin_station = args.origin
        destination_station = args.destination
        departure_date_str = args.departure_date

        # Logika untuk mem-parsing tanggal natural (jika LLM memberikannya)
        try:
            import locale
            try:
                locale.setlocale(locale.LC_TIME, 'id_ID.UTF-8')
            except locale.Error:
                locale.setlocale(locale.LC_TIME, 'Indonesian_Indonesia.1252')
            
            dt_object = datetime.strptime(departure_date_str, '%d %B %Y')
            search_date = dt_object.strftime('%Y-%M-%d')
        except ValueError:
            # Jika gagal, asumsikan formatnya sudah YYYY-MM-DD
            search_date = departure_date_str
            
        print(f"🔎 Mencari jadwal: {origin_station} -> {destination_station} pada {search_date}")

        from supabase_client import supabase
        response = supabase.rpc('get_schedules_by_station_name', {
            'origin_name': origin_station,
            'destination_name': destination_station,
            'departure_date_filter': search_date
        }).execute()

        if not response.data:
            return f"Maaf, tidak ada jadwal kereta yang ditemukan dari {origin_station} ke {destination_station} pada tanggal {search_date}."

        schedule_list = response.data
        return json.dumps(schedule_list, indent=2, ensure_ascii=False)

    except Exception as e:
        print(f"Error pada tool get_train_schedule: {e}")
        return f"Terjadi kesalahan saat memproses permintaan Anda. Pastikan format input sudah benar. Error: {str(e)}"