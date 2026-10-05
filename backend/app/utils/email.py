"""Transactional email delivery through Resend.

This module intentionally uses Resend's HTTPS API through ``requests`` so
there is no SDK-specific behaviour hidden from the application. All secrets
remain on the backend; the frontend never receives a Resend API key.
"""
import logging
import os
from html import escape

import requests


logger = logging.getLogger(__name__)
RESEND_API_URL = "https://api.resend.com/emails"


def _settings() -> tuple[str | None, str | None]:
    return os.getenv("RESEND_API_KEY"), os.getenv("RESEND_FROM_EMAIL")


def _send_email(*, recipient: str, subject: str, html: str, purpose: str) -> bool:
    """Send a transactional email without letting delivery failure break a workflow."""
    api_key, sender = _settings()
    if not api_key or not sender:
        logger.warning("%s email was skipped because Resend is not configured", purpose)
        return False

    try:
        response = requests.post(
            RESEND_API_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "from": sender,
                "to": [recipient],
                "subject": subject,
                "html": html,
            },
            timeout=10,
        )
        response.raise_for_status()
        return True
    except requests.RequestException:
        logger.exception("Resend could not send %s email", purpose)
        return False


def send_password_reset_email(*, recipient: str, reset_url: str) -> bool:
    """Send a reset link and return whether Resend accepted the request.

    Delivery errors are logged server-side only. The password-reset endpoint
    intentionally stays generic so it never exposes account existence or
    email-provider configuration to a browser.
    """
    html = f"""
    <div style=\"font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#171717\">
      <h1 style=\"color:#e62929\">NEXUS</h1>
      <h2>Reset your password</h2>
      <p>We received a request to reset the password for your NEXUS account.</p>
      <p><a href=\"{reset_url}\" style=\"display:inline-block;background:#e62929;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold\">Reset password</a></p>
      <p>This link expires in 15 minutes and can be used once. If you did not request it, you can safely ignore this email.</p>
    </div>
    """
    return _send_email(
        recipient=recipient,
        subject="Reset your NEXUS password",
        html=html,
        purpose="password reset",
    )


def send_event_review_email(
    *,
    recipient: str,
    reviewer_name: str,
    event_title: str,
    organizer: str,
    schedule_summary: str,
    event_id: int,
) -> bool:
    """Tell a reviewer by email that a submitted event needs a decision.

    This is deliberately best-effort: the event request and its in-app
    notification are already committed before this function is scheduled.
    A temporary Resend outage must never prevent a coordinator submitting an
    event request.
    """
    frontend_url = os.getenv("FRONTEND_URL", "").rstrip("/")
    review_url = f"{frontend_url}/events/{event_id}" if frontend_url else None
    review_action = (
        f'<p><a href="{escape(review_url, quote=True)}" '
        'style="display:inline-block;background:#e62929;color:#fff;padding:12px 20px;'
        'border-radius:8px;text-decoration:none;font-weight:bold">Open request</a></p>'
        if review_url
        else ""
    )
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#171717">
      <h1 style="color:#e62929">NEXUS</h1>
      <h2>New event request awaiting review</h2>
      <p>Hello {escape(reviewer_name)},</p>
      <p><strong>{escape(event_title)}</strong> was submitted by {escape(organizer)} and needs your review.</p>
      <p style="padding:12px;background:#f5f5f5;border-radius:8px"><strong>Schedule</strong><br>{escape(schedule_summary)}</p>
      {review_action}
      <p style="color:#666">You can also review this request from your NEXUS dashboard.</p>
    </div>
    """
    return _send_email(
        recipient=recipient,
        subject=f"Review requested: {event_title}",
        html=html,
        purpose="event review",
    )
