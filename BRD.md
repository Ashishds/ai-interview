# Business Requirements Document (BRD)
## AI Interviewer & Skill Assessment Platform (Video + Voice)

### 1. Executive Summary
The AI Interviewer & Skill Assessment Platform is an end-to-end automated recruitment system designed to streamline the hiring process. It handles candidate onboarding, resume parsing, job matching, interview scheduling, and conducts multi-round video and voice interviews using AI. The system evaluates candidates across behavioral, technical, and core skills, and can even negotiate salaries.

### 2. Objectives
- Automate the initial screening and interview process.
- Reduce human bias and save time for HR and technical teams.
- Provide a seamless and interactive candidate experience using real-time voice and video AI.
- Generate comprehensive assessment reports for each candidate.

### 3. User Personas
- **Candidate:** Applies for jobs, uploads resume, schedules interviews, and participates in AI-driven interviews.
- **Recruiter/Admin:** Creates job postings, reviews AI assessments, and makes final hiring decisions.

### 4. Functional Requirements

#### 4.1. Candidate Onboarding & Resume Parsing
- The system must provide a portal for candidates to apply for specific jobs.
- Candidates must input basic details (Name, Email, Phone).
- Candidates must upload their resume.
- **AI Resume Parsing:** The system must parse the resume to extract skills, experience, and education.
- **JD Matching:** The system must compare the extracted data against the Job Description (JD).
- **Automated Invites:** If the match score meets the threshold, the system automatically emails an interview invite.

#### 4.2. Interview Scheduling
- The system must provide a calendar interface for the candidate to select an interview slot.
- The system must send calendar invites and reminders.

#### 4.3. AI Video/Voice Interview
- **Real-time Interaction:** The system must use a speech-to-speech API to conduct a conversational interview.
- **Dynamic Questioning:** The AI must generate questions based on the candidate's parsed resume and the specific JD.
- **Multi-Round Structure:**
  - Round 1: Introduction & Background
  - Round 2: Core Skills & Technical Assessment
  - Round 3: Behavioral & HR (including salary negotiation)

#### 4.4. Assessment & Reporting
- The system must evaluate the candidate's responses in real-time.
- The system must generate a detailed scorecard post-interview covering:
  - Behavioral Score
  - Technical Score
  - Core Skills Score
  - Overall Feedback
- The system must save these reports for recruiter review.

### 5. Non-Functional Requirements
- **Scalability:** Must handle multiple concurrent interviews.
- **Low Latency:** Speech-to-speech interaction must have minimal delay to simulate a real conversation.
- **Security & Privacy:** Resume data and interview recordings/transcripts must be securely stored and comply with data privacy regulations.

### 6. Technology Stack & Architecture

#### 6.1. Frontend
- **Framework:** Next.js (React)
- **Styling:** Tailwind CSS
- **Language:** TypeScript
- **Features:** WebRTC for video/audio capture, candidate dashboard, recruiter dashboard.

#### 6.2. Backend
- **Framework:** Python with FastAPI
- **Architecture:** Modular architecture (routers, services, core config, schemas) for best practices.
- **Real-time Communication:** WebSockets for real-time audio streaming to the AI model.

#### 6.3. Database & Authentication
- **Provider:** Supabase (PostgreSQL)
- **Features:** Relational data storage, user authentication (Candidate & Recruiter).

#### 6.4. AI & Machine Learning
- **LLMs:** OpenAI (GPT-4) for resume parsing, question generation, and assessment.
- **Voice/Speech:** Real-time speech-to-speech APIs (e.g., OpenAI Realtime API or Whisper + TTS).

#### 6.5. Infrastructure & Hosting
- **Cloud Provider:** AWS
- **Caching:** Redis (for session management and fast data retrieval).
- **Deployment:** Dockerized containers, managed via ECS or EKS.

### 7. Project Skeleton Structure

```text
aiinterview/
├── frontend/                # Next.js + Tailwind + TypeScript
│   ├── src/
│   │   ├── app/             # Next.js App Router (pages)
│   │   ├── components/      # Reusable UI components
│   │   ├── hooks/           # Custom React hooks (e.g., WebRTC)
│   │   ├── services/        # API client calls
│   │   └── types/           # TypeScript interfaces
│   ├── package.json
│   └── tailwind.config.ts
├── backend/                 # Python FastAPI
│   ├── app/
│   │   ├── api/             # API Routers (endpoints)
│   │   │   └── endpoints/   # jobs.py, applications.py, interviews.py
│   │   ├── core/            # Configuration (settings.py, security.py)
│   │   ├── db/              # Database connections (supabase.py)
│   │   ├── models/          # ORM models (if applicable)
│   │   ├── schemas/         # Pydantic models for validation
│   │   └── services/        # Business logic (ai_service.py, matching.py)
│   ├── main.py              # FastAPI application entry point
│   ├── requirements.txt
│   └── .env.example
├── infra/                   # Infrastructure as Code (Terraform/AWS CDk)
└── BRD.md                   # Business Requirements Document
```

### 8. Next Steps
1. **Frontend Setup:** Initialize the Next.js project and build the onboarding forms.
2. **Backend Database Schema:** Create tables in Supabase for Jobs, Applications, and Assessments.
3. **AI Integration:** Implement the OpenAI Realtime API for the interview agent.
4. **WebRTC Integration:** Connect the Next.js frontend audio/video streams to the FastAPI WebSocket backend.
