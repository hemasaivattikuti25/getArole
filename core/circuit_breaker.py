"""
core/circuit_breaker.py
Production-grade Asyncio-native Circuit Breaker for modern Python.
"""
import time
import asyncio
import logging
from typing import Callable, Any, Optional
from core.metrics import CIRCUIT_BREAKER_STATE, DEPENDENCY_ERRORS_TOTAL

logger = logging.getLogger("sre.circuit_breaker")

class CircuitBreakerOpenException(Exception):
    """Raised when an operation is attempted while the circuit breaker is OPEN."""
    pass

class AsyncCircuitBreaker:
    def __init__(
        self,
        name: str,
        fail_max: int = 3,
        reset_timeout: float = 30.0
    ):
        self.name = name
        self.fail_max = fail_max
        self.reset_timeout = reset_timeout
        self.failure_count = 0
        self.last_failure_time = 0.0
        self.state = "closed"  # "closed", "open", "half-open"
        self._lock = asyncio.Lock()
        
        # Initialize metric gauge
        CIRCUIT_BREAKER_STATE.labels(dependency=self.name).set(0)

    @property
    def is_open(self) -> bool:
        if self.state == "open":
            if time.time() - self.last_failure_time > self.reset_timeout:
                self.state = "half-open"
                CIRCUIT_BREAKER_STATE.labels(dependency=self.name).set(1)
                logger.info(f"CircuitBreaker[{self.name}] transition to HALF-OPEN")
                return False
            return True
        return False

    async def record_success(self):
        async with self._lock:
            self.failure_count = 0
            self.state = "closed"
            CIRCUIT_BREAKER_STATE.labels(dependency=self.name).set(0)

    async def record_failure(self, error: Optional[Exception] = None):
        async with self._lock:
            self.failure_count += 1
            self.last_failure_time = time.time()
            error_type = type(error).__name__ if error else "UnknownError"
            DEPENDENCY_ERRORS_TOTAL.labels(dependency=self.name, error_type=error_type).inc()

            if self.failure_count >= self.fail_max:
                self.state = "open"
                CIRCUIT_BREAKER_STATE.labels(dependency=self.name).set(2)
                logger.warning(
                    f"CircuitBreaker[{self.name}] TRIPPED to OPEN after {self.failure_count} failures. "
                    f"Reset timeout: {self.reset_timeout}s. Last error: {error_type}"
                )
