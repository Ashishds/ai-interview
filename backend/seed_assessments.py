import uuid
from app.core.database import get_supabase
from datetime import datetime, timedelta

def seed_db():
    sb = get_supabase()
    
    candidates = [
        {"name": "Arjun Mehta", "email": "arjun@email.com", "role": "Senior React Developer", "score": 91},
        {"name": "Deepika Rao", "email": "deepika@email.com", "role": "ML Engineer", "score": 88},
        {"name": "Neha Patel", "email": "neha@email.com", "role": "Product Manager", "score": 95},
        {"name": "Rohit Kumar", "email": "rohit@email.com", "role": "DevOps Engineer", "score": 67},
        {"name": "Sonam Gupta", "email": "sonam@email.com", "role": "UX Designer", "score": 89},
    ]
    
    admin = sb.table("users").select("id").eq("role", "recruiter").execute()
    admin_id = admin.data[0]['id'] if admin.data else None
    if not admin_id:
        admin_id = str(uuid.uuid4())
        sb.table("users").upsert({"id": admin_id, "email": "admin@hireai.local", "name": "Admin", "role": "recruiter"}).execute()

    for c in candidates:
        # Create Job
        job_id = str(uuid.uuid4())
        job_res = sb.table("jobs").upsert({
            "id": job_id,
            "recruiter_id": admin_id,
            "title": c["role"],
            "description": f"Role for {c['role']}",
            "requirements": ["Skill A", "Skill B"],
            "is_active": True
        }).execute()
        
        # Create User
        user_res = sb.table("users").select("id").eq("email", c["email"]).execute()
        if user_res.data:
            user_id = user_res.data[0]["id"]
        else:
            user_id = str(uuid.uuid4())
            sb.table("users").upsert({
                "id": user_id,
                "email": c["email"],
                "role": "candidate"
            }).execute()
        
        sb.table("profiles").upsert({
            "id": user_id,
            "full_name": c["name"],
        }).execute()
        
        # Create Application
        app_id = str(uuid.uuid4())
        sb.table("applications").upsert({
            "id": app_id,
            "job_id": job_id,
            "candidate_id": user_id,
            "status": "applied",
            "ai_score": c["score"] / 100
        }).execute()
        
        # Create Interview
        interview_id = str(uuid.uuid4())
        sb.table("interviews").upsert({
            "id": interview_id,
            "application_id": app_id,
            "status": "completed",
            "scheduled_at": (datetime.utcnow() - timedelta(days=1)).isoformat()
        }).execute()
        
        # Create Assessment
        integrity_score = 100 if c["score"] > 70 else 60
        security_verdict = 'clear' if integrity_score > 80 else 'flagged'
        assessment_id = str(uuid.uuid4())
        
        sb.table("assessments").upsert({
            "id": assessment_id,
            "interview_id": interview_id,
            "overall_score": c["score"],
            "detailed_report": {
                "technical_skills_score": c["score"],
                "communication_score": c["score"] - 2,
                "problem_solving_score": c["score"] + 1,
                "cultural_fit_score": 90,
                "strengths": ["Excellent knowledge", "Good communication"],
                "areas_for_improvement": ["Can improve documentation"],
                "security_report": {
                    "overall_risk": "low" if security_verdict == 'clear' else 'high',
                    "final_security_verdict": security_verdict,
                    "integrity_score": integrity_score,
                    "tab_switches_count": 0 if security_verdict == 'clear' else 4,
                    "flags": [] if security_verdict == 'clear' else ["Multiple tab switches detected"]
                }
            },
            "created_at": (datetime.utcnow() - timedelta(hours=2)).isoformat()
        }).execute()

    print("Seeded successfully!")

if __name__ == "__main__":
    seed_db()
