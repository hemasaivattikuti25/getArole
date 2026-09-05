-- ==============================================================================
-- getArole AI — Complete Production Supabase Schema
-- 
-- 🚀 QUICK FIX MIGRATION (Run this in Supabase Dashboard → SQL Editor → Run):
-- ------------------------------------------------------------------------------
-- 1. Ensure user_resumes has UNIQUE(firebase_uid) for clean upserts:
-- ALTER TABLE public.user_resumes DROP CONSTRAINT IF EXISTS user_resumes_firebase_uid_key;
-- ALTER TABLE public.user_resumes ADD CONSTRAINT user_resumes_firebase_uid_key UNIQUE (firebase_uid);
--
-- 2. Ensure RLS allows full client CRUD with anon publishable key:
-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_resumes ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Anon full access - user_profiles" ON public.user_profiles;
-- CREATE POLICY "Anon full access - user_profiles" ON public.user_profiles FOR ALL USING (true) WITH CHECK (true);
-- DROP POLICY IF EXISTS "Anon full access - user_preferences" ON public.user_preferences;
-- CREATE POLICY "Anon full access - user_preferences" ON public.user_preferences FOR ALL USING (true) WITH CHECK (true);
-- DROP POLICY IF EXISTS "Anon full access - user_resumes" ON public.user_resumes;
-- CREATE POLICY "Anon full access - user_resumes" ON public.user_resumes FOR ALL USING (true) WITH CHECK (true);
-- ==============================================================================

