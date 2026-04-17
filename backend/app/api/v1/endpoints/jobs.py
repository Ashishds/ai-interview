"""Jobs API — Create, list, update job postings with JD embedding generation."""
import uuid
import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from openai import AsyncOpenAI

from app.core.config import settings
from app.core.database import get_supabase, get_redis
from app.schemas.schemas import JobCreate, JobResponse, JDGenerationRequest, JDGenerationResponse
from app.api.v1.endpoints.auth import get_current_user, get_current_user_optional

router = APIRouter()
openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)


async def generate_jd_embedding(job: JobCreate) -> list[float]:
    """Generate vector embedding for JD semantic matching."""
    jd_text = f"""
    Job Title: {job.title}
    Department: {job.department or ''}
    Description: {job.description}
    Requirements: {', '.join(job.requirements)}
    Experience Required: {job.experience_min}-{job.experience_max or '+'} years
    """
    try:
        response = await openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=jd_text.strip(),
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"DEBUG: OpenAI Exception in generate_jd_embedding: {str(e)}")
        # Fallback to zero vector so job creation doesn't hard-fail
        return [0.0] * 1536


@router.post("/", response_model=JobResponse, status_code=201)
async def create_job(
    data: JobCreate,
    current_user: dict = Depends(get_current_user),
):
    """Create a new job posting. Recruiter only."""
    print(f"DEBUG: Job creation attempt by {current_user['sub']} for title '{data.title}'")
    
    if current_user["role"] not in ("recruiter", "admin"):
        print(f"DEBUG: Permission denied for role {current_user['role']}")
        raise HTTPException(status_code=403, detail="Recruiter access required.")
    
    supabase = get_supabase()
    
    try:
        # Generate JD embedding for semantic search
        print("DEBUG: Generating JD embedding via OpenAI...")
        embedding = await generate_jd_embedding(data)
        print("DEBUG: Embedding generation success")
    except Exception as e:
        print(f"DEBUG: Embedding generation ERROR: {str(e)}")
        # Graceful degradation fallback
        embedding = [0.0] * 1536
    # Map to database schema
    job_data = {
        "title": data.title,
        "description": data.description,
        "requirements": data.requirements,  # Database handles list/array now
        "department": data.department,
        "location": data.location,
        "type": data.job_type,
        "salary_min": data.salary_min,
        "salary_max": data.salary_max,
        "experience_min": data.experience_min,
        "experience_max": data.experience_max,
        "recruiter_id": current_user["sub"],
        "embedding": embedding,
        "is_active": data.is_active,
        "status": "active"
    }
    
    try:
        print("DEBUG: Inserting job into Supabase...")
        result = supabase.table("jobs").insert(job_data).execute()
        job_id = result.data[0]["id"]
        print(f"DEBUG: Job inserted successfully with ID: {job_id}")
    except Exception as e:
        print(f"DEBUG: Job insertion ERROR: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Database insertion failed: {str(e)}")
    
    # Optional: Cache in Redis if available
    try:
        redis_client = await get_redis()
        if redis_client:
            print("DEBUG: Caching JD in Redis...")
            await redis_client.setex(
                f"jd:embedding:{job_id}",
                settings.REDIS_TTL,
                json.dumps({
                    "description": data.description,
                    "requirements": data.requirements,
                    "requirements_embedding": embedding,
                }),
            )
    except Exception as e:
        print(f"DEBUG: Redis caching warning (non-fatal): {str(e)}")

    return result.data[0]


@router.post("/generate-jd", response_model=JDGenerationResponse)
async def generate_job_description(
    data: JDGenerationRequest,
    current_user: dict = Depends(get_current_user),
):
    """Generate a professional job description using AI."""
    if current_user["role"] not in ("recruiter", "admin"):
        raise HTTPException(status_code=403, detail="Recruiter access required.")

    prompt = f"""
    You are an expert HR and technical recruiter. Generate a professional and compelling job description based on the following details:
    
    Job Title: {data.title}
    Department: {data.department}
    Job Type: {data.job_type.replace('_', ' ').capitalize()}
    Location: {data.location}
    
    The job description should be structured exactly as follows:
    1. An introductory paragraph starting with "We are looking for an experienced [Title]..." explaining the core responsibility.
    2. A second paragraph about the ideal candidate, cross-functional collaboration, and being passionate about technology.
    3. A section labeled "Responsibilities:" (no stars or markdown) followed by 5-6 bullet points using the '•' character.
    
    Use the user's provided example format:
    "We are looking for an experienced {data.title} to join our {data.department} team. In this role, you will be responsible for [core responsibility]... 
    
    You will collaborate closely with cross-functional teams to deliver high-quality products on time. The ideal candidate is passionate about technology, has strong problem-solving skills, and thrives in a fast-paced environment.
    
    Responsibilities:
    • [Bullet 1]
    • [Bullet 2]
    ... "
    
    CRITICAL: Do NOT use markdown formatting like ** for bolding. Use plain text only.
    
    Make the content unique to the job title "{data.title}".
    Do NOT include any other headers or text.
    """

    try:
        response = await openai_client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a professional recruitment assistant."},
                {"role": "user", "content": prompt.strip()}
            ],
            temperature=0.7,
            max_tokens=600,
        )
        generated_jd = response.choices[0].message.content.strip()
        return JDGenerationResponse(description=generated_jd)
    except Exception as e:
        if "quota" in str(e).lower() or "429" in str(e):
            fallback_jd = f"We are looking for an experienced {data.title} to join our {data.department} team.\n\nYou will collaborate closely with cross-functional teams to deliver high-quality products. The ideal candidate is passionate about technology, has strong problem-solving skills, and thrives in a fast-paced environment.\n\nResponsibilities:\n• Develop and maintain highly reliable software\n• Collaborate with cross-functional engineering teams\n• Ensure code quality, architecture scalability, and system performance\n• Actively participate in design and code reviews\n\n(Note: This is a fallback template generated because the AI service has exceeded its quota limits.)"
            return JDGenerationResponse(description=fallback_jd)
        raise HTTPException(status_code=500, detail=f"AI JD Generation failed: {str(e)}")


@router.get("/", response_model=list[JobResponse])
async def list_jobs(
    is_active: Optional[bool] = Query(True),
    department: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(20, le=100),
    offset: int = 0,
    current_user: Optional[dict] = Depends(get_current_user_optional),
):
    """List all active job postings."""
    supabase = get_supabase()
    query = supabase.table("jobs").select("*")
    
    if current_user and current_user.get("role") == "recruiter":
        query = query.eq("recruiter_id", current_user["sub"])

    if is_active is not None:
        query = query.eq("is_active", is_active)
    
    # Also exclude archived jobs by default if we haven't explicitly asked for them
    query = query.neq("status", "archived")
    
    result = query.range(offset, offset + limit - 1).order("created_at", desc=True).execute()
    
    # ── Fetch app counts ──
    try:
        # We need stats per job id. We'll fetch applications for these jobs.
        job_ids = [j['id'] for j in result.data]
        if job_ids:
            apps_res = supabase.table("applications").select("job_id, status").in_("job_id", job_ids).execute()
            
            # Aggregate stats
            stats_map = {jid: {"applications_count": 0, "shortlisted_count": 0, "interviewed_count": 0} for jid in job_ids}
            for app in apps_res.data:
                jid = app["job_id"]
                st = app.get("status")
                
                stats_map[jid]["applications_count"] += 1
                
                if st in ("invited", "scheduled", "interviewing", "interviewed", "offered", "hired"):
                    stats_map[jid]["shortlisted_count"] += 1
                if st in ("interviewed", "offered", "hired"):
                    stats_map[jid]["interviewed_count"] += 1
                    
            for j in result.data:
                jid = j["id"]
                j["applications_count"] = stats_map[jid]["applications_count"]
                j["shortlisted_count"] = stats_map[jid]["shortlisted_count"]
                j["interviewed_count"] = stats_map[jid]["interviewed_count"]
    except Exception as e:
        print(f"DEBUG: Failed to aggregate stats for jobs: {e}")
    
    # Map 'type' back to 'job_type' if frontend expects it, or just return as is
    return result.data


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    """Get single job details."""
    supabase = get_supabase()
    result = supabase.table("jobs").select("*").eq("id", job_id).single().execute()
    
    if not result.data:
        raise HTTPException(status_code=404, detail="Job not found.")
    
    return result.data


@router.patch("/{job_id}")
async def update_job(
    job_id: str,
    updates: dict,
    current_user: dict = Depends(get_current_user),
):
    """Update job status or details. Recruiter only."""
    if current_user["role"] not in ("recruiter", "admin"):
        raise HTTPException(status_code=403, detail="Recruiter access required.")
    
    supabase = get_supabase()
    
    # Only allow safe updates
    allowed_fields = {"status", "title", "description", "salary_min", "salary_max", "location", "is_active"}
    safe_updates = {k: v for k, v in updates.items() if k in allowed_fields}
    
    result = supabase.table("jobs").update(safe_updates).eq("id", job_id).execute()
    return result.data[0]


@router.delete("/{job_id}", status_code=204)
async def delete_job(job_id: str, current_user: dict = Depends(get_current_user)):
    """Soft-delete (archive) a job. Recruiter only."""
    if current_user["role"] not in ("recruiter", "admin"):
        raise HTTPException(status_code=403, detail="Recruiter access required.")
    
    supabase = get_supabase()
    supabase.table("jobs").update({
        "status": "archived",
        "is_active": False
    }).eq("id", job_id).execute()


@router.get("/{job_id}/candidates")
async def get_job_candidates(
    job_id: str,
    current_user: dict = Depends(get_current_user),
    min_score: float = Query(0.0),
):
    """Get ranked candidate list for a job. Recruiter only."""
    if current_user["role"] not in ("recruiter", "admin"):
        raise HTTPException(status_code=403, detail="Recruiter access required.")
    
    supabase = get_supabase()
    result = (
        supabase.table("applications")
        .select("*, users(name, email, phone)")
        .eq("job_id", job_id)
        .gte("ai_score", min_score)
        .order("ai_score", desc=True)
        .execute()
    )
    return result.data


@router.post("/recommendations")
async def get_job_recommendations(
    candidate_profile: str = Query(...),
    limit: int = 10,
    current_user: dict = Depends(get_current_user),
):
    """
    Candidate Recommendation Engine.
    Generates embedding for candidate profile and uses Supabase vector search.
    """
    supabase = get_supabase()
    
    # 1. Generate embedding for the candidate's request/profile
    try:
        response = await openai_client.embeddings.create(
            model="text-embedding-3-small",
            input=candidate_profile.strip(),
        )
        embedding = response.data[0].embedding
    except Exception as e:
        print(f"DEBUG: Candidate Recommendation embedding failed: {e}")
        embedding = [0.0] * 1536
    
    # 2. Call Supabase RPC function 'match_jobs'
    result = supabase.rpc(
        "match_jobs",
        {
            "query_embedding": embedding,
            "match_threshold": 0.5,
            "match_count": limit,
        }
    ).execute()
    
    return result.data
