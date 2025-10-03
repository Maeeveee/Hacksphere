import json
from datetime import datetime
from langchain_core.tools import tool
from pydantic import BaseModel, Field, AliasChoices 

class ScheduleInput(BaseModel):
    origin: str = Field(validation_alias=AliasChoices('origin', 'stasiun_asal', 'station_origin'))
    destination: str = Field(validation_alias=AliasChoices('destination', 'stasiun_tujuan', 'station_destination'))
    departureDate: str = Field(validation_alias=AliasChoices('departureDate', 'departure_date', 'date_of_departure', 'tanggal_keberangkatan'))

@tool
def get_train_schedule(tool_input: str) -> str:
    """
    Gunakan tool ini untuk mencari jadwal kereta api. 
    Input untuk tool ini HARUS berupa string JSON yang valid dengan kunci: 'origin', 'destination', dan 'departureDate'.
    """
    try:
        # Langkah pembersihan otomatis
        cleaned_input = tool_input.strip()
        if (cleaned_input.startswith("'") and cleaned_input.endswith("'")) or \
           (cleaned_input.startswith('"') and cleaned_input.endswith('"')):
            cleaned_input = cleaned_input[1:-1]
        
        args = ScheduleInput.model_validate_json(cleaned_input)

        origin_station = args.origin
        destination_station = args.destination
        departure_date_str = args.departureDate

        # ==========================================================
        # LOGIKA BARU: PARSING TANGGAL YANG LEBIH PINTAR
        # ==========================================================
        search_date = ""
        # 1. Coba format natural (contoh: 31 Oktober 2025)
        try:
            import locale
            try:
                locale.setlocale(locale.LC_TIME, 'id_ID.UTF-8')
            except locale.Error:
                locale.setlocale(locale.LC_TIME, 'Indonesian_Indonesia.1252')
            
            dt_object = datetime.strptime(departure_date_str, '%d %B %Y')
            search_date = dt_object.strftime('%Y-%m-%d')
        except ValueError:
            # 2. Jika gagal, coba format DD-MM-YYYY
            try:
                dt_object = datetime.strptime(departure_date_str, '%d-%m-%Y')
                search_date = dt_object.strftime('%Y-%m-%d')
            except ValueError:
                # 3. Jika masih gagal, asumsikan formatnya sudah YYYY-MM-DD
                search_date = departure_date_str
        # ==========================================================
            
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
        return f"Terjadi kesalahan saat memproses permintaan Anda. Error: {str(e)}"