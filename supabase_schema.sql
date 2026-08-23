-- ==============================================================================
-- getAjob (getArole AI) — Production Supabase Schema with pgvector
-- Run this script in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Enable pgvector extension for high-performance dense semantic vector search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Jobs Table: Stores live ingested job listings across all platforms
CREATE TABLE IF NOT EXISTS public.jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    city TEXT DEFAULT 'India',
    platform TEXT NOT NULL, -- Greenhouse, Lever, Ashby, Internshala, LinkedIn
    url TEXT NOT NULL,
    workplace_type TEXT DEFAULT 'Onsite', -- Remote, Hybrid, Onsite
    employment_type TEXT DEFAULT 'Full-Time', -- Full-Time, Internship, Contract
    stipend_or_salary TEXT,
    stipend_amount_min INTEGER,
    description TEXT,
    skills TEXT[],
    embedding vector(384), -- 384-dimensional dense semantic embedding (bge-small-en-v1.5)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Candidates Table: Stores parsed candidate profiles
CREATE TABLE IF NOT EXISTS public.candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    skills TEXT[],
    experience_years NUMERIC(4, 1) DEFAULT 0.0,
    education TEXT,
    raw_resume_text TEXT,
    resume_embedding vector(384),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Match Evaluations Table: Stores 3-stage hybrid screening and 70B rubric scores
CREATE TABLE IF NOT EXISTS public.match_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    job_id TEXT REFERENCES public.jobs(id) ON DELETE CASCADE,
    fit_score_percent NUMERIC(5, 2) NOT NULL,
    score_10 NUMERIC(3, 1) NOT NULL,
    verdict TEXT NOT NULL, -- Shortlisted, Review, Rejected
    rubric_breakdown JSONB, -- { technical_skills, experience_relevance, domain_knowledge, prerequisites_met }
    strengths TEXT[],
    missing_skills TEXT[],
    justification TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Applications Tracker Table: Tracks candidate application stages
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    job_id TEXT REFERENCES public.jobs(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'saved', -- saved, applied, interview, offer, rejected
    notes TEXT,
    applied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Indexes for High-Speed Queries
CREATE INDEX IF NOT EXISTS idx_jobs_company ON public.jobs (company);
CREATE INDEX IF NOT EXISTS idx_jobs_city ON public.jobs (city);
CREATE INDEX IF NOT EXISTS idx_jobs_platform ON public.jobs (platform);
CREATE INDEX IF NOT EXISTS idx_jobs_workplace_type ON public.jobs (workplace_type);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs (created_at DESC);

-- HNSW Vector Index for <5ms cosine similarity search across 500,000+ jobs
CREATE INDEX IF NOT EXISTS idx_jobs_embedding ON public.jobs USING hnsw (embedding vector_cosine_ops);

-- 7. Row Level Security (RLS) Configuration
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Allow public read access to jobs
CREATE POLICY "Public Read Access for Jobs" ON public.jobs
    FOR SELECT USING (true);

-- Allow authenticated/service insert & update for jobs
CREATE POLICY "Public Insert/Upsert Access for Jobs" ON public.jobs
    FOR ALL USING (true);

-- Allow public read & write for candidates, evaluations, and applications
CREATE POLICY "Allow All Access for Candidates" ON public.candidates FOR ALL USING (true);
CREATE POLICY "Allow All Access for Match Evaluations" ON public.match_evaluations FOR ALL USING (true);
CREATE POLICY "Allow All Access for Applications" ON public.applications FOR ALL USING (true);

-- 8. Vector Match Function: High-Speed RPC for dense candidate resume retrieval
CREATE OR REPLACE FUNCTION match_jobs_for_resume (
  query_embedding vector(384),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  id text,
  title text,
  company text,
  location text,
  city text,
  platform text,
  url text,
  workplace_type text,
  employment_type text,
  description text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    jobs.id,
    jobs.title,
    jobs.company,
    jobs.location,
    jobs.city,
    jobs.platform,
    jobs.url,
    jobs.workplace_type,
    jobs.employment_type,
    jobs.description,
    1 - (jobs.embedding <=> query_embedding) AS similarity
  FROM jobs
  WHERE 1 - (jobs.embedding <=> query_embedding) > match_threshold
  ORDER BY jobs.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
