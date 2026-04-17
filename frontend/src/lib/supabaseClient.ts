import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Singleton Supabase browser client
export const supabase = createClientComponentClient()

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          role: 'candidate' | 'recruiter' | 'admin'
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      jobs: {
        Row: {
          id: string
          title: string
          description: string
          requirements: string[]
          location: string
          job_type: string
          salary_min: number
          salary_max: number
          department: string | null
          experience_min: number
          experience_max: number | null
          status: 'draft' | 'active' | 'paused' | 'closed' | 'archived'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['jobs']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['jobs']['Insert']>
      }
      applications: {
        Row: {
          id: string
          job_id: string
          candidate_id: string
          candidate_email: string
          resume_url: string | null
          parsed_data: Record<string, unknown> | null
          match_score: number | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['applications']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['applications']['Insert']>
      }
      interviews: {
        Row: {
          id: string
          application_id: string
          scheduled_at: string | null
          started_at: string | null
          ended_at: string | null
          status: string
          unique_link: string | null
          unique_token: string | null
          transcript: unknown[]
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['interviews']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['interviews']['Insert']>
      }
      assessments: {
        Row: {
          id: string
          interview_id: string
          technical_score: number
          behavioral_score: number
          communication_score: number
          cultural_fit_score: number
          overall_score: number
          expected_salary: number | null
          negotiated_salary: number | null
          verdict: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire' | null
          verdict_reasoning: string | null
          key_strengths: string[]
          areas_of_improvement: string[]
          round_summaries: unknown[]
          detailed_report: Record<string, unknown>
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['assessments']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['assessments']['Insert']>
      }
    }
  }
}
