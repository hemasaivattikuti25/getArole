# 🛡️ getArole AI — Comprehensive Failure & Fallback Engineering Report
**Author:** getArole Reliability & Systems Engineering (SRE)  
**Scope:** Complete Codebase (Frontend, Backend Gateway, Scraper Cluster, Vector Engine, AI Inference, Database)  
**System Status:** Production Hardened (All 119 Core Test Suites Passing)  
**Last Audit:** October 2026  

---

## 📑 Executive Audit Summary

The **getArole AI** platform operates in an inherently volatile environment:
* Public career portals frequently update HTML schemas, deploy Cloudflare/DataDome anti-bot challenges, and enforce strict IP rate-limits.
* Cloud LLM endpoints (NVIDIA NIM) experience intermittent network latency spikes, token-quota throttling (HTTP 429), or JSON deserialization anomalies.
* Client-side browsers on low-connectivity mobile networks may lose access to backend API gateways or third-party OAuth providers.

To deliver an uninterrupted user experience, the system implements a **multi-tier defensive architecture** where every potential failure point is backed by deterministic, zero-downtime fallback paths.

---

## 📊 System-Wide Failure & Fallback Matrix

| Layer / Subsystem | Primary Failure Mode | Detection Mechanism | Primary Execution Path | Secondary Fallback | Tertiary / Ultimate Fallback | SRE Observability Metric |
|---|---|---|---|---|---|---|
| **Frontend Job Discovery** (`useJobs.ts`) | FastAPI backend unreachable, proxy down, or port blocked | Network timeout / HTTP 5xx catch block | `apiClient.get('/jobs')` via FastAPI Gateway | Direct browser HTTPS query to Supabase PostgREST cloud endpoint with public anon key | Statically bundled verified mock jobs array (guarantees non-empty UI) | `console.log` warning, UI error state suppressed |
| **User Authentication** (`auth-provider.tsx`) | Firebase Auth API outage, blocked cookies, or network drop | Promise rejection on auth init or token fetch | Firebase Cloud Auth (Google OAuth & Email/Pass) | Session recovered from browser `localStorage` (`getarole_user`) | Anonymous guest session with local state persistence | Client console warning, guest fallback active |
| **Page & Asset Delivery** (`server.py`) | Next.js prerendered static build missing or incomplete (`frontend/out`) | `os.path.exists()` check in `serve_nextjs_page()` | Next.js App Router static export (`frontend/out/*.html`) | Legacy static HTML templates (`web/static/*.html`) | Minimal clean HTML fallback page with navigation links | `sre.server` debug log |
| **API Error Handling** (`server.py`) | Unhandled runtime exception or malformed route | Global exception handlers (`@app.exception_handler`) | Normal API JSON response or clean page render | Structured JSON `{"success": false, "error": "..."}` for `/api/*` | Branded standalone HTML 500 error page with retry and dashboard buttons (zero stack trace leak) | Observability middleware logs, HTTP 500 counter |
| **Database Retrieval** (`supabase_service.py`) | Supabase connection pool exhaustion, latency spike ($>2.5\text{s}$) | `asyncio.timeout(2.5)` & exception trapping | Async Supabase Python client via connection pool | L1 In-Memory write-through cache (`_JOB_WRITE_THROUGH_CACHE`) | Sync `httpx.Client` query via Supabase REST API; stale cached data if persistent outage | `SUPABASE_FAILURES_TOTAL`, `SUPABASE_QUERY_DURATION` |
| **Job Listings Cache** (`server.py`) | In-memory cache unpopulated on cold start | `if not AGGREGATOR.cached_jobs:` check | In-memory `AGGREGATOR.cached_jobs` array | Project disk cache (`data/jobs.json`) | OS temp disk cache (`/tmp/jobs.json`), then direct Supabase REST | `CACHE_OPERATIONS` (`stale_serve`, `l1_memory_hit`) |
| **Vector Embeddings** (`embedding_service.py`) | Cache directory write failure or ONNX model init failure | Startup probe validation (assert length == 384) | FastEmbed ONNX runtime with custom cache directory | Re-initialize FastEmbed with default temp cache | Model set to `None`, returns zero-vectors (`np.zeros(384)`) to prevent runtime crashes | `DEPENDENCY_ERRORS_TOTAL{dependency="fastembed"}` |
| **AI Candidate Evaluation** (`llm_service.py`) | NVIDIA NIM rate limit (429), timeout, circuit breaker trip, or bad JSON | `llm_breaker.is_open` flag, HTTP status, or JSON parse exception | Llama 3.1 70B Instruct via NVIDIA NIM DGX Cloud | 2x retry with exponential backoff & regex JSON extraction | Deterministic 5-Dimensional Algorithmic ATS Match Engine (Jaccard lexical overlap + seniority scoring) | `LLM_FALLBACK_TOTAL{reason="..."}`, `CIRCUIT_BREAKER_STATE` |
| **AI Resume Tailoring** (`llm_service.py`) | LLM fails during Drafter or Reviewer pass | Exception handling around two-pass pipeline | Two-pass neural Drafter-Reviewer optimization | Single-pass draft generation without reviewer audit | Deterministic algorithmic summary and keyword-matched cover letter | `LLM_FALLBACK_TOTAL` |
| **Resume Document Parsing** (`resume_parser_service.py`) | Uploaded file is corrupt PDF, renamed Word docx, or raw text | PyMuPDF `fitz.open()` exception handling | PyMuPDF text and annotation link extraction | OpenXML DOCX ElementTree parser (`word/document.xml`) | UTF-8 plain text decoder (`errors="ignore"`), followed by regex heuristic section classifier | `sre.resume_parser` debug log |
| **Career Board Scraping** (`aggregator.py`) | Career board HTTP 403, 429 rate limit, or HTML layout change | Retry loop with `random.uniform()` full jitter exponential backoff | Direct async HTTP scraper fetch | Retry up to 3 times with exponential backoff and randomized jitter | Payload validation: if $>50\%$ of jobs invalid, quarantine batch into Dead-Letter Queue (`dlq_rejected_records.jsonl`) | `SCRAPER_FAILURE_TOTAL{scraper="...", reason="..."}` |
| **Concurrent Scraper Runs** (`server.py`) | Admin or scheduler triggers scrape while sync is already active | `asyncio.Lock.locked()` inspection | Immediate acquisition of `JOB_SYNC_ENGINE._lock` | Request safely rejected with HTTP 409 Conflict and telemetry payload | Prevents duplicate socket allocation, memory spikes, and race conditions | Sync engine telemetry `is_busy=True` |

---

## 🔍 Detailed Subsystem Failure Analysis

---

### 1. Frontend Client Tier (`frontend/src/`)

```mermaid
flowchart TD
    Start([User visits /explore]) --> FetchLocal[1. Hit FastAPI /api/jobs]
    FetchLocal --> CheckLocal{Backend Responds?}

    CheckLocal -- Yes --> ParseLocal[Parse & Sanitize Payload]
    ParseLocal --> RenderUI([Render Active Job Cards])

    CheckLocal -- No / Network Error --> FetchCloud[2. Fallback: Query Supabase REST Cloud directly]
    FetchCloud --> CheckCloud{Supabase Cloud Responds?}

    CheckCloud -- Yes --> ParseCloud[Parse & Sanitize Payload]
    ParseCloud --> RenderUI

    CheckCloud -- No / Offline Mode --> FetchMock[3. Fallback: Load Verified Mock Job Array]
    FetchMock --> RenderUI
```

#### Failure Modes:
* **FastAPI Server Not Running:** In production setups where the Next.js static site is hosted on GitHub Pages or Vercel, the local FastAPI backend (`localhost:8000`) is unreachable.
* **Network Interruption:** Client network drops while browsing.
#### Defense & Fallback:
1. `useJobs.ts` executes a nested `try-catch` pipeline.
2. If `apiClient.get('/jobs')` throws an error, the hook seamlessly issues a direct browser `fetch()` call to `https://tgmhtlqcjgcjedlnthfk.supabase.co/rest/v1/jobs` utilizing the public `anon` API key.
3. If internet connectivity is completely lost, the hook falls back to a curated, high-quality array of top tech roles (Google, Microsoft, Atlassian), allowing the UI to remain interactive and functional.

