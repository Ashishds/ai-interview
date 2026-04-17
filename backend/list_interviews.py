try:
    from app.core.database import get_supabase
    import asyncio

    async def check():
        supabase = get_supabase()
        res = supabase.table('applications').select('*').order('created_at', desc=True).limit(5).execute()
        for row in res.data:
            print(f"Row: {row}")

    if __name__ == "__main__":
        asyncio.run(check())
except Exception as e:
    print(f"ERROR: {e}")
