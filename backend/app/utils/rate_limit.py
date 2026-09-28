"""Rate limits backed by Redis when configured, with local development fallback.

Set ``REDIS_URL`` in every multi-worker/production deployment. The old
in-process fallback is retained only for local development and tests.
Set ``REQUIRE_REDIS=true`` to make an unavailable Redis configuration fail
closed rather than silently weakening protections.
"""

import os
import threading
import time
import uuid
from collections import defaultdict, deque

try:  # Redis is optional locally but listed in production requirements.
    import redis
except ImportError:  # pragma: no cover - exercised only before dependencies install
    redis = None


_lock = threading.Lock()
_hits: dict[str, deque] = defaultdict(deque)
_redis_client = None
_redis_attempted = False

ACCOUNT_MAX_ATTEMPTS = 5
IP_MAX_ATTEMPTS = 10
WINDOW_SECONDS = 15 * 60
RESET_ACCOUNT_MAX_ATTEMPTS = 3
RESET_IP_MAX_ATTEMPTS = 8
RESET_WINDOW_SECONDS = 60 * 60
UPLOAD_MAX_ATTEMPTS = 30
UPLOAD_WINDOW_SECONDS = 60 * 60


def _redis():
    global _redis_client, _redis_attempted
    redis_url = os.getenv("REDIS_URL", "").strip()
    if not redis_url:
        return None
    if _redis_attempted:
        return _redis_client
    _redis_attempted = True
    try:
        if redis is None:
            raise RuntimeError("redis package is not installed")
        client = redis.Redis.from_url(redis_url, decode_responses=True, socket_connect_timeout=1)
        client.ping()
        _redis_client = client
        return client
    except Exception as exc:
        if os.getenv("REQUIRE_REDIS", "false").lower() == "true":
            raise RuntimeError("Redis is required for rate limiting but is unavailable") from exc
        return None


def rate_limit_backend() -> str:
    return "redis" if _redis() is not None else "in-memory"


def is_limited(key: str, max_attempts: int, window: int) -> bool:
    now = time.time()
    client = _redis()
    if client is not None:
        redis_key = f"nexus:rate:{key}"
        client.zremrangebyscore(redis_key, 0, now - window)
        return client.zcard(redis_key) >= max_attempts
    with _lock:
        dq = _hits[key]
        while dq and now - dq[0] > window:
            dq.popleft()
        return len(dq) >= max_attempts


def record_failure(key: str, window: int = RESET_WINDOW_SECONDS) -> None:
    now = time.time()
    client = _redis()
    if client is not None:
        redis_key = f"nexus:rate:{key}"
        client.zadd(redis_key, {f"{now}:{uuid.uuid4().hex}": now})
        client.zremrangebyscore(redis_key, 0, now - window)
        client.expire(redis_key, window)
        return
    with _lock:
        _hits[key].append(now)


def clear_failures(key: str) -> None:
    client = _redis()
    if client is not None:
        client.delete(f"nexus:rate:{key}")
        return
    with _lock:
        _hits.pop(key, None)


def reset_all() -> None:
    """Clear local test state. Tests never use a real Redis service."""
    with _lock:
        _hits.clear()


def login_key_for_account(email: str) -> str:
    return f"login:account:{email.strip().lower()}"


def login_key_for_ip(ip: str) -> str:
    return f"login:ip:{ip}"


def check_login_allowed(email: str, ip: str) -> str | None:
    if is_limited(login_key_for_ip(ip), IP_MAX_ATTEMPTS, WINDOW_SECONDS):
        return "Too many login attempts from this network. Try again later."
    if is_limited(login_key_for_account(email), ACCOUNT_MAX_ATTEMPTS, WINDOW_SECONDS):
        return "Too many failed attempts for this account. Try again later."
    return None


def record_failed_login(email: str, ip: str) -> None:
    record_failure(login_key_for_ip(ip), WINDOW_SECONDS)
    record_failure(login_key_for_account(email), WINDOW_SECONDS)


def record_successful_login(email: str, ip: str) -> None:
    clear_failures(login_key_for_ip(ip))
    clear_failures(login_key_for_account(email))


def reset_key_for_account(email: str) -> str:
    return f"password-reset:account:{email.strip().lower()}"


def reset_key_for_ip(ip: str) -> str:
    return f"password-reset:ip:{ip}"


def allow_password_reset_request(email: str, ip: str) -> bool:
    return not (
        is_limited(reset_key_for_account(email), RESET_ACCOUNT_MAX_ATTEMPTS, RESET_WINDOW_SECONDS)
        or is_limited(reset_key_for_ip(ip), RESET_IP_MAX_ATTEMPTS, RESET_WINDOW_SECONDS)
    )


def record_password_reset_request(email: str, ip: str) -> None:
    record_failure(reset_key_for_account(email), RESET_WINDOW_SECONDS)
    record_failure(reset_key_for_ip(ip), RESET_WINDOW_SECONDS)


def upload_key_for_user(user_id: int) -> str:
    return f"upload:user:{user_id}"


def allow_upload(user_id: int) -> bool:
    return not is_limited(upload_key_for_user(user_id), UPLOAD_MAX_ATTEMPTS, UPLOAD_WINDOW_SECONDS)


def record_upload(user_id: int) -> None:
    record_failure(upload_key_for_user(user_id), UPLOAD_WINDOW_SECONDS)
