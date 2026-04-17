import asyncio
import os
import sys
from dotenv import load_dotenv

# Add backend to sys.path
sys.path.append(os.getcwd())
load_dotenv()

async def test_supabase_connection():
    print("--- Supabase Connection Test ---")
    
    from app.core.config import settings
    from supabase import create_client
    
    url = settings.SUPABASE_URL
    key = settings.SUPABASE_SERVICE_KEY
    
    print(f"URL: {url}")
    print(f"Key present: {bool(key)}")
    
    try:
        supabase = create_client(url, key)
        print("Executing test query on 'jobs' table...")
        # A simple query that should work if keys are valid
        response = supabase.table('jobs').select('id').limit(1).execute()
        
        print("SUCCESS: Connection points to a valid Supabase instance!")
        print(f"Response data: {response.data}")
    except Exception as e:
        print(f"FAILURE: Connection error occurred.")
        print(f"Error detail: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_supabase_connection())
