import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

def get_schema():
    # Attempt to get table info via postgrest or just a dummy select
    try:
        # Get one record to see columns
        res = supabase.table("applications").select("*").limit(1).execute()
        print("Columns in applications:", res.data[0].keys() if res.data else "No records found")
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    get_schema()