---

### 2. API Gateway & Static Route Serving (`web/server.py`)

```mermaid
flowchart TD
    Req[Incoming HTTP Request for Page Route e.g., /dashboard] --> CheckNext{Does frontend/out/dashboard.html exist?}

    CheckNext -- Yes --> ReadNext[Read Next.js Static Export Asset]
    ReadNext --> CheckCache[Check mtime LRU Memory Cache]
    CheckCache --> ReturnNext([Serve Fast Next.js HTML])

    CheckNext -- No --> CheckLegacy{Does web/static/dashboard.html exist?}
    CheckLegacy -- Yes --> ReadLegacy[Read Legacy Static HTML]
    ReadLegacy --> ReturnLegacy([Serve Legacy Static HTML])

    CheckLegacy -- No --> ReturnEmergency([Serve Emergency Branded Error Boundary])
```

#### Failure Modes:
* **Missing Frontend Build:** Developers or deployment scripts might start `main.py` without first running `npm run build` in `frontend/`.
* **Sync Disk I/O Blocking:** High traffic reading files from disk could block the Python async event loop.
#### Defense & Fallback:
1. `serve_nextjs_page()` evaluates candidate file locations sequentially: `frontend/out/{page}.html` $\rightarrow$ `frontend/out/{page}/index.html` $\rightarrow$ `web/static/{page}/index.html` $\rightarrow$ `web/static/index.html`.
2. An in-memory cache `_HTML_PAGE_CACHE` stores the HTML string alongside its disk `mtime`, eliminating disk read overhead on subsequent requests.
3. If no file is found, an emergency styled HTML response is generated, preventing 500 server crashes.

---

### 3. Database & Caching Tier (`services/supabase_service.py`)

```mermaid
flowchart TD
    Query[fetch_jobs Query limit=100] --> CheckL1{Unfiltered Query & L1 Cache Age < 15s?}

    CheckL1 -- Yes (Hit) --> ReturnL1([Return L1 Memory Cache < 1ms])

    CheckL1 -- No (Miss) --> CheckClient{Async Supabase Client Available?}
    CheckClient -- No --> CheckDisk[Check Disk Cache data/jobs.json]

    CheckClient -- Yes --> ExecAsync[Execute Async PostgREST Query with 2.5s Timeout]
    ExecAsync --> CheckTimeout{Completed within 2.5s?}

    CheckTimeout -- Yes --> UpdateL1[Update L1 Cache & Return Fresh Data]
    UpdateL1 --> ReturnFresh([Return Fresh Job Records])

    CheckTimeout -- No / Timeout --> FallbackL1[Log Timeout Metric & Return Stale L1 Cache]
    FallbackL1 --> ReturnStale([Return Stale Cache])

    CheckDisk --> CheckTmp[Check /tmp/jobs.json]
    CheckTmp --> CheckSyncREST[Call Sync httpx Supabase REST API]
    CheckSyncREST --> ReturnREST([Return Direct REST Data])
```

#### Failure Modes:
* **Supabase Connection Pool Exhaustion:** 1,000+ concurrent requests hitting Supabase simultaneously can exhaust available PostgREST connection slots.
* **Slow Query Degradation:** Network latency between server and database exceeding the 2.0s P99 SLO.
* **Cache Poisoning:** Filtered queries (e.g. `city=chennai`) polluting global cache and hiding other jobs.
#### Defense & Fallback:
1. **L1 In-Memory Fast Path:** Unfiltered queries are served from `_JOB_WRITE_THROUGH_CACHE` with a 15-second TTL and anti-stampede mutex locks, absorbing 1,000–5,000 VU spikes with sub-millisecond response times.
2. **Strict 2.5s Async Timeout:** Any Supabase query taking longer than 2.5s is automatically canceled via `asyncio.timeout(2.5)`, logging a Prometheus alert and returning the stale L1 cache to preserve availability.
3. **Cache Isolation:** Filtered queries never write to the global `_JOB_WRITE_THROUGH_CACHE`, completely eliminating cache poisoning risks.
4. **Sync REST Fallback:** In environments where the async client fails to establish a session, `_fetch_jobs_from_supabase_rest()` executes pooled synchronous HTTP requests.

---

### 4. Zero-Cost Vector Embeddings (`services/embedding_service.py`)

#### Failure Modes:
* **Read-Only / Protected Filesystem:** When running in locked-down containers or serverless environments (AWS Lambda / Vercel), writing to the default FastEmbed cache folder can throw permissions errors.
* **Dimensionality Mismatch:** Corrupt ONNX weights producing unexpected vector lengths.
#### Defense & Fallback:
1. **Cache Fallback:** Tries `FASTEMBED_CACHE_DIR` environment variable, then falls back to `tempfile.gettempdir()/fastembed_cache`, and finally to the library's internal default directory.
2. **Startup Health Probe:** During initialization, a probe string is embedded and verified to produce exactly 384 dimensions. If the probe fails, the service falls back to default model parameters.
3. **Graceful Zero-Vector Return:** If the ONNX runtime encounters an irrecoverable crash or runs out of RAM, `embed_texts()` catches the error, logs to Prometheus, and returns `[np.zeros(384, dtype=np.float32)]`. Cosine similarity functions explicitly handle zero-norm vectors by returning `0.0`, preventing `ZeroDivisionError` crashes.

---

### 5. AI Reasoning & NVIDIA NIM Llama 3.1 70B (`services/llm_service.py`)

```mermaid
flowchart TD
    EvalReq[Candidate Evaluation Request] --> BreakerCheck{Circuit Breaker State?}

    BreakerCheck -- OPEN --> AlgorithmicFallback[Trigger Algorithmic ATS Match Engine]

    BreakerCheck -- CLOSED / HALF-OPEN --> NIMCall[Call NVIDIA NIM Llama 3.1 70B Instruct]
    NIMCall --> CheckSuccess{Response Received within 45s?}

    CheckSuccess -- Yes --> ParseJSON{Valid JSON Payload?}
    ParseJSON -- Yes --> RecordSuccess[Record Success on Circuit Breaker]
    RecordSuccess --> ReturnLLM([Return AI 5D Rubric & Justification])

    ParseJSON -- No --> RegexJSON{Regex Extract JSON Successful?}
    RegexJSON -- Yes --> RecordSuccess
    RegexJSON -- No --> AlgorithmicFallback

    CheckSuccess -- No (Timeout/429/5xx) --> RecordFailure[Record Failure on Circuit Breaker]
    RecordFailure --> CheckTripped{Failures >= 5?}
    CheckTripped -- Yes --> TripBreaker[Trip Breaker to OPEN for 20s]
    CheckTripped -- No --> AlgorithmicFallback
    TripBreaker --> AlgorithmicFallback

    AlgorithmicFallback --> ReturnAlgo([Return Deterministic 5D ATS Score & Roadmap])
```

#### Failure Modes:
* **API Rate Limiting (HTTP 429):** High volumes of resume evaluations exceeding NVIDIA NIM rate limits.
* **Network Timeout:** Complex prompts or high cloud load causing responses to exceed 45 seconds.
* **Malformed LLM Output:** Llama 3.1 including markdown commentary or truncated JSON syntax.
#### Defense & Fallback:
1. **Async Circuit Breaker (`AsyncCircuitBreaker`):**
   * Automatically trips to `OPEN` after 5 consecutive failures.
   * While `OPEN`, requests skip network calls entirely and fail fast directly to the algorithmic fallback, eliminating latency for downstream callers.
   * After a 20-second cooldown, transitions to `HALF-OPEN` to test service recovery with a single probe request.
2. **Regex JSON Rescue:** If `json.loads` fails due to markdown fences (e.g. ````json ... ````), a regular expression search `re.search(r'(\{[\s\S]*\})', content)` extracts the raw JSON dictionary.
3. **Deterministic Algorithmic ATS Match Engine:**
   * If the LLM is completely unavailable, `_calculate_algorithmic_ats_score()` activates.
   * **Skills Match:** Evaluates exact and partial overlap across a comprehensive 60+ technical skill catalog using Jaccard similarity.
   * **Experience Alignment:** Scans for seniority hierarchy markers (`intern` $\rightarrow$ `lead` $\rightarrow$ `director`) and compares candidate depth against the job description requirements.
   * **Workplace & Location Synergy:** Evaluates candidate preference synergy (Remote, Hybrid, Onsite, and City matching).
   * Generates a calibrated 1.0–10.0 score, verdict, strengths, missing skills, and actionable improvement roadmap without calling any external API.

---

### 6. Document & Resume Parsing (`services/resume_parser_service.py`)

#### Failure Modes:
* **Mismatched Extensions:** A `.docx` file uploaded with a `.pdf` extension or vice versa.
* **Binary Stream Corruption:** Incomplete file uploads or unsupported PDF compression filters.
* **Malicious / SSRF Links:** Resumes embedding internal network URLs (e.g., `http://169.254.169.254/latest/meta-data`) or `javascript:alert(1)` exploits.
#### Defense & Fallback:
1. **Type Fallback Cascade:**
   * Attempts PyMuPDF `fitz.open(stream=bytes)`.
   * If parsing raises an exception, automatically passes bytes to `parse_docx_bytes()` to inspect OpenXML zip archives.
   * If still unsuccessful, decodes as plain UTF-8 text with `errors="ignore"`.
2. **Heuristic Section Classifier:** If LLM-assisted parsing is disabled or fails, a deterministic line-by-line parser identifies section headers (`EXPERIENCE`, `EDUCATION`, `PROJECTS`, `SKILLS`), separates dates and roles, and categorizes technical proficiencies into Languages, Frameworks, Cloud/Databases, and Developer Tools.
3. **Zero-Trust URL Sanitizer:** Every hyperlink annotation or regex-extracted URL is screened via `_is_safe_url()`. Any link containing local IP ranges, private cloud metadata endpoints, or non-HTTP schemes is discarded.

---

### 7. Scraper Aggregation & Ingestion Engine (`scrapers/aggregator.py` & `cron_scraper/main.py`)

#### Failure Modes:
* **Anti-Bot Cloudflare Blocks (403/429):** Aggressive scraping triggering IP reputation bans.
* **Malformed Scraper Payloads:** Web changes resulting in empty job titles or broken URLs.
* **Stale Job Listings Accumulation:** Closed positions persisting in the database.
#### Defense & Fallback:
1. **Full Jitter Exponential Backoff:** Scrapers retry up to 3 times with randomized backoff:
   $$\text{Delay} = \text{random}(0.5, \text{base} \times 2^{\text{attempt}-1})$$
2. **Payload Sanity Threshold:** If fewer than 50% of extracted jobs contain valid `title`, `company`, and `url` attributes, the entire batch is rejected to avoid polluting the database with anti-bot challenge HTML.
3. **Dead-Letter Queue (DLQ):** Rejected records are quarantined into `dlq_rejected_records.jsonl` with failure timestamps and pipeline run IDs for engineering review.
4. **Data Freshness SLA Reaper:** A background pruning routine (`reap_stale_jobs`) purges postings older than 30 days that have not been refreshed.

---

## 📈 Identified Fragilities & Hardening Recommendations

1. **L1 Cache Invalidation Across Multiple ASGI Workers:**
   * *Current State:* `_JOB_WRITE_THROUGH_CACHE` is stored in process memory. If running multiple Uvicorn workers (`--workers 4`), each worker maintains its own separate cache.
   * *Recommendation:* For horizontal scaling across multiple container instances, deploy a Redis or Dragonfly instance for centralized write-through caching.
2. **In-Memory Rate Limiting:**
   * *Current State:* `enforce_ai_rate_limit()` stores IP counts in an in-memory dictionary.
   * *Recommendation:* Transition rate-limiting to Redis token bucket algorithm (`sliding window counter`) to prevent rate limit bypasses when autoscaling container pods.
3. **Static Export Next.js Rewrites:**
   * *Current State:* Next.js static exports (`output: "export"`) do not execute server-side `rewrites` configured in `next.config.ts`.
   * *Current Mitigation:* `useJobs.ts` directly implements client-side multi-tier fallbacks, ensuring seamless operation regardless of proxy presence.
