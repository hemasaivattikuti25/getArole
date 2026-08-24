"""
core/logging_config.py
Structured JSON Logger with PII Redaction and ContextVar Correlation ID.
"""
import json
import logging
import re
import contextvars
from datetime import datetime, timezone
from typing import Any, Dict

# Context variable to hold request_id across async tasks
request_id_ctx = contextvars.ContextVar("request_id", default="system")

class PIIRedactionFilter(logging.Filter):
    """Filter that masks emails, phone numbers, and bearer tokens in log messages."""
    
    EMAIL_REGEX = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
    BEARER_REGEX = re.compile(r'Bearer\s+[A-Za-z0-9._-]+', re.IGNORECASE)
    PHONE_REGEX = re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b')

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = self.EMAIL_REGEX.sub(r'***@redacted.email', record.msg)
            record.msg = self.BEARER_REGEX.sub('Bearer ***REDACTED***', record.msg)
            record.msg = self.PHONE_REGEX.sub('***-***-****', record.msg)
        return True

class JSONFormatter(logging.Formatter):
    """Format log records as structured JSON lines."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_obj: Dict[str, Any] = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_ctx.get(),
        }

        # Attach exception info if present
        if record.exc_info:
            log_obj["exception"] = self.formatException(record.exc_info)

        # Merge extra attributes if provided
        if hasattr(record, "extra") and isinstance(record.extra, dict):
            log_obj.update(record.extra)

        # Merge other standard record extra keys
        for key, val in record.__dict__.items():
            if key not in [
                "args", "asctime", "created", "exc_info", "exc_text", "filename",
                "funcName", "levelname", "levelno", "lineno", "module", "msecs",
                "message", "msg", "name", "pathname", "process", "processName",
                "relativeCreated", "stack_info", "thread", "threadName", "extra"
            ]:
                log_obj[key] = val

        return json.dumps(log_obj)

def configure_logging(level: int = logging.INFO):
    """Configure root logger with JSONFormatter and PII filter."""
    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    # Avoid duplicate handlers
    if not root_logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(JSONFormatter())
        handler.addFilter(PIIRedactionFilter())
        root_logger.addHandler(handler)
    else:
        for handler in root_logger.handlers:
            handler.setFormatter(JSONFormatter())
            handler.addFilter(PIIRedactionFilter())

    # Set external libraries to warning to reduce noise
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
