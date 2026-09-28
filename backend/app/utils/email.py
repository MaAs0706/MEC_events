"""Transactional email delivery through Resend.

This module intentionally uses Resend's HTTPS API through ``requests`` so
there is no SDK-specific behaviour hidden from the application. All secrets
remain on the backend; the frontend never receives a Resend API key.
"""
import logging
import os

import requests


logger = logging.getLogger(__name__)
RESEND_API_URL = "https://api.resend.com/emails"


def _settings() -> tuple[str | None, str | None]:
    return os.getenv("RESEND_API_KEY"), os.getenv("RESEND_FROM_EMAIL")


def send_password_reset_email(*, recipient: str, reset_url: str) -> bool:
    """Send a reset link and return whether Resend accepted the request.

    Delivery errors are logged server-side only. The password-reset endpoint
    intentionally stays generic so it never exposes account existence or
    email-provider configuration to a browser.
    """
    api_key, sender = _settings()
    if not api_key or not sender:
        logger.warning("Password reset email was requested but Resend is not configured")
        return False

    html = f"""
    <div style=\"font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#171717\">
      <h1 style=\"color:#e62929\">NEXUS</h1>
      <h2>Reset your password</h2>
      <p>We received a request to reset the password for your NEXUS account.</p>
      <p><a href=\"{reset_url}\" style=\"display:inline-block;background:#e62929;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold\">Reset password</a></p>
      <p>This link expires in 15 minutes and can be used once. If you did not request it, you can safely ignore this email.</p>
    </div>
    """
    try:
        response = requests.post(
            RESEND_API_URL,
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "from": sender,
                "to": [recipient],
                "subject": "Reset your NEXUS password",
                "html": html,
            },
            timeout=10,
        )
        response.raise_for_status()
        return True
    except requests.RequestException:
        logger.exception("Resend could not send password reset email")
        return False
