# Business Requirements Document (BRD) & System Architecture
**Project Name:** AI Interviewer & Skill Assessment Platform (Video + Voice)
**Role:** Chief Architect / Senior Developer
**Date:** March 2026

---

## 1. Executive Summary
The AI Interviewer & Skill Assessment Platform is an end-to-end automated recruitment solution designed to streamline the hiring process. The platform allows candidates to apply for jobs, automatically parses and screens their resumes against job descriptions, schedules interviews, and conducts multi-round video and voice interviews using AI. Post-interview, it provides comprehensive assessments on technical, behavioral, and core skills, and is even capable of handling salary negotiations. 

## 2. User Personas
1. **Candidate:** Applies for jobs, uploads resume, schedules interviews, and interacts with the AI interviewer.
2. **Recruiter/HR/Admin:** Creates job postings, defines Job Descriptions (JDs), reviews AI-generated assessments, and manages final hiring decisions.

## 3. Core Workflows
### 3.1 Candidate Onboarding & Screening
1. Candidate applies for a specific job posting.
2. Candidate provides basic details (Name, Email, Phone) and uploads a resume.
3. System parses the resume to extract skills, experience, and educational background.
4. System matches the extracted data against the Job Description.
5. If the match score meets the threshold, the system automatically sends an interview invite via email.

### 3.2 Scheduling
1. Candidate receives an email with a scheduling link.
2. Candidate selects an available time slot.
3. System confirms the slot and sends calendar invites with a unique interview link.

### 3.3 AI Interview Process (Video + Voice)
1. Candidate joins the interview link at the scheduled time.
2. AI Interviewer initiates a real-time voice and video conversation.
3. **Rounds:**
   - **Introduction Round:** Basic background, cultural fit.
   - **Technical Round:** Deep dive into core skills mentioned in the resume and required by the JD.
   - **HR/Behavioural Round:** Behavioral questions, scenario-based questions.
   - **Salary Negotiation:** AI discusses expectations and negotiates within predefined HR limits.

### 3.4 Assessment & Reporting
1. System evaluates the candidate's responses in real-time.
2. Generates a detailed scorecard covering:
   - Behavioral traits
   - Technical proficiency
   - Core skills
3. Recruiter views the comprehensive report on the dashboard.

---

## 4. Technical Stack
- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Backend:** Python (FastAPI/Django/Flask - *FastAPI recommended for async AI streaming*)
- **Database:** Supabase (PostgreSQL, Auth, Storage)
- **AI/LLM:** OpenAI LLMs (GPT-4o), Real-time Speech-to-Speech API (OpenAI Realtime API or WebRTC based integrations)
- **Infrastructure:** AWS (EC2/EKS, S3, CloudFront, ElastiCache for caching)
- **Caching:** Redis (AWS ElastiCache)

---

## 5. System Architecture
### 5.1 High-Level Architecture
1. **Client Layer (Next.js):** Handles user interfaces for candidates and recruiters. Manages WebRTC connections for video/audio streaming.
2. **API Gateway / Backend (Python FastAPI):** Acts as the central orchestrator. Handles business logic, database operations, and proxying requests to AI models.
3. **AI Engine:**
   - **Resume Parser:** LangChain + OpenAI for extracting structured JSON from PDFs.
   - **Matching Engine:** Vector embeddings (OpenAI) + Supabase pgvector for semantic matching of Resume vs JD.
   - **Interview Conductor:** OpenAI Realtime API (or Whisper + GPT-4o + TTS) for low-latency conversational AI.
4. **Data Layer (Supabase):** Relational data (users, jobs, interviews, assessments), Authentication, and Blob storage (Resumes, Interview Recordings).
5. **Infrastructure (AWS):** Dockerized backend deployed on ECS/EKS, Redis for session and rate-limit caching, S3 for backups.

### 5.2 Component Breakdown
- **User Service:** Auth, Profile management.
- **Job Service:** JD creation, requirement indexing.
- **Screening Service:** Resume parsing (PDF to Text), NLP extraction, Matching Algorithm.
- **Scheduling Service:** Calendar integration, Slot management, Email notifications (via AWS SES or SendGrid).
- **Interview Service:** WebRTC signaling, Real-time AI prompt injection based on current round, state management.
- **Assessment Service:** Post-interview transcript analysis, scoring, report generation.

---

## 6. Project Skeleton (Folder Structure)

