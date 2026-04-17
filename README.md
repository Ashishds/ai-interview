# 🤖 HireAI — AI Interviewer & Skill Assessment Platform

> **Production-grade autonomous recruitment platform** powered by GPT-4o, OpenAI Realtime API, WebRTC, and Supabase. Automate your entire hiring pipeline from resume screening to multi-round AI video interviews.

---

## ✨ Features

| Feature | Tech |
|---|---|
| Resume Parsing & JD Matching | LangChain + GPT-4o + pgvector |
| Real-Time Voice AI Interviews | OpenAI Realtime API (Speech-to-Speech) |
| Video Streaming | WebRTC |
| Live Candidate Scoring | Real-time WebSocket analysis |
| Multi-Round Interview Engine | State Machine (Intro → Tech → HR → Salary) |
| Automated Email Invites | AWS SES |
| Comprehensive Scorecards | GPT-4o Post-Interview Analysis |
| Recruiter Dashboard | Next.js 14, Tailwind CSS |

---

## 🏗️ Architecture

```
Browser (Candidate)          Browser (Recruiter)
     │ WebRTC                      │ HTTPS
     ▼                             ▼
┌─────────────────────────────────────────────┐
│           Next.js Frontend (Vercel)          │
│   Candidate Portal | Recruiter Dashboard    │
└─────────────┬───────────────────────────────┘
              │ REST + WebSocket
              ▼
┌─────────────────────────────────────────────┐
│         FastAPI Backend (AWS ECS Fargate)    │
│  Auth | Jobs | Applications | Interviews    │
│  Resume Parser | Matching Engine | AI       │
└────┬─────────────────────────────┬──────────┘
     │                             │
     ▼                             ▼
┌──────────────┐         ┌─────────────────┐
│   Supabase   │         │  Redis (AWS     │
│  PostgreSQL  │         │  ElastiCache)   │
│  pgvector    │         │  Sessions/Cache │
│  Auth+Storage│         └─────────────────┘
└──────────────┘
     │
     ▼
┌──────────────────────────┐
│   OpenAI APIs            │
│  • GPT-4o (parsing,      │
│    assessment, matching) │
│  • Realtime API (voice)  │
│  • Embeddings (search)   │
└──────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- Supabase account (free tier works)
- OpenAI API key (GPT-4o access required)
- AWS account (for S3 + SES in production)

### 1. Clone and Setup

```bash
git clone https://github.com/your-org/ai-interviewer-platform.git
cd ai-interviewer-platform
```

### 2. Database Setup (Supabase)

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run:
   ```sql
   -- Run the full schema
   \i infra/supabase_schema.sql
   ```
3. Copy your `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` from Project Settings

### 3. Backend Setup

```bash
cd backend

# Copy and fill environment variables
cp .env.example .env
# Edit .env with your keys

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn app.main:app --reload --port 8000
```

Backend will be available at `http://localhost:8000/api/docs`

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy env
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:8000
# Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# Start development server
npm run dev
```

Frontend will be at `http://localhost:3000`

### 5. Full Stack with Docker

```bash
# From project root
docker-compose up
```

Services:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs
- Redis: localhost:6379

---

## 📁 Project Structure

```
ai-interviewer-platform/
├── frontend/                    # Next.js 14 App
│   ├── src/app/
│   │   ├── page.tsx             # Landing page
│   │   ├── auth/login/          # Login page
│   │   ├── auth/register/       # Registration
│   │   ├── candidate/
│   │   │   ├── apply/           # Job application form
│   │   │   ├── schedule/        # Interview slot booking
│   │   │   └── room/[id]/       # Live interview room
│   │   └── recruiter/
│   │       ├── page.tsx         # Dashboard
│   │       ├── jobs/            # Job management
│   │       ├── candidates/      # Candidate tracking
│   │       └── assessments/     # Scorecard viewer
│   ├── src/hooks/
│   │   ├── useWebRTC.ts         # Camera/mic management
│   │   └── useInterviewSocket.ts # WS interview connection
│   └── src/services/api.ts      # Backend API client
│
├── backend/                     # Python FastAPI
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── core/                # Config, DB, Auth
│   │   ├── api/v1/endpoints/    # REST + WebSocket routes
│   │   ├── services/
│   │   │   ├── resume_parser.py         # LangChain PDF parsing
│   │   │   ├── matching_engine.py       # pgvector JD matching
│   │   │   ├── ai_interviewer.py        # OpenAI Realtime orchestration
│   │   │   ├── assessment_generator.py  # Post-interview scoring
│   │   │   └── email_service.py         # AWS SES
│   │   └── schemas/schemas.py   # Pydantic models
│   ├── requirements.txt
│   └── Dockerfile
│
├── infra/
│   ├── supabase_schema.sql      # Full DB schema + RLS + pgvector
│   └── terraform/main.tf        # AWS ECS, ElastiCache, S3, ALB
│
└── docker-compose.yml           # Local dev stack
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `OPENAI_API_KEY` | OpenAI API key (GPT-4o required) |
| `REDIS_URL` | Redis connection URL |
| `AWS_ACCESS_KEY_ID` | AWS credentials (S3 + SES) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `SECRET_KEY` | JWT signing secret (use random 32+ chars) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend URL (http://localhost:8000) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |

---

## 🌐 Deployment

### Frontend → Vercel

```bash
cd frontend
vercel deploy --prod
```

Set environment variables in Vercel Dashboard.

### Backend → AWS ECS (Terraform)

```bash
cd infra/terraform

# Initialize
terraform init

# Review plan
terraform plan

# Deploy
terraform apply

# Build and push Docker image
cd ../../backend
aws ecr get-login-password | docker login --username AWS --password-stdin <ECR_URL>
docker build -t hireai-backend .
docker tag hireai-backend:latest <ECR_URL>:latest
docker push <ECR_URL>:latest

# Force ECS to deploy new image
aws ecs update-service --cluster hireai-cluster --service hireai-backend --force-new-deployment
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/ -v --asyncio-mode=auto

# Frontend type check
cd frontend
npm run type-check

# Frontend lint
npm run lint
```

---

## 📊 Interview Flow

```
Candidate applies → AI parses resume → JD matching score calculated
       ↓
   Score ≥ 75%?
       ↓ Yes
Email invite sent → Candidate books slot → Calendar invite sent
       ↓
Interview starts (WebRTC + OpenAI Realtime API)
       ↓
Round 1: Introduction (8 min)
Round 2: Technical Assessment (20 min) 
Round 3: Behavioural & HR (10 min)
Round 4: Salary Negotiation (5 min)
       ↓
AI generates comprehensive scorecard → Recruiter notified
```

---

## 🔒 Security

- JWT authentication (24h expiry)
- Supabase Row Level Security (RLS) on all tables
- AWS SSM for secrets (never in environment files in production)
- S3 bucket with server-side encryption + blocked public access
- Resume files stored with application-scoped paths
- WebSocket authentication via token query parameter
- PII data isolated per user in RLS policies

---

## 📝 License

MIT License — Free to use for commercial projects.

---

Built with ❤️ for modern HR teams. Powered by GPT-4o, OpenAI Realtime API, Next.js 14, and FastAPI.
L a s t   u p d a t e d :    
 