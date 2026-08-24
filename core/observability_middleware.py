"""
core/observability_middleware.py
ASGI Middleware for Request ID Tracing, Prometheus Latency Recording, and Access Logging.
"""
import time
import uuid
import logging
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request, Response
from core.logging_config import request_id_ctx
from core.metrics import HTTP_REQUEST_DURATION_SECONDS

logger = logging.getLogger("sre.access")

class ObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # 1. Extract or generate correlation ID
        incoming_id = request.headers.get("X-Request-ID") or request.headers.get("x-request-id")
        request_id = incoming_id if incoming_id else str(uuid.uuid4())
        
        # Set ContextVar for structured logging throughout the async lifecycle
        token = request_id_ctx.set(request_id)
        request.state.request_id = request_id

        start_time = time.time()
        try:
            response: Response = await call_next(request)
        except Exception as exc:
            duration = time.time() - start_time
            endpoint = request.url.path
            HTTP_REQUEST_DURATION_SECONDS.labels(
                method=request.method,
                endpoint=endpoint,
                status_code="500"
            ).observe(duration)
            logger.exception(
                "unhandled_http_exception",
                extra={
                    "method": request.method,
                    "path": endpoint,
                    "duration_ms": round(duration * 1000, 2),
                    "error": str(exc),
                    "error_type": type(exc).__name__
                }
            )
            request_id_ctx.reset(token)
            raise exc

        duration = time.time() - start_time
        endpoint = request.url.path

        # 2. Record latency histogram in Prometheus
        HTTP_REQUEST_DURATION_SECONDS.labels(
            method=request.method,
            endpoint=endpoint,
            status_code=str(response.status_code)
        ).observe(duration)

        # 3. Attach X-Request-ID response header
        response.headers["X-Request-ID"] = request_id

        # 4. Content-Hash Aware Cache-Control Policy
        if "Cache-Control" not in response.headers:
            path = request.url.path
            import re
            if re.search(r'\.[a-f0-9]{8,}\.(js|css|woff2)$', path):
                response.headers["Cache-Control"] = "public, max-age=31536000, immutable"
            elif path.endswith(('.js', '.css')):
                response.headers["Cache-Control"] = "public, max-age=3600, must-revalidate"
            elif path.endswith(('.svg', '.png', '.jpg', '.ico', '.woff2')):
                response.headers["Cache-Control"] = "public, max-age=86400"
            elif path.startswith('/api/') or path.endswith(('.html', '/')) or path in ['/dashboard', '/explore', '/matches', '/profile', '/onboarding', '/candidate']:
                response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"

        # 4. Emit structured JSON access log
        logger.info(
            "http_request_completed",
            extra={
                "method": request.method,
                "path": endpoint,
                "status_code": response.status_code,
                "duration_ms": round(duration * 1000, 2),
                "client_ip": request.client.host if request.client else "unknown"
            }
        )

        request_id_ctx.reset(token)
        return response
