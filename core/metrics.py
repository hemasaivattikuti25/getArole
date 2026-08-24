"""
core/metrics.py
Centralized Prometheus metrics registry for SRE observability.
"""
from prometheus_client import Counter, Histogram, Gauge

# 1. HTTP Request Latency & Status
HTTP_REQUEST_DURATION_SECONDS = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency distributions in seconds",
    ["method", "endpoint", "status_code"],
    buckets=[0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0]
)

# 2. Dependency Failures Counter
DEPENDENCY_ERRORS_TOTAL = Counter(
    "dependency_errors_total",
    "Total failures from third-party dependencies",
    ["dependency", "error_type"]
)

# 3. Fallback Path Invocations Counter
LLM_FALLBACK_TOTAL = Counter(
    "llm_fallback_total",
    "Count of LLM fallbacks triggered",
    ["reason"]
)

SCRAPER_FAILURE_TOTAL = Counter(
    "scraper_failure_total",
    "Count of scraper execution failures",
    ["scraper", "reason"]
)

SUPABASE_FAILURES_TOTAL = Counter(
    "supabase_failures_total",
    "Count of Supabase database connection and query failures",
    ["error_type"]
)

# 4. Circuit Breaker States Gauge (0 = Closed/Normal, 1 = Half-Open, 2 = Open/Tripped)
CIRCUIT_BREAKER_STATE = Gauge(
    "circuit_breaker_state",
    "Current state of circuit breakers",
    ["dependency"]
)

# Initialize defaults
CIRCUIT_BREAKER_STATE.labels(dependency="nvidia_nim").set(0)
CIRCUIT_BREAKER_STATE.labels(dependency="supabase").set(0)
