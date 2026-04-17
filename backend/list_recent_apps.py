import asyncio
from app.core.database import get_supabase

async def list_recent_apps():
    supabase = get_supabase()
    result = supabase.table("applications").select("id, status, ai_score, candidate_id, created_at").order("created_at", desc=True).limit(5).execute()
    
    print("Recent Applications:")
    for row in result.data:
        # Get candidate email
        user = supabase.table("users").select("email").eq("id", row["candidate_id"]).execute()
        email = user.data[0]["email"] if user.data else "Unknown"
        print(f"App: {row['id']} | Email: {email} | Status: {row['status']} | Score: {row['ai_score']} | Time: {row['created_at']}")

if __name__ == "__main__":
    asyncio.run(list_recent_apps())
