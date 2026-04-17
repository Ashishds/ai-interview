import uuid
from app.core.database import get_supabase
from datetime import datetime

def insert_mock_assessment():
    sb = get_supabase()
    
    # Get the last interview
    interviews_res = sb.table('interviews').select('*').limit(1).execute()
    if not interviews_res.data:
        print("No interviews found. Please create an application and interview first.")
        return
        
    interview = interviews_res.data[0]
    
    # Check if an assessment already exists
    existing = sb.table('assessments').select('id').eq('interview_id', interview['id']).execute()
    if existing.data:
        print("Assessment already exists.")
        return
        
    # Mock data
    mock_data = {
        "id": str(uuid.uuid4()),
        "interview_id": interview["id"],
        "overall_score": 92.5,
        "detailed_report": {
            "technical_skills_score": 95,
            "communication_score": 88,
            "problem_solving_score": 93,
            "cultural_fit_score": 90,
            "strengths": ["Excellent Python knowledge", "Clear communication", "Problem-solving"],
            "areas_for_improvement": ["Could provide more structure in system design"],
            "security_report": {
                "overall_risk": "low",
                "final_security_verdict": "clear",
                "integrity_score": 100,
                "tab_switches_count": 0,
                "flags": []
            }
        },
        "created_at": datetime.utcnow().isoformat()
    }
    
    res = sb.table('assessments').insert(mock_data).execute()
    print("Successfully inserted mock assessment:", res.data[0]['id'])

if __name__ == "__main__":
    insert_mock_assessment()
