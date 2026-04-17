import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_KEY")
supabase = create_client(url, key)

response = supabase.table("applications").select("*").order("created_at", desc=True).limit(5).execute()
for app in response.data:
    print(f"ID: {app['id']}, Candidate: {app['candidate_name']}, Status: {app['status']}, Score: {app.get('match_score')}")
