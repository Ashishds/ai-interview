import asyncio
import os
import sys

# Add backend to sys.path
sys.path.append(os.getcwd())

async def diag():
    print("--- Environment Check ---")
    print(f"Python Version: {sys.version}")
    
    from app.core.config import settings
    print(f"SUPABASE_URL: {settings.SUPABASE_URL}")
    print(f"API PORT: {settings.PORT if hasattr(settings, 'PORT') else 'Not Set'}")
    
    from app.core.database import get_supabase, get_redis
    print("\n--- Connecting to Supabase ---")
    try:
        sb = get_supabase()
        print("Supabase client created")
    except Exception as e:
        print(f"Supabase error: {e}")

    print("\n--- Connecting to Redis ---")
    try:
        rd = await get_redis()
        if rd:
            print("Redis client created and pinged")
        else:
            print("Redis client is None (expected fallback)")
    except Exception as e:
        print(f"Redis error: {e}")

    print("\n--- Diagnostic Finished ---")

if __name__ == "__main__":
    asyncio.run(diag())