-- ─────────────────────────────────────────────────────────────
-- 0. Extensions
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────────────────────────
-- 1. jobs
-- All scraped jobs. Auto-refreshed every 30 minutes.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.jobs (
    id                  TEXT PRIMARY KEY,
    title               TEXT NOT NULL,
    company             TEXT NOT NULL,
    location            TEXT NOT NULL,
    city                TEXT DEFAULT 'India',
    platform            TEXT NOT NULL,
    url                 TEXT NOT NULL,
    workplace_type      TEXT DEFAULT 'Onsite',
    employment_type     TEXT DEFAULT 'Full-Time',
    stipend_or_salary   TEXT,
    stipend_amount_min  INTEGER,
    description         TEXT,
    skills              TEXT[],
    embedding           vector(384),
    is_deleted          BOOLEAN DEFAULT FALSE,
    last_seen_at        TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 2. candidates
-- Resume uploads from the recruiter screening tool.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.candidates (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                TEXT NOT NULL,
    email               TEXT,
    skills              TEXT[],
    experience_years    NUMERIC(4, 1) DEFAULT 0.0,
    education           TEXT,
    raw_resume_text     TEXT,
    resume_embedding    vector(384),
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 3. match_evaluations
-- AI screening scores per candidate per job (recruiter side).
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.match_evaluations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id        UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    job_id              TEXT REFERENCES public.jobs(id) ON DELETE CASCADE,
    fit_score_percent   NUMERIC(5, 2) NOT NULL,
    score_10            NUMERIC(3, 1) NOT NULL,
    verdict             TEXT NOT NULL,
    rubric_breakdown    JSONB,
    strengths           TEXT[],
    missing_skills      TEXT[],
    justification       TEXT,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 4. applications
-- Tracks a user's job application stages.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.applications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id        UUID REFERENCES public.candidates(id) ON DELETE CASCADE,
    job_id              TEXT REFERENCES public.jobs(id) ON DELETE CASCADE,
    status              TEXT NOT NULL DEFAULT 'saved',
    notes               TEXT,
    applied_at          TIMESTAMP WITH TIME ZONE,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 5. user_profiles
-- Every registered user's personal info, keyed by Firebase UID.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    firebase_uid    TEXT UNIQUE NOT NULL,
    email           TEXT,
    first           TEXT,
    last            TEXT,
    pref_name       TEXT,
    suffix          TEXT,
    phone           TEXT,
    dob             TEXT,
    loc             TEXT,
    add1            TEXT,
    add2            TEXT,
    add3            TEXT,
    zip             TEXT,
    headline        TEXT,
    linkedin_url    TEXT,
    github_url      TEXT,
    portfolio_url   TEXT,
    other_url       TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 6. user_preferences
-- Every user's job search preferences, keyed by Firebase UID.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    firebase_uid    TEXT UNIQUE NOT NULL,
    values          TEXT[],
    roles           TEXT[],
    locations       TEXT[],
    roletype        TEXT[],
    rolelevel       TEXT[],
    compsize        TEXT[],
    industries      TEXT[],
    skills_inc      TEXT[],
    salary_amt      INTEGER,
    salary_curr     TEXT DEFAULT 'INR',
    status          TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ─────────────────────────────────────────────────────────────
-- 7. user_resumes
-- Resume uploads + all parsed data per user (JSONB for flexibility).
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_resumes (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    firebase_uid    TEXT NOT NULL,
    is_default      BOOLEAN DEFAULT true,
    filename        TEXT,
    file_url        TEXT,
    uploaded_at     TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    work_experience JSONB DEFAULT '[]'::jsonb,
    education       JSONB DEFAULT '[]'::jsonb,
    projects        JSONB DEFAULT '[]'::jsonb,
    skills          TEXT[] DEFAULT '{}'::text[],
    languages       TEXT[],
    raw_text        TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT user_resumes_firebase_uid_key UNIQUE (firebase_uid)
);

-- For existing Supabase instances where user_resumes was created without the UNIQUE constraint:
-- ALTER TABLE public.user_resumes ADD CONSTRAINT user_resumes_firebase_uid_key UNIQUE (firebase_uid);

CREATE INDEX IF NOT EXISTS idx_jobs_workplace_loc   ON public.jobs (workplace_type, location);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at      ON public.jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_active          ON public.jobs (is_deleted) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_jobs_title_gin       ON public.jobs USING gin (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_jobs_embedding       ON public.jobs USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_user_profiles_uid    ON public.user_profiles(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_user_preferences_uid ON public.user_preferences(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_user_resumes_uid     ON public.user_resumes(firebase_uid);

-- ─────────────────────────────────────────────────────────────
-- 9. Row Level Security (Zero-Trust Least-Privilege Scoping)
-- 
-- ⚠️ ARCHITECTURAL NOTE ON FIREBASE AUTH vs SUPABASE RLS:
-- getArole authenticates users via Firebase Auth on the web client.
-- The client communicates with Supabase PostgREST using the public 'anon' key.
-- Supabase's built-in 'auth.uid()' is only populated if users sign in via Supabase Auth JWTs.
-- If you enforce 'auth.uid() = firebase_uid', client-side PostgREST calls with the anon key
-- will evaluate auth.uid() as NULL and fail with RLS errors.
--
-- For direct client-side PostgREST access with Firebase Auth, either:
--   A) Keep RLS disabled for user_profiles, user_preferences, and user_resumes (app queries isolate by firebase_uid), OR
--   B) Use the anon-permissive policies below, OR
--   C) Route all reads/writes through the FastAPI backend with the service_role key.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.jobs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications      ENABLE ROW LEVEL SECURITY;

-- 1. Jobs: Public read-only for active non-deleted jobs; write restricted to backend service_role
DROP POLICY IF EXISTS "Public read-only active jobs" ON public.jobs;
CREATE POLICY "Public read-only active jobs" ON public.jobs
  FOR SELECT USING (is_deleted = false);

DROP POLICY IF EXISTS "Service role full access - jobs" ON public.jobs;
CREATE POLICY "Service role full access - jobs" ON public.jobs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. Recruiter Candidate & Evaluation Tables: Restricted to backend service role
DROP POLICY IF EXISTS "Service role full access - candidates" ON public.candidates;
CREATE POLICY "Service role full access - candidates" ON public.candidates
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access - match evaluations" ON public.match_evaluations;
CREATE POLICY "Service role full access - match evaluations" ON public.match_evaluations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access - applications" ON public.applications;
CREATE POLICY "Service role full access - applications" ON public.applications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. User Data Tables (Profiles, Preferences, Resumes):
-- When using direct client PostgREST calls with the anon key, configure permissive access:
ALTER TABLE public.user_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_resumes      ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anon full access - user_profiles" ON public.user_profiles;
CREATE POLICY "Anon full access - user_profiles" ON public.user_profiles
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access - user_preferences" ON public.user_preferences;
CREATE POLICY "Anon full access - user_preferences" ON public.user_preferences
  FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anon full access - user_resumes" ON public.user_resumes;
CREATE POLICY "Anon full access - user_resumes" ON public.user_resumes
  FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 10. pgvector RPC — semantic job matching for resume uploads
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION match_jobs_for_resume (
  query_embedding vector(384),
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 50
)
RETURNS TABLE (
  id text, title text, company text, location text, city text,
  platform text, url text, workplace_type text, employment_type text,
  description text, similarity float
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    jobs.id, jobs.title, jobs.company, jobs.location, jobs.city,
    jobs.platform, jobs.url, jobs.workplace_type, jobs.employment_type,
    jobs.description,
    1 - (jobs.embedding <=> query_embedding) AS similarity
  FROM jobs
  WHERE 1 - (jobs.embedding <=> query_embedding) > match_threshold
  ORDER BY jobs.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 11. Auto-update updated_at trigger
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_jobs_updated              ON public.jobs;
DROP TRIGGER IF EXISTS trg_applications_updated      ON public.applications;
DROP TRIGGER IF EXISTS trg_user_profiles_updated     ON public.user_profiles;
DROP TRIGGER IF EXISTS trg_user_preferences_updated  ON public.user_preferences;
DROP TRIGGER IF EXISTS trg_user_resumes_updated      ON public.user_resumes;

CREATE TRIGGER trg_jobs_updated
  BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_applications_updated
  BEFORE UPDATE ON public.applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_user_profiles_updated
  BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_user_preferences_updated
  BEFORE UPDATE ON public.user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_user_resumes_updated
  BEFORE UPDATE ON public.user_resumes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
