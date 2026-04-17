from app.core.database import get_supabase

def check():
    sb = get_supabase()
    res = sb.table("assessments").select("id, interview_id").execute()
    print("Assessments:", res.data)
    
    interviews = sb.table("interviews").select("id, status").execute()
    print("Interviews:", interviews.data)

check()
