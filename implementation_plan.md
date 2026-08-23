# 🧠 "Brain & Heart" Architecture: Universal AI Engine & Resilient Scraping

We will refactor the core backend architecture to build the "world's best" robust, universal candidate processing and job scraping engine. This ensures the scraping pipeline (the Heart) never fails entirely due to single-board timeouts, and the LLM logic (the Brain) is centralized in a powerful, stateful `ApplicationAgent`.

## Open Questions

- **Rate Limits**: The GitHub Actions runner IP might be getting rate-limited or blocked by some job boards (e.g., LinkedIn, Greenhouse) causing the `httpx.ConnectTimeout`. Should we explore proxy rotation if timeouts persist after we add exponential backoff?
- **Sync vs Async Database**: The current `SupabaseService` uses the synchronous `Client`. To avoid blocking the event loop during bulk upserts in the cron job, I plan to migrate this to `AsyncClient`. Are there any other synchronous operations in the pipeline that need addressing?

## Proposed Changes

### Core Scraping & Orchestration (The Heart)

We will make the scraping pipeline bulletproof. The recent GitHub Action failures were caused by unhandled timeouts (e.g., `httpx.ConnectTimeout`) bypassing the current generic `try-except` blocks or occurring during client initialization/pool exhaustion.

#### [MODIFY] scrapers/aggregator.py
- Add an `Orchestrator` pattern to the `JobAggregator`.
- Implement per-scraper retry logic with exponential backoff using `tenacity` or custom async retry loops.
- Add structured logging to track exactly which scraper failed and why, without crashing the entire cron job.

#### [MODIFY] scrapers/*.py (lever, greenhouse, linkedin, etc.)
- Improve `httpx.AsyncClient` usage: Ensure all network requests, including connection establishment, are heavily guarded with strict timeouts and proper exception catching (catching `httpx.RequestError`).
- Add fallback user-agents to mitigate basic bot-blocking.

### AI Candidate Abstraction (The Brain)

We will decouple the AI logic from the web routes, creating a centralized `ApplicationAgent` that acts as the intelligent core for any candidate.

#### [NEW] services/agent.py
- Create an `ApplicationAgent` class that encapsulates the candidate's state (skills, experience, preferences).
- Move the structured evaluation (`evaluate_candidate_match`) and tailored generation (`generate_tailored_application`) logic here.
- This agent will expose clean methods like `agent.match_against(job)` and `agent.generate_application(job)`.

#### [MODIFY] services/llm_service.py
- Refactor `NvidiaLLMService` to act strictly as the low-level LLM client (handling token limits, API calls, and raw prompts), leaving the business logic to the `ApplicationAgent`.

#### [MODIFY] web/server.py
- Refactor API routes to instantiate and use the `ApplicationAgent` instead of calling `llm_service` directly with raw strings. This makes the routes cleaner and strictly concerned with HTTP transport.

### Resilient Database Operations

#### [MODIFY] services/supabase_service.py
- Migrate from synchronous `create_client` to `create_async_client` to prevent blocking the async event loop during bulk upserts.
- Improve error handling during batch inserts to ensure partial successes are committed even if one batch fails.

## Verification Plan

### Automated Tests
- Run `python run_cron.py` locally to verify the scraping pipeline completes (or gracefully handles timeouts) and successfully syncs to Supabase.
- Test the API routes (`/api/cv/evaluate`, `/api/cv/tailor`) to ensure the new `ApplicationAgent` responds with correctly structured data and the exact same low latency.

### Manual Verification
- Trigger the GitHub Action manually to verify the cron job succeeds without `ConnectTimeout` crashes.
- Review the `run_cron.py` logs to confirm batch upserts are processed asynchronously.
