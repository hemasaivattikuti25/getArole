# 🏛️ getArole AI — System Design Document (SDD)
**Author:** getArole Core Engineering Team  
**System Version:** v1.1.0 (Next.js App Router + FastAPI + ONNX Local Embeddings + NVIDIA NIM Llama 3.1 70B)  
**Last Updated:** October 2026  
**Status:** Approved / Active Production Architecture  

---

## 📑 Table of Contents
1. [Executive Summary & Architectural Tenets](#1-executive-summary--architectural-tenets)
2. [High-Level System Context (C4 Context Diagram)](#2-high-level-system-context-c4-context-diagram)
3. [Container & Component Architecture (C4 Level 2 & 3)](#3-container--component-architecture-c4-level-2--3)
4. [Subsystem Deep Dives](#4-subsystem-deep-dives)
   - 4.1. Client Tier (Next.js 16 + React 19 + Tailwind v4)
   - 4.2. API Gateway & Application Server (FastAPI + Observability Middleware)
   - 4.3. Multi-Platform Scraper Aggregation & Ingestion Engine
   - 4.4. Zero-Cost Semantic Vector Matching Engine (ONNX FastEmbed)
   - 4.5. Multi-Stage AI Talent Screener (NVIDIA NIM Llama 3.1 70B)
   - 4.6. Persistence, Caching & Vector Store (Supabase + pgvector)
5. [UML Sequence Diagrams](#5-uml-sequence-diagrams)
   - Sequence 1: End-to-End Job Discovery & Multi-Tier Fallback Flow
   - Sequence 2: Resume Ingestion & Local Semantic Vector Matching
   - Sequence 3: 5-Dimensional AI Screening & Circuit Breaker Fallback
   - Sequence 4: Scheduled Multi-Platform Scraper Pipeline & DLQ Quarantine
6. [Data Architecture & Entity-Relationship Diagram (ERD)](#6-data-architecture--entity-relationship-diagram-erd)
7. [State Machine Diagrams](#7-state-machine-diagrams)
   - Circuit Breaker State Machine
   - Scraper Engine Managed Sync State Machine
   - Candidate Application Pipeline Lifecycle
8. [Security, Zero-Trust & Observability Architecture](#8-security-zero-trust--observability-architecture)

---

## 1. Executive Summary & Architectural Tenets

**getArole AI** is a high-throughput, multi-platform job aggregation and automated candidate evaluation platform. It is engineered to solve two distinct pain points in the modern technical talent market:
1. **For Job Seekers:** Fragmentation across career portals (Greenhouse, Lever, Ashby, Internshala, LinkedIn, Unstop), lack of objective ATS feedback, and generic application tailoring.
2. **For Recruiters:** Inefficient keyword-based ATS filtering, leading to false negatives and unstructured inbound candidate evaluation.

### Core Architectural Principles
* **Zero-Cost Semantic Search:** Candidate resume embedding and job vector comparisons run 100% locally on CPU via ONNX Runtime (`BAAI/bge-small-en-v1.5`), eliminating vector database and external embedding API costs.
* **Graceful Degradation & Autonomous Fallbacks:** Every subsystem (database queries, LLM evaluations, file parsing, web scrapers) contains deterministic, zero-downtime fallback paths.
* **Defense in Depth & Observability:** Prometheus latency instrumentation, structured JSON logging, strict rate-limiting ceilings, and circuit breakers protect backend infrastructure.

---

## 2. High-Level System Context (C4 Context Diagram)

```mermaid
C4Context
    title System Context Diagram (Level 1) — getArole AI Ecosystem

    Person(candidate, "Candidate / Job Seeker", "Explores aggregated jobs, uploads resumes, tracks applications, and receives calibrated match scores.")
    Person(recruiter, "Recruiter / Hiring Lead", "Uploads job descriptions and candidate batches for automated 5-dimensional screening.")
    Person(admin, "Platform Admin / SRE", "Monitors ingestion telemetry, triggers scraper syncs, and exports CRM metrics.")

    Enterprise_Boundary(b0, "getArole AI Platform") {
        System(getarole_system, "getArole AI Platform", "Unified Next.js 16 frontend and FastAPI backend orchestrating ingestion, local semantic search, and AI screening.")
    }

    System_Ext(career_apis, "Career Portals & ATS APIs", "Greenhouse, Lever, Ashby, Internshala, LinkedIn, Unstop public endpoints.")
    System_Ext(nvidia_nim, "NVIDIA NIM Cloud", "Hosted Llama 3.1 70B Instruct LLM inference on DGX Cloud.")
    System_Ext(supabase_cloud, "Supabase Cloud Database", "PostgreSQL 15 with pgvector extension, connection pooling, and PostgREST API.")
    System_Ext(firebase_auth, "Firebase Auth", "Client-side identity management (Google OAuth & Email/Password).")

    Rel(candidate, getarole_system, "Discovers jobs, uploads resume, manages pipeline", "HTTPS / Next.js UI")
    Rel(recruiter, getarole_system, "Runs bulk resume screening & reviews scorecards", "HTTPS / REST API")
    Rel(admin, getarole_system, "Audits sync status, monitors system health", "HTTPS / Admin UI & REST")

    Rel(getarole_system, career_apis, "Scrapes & normalizes live job postings", "HTTPS / Async HTTPX")
    Rel(getarole_system, nvidia_nim, "Executes 5D evaluations & application tailoring", "HTTPS / JSON REST")
    Rel(getarole_system, supabase_cloud, "Stores jobs, profiles, resumes, and vector embeddings", "PostgreSQL / REST (Port 5432 / 443)")
    Rel(candidate, firebase_auth, "Authenticates and receives ID tokens", "HTTPS / OAuth2")
    Rel(getarole_system, firebase_auth, "Validates Firebase UID headers", "Stateless Header Inspection")
```

---

## 3. Container & Component Architecture (C4 Level 2 & 3)

```mermaid
graph TB
    subgraph Client_Tier ["Client Tier (Browser / Next.js)"]
        UI_Pages["Next.js App Router (16.3)<br/>• / (Marketing Landing)<br/>• /explore (Job Explorer)<br/>• /dashboard (Kanban Tracker)<br/>• /matches (Semantic Fit)<br/>• /resume-builder<br/>• /preferences & /profile"]
        UI_State["Client State & Stores<br/>• Zustand Local Stores<br/>• TanStack React Query v5<br/>• useJobs Hook (Multi-tier Fetch)"]
        UI_Auth["Firebase Auth Provider<br/>• Session Sync<br/>• LocalStorage Cache<br/>• Bearer Token Injection"]
    end

    subgraph API_Gateway ["API Gateway & Core Web Server (FastAPI)"]
        MW_Obs["Observability Middleware<br/>(Request-ID, Latency, Prometheus)"]
        MW_Sec["Security & Rate Limiting<br/>(10 req/min AI Ceiling, Token Auth)"]
        Router_Dispatcher["Route Dispatcher<br/>• Clean /api/v1 Endpoints<br/>• Next.js Static Export Fallback<br/>• Legacy Static Serving Cache"]
        Error_Boundaries["Global Exception Boundaries<br/>• Custom 404/500 JSON for API<br/>• Custom 404/500 HTML for Web"]
    end

    subgraph Ingestion_Subsystem ["Ingestion & Scraper Engine"]
        Sync_Engine["ManagedJobSyncEngine<br/>(asyncio.Lock guard, Status Telemetry)"]
        Scraper_Workers["Scraper Worker Cluster<br/>• Greenhouse API<br/>• Lever API<br/>• Ashby API<br/>• Internshala Scraper<br/>• LinkedIn Scraper<br/>• Unstop Portal"]
        Stealth_Module["Stealth & Fingerprint Module<br/>(Synchronized UA, Sec-CH-UA, Full Jitter)"]
        Normalizer["Text Normalizer & PII Scrubbing<br/>• URL Normalization<br/>• Semantic Dedup<br/>• Dead-Letter Queue (DLQ)"]
    end

    subgraph Vector_Subsystem ["Semantic Vector Matching Engine"]
        Doc_Parser["PyMuPDF Document Parser<br/>• PDF Stream Extractor<br/>• DOCX OpenXML Zip Parser<br/>• Annotation Link Extractor"]
        FastEmbed_Engine["FastEmbed ONNX Runtime<br/>• BAAI/bge-small-en-v1.5<br/>• 384-dimensional dense vectors<br/>• Zero-cost local CPU execution"]
        Cosine_Engine["Cosine Similarity Engine<br/>• Vector Dot Product & Norms<br/>• Percentile Match Ranker"]
    end

    subgraph AI_Reasoning ["AI Neural Reasoning Engine"]
        Circuit_Breaker["AsyncCircuitBreaker<br/>(fail_max=5, reset_timeout=20s)"]
        Nvidia_Client["NvidiaLLMService<br/>(Llama 3.1 70B Instruct)"]
        Drafter_Reviewer["Drafter-Reviewer Tailoring Pipeline<br/>(Two-pass ATS Generation)"]
        Algorithmic_Fallback["Deterministic Algorithmic ATS Fallback<br/>(Jaccard Lexical Overlap, Seniority Matrix)"]
    end

    subgraph Storage_Caching ["Persistence, Caching & Data Layer"]
        L1_Cache["L1 In-Memory Write-Through Cache<br/>(15s TTL, Anti-Stampede Lock)"]
        Disk_Cache["Disk File Cache<br/>(data/jobs.json & /tmp/jobs.json)"]
        Supabase_DB["Supabase PostgreSQL 15<br/>• pgvector (384-dim HNSW)<br/>• public.jobs & public.candidates<br/>• public.match_evaluations<br/>• public.user_profiles / user_resumes"]
    end

    %% Wiring
    UI_Pages --> UI_State
    UI_State --> UI_Auth
    UI_Auth -->|HTTPS API Requests| MW_Obs
    MW_Obs --> MW_Sec
    MW_Sec --> Router_Dispatcher

    Router_Dispatcher -->|/api/jobs| L1_Cache
    L1_Cache -.->|Cache Miss| Supabase_DB
    L1_Cache -.->|Supabase Failure| Disk_Cache
    UI_State -.->|Backend Offline Fallback| Supabase_DB

    Router_Dispatcher -->|/api/scrape| Sync_Engine
    Sync_Engine --> Scraper_Workers
    Scraper_Workers --> Stealth_Module
    Scraper_Workers --> Normalizer
    Normalizer --> FastEmbed_Engine
    Normalizer --> Supabase_DB

    Router_Dispatcher -->|/api/match-resume| Doc_Parser
    Doc_Parser --> FastEmbed_Engine
    FastEmbed_Engine --> Cosine_Engine

    Router_Dispatcher -->|/api/ai/deep-evaluate| Circuit_Breaker
    Circuit_Breaker -->|Circuit Closed| Nvidia_Client
    Circuit_Breaker -.->|Circuit Tripped / Error| Algorithmic_Fallback
    Nvidia_Client --> Drafter_Reviewer
    Nvidia_Client -.->|Timeout / Bad JSON| Algorithmic_Fallback
```

---

## 4. Subsystem Deep Dives

### 4.1. Client Tier (Next.js 16 + React 19 + Tailwind v4)
* **Architecture:** Prerendered Static Site Generation (`output: "export"`) with hydration in modern browsers.
* **Routing Structure:**
  * `/(marketing)`: Static conversion landing page, Bento feature grids, trust tickers, FAQ accordion.
  * `/(app)`: Authenticated job discovery hub (`/explore`), Kanban tracker (`/dashboard`), semantic recommendations (`/matches`), resume builder (`/resume-builder`), and profile settings (`/preferences`).
  * `/(admin)`: Recruiter CRM candidate management (`/crm`).
* **Multi-Tier Job Fetching Strategy (`useJobs` Hook):**
  1. Primary: Fetches `/api/jobs` via FastAPI backend with Axios.
  2. Secondary Fallback: Direct HTTPS client query to Supabase PostgREST endpoint using the public anonymous key.
  3. Tertiary Fallback: Verified mock dataset to guarantee the UI never displays a broken blank screen.

### 4.2. API Gateway & Application Server (FastAPI)
* **Middleware Pipeline:**
  1. `ObservabilityMiddleware`: Attaches UUIDv4 `X-Request-ID` to all HTTP headers, records duration into Prometheus histograms (`HTTP_REQUEST_DURATION_SECONDS`), and manages Prometheus metrics at `/metrics`.
  2. `GZipMiddleware`: Compresses responses over 500 bytes for accelerated Time-To-First-Byte (TTFB).
  3. `CORSMiddleware`: Whitelists domains (`https://getarole.in`, `https://getarole.com`, and Vercel preview environments).
* **Multi-Stage Prerendered Page Dispatcher (`serve_nextjs_page`):**
  * Serves Next.js static HTML from `frontend/out/` using an in-memory mtime-aware cache.
  * Falls back to `web/static/` legacy HTML templates if Next.js export assets are missing.
  * Emits custom branded 404/500 error boundaries without exposing stack traces.

### 4.3. Multi-Platform Scraper Aggregation & Ingestion Engine
* **Concurrency & Safety:** The `ManagedJobSyncEngine` utilizes an `asyncio.Lock()` to strictly prevent overlapping scraper runs. Manual or scheduled requests while a sync is in progress immediately receive HTTP 409 Conflict.
* **Platform Adapters:**
  * **Greenhouse:** Public board API querying curated technology companies.
  * **Lever:** Public careers API extracting structured titles, departments, and URLs.
  * **Ashby:** Career board GraphQL/REST ingestion.
  * **Internshala & LinkedIn:** Headless HTTP scrapers with stealth browser fingerprint rotation.
* **Resilience & Sanitization:**
  * Full Jitter Exponential Backoff retries ($t = \text{random}(0.5, \text{base} \times 2^{\text{attempt}-1})$).
  * Payload validator: Rejects any batch where $>50\%$ of records fail basic schema checks.
  * Dead-Letter Queue (DLQ) (`dlq_rejected_records.jsonl`) for quarantine and triage.

### 4.4. Zero-Cost Semantic Vector Matching Engine (ONNX FastEmbed)
* **Model:** `BAAI/bge-small-en-v1.5` dense text embedding model running on local ONNX runtime.
* **Dimensionality:** 384 dense floating-point dimensions.
* **Resource Profile:** $<200\text{ MB}$ RAM overhead, sub-15ms inference per document on commodity CPU, zero cloud API bills.
* **Mathematical Calibration:**
  $$\text{Cosine Similarity}(u, v) = \frac{u \cdot v}{\|u\|_2 \|v\|_2}$$
  Scores are calibrated to a 100-point scale: $\text{Match Score} = \min(99, \max(50, \text{round}(\text{sim} \times 100)))$.

### 4.5. Multi-Stage AI Talent Screener (NVIDIA NIM Llama 3.1 70B)
* **Inference Endpoint:** NVIDIA NIM Cloud hosting `meta/llama-3.1-70b-instruct`.
* **5-Dimensional Evaluation Rubric:**
  1. *Skills Match* (30% weight): Technical stack, languages, tools, frameworks.
  2. *Experience Alignment* (25% weight): Seniority rank, scope, production scale.
  3. *Culture & Workplace Fit* (15% weight): Remote/Hybrid/Onsite synergy.
  4. *Location Synergy* (15% weight): Proximity, timezone alignment.
  5. *Career Growth Trajectory* (15% weight): Upside velocity and headroom.
* **Composite Score Formula:**
  $$\text{Score}_{10} = 0.30 S + 0.25 E + 0.15 C + 0.15 L + 0.15 G$$
* **Circuit Breaker:** `AsyncCircuitBreaker("nvidia_nim", fail_max=5, reset_timeout=20.0s)`.
* **Drafter-Reviewer Tailoring Pipeline:**
  * Pass 1 (Drafter): Generates role-specific ATS bullet points and cover letter.
  * Pass 2 (Reviewer): Strictly audits draft against job description keywords, eliminates hallucinations, and enforces concise metric-driven wording.

### 4.6. Persistence, Caching & Vector Store (Supabase + pgvector)
* **Primary Database:** Supabase PostgreSQL 15 with `pgvector` extension.
* **Vector Index:** Hierarchical Navigable Small World (HNSW) index using cosine distance:
  `CREATE INDEX idx_jobs_embedding ON public.jobs USING hnsw (embedding vector_cosine_ops);`
* **L1 Cache Protection:** High-concurrency 15-second TTL in-memory cache with stampede locks protects the database connection pool during traffic surges.
* **User Data Concurrency:** Per-user `asyncio.Lock` guarantees serialized profile/resume writes and eliminates race conditions.

---

## 5. UML Sequence Diagrams

### Sequence 1: End-to-End Job Discovery & Multi-Tier Fallback Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Candidate Browser
    participant Hook as useJobs Hook (Frontend)
    participant API as FastAPI Gateway
    participant L1 as L1 In-Memory Cache
    participant Disk as Disk Cache (jobs.json)
    participant PostgREST as Supabase PostgREST
    participant Mock as Fallback Mock Store

    User->>Hook: Navigate to /explore or /matches
    Hook->>API: GET /api/jobs (limit=1500)
    
    alt FastAPI Backend Available
        API->>L1: Check _JOB_WRITE_THROUGH_CACHE (TTL < 15s)
        alt L1 Cache Hit
            L1-->>API: Return Cached Job Listings
            API-->>Hook: 200 OK [JSON Payload]
        else L1 Cache Miss
            API->>PostgREST: SELECT * FROM jobs WHERE is_deleted=false
            alt Supabase DB Responds
                PostgREST-->>API: 200 OK (Job Records)
                API->>L1: Populate L1 Cache & Reset Timestamp
                API-->>Hook: 200 OK [JSON Payload]
            else Supabase Timeout / Network Failure (>2.5s)
                API->>Disk: Load from data/jobs.json or /tmp/jobs.json
                Disk-->>API: Read Cached JSON File
                API-->>Hook: 200 OK [Stale Cached Payload]
            end
        end
    else FastAPI Backend Offline / Unreachable
        Hook->>Hook: Catch Network Error
        Hook->>PostgREST: Direct Client Fetch (SUPABASE_REST_URL + Anon Key)
        alt Direct Supabase Fetch Succeeds
            PostgREST-->>Hook: 200 OK [Jobs JSON Array]
        else Direct Supabase Call Fails (e.g., Offline Mode)
            Hook->>Mock: Load Curated Verified Mock Openings
            Mock-->>Hook: Return Mock Fallback Array
        end
    end
    
    Hook-->>User: Render Job Cards with Filter Facets
```

---

### Sequence 2: Resume Ingestion & Local Semantic Vector Matching

```mermaid
sequenceDiagram
    autonumber
    actor User as Candidate
    participant UI as Resume Upload Modal
    participant API as POST /api/match-resume
    participant Parser as ResumeParserService
    participant PyMuPDF as PyMuPDF (fitz)
    participant Docx as OpenXML Zip Parser
    participant ONNX as FastEmbed ONNX Engine
    participant Cosine as Cosine Matching Engine
    participant Store as Local Storage / DB

    User->>UI: Upload resume file (.pdf, .docx, .txt)
    UI->>API: Multipart Form Upload (file bytes)
    API->>API: Enforce 10MB Payload Ceiling
    API->>Parser: process_resume_bytes(bytes, filename)

    alt Document is PDF
        Parser->>PyMuPDF: fitz.open(stream=bytes)
        PyMuPDF-->>Parser: Extracted text & hyperlink annotations
    else Document is DOCX
        Parser->>Docx: zipfile.ZipFile -> word/document.xml
        Docx-->>Parser: Extracted XML paragraph texts
    else Corrupt PDF / Plaintext
        Parser->>Parser: Fallback to UTF-8 plain text decode
    end

    Parser->>Parser: Extract structured entities (Name, Email, Phone, Skills Taxonomy)
    Parser-->>API: Candidate Profile Object

    API->>ONNX: embed_texts([resume_text])
    alt FastEmbed Model Operational
        ONNX-->>API: 384-dimensional Candidate Vector
    else ONNX Failure / Low Memory
        API->>API: Fallback to np.zeros(384) [Graceful Degradation]
    end

    API->>Cosine: Rank candidate vector against cached active jobs
    Cosine->>Cosine: Compute dot products and normalized similarities
    Cosine-->>API: Sorted Ranked Jobs with Fit Scores (1-100%)
    API-->>UI: 200 OK (Profile, Extracted Skills & Top Matches)
    UI->>Store: Persist to getarole_resume_v2
    UI-->>User: Display Extracted Profile & Top Ranked Jobs
```

---

### Sequence 3: 5-Dimensional AI Screening & Circuit Breaker Fallback

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter as Recruiter / Hiring Lead
    participant API as POST /api/ai/deep-evaluate
    participant Breaker as AsyncCircuitBreaker (nvidia_nim)
    participant LLM as NvidiaLLMService (Llama 3.1 70B)
    participant NIM as NVIDIA DGX Cloud API
    participant Algorithmic as Deterministic ATS Fallback
    participant Supabase as Supabase Database

    Recruiter->>API: Submit Candidate Resume + Target JD
    API->>API: Rate Limiter Check (max 10 req/min)
    API->>Breaker: Check circuit breaker state

    alt Circuit Breaker is OPEN
        Breaker-->>API: Raise CircuitBreakerOpenException
        API->>Algorithmic: _calculate_algorithmic_ats_score()
        Algorithmic->>Algorithmic: Jaccard Tech Overlap + Seniority Matrix
        Algorithmic-->>API: Deterministic 5D Rubric & Composite Score
    else Circuit Breaker is CLOSED / HALF-OPEN
        API->>LLM: a_evaluate_candidate_match(resume, jd)
        LLM->>NIM: POST /v1/chat/completions (timeout=45s)
        
        alt NVIDIA NIM Responds Successfully
            NIM-->>LLM: 200 OK (JSON Raw Content)
            LLM->>LLM: Parse JSON payload (with regex fallback)
            LLM->>Breaker: record_success()
            LLM-->>API: Evaluated 5D Rubric + Recruiter Justification
        else NIM Timeout, Rate-Limit (429), or 5xx Error
            NIM-->>LLM: Error / Timeout
            LLM->>Breaker: record_failure(error)
            LLM->>Algorithmic: Fallback to _calculate_algorithmic_ats_score()
            Algorithmic-->>LLM: Deterministic 5D Rubric & Justification
            LLM-->>API: Fallback Evaluation Report
        end
    end

    API->>Supabase: Insert candidate & match_evaluations record
    API-->>Recruiter: 200 OK (Score 1-10, Rubric Breakdown, Roadmap)
```

---

### Sequence 4: Scheduled Multi-Platform Scraper Pipeline & DLQ Quarantine

```mermaid
sequenceDiagram
    autonumber
    actor Scheduler as Cron / Admin Trigger
    participant Sync as ManagedJobSyncEngine
    participant Aggregator as JobAggregator
    participant Scrapers as Scraper Strategy Workers
    participant Portals as External Job Boards
    participant Normalizer as Normalizer & PII Scrubber
    participant DLQ as Dead-Letter Queue (DLQ)
    participant VectorEngine as CronVectorEngine (FastEmbed)
    participant Supabase as Supabase jobs Table

    Scheduler->>Sync: execute_sync(trigger_source)
    Sync->>Sync: Acquire asyncio.Lock()
    
    alt Lock already acquired
        Sync-->>Scheduler: Return 409 Conflict ("Already syncing")
    else Lock acquired successfully
        Sync->>Aggregator: aggregate_all()
        
        par Scrape Greenhouse
            Aggregator->>Scrapers: scrape_all_greenhouse_jobs()
            Scrapers->>Portals: HTTP GET /api.greenhouse.io
            Portals-->>Scrapers: Raw Job JSON
        and Scrape Lever
            Aggregator->>Scrapers: scrape_all_lever_jobs()
            Scrapers->>Portals: HTTP GET /api.lever.co
            Portals-->>Scrapers: Raw Job JSON
        and Scrape Ashby
            Aggregator->>Scrapers: scrape_all_ashby_jobs()
            Scrapers->>Portals: HTTP POST /jobs.ashbyhq.com
            Portals-->>Scrapers: Raw Job JSON
        and Scrape Internshala / LinkedIn / Unstop
            Aggregator->>Scrapers: scrape_with_stealth()
            Scrapers->>Portals: HTTP GET with Rotated Headers
            Portals-->>Scrapers: Raw HTML / JSON
        end

        Scrapers-->>Aggregator: Gathered Job Candidates
        
        loop For each scraped record
            Aggregator->>Normalizer: Clean, sanitize PII, validate schema
            alt Schema Valid & Verified
                Normalizer->>VectorEngine: Generate 384-dim ONNX embedding
                VectorEngine-->>Normalizer: Vector Attached
            else Invalid Schema / Missing Title or URL
                Normalizer->>DLQ: log_to_dlq(record, "anti_bot_schema_mismatch")
            end
        end

        Normalizer->>Supabase: Batch Upsert (100 records / batch)
        Supabase-->>Sync: Rows Inserted & Updated
        Sync->>Sync: Update telemetry, release lock
        Sync-->>Scheduler: 200 OK (Sync Completed Metrics)
    end
```

---

## 6. Data Architecture & Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    jobs ||--o{ match_evaluations : evaluated_in
    jobs ||--o{ applications : applied_to
    candidates ||--o{ match_evaluations : receives
    candidates ||--o{ applications : tracks
    user_profiles ||--o| user_preferences : configures
    user_profiles ||--o| user_resumes : uploads

    jobs {
        text id PK "Deterministic unique hash (company_title)"
        text title "Job title"
        text company "Employer name"
        text location "Raw location string"
        text city "Standardized city"
        text platform "Greenhouse | Lever | Ashby | LinkedIn | Internshala"
        text url "Application URL"
        text workplace_type "Remote | Hybrid | Onsite"
        text employment_type "Full-Time | Internship | Contract"
        text stipend_or_salary "Compensation string"
        int stipend_amount_min "Normalized minimum salary"
        text description "Sanitized job description (max 4000 chars)"
        text_array skills "Identified required tech skills"
        vector_384 embedding "384-dimensional ONNX dense embedding"
        boolean is_deleted "Soft delete flag"
        timestamptz created_at "Created timestamp"
        timestamptz updated_at "Last updated timestamp"
    }

    candidates {
        uuid id PK "gen_random_uuid()"
        text name "Candidate full name"
        text email "Contact email"
        text_array skills "Extracted technical skills"
        numeric experience_years "Calculated years of experience"
        text education "Degree & institution"
        text raw_resume_text "Extracted plain text"
        vector_384 resume_embedding "384-dimensional dense resume vector"
        timestamptz created_at "Upload timestamp"
    }

    match_evaluations {
        uuid id PK "gen_random_uuid()"
        uuid candidate_id FK "References candidates.id"
        text job_id FK "References jobs.id"
        numeric fit_score_percent "Percentage fit (0-100)"
        numeric score_10 "Calibrated score (1.0-10.0)"
        text verdict "Shortlisted | Review | Rejected"
        jsonb rubric_breakdown "5D scoring breakdown"
        text_array strengths "Candidate key strengths"
        text_array missing_skills "Identified skill gaps"
        text justification "Recruiter reasoning summary"
        timestamptz created_at "Evaluation timestamp"
    }

    applications {
        uuid id PK "gen_random_uuid()"
        uuid candidate_id FK "References candidates.id"
        text job_id FK "References jobs.id"
        text status "saved | applied | interview | offer | rejected"
        text notes "User interview notes"
        timestamptz applied_at "Application date"
        timestamptz created_at "Created timestamp"
        timestamptz updated_at "Updated timestamp"
    }

    user_profiles {
        uuid id PK "gen_random_uuid()"
        text firebase_uid UK "Unique Firebase Auth identifier"
        text email "Account email"
        text first "First name"
        text last "Last name"
        text phone "Phone number"
        text headline "Current role title"
        text linkedin_url "LinkedIn profile link"
        text github_url "GitHub profile link"
        text portfolio_url "Portfolio website link"
        timestamptz created_at "Created timestamp"
        timestamptz updated_at "Updated timestamp"
    }

    user_preferences {
        uuid id PK "gen_random_uuid()"
        text firebase_uid UK "References user_profiles.firebase_uid"
        text_array roles "Target job roles"
        text_array locations "Target geographic locations"
        text_array roletype "Full-time, Internship, etc."
        text seniority "Junior | Mid | Senior | Lead"
        text_array skills_inc "Preferred skills"
        int salary_amt "Target salary"
        text salary_curr "INR | USD"
        timestamptz updated_at "Updated timestamp"
    }

    user_resumes {
        uuid id PK "gen_random_uuid()"
        text firebase_uid UK "References user_profiles.firebase_uid"
        boolean is_default "Primary resume flag"
        text filename "Original document filename"
        jsonb work_experience "Parsed experience array"
        jsonb education "Parsed education array"
        jsonb projects "Parsed projects array"
        text_array skills "Categorized skill list"
        text raw_text "Plain text document content"
        timestamptz uploaded_at "Upload timestamp"
    }
```

---

## 7. State Machine Diagrams

### Circuit Breaker State Machine (`AsyncCircuitBreaker`)

```mermaid
stateDiagram-v2
    [*] --> Closed : Server Initialization

    Closed --> Closed : Operation Success (failure_count = 0)
    Closed --> Open : failure_count >= 5 (fail_max reached)

    state Open {
        [*] --> FastFail : Drop requests immediately
        FastFail --> FastFail : Trigger Algorithmic Fallback
    }

    Open --> HalfOpen : time.time() - last_failure > 20s (reset_timeout)

    state HalfOpen {
        [*] --> ProbeTrial : Allow single trial call to LLM
        ProbeTrial --> TrialSuccess : Call succeeds
        ProbeTrial --> TrialFailure : Call fails
    }

    TrialSuccess --> Closed : Reset failure_count = 0
    TrialFailure --> Open : Reset last_failure_time
```

---

### Scraper Engine Managed Sync State Machine (`ManagedJobSyncEngine`)

```mermaid
stateDiagram-v2
    [*] --> IDLE : Engine Instantiation

    IDLE --> SYNCING : execute_sync() / Lock Acquired
    SYNCING --> SYNCING : Inbound Request -> Return HTTP 409 Conflict

    state SYNCING {
        [*] --> FetchingPortals : Parallel Async Gather
        FetchingPortals --> ValidatingSchema : Anti-Bot Payload Check
        ValidatingSchema --> EmbeddingVectors : FastEmbed ONNX Batch
        EmbeddingVectors --> SupabaseUpsert : 100-batch PostgreSQL Upsert
    }

    SYNCING --> IDLE : Success (last_status="SUCCESS", Lock Released)
    SYNCING --> IDLE : Error (last_status="ERROR", log error, Lock Released)
```

---

### Candidate Application Pipeline Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Saved : Role bookmarked from Explore

    Saved --> Applied : Application submitted on employer portal
    Saved --> Archived : Discarded by user

    Applied --> Interview : Recruiter outreach / Round scheduled
    Applied --> Rejected : Automated rejection email received

    Interview --> Interview : Next round (Technical / Leadership)
    Interview --> Offer : Offer extended
    Interview --> Rejected : Candidate rejected after interview

    Offer --> Accepted : Candidate accepts offer
    Offer --> Declined : Candidate declines offer

    Accepted --> [*]
    Declined --> [*]
    Rejected --> [*]
    Archived --> [*]
```

---

## 8. Security, Zero-Trust & Observability Architecture

### 8.1. Zero-Trust Security Policies
* **Least-Privilege Database Access:** Public anonymous Supabase keys are strictly limited to `SELECT` on non-deleted jobs. Write access to `jobs`, `candidates`, and `match_evaluations` requires backend `service_role` credentials.
* **SSRF Protection in Document Parsing:** The `ResumeParserService` validates all extracted candidate links. Any URLs matching private IP blocks (`127.0.0.1`, `169.254.169.254`, `localhost`, `10.0.0.0/8`, `192.168.0.0/16`) or unsupported URI schemes (`javascript:`, `file:`, `data:`, `ftp:`) are stripped.
* **Payload Size Limits:** Upload endpoints strictly reject binaries exceeding 10MB to protect memory pools from Denial-of-Service (DoS) and Out-of-Memory (OOM) crashes.
* **AI Rate Limiting:** An in-memory rate limiter strictly caps AI generation endpoints to 10 requests per minute per IP address.

### 8.2. Observability & SRE Metrics
* **Prometheus Metrics Scrape (`/metrics`):**
  * `HTTP_REQUEST_DURATION_SECONDS`: Request latency distribution histogram across all endpoints.
  * `SUPABASE_QUERY_DURATION`: Database latency tracker alerting on slow queries ($>200\text{ms}$).
  * `CIRCUIT_BREAKER_STATE`: Real-time gauge ($0 = \text{Closed}, 1 = \text{Half-Open}, 2 = \text{Open}$).
  * `LLM_FALLBACK_TOTAL`: Counter tracking every activation of the deterministic ATS fallback.
  * `SCRAPER_FAILURE_TOTAL`: Counter partitioned by scraper and failure reason.
* **Kubernetes Probes:**
  * Liveness (`/healthz`): Rapid process health check returning process PID ($<5\text{ms}$).
  * Readiness (`/readyz`): Deep dependency probe validating Supabase connectivity and the 384-dimensional FastEmbed ONNX model before admitting ingress traffic.
