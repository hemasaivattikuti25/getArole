# ==============================================================================
# getArole AI — Production Multi-Stage Hardened Dockerfile
# ==============================================================================
# Base Image: Python 3.11 Slim Bookworm (Minimal attack surface & CVE exposure)
# Security: Non-root user (UID 10001), Read-only root filesystem compatible
# ==============================================================================

# ── Stage 1: Build & Dependencies Compiler ────────────────────────────────────
FROM python:3.11-slim-bookworm AS builder

WORKDIR /build

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN python -m pip install --upgrade pip && \
    pip install --prefix=/install -r requirements.txt

# ── Stage 2: Hardened Runtime Container ────────────────────────────────────────
FROM python:3.11-slim-bookworm AS runtime

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    APP_ENV=production \
    PYTHONPATH=/app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy installed Python packages from builder stage
COPY --from=builder /install /usr/local

# Create non-root system user & group (UID: 10001)
RUN groupadd -g 10001 appgroup && \
    useradd -u 10001 -g appgroup -s /sbin/nologin -M appuser

# Copy application source code
COPY --chown=appuser:appgroup core/ ./core/
COPY --chown=appuser:appgroup domain/ ./domain/
COPY --chown=appuser:appgroup services/ ./services/
COPY --chown=appuser:appgroup scrapers/ ./scrapers/
COPY --chown=appuser:appgroup web/ ./web/
COPY --chown=appuser:appgroup main.py .

# Switch to non-root user
USER 10001:10001

# Expose HTTP port
EXPOSE 8000

# Container Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/healthz || exit 1

# Start enterprise production ASGI server
CMD ["uvicorn", "web.server:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2", "--proxy-headers", "--forwarded-allow-ips", "*"]