```text
ai-interviewer-platform/
│
├── frontend/                  # Next.js Application
│   ├── src/
│   │   ├── app/               # Next.js App Router (Pages & Layouts)
│   │   │   ├── (auth)/        # Login / Register
│   │   │   ├── candidate/     # Candidate Dashboard, Application, Interview Room
│   │   │   └── recruiter/     # Recruiter Dashboard, Job Postings, Assessments
│   │   ├── components/        # Reusable UI components (Tailwind)
│   │   ├── hooks/             # Custom React hooks (WebRTC, Audio streaming)
│   │   ├── lib/               # Utility functions, Supabase client
│   │   ├── services/          # API call wrappers
│   │   └── types/             # TypeScript interfaces
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/                   # Python Backend (FastAPI recommended)
│   ├── app/
│   │   ├── api/               # API Routers / Endpoints
│   │   │   ├── v1/
│   │   │   │   ├── auth.py
│   │   │   │   ├── resume.py
│   │   │   │   ├── schedule.py
│   │   │   │   ├── interview.py
│   │   │   │   └── assessment.py
│   │   ├── core/              # Config, Security, DB Connections
│   │   ├── models/            # SQLAlchemy / Pydantic models
│   │   ├── services/          # Business Logic
│   │   │   ├── ai_service.py  # OpenAI integrations (Parsing, Realtime API)
│   │   │   ├── match_engine.py# Resume-JD matching logic
│   │   │   └── email_service.py
│   │   ├── utils/             # Helper functions
│   │   └── main.py            # FastAPI application entry point
│   ├── requirements.txt
│   └── Dockerfile
│
├── infra/                     # Infrastructure as Code (Terraform / AWS CDK)
│   ├── vpc.tf
│   ├── ecs.tf
│   ├── redis.tf
│   └── s3.tf
│
├── docs/                      # Documentation
│   └── architecture.md
│
├── .gitignore
├── docker-compose.yml         # Local development setup (Backend + Redis)
└── README.md
```

---

## 7. Key Technical Challenges & Solutions
1. **Latency in Voice Conversation:**
   - *Solution:* Use WebRTC for audio/video transmission. Utilize OpenAI's Realtime API to minimize the Speech-to-Text -> LLM -> Text-to-Speech loop latency.
2. **Dynamic Questioning:**
   - *Solution:* The AI prompt must dynamically update based on the round. The backend state machine tracks the current round (Intro -> Tech -> HR) and injects the candidate's parsed resume and previous answers into the system prompt.
3. **Accurate Resume Parsing:**
   - *Solution:* Use robust PDF text extraction combined with structured output parsing via LLMs (e.g., OpenAI JSON mode) to ensure consistent data schemas.
4. **Caching & Scalability:**
   - *Solution:* Use Redis to cache Job Descriptions, parsed Resumes for the duration of the interview, and active WebRTC session states. Deploy backend statelessly behind an AWS Application Load Balancer.

---

## 8. Best Practices to Follow
- **Code Quality:** Strict TypeScript typing on the frontend. Pydantic validation and type hinting in Python.
- **Security:** JWT based authentication via Supabase. PII data encryption. Secure handling of OpenAI API keys via AWS Secrets Manager.
- **Scalability:** Microservices or modular monolith architecture. Async processing for heavy tasks (e.g., generating final assessment reports) using Celery/Redis or AWS SQS.
- **Testing:** Unit tests (Pytest for Python, Jest for frontend), Integration tests for the AI conversational flow.
- **CI/CD:** GitHub Actions to build Docker images, run tests, and deploy to AWS.

---

## 9. Next Steps for Implementation
1. **Phase 1: Foundation & Onboarding**
   - Setup Supabase project (Auth, DB schema).
   - Build frontend job application flow.
   - Implement backend resume parsing and JD matching logic.
2. **Phase 2: Scheduling & Notifications**
   - Integrate email service.
   - Build calendar slot selection UI and backend logic.
3. **Phase 3: Core AI Interview Engine (The hardest part)**
   - Setup WebRTC / WebSocket infrastructure.
   - Integrate Speech-to-Speech API.
   - Design the prompt engineering state machine for different interview rounds.
4. **Phase 4: Assessment & Polish**
   - Generate post-interview reports using LLMs.
   - Build recruiter dashboards to view candidate scorecards.
   - Implement caching (Redis) and deploy to AWS.