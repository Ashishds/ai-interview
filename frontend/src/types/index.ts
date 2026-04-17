// ─── Common ──────────────────────────────────────────────────

export type UserRole = 'candidate' | 'recruiter' | 'admin'

export type ApplicationStatus =
  | 'applied' | 'screening' | 'invited' | 'scheduled'
  | 'interviewed' | 'shortlisted' | 'rejected' | 'offer_sent' | 'hired'

export type InterviewStatus =
  | 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'

export type InterviewRound = 'intro' | 'technical' | 'behavioral' | 'salary'

export type HireVerdict = 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire'

// ─── User ─────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  avatarUrl?: string
  company?: string
  createdAt: string
}

// ─── Job ─────────────────────────────────────────────────────

export interface Job {
  id: string
  title: string
  description: string
  requirements: string[]
  location: string
  jobType: 'full_time' | 'part_time' | 'contract' | 'internship'
  salaryMin: number
  salaryMax: number
  department?: string
  experienceMin: number
  experienceMax?: number
  status: 'draft' | 'active' | 'paused' | 'closed' | 'archived'
  applicationsCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ─── Application ─────────────────────────────────────────────

export interface ParsedResume {
  name: string
  email?: string
  phone?: string
  skills: string[]
  experience: {
    company: string
    title: string
    startDate: string
    endDate: string
    description: string
  }[]
  education: {
    institution: string
    degree: string
    field: string
    year: string
  }[]
  certifications: string[]
  totalYearsExperience: number
  summary?: string
}

export interface Application {
  id: string
  jobId: string
  candidateId: string
  candidateEmail: string
  resumeUrl?: string
  parsedData?: ParsedResume
  matchScore?: number
  status: ApplicationStatus
  createdAt: string
}

// ─── Interview ────────────────────────────────────────────────

export interface Interview {
  id: string
  applicationId: string
  scheduledAt?: string
  startedAt?: string
  endedAt?: string
  status: InterviewStatus
  uniqueLink?: string
  transcript: TranscriptTurn[]
  createdAt: string
}

export interface TranscriptTurn {
  speaker: 'ai' | 'candidate'
  text: string
  timestamp: string
  round: InterviewRound
}

// ─── Assessment ───────────────────────────────────────────────

export interface RoundScore {
  round: InterviewRound
  score: number
  durationSeconds: number
  highlights: string[]
  areasOfConcern: string[]
}

export interface Assessment {
  id: string
  interviewId: string
  technicalScore: number
  behavioralScore: number
  communicationScore: number
  culturalFitScore: number
  overallScore: number
  expectedSalary?: number
  negotiatedSalary?: number
  verdict: HireVerdict
  verdictReasoning: string
  keyStrengths: string[]
  areasOfImprovement: string[]
  roundSummaries: RoundScore[]
  detailedReport: Record<string, unknown>
  createdAt: string
}

// ─── API Responses ────────────────────────────────────────────

export interface TokenResponse {
  accessToken: string
  tokenType: string
  user: User
}

export interface ApplyResponse {
  applicationId: string
  matchScore: number
  status: ApplicationStatus
  message: string
  interviewInvited: boolean
}

export interface TimeSlot {
  slotId: string
  startTime: string
  endTime: string
  available: boolean
}

export interface ScheduleResponse {
  interviewId: string
  scheduledAt: string
  uniqueLink: string
  calendarInviteSent: boolean
}

// ─── WebSocket Messages ───────────────────────────────────────

export interface WSMessage {
  type: 'ai_response' | 'scores_update' | 'round_change' | 'interview_ended' | 'error' | 'pong'
  data: Record<string, unknown>
}

export interface LiveScores {
  technical: number
  communication: number
  confidence: number
}
