-- BRD §2.6 — extend existing Supabase/Postgres for full scorecard + AI Shield logs.
-- Run once in SQL Editor if you created the DB from an older reset script.

-- Application lifecycle: allow "interviewed" after interview + assessment
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_status_check
  CHECK (status IN (
    'applied', 'screening', 'invited', 'scheduled', 'interviewing',
    'interviewed', 'offered', 'rejected'
  ));

ALTER TABLE public.interviews
  ADD COLUMN IF NOT EXISTS proctoring_logs JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS communication_score DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS cultural_fit_score DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS problem_solving_score DOUBLE PRECISION DEFAULT 0;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS verdict_reasoning TEXT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS expected_salary INTEGER;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS negotiated_salary INTEGER;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS key_strengths JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS areas_of_improvement JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS round_summaries JSONB DEFAULT '[]'::jsonb;
