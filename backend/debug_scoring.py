import asyncio
from app.core.database import get_supabase
from app.services.resume_parser import resume_parser
from app.services.matching_engine import get_matching_engine
from app.schemas.schemas import ParsedResumeData

async def debug_score():
    supabase = get_supabase()
    # Get the most recent app with score 0
    res = supabase.table("applications").select("id, job_id, resume_url, candidate_id").eq("ai_score", 0).order("created_at", desc=True).limit(1).execute()
    
    if not res.data:
        print("No 0-score apps found.")
        return
    
    app = res.data[0]
    print(f"Debugging App: {app['id']} for Job: {app['job_id']}")
    
    # Get job details
    job = supabase.table("jobs").select("*").eq("id", app['job_id']).single().execute()
    jd = job.data
    print(f"Job: {jd['title']}")
    
    # We need resume text. Since we can't easily download from S3 here without credentials, 
    # let's try to get it from the parsed_data if it exists, or just use a dummy text for logic testing.
    # Actually, let's just test the ENGINE logic with provided data.
    
    engine = get_matching_engine()
    
    dummy_resume = ParsedResumeData(
        name="Test",
        skills=["python", "react", "fastapi"],
        total_years_experience=5,
        summary="Experienced developer",
        education=[{"institution": "IIT", "degree": "BTech"}]
    )
    
    print("\n--- Running Engine Test (Manual) ---")
    score = await engine.compute_match_score(
        parsed_resume=dummy_resume,
        job_id=jd['id'],
        job_description=jd['description'],
        required_skills=jd['requirements'] or [],
        min_experience=jd['experience_min'] or 0
    )
    print(f"\nFinal Calculated Score: {score}")

if __name__ == "__main__":
    asyncio.run(debug_score())
