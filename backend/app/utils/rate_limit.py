"""In-memory sliding-window rate limiter used to protect login.

Intentionally simple: state lives in this process only, which is fine for
a single uvicorn worker. For a multi-worker deployment, swap the storage
for an external store (e.g. Redis) — the public functions stay the same.
"""
import threading
import time
from collections import defaultdict, deque

_lock = threading.Lock()
_hits: dict[str, deque] = defaultdict(deque)

# Login policy
ACCOUNT_MAX_ATTEMPTS = 5   # per email
IP_MAX_ATTEMPTS = 10       # per client IP
WINDOW_SECONDS = 15 * 60   # 15 minute window


def is_limited(key: str, max_attempts: int, window: int) -> bool:
    """True once `key` has accumulated >= max_attempts in the window."""
    now = time.time()
    with _lock:
        dq = _hits[key]
        while dq and now - dq[0] > window:
            dq.popleft()
        return len(dq) >= max_attempts


def record_failure(key: str) -> None:
    with _lock:
        _hits[key].append(time.time())


def clear_failures(key: str) -> None:
    with _lock:
        _hits.pop(key, None)


def reset_all() -> None:
    """Clear all state. Used by tests so attempts do not leak across tests."""
    with _lock:
        _hits.clear()


def login_key_for_account(email: str) -> str:
    return f"account:{email.strip().lower()}"


def login_key_for_ip(ip: str) -> str:
    return f"ip:{ip}"


def check_login_allowed(email: str, ip: str) -> str | None:
    """Return None if the attempt may proceed, else the block reason."""
    if is_limited(login_key_for_ip(ip), IP_MAX_ATTEMPTS, WINDOW_SECONDS):
        return "Too many login attempts from this network. Try again later."
    if is_limited(login_key_for_account(email), ACCOUNT_MAX_ATTEMPTS, WINDOW_SECONDS):
        return "Too many failed attempts for this account. Try again later."
    return None


def record_failed_login(email: str, ip: str) -> None:
    record_failure(login_key_for_ip(ip))
    record_failure(login_key_for_account(email))


def record_successful_login(email: str, ip: str) -> None:
    clear_failures(login_key_for_ip(ip))
    clear_failures(login_key_for_account(email))


# Password reset requests are deliberately stricter than sign-in failures.
# These keys use the shared, in-process limiter; production multi-worker
# deployments should move the same policy to Redis.
RESET_ACCOUNT_MAX_ATTEMPTS = 3
RESET_IP_MAX_ATTEMPTS = 8
RESET_WINDOW_SECONDS = 60 * 60


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
    record_failure(reset_key_for_account(email))
    record_failure(reset_key_for_ip(ip))
