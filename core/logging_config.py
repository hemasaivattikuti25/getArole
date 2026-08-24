"""
core/logging_config.py
Production-grade Structured JSON Logger with Comprehensive PII Redaction and ContextVar Correlation ID.
"""
import json
import logging
import re
import contextvars
from datetime import datetime, timezone
from typing import Any, Dict

# Context variable to hold request_id across async coroutines
request_id_ctx = contextvars.ContextVar("request_id", default="system")

class PIIRedactionFilter(logging.Filter):
    """
    Comprehensive PII Redaction Filter.
    Redacts Emails, Phone Numbers, SSNs, LinkedIn URLs, Street Addresses, and Bearer Tokens.
    Strips raw resume text and sensitive payload fields from log extras.
    """
    
    PATTERNS = [
        # Email addresses
        (re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'), '***@redacted.email'),
        # Phone numbers (US, international formats)
        (re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b'), '***-PHONE-REDACTED'),
        # SSN (Social Security Numbers)
        (re.compile(r'\b\d{3}[-.\s]\d{2}[-.\s]\d{4}\b'), '***-SSN-REDACTED'),
        # LinkedIn URLs
        (re.compile(r'https?://(?:www\.)?linkedin\.com/in/[\w-]+', re.IGNORECASE), 'https://linkedin.com/in/[REDACTED]'),
        # Street addresses (simple US street address pattern)
        (re.compile(r'\b\d+\s+[A-Za-z0-9\s.,]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way)\b', re.IGNORECASE), '[ADDRESS REDACTED]'),
        # Bearer tokens & API keys
        (re.compile(r'Bearer\s+[\w\-._~+/]+=*', re.IGNORECASE), 'Bearer [REDACTED]'),
        (re.compile(r'nvapi-[\w\-]+', re.IGNORECASE), 'nvapi-[REDACTED]'),
        (re.compile(r'sb_publishable_[\w\-]+', re.IGNORECASE), 'sb_publishable_[REDACTED]'),
    ]

    # Sensitive fields that must NEVER appear in log extras
    BLOCKED_FIELDS = {"resume_text", "cover_letter", "raw_resume", "raw_resume_text", "password", "api_key", "token"}

    def redact_text(self, text: str) -> str:
        """Helper to scrub text matching known PII patterns."""
        if not isinstance(text, str):
            return text
        for pattern, replacement in self.PATTERNS:
            text = pattern.sub(replacement, text)
        return text

    def filter(self, record: logging.LogRecord) -> bool:
        # 1. Scrub record message string
        if isinstance(record.msg, str):
            record.msg = self.redact_text(record.msg)

        # 2. Scrub record args if provided (preserving numeric types for %d formatters)
        if record.args:
            if isinstance(record.args, dict):
                record.args = {k: (f"[{k.upper()}_BLOCKED]" if k in self.BLOCKED_FIELDS else (self.redact_text(v) if isinstance(v, str) else v)) for k, v in record.args.items()}
            elif isinstance(record.args, tuple):
                record.args = tuple((self.redact_text(arg) if isinstance(arg, str) else arg) for arg in record.args)

        # 3. Block sensitive fields in record extra attributes
        if hasattr(record, "extra") and isinstance(record.extra, dict):
            for field in self.BLOCKED_FIELDS:
                if field in record.extra:
                    record.extra[field] = f"[{field.upper()}_BLOCKED]"
                elif isinstance(record.extra.get(field), str):
                    record.extra[field] = self.redact_text(record.extra[field])

        return True

class JSONFormatter(logging.Formatter):
    """Formats log records into ISO-8601 structured JSON lines."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_ctx.get(),
        }

        # Include exception trace if present
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)

        # Merge extra attributes if provided
        if hasattr(record, "extra") and isinstance(record.extra, dict):
            log_obj.update(record.extra)

        # Merge other standard custom attributes
        for key, val in record.__dict__.items():
            if key not in [
                "args", "asctime", "created", "exc_info", "exc_text", "filename",
                "funcName", "levelname", "levelno", "lineno", "module", "msecs",
                "message", "msg", "name", "pathname", "process", "processName",
                "relativeCreated", "stack_info", "thread", "threadName", "extra"
            ]:
                if key in PIIRedactionFilter.BLOCKED_FIELDS:
                    log_obj[key] = f"[{key.upper()}_BLOCKED]"
                else:
                    log_obj[key] = val

        return json.dumps(log_obj)

def configure_logging(level: int = logging.INFO):
    """Configure root logger with JSONFormatter and PII redaction filter."""
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    pii_filter = PIIRedactionFilter()
    formatter = JSONFormatter()

    if not root_logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(formatter)
        handler.addFilter(pii_filter)
        root_logger.addHandler(handler)
    else:
        for handler in root_logger.handlers:
            handler.setFormatter(formatter)
            handler.addFilter(pii_filter)

    # Attach filter to SRE loggers specifically
    for name in ["sre.access", "sre.database", "sre.security", "sre.llm", "sre.scrapers"]:
        l = logging.getLogger(name)
        l.addFilter(pii_filter)

    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
