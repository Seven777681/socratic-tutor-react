import hashlib
import hmac
import json
import os
import re
import secrets
import sys
import uuid
from datetime import datetime, timedelta, timezone
from html import escape
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from database import database


EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
CODE_TTL = timedelta(minutes=10)
SEND_COOLDOWN = timedelta(seconds=60)
MAX_ATTEMPTS = 5


class VerificationError(Exception):
    def __init__(self, status_code: int, message: str):
        super().__init__(message)
        self.status_code = status_code
        self.message = message


def normalize_email(value: str) -> str:
    return value.strip().lower()


def _parse_datetime(value: str | datetime) -> datetime:
    if isinstance(value, datetime):
        parsed = value
    else:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed


def _verification_secret() -> str:
    secret = os.getenv("VERIFICATION_CODE_SECRET", "").strip()
    if len(secret) < 32:
        raise VerificationError(503, "Email verification is not configured.")
    return secret


def _code_hash(destination: str, code: str) -> str:
    payload = f"register:{destination}:{code}".encode("utf-8")
    return hmac.new(_verification_secret().encode("utf-8"), payload, hashlib.sha256).hexdigest()


def _latest_code(destination: str):
    rows = (
        database.table("verification_codes")
        .select("*")
        .eq("destination", destination)
        .eq("purpose", "register")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
        .data
    )
    return rows[0] if rows else None


def _send_with_resend(destination: str, code: str, record_id: str, language: str) -> None:
    api_key = os.getenv("RESEND_API_KEY", "").strip()
    sender = os.getenv("VERIFICATION_EMAIL_FROM", "").strip()
    if not api_key or not sender:
        raise VerificationError(503, "Email delivery is not configured.")

    safe_code = escape(code)
    is_chinese = language == "zh"
    subject = "苏格拉底式 AI 导师验证码" if is_chinese else "Your Socratic AI Tutor verification code"
    text = (
        f"你的验证码是 {code}，10 分钟内有效。如果不是你本人操作，请忽略此邮件。"
        if is_chinese
        else f"Your verification code is {code}. It expires in 10 minutes. If you did not request this code, ignore this email."
    )
    message_html = (
        ("<p>请使用以下验证码创建账户：</p>"
         f"<p style=\"font-size:32px;font-weight:800;letter-spacing:8px\">{safe_code}</p>"
         "<p>验证码将在 10 分钟后失效。如果不是你本人操作，请忽略此邮件。</p>")
        if is_chinese
        else ("<p>Use this verification code to create your account:</p>"
              f"<p style=\"font-size:32px;font-weight:800;letter-spacing:8px\">{safe_code}</p>"
              "<p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>")
    )
    payload = json.dumps({
        "from": sender,
        "to": [destination],
        "subject": subject,
        "text": text,
        "html": (
            "<div style=\"font-family:Arial,sans-serif;color:#172033;line-height:1.6\">"
            "<h2 style=\"color:#6255f6\">Socratic AI Tutor</h2>"
            f"{message_html}"
            "</div>"
        ),
    }).encode("utf-8")
    request = Request(
        "https://api.resend.com/emails",
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Idempotency-Key": f"registration-code/{record_id}",
        },
    )
    try:
        with urlopen(request, timeout=10) as response:
            if not 200 <= response.status < 300:
                raise VerificationError(502, "The verification email could not be sent.")
    except VerificationError:
        raise
    except (HTTPError, URLError, TimeoutError) as error:
        print(f"Resend verification email failed: {type(error).__name__}", file=sys.stderr)
        raise VerificationError(502, "The verification email could not be sent.") from error


def send_registration_code(value: str, language: str = "en") -> None:
    destination = normalize_email(value)
    if not EMAIL_PATTERN.fullmatch(destination):
        raise VerificationError(400, "Please enter a valid email address. Phone verification is not available yet.")

    now = datetime.now(timezone.utc)
    latest = _latest_code(destination)
    if latest:
        next_allowed = _parse_datetime(latest["last_sent_at"]) + SEND_COOLDOWN
        if next_allowed > now:
            seconds = max(1, int((next_allowed - now).total_seconds()) + 1)
            raise VerificationError(429, f"Please wait {seconds} seconds before requesting another code.")

    code = f"{secrets.randbelow(1_000_000):06d}"
    record_id = str(uuid.uuid4())
    database.table("verification_codes").insert({
        "id": record_id,
        "destination": destination,
        "purpose": "register",
        "code_hash": _code_hash(destination, code),
        "attempts": 0,
        "max_attempts": MAX_ATTEMPTS,
        "expires_at": (now + CODE_TTL).isoformat(),
        "last_sent_at": now.isoformat(),
        "created_at": now.isoformat(),
    }).execute()
    try:
        _send_with_resend(destination, code, record_id, "zh" if language == "zh" else "en")
    except VerificationError:
        database.table("verification_codes").update({"used_at": now.isoformat()}).eq("id", record_id).execute()
        raise


def verify_registration_code(value: str, code: str) -> str:
    destination = normalize_email(value)
    record = _latest_code(destination)
    now = datetime.now(timezone.utc)
    if not record or record.get("used_at"):
        raise VerificationError(400, "Invalid verification code.")
    if _parse_datetime(record["expires_at"]) <= now:
        raise VerificationError(400, "Verification code has expired. Please request a new one.")
    if record["attempts"] >= record["max_attempts"]:
        raise VerificationError(429, "Too many incorrect attempts. Please request a new code.")
    if not hmac.compare_digest(record["code_hash"], _code_hash(destination, code.strip())):
        attempts = record["attempts"] + 1
        database.table("verification_codes").update({"attempts": attempts}).eq("id", record["id"]).execute()
        if attempts >= record["max_attempts"]:
            raise VerificationError(429, "Too many incorrect attempts. Please request a new code.")
        raise VerificationError(400, "Invalid verification code.")
    return record["id"]


def consume_registration_code(record_id: str) -> None:
    database.table("verification_codes").update({
        "used_at": datetime.now(timezone.utc).isoformat(),
    }).eq("id", record_id).execute()
