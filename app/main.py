from __future__ import annotations

from copy import deepcopy
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock, Thread
from typing import Any
import base64
import hashlib
import hmac
import json
import mimetypes
import os
import re
import shutil
import urllib.error
import urllib.request
import uuid
import zipfile

import fitz
from fastapi import FastAPI, File, HTTPException, Request, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import ocr_preprocess as ocr
from app.processing import (
    ProcessingOptions,
    load_image_file,
    output_extension,
    preprocess_page_image,
    rasterize_pdf_page,
    save_image,
)


ROOT_DIR = Path(__file__).resolve().parent.parent
STATIC_DIR = ROOT_DIR / "app" / "static"
ASSET_DIR = ROOT_DIR / "app" / "asset"
DATA_DIR = ROOT_DIR / "data"
SESSIONS_DIR = DATA_DIR / "sessions"
GOOGLE_LOGIN_SETTINGS_FILE = DATA_DIR / "google_login_settings.json"
GOOGLE_VERIFIED_USERS_FILE = DATA_DIR / "google_verified_users.json"
VERSION_FILE = ROOT_DIR / "VERSION"
APP_SECRET = os.environ.get("WEBDOCTO_SECRET", "webdocto-dev-secret")
AUTH_COOKIE_NAME = "webdocto_auth"
GUEST_COOKIE_NAME = "webdocto_guest"
GOOGLE_IDENTITY_COOKIE_NAME = "webdocto_google_identity"
AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 14
SPECIAL_ADMIN_EMAILS = {"admin@gmail.com"}
DEFAULT_PUBLIC_WEB_ORIGIN = os.environ.get("PUBLIC_WEB_ORIGIN", "http://127.0.0.1:8000").strip() or "http://127.0.0.1:8000"
N8N_WEBHOOK_URL = os.environ.get(
    "N8N_WEBHOOK_URL",
    "https://n8n.sahapat.com:5678/webhook/WebDocToFolw",
)
DEFAULT_WEBHOOK_METHOD = "POST"
DEFAULT_WEBHOOK_BODY = json.dumps(
    {
        "session_id": "{{sessionId}}",
        "metadata": "{{metadata_json}}",
    },
    ensure_ascii=False,
    indent=2,
)
WEBHOOK_ALLOWED_METHODS = {"POST", "PUT", "PATCH"}
TEMPLATE_FULL_PATTERN = re.compile(r"^\s*{{\s*([a-zA-Z0-9_.]+)\s*}}\s*$")
TEMPLATE_TOKEN_PATTERN = re.compile(r"{{\s*([a-zA-Z0-9_.]+)\s*}}")

PHASE_LABELS = {
    "rendering_pdf": "converted PDF page to image",
    "normalizing_size": "normalized page size",
    "cropping_document": "cropped document area",
    "deskewing_document": "deskewed document",
    "detecting_document_profile": "analyzed page profile",
    "cleanup_document": "cleaned colored artifacts",
    "grayscale_document": "converted page to grayscale",
    "visual_cleanup": "built clean preview image",
    "denoise_document": "reduced image noise",
    "enhance_document": "enhanced contrast",
    "scoring_ocr_candidates": "scored OCR candidate",
}

PHASE_PROGRESS = {
    "rendering_pdf": 8.0,
    "normalizing_size": 18.0,
    "cropping_document": 28.0,
    "deskewing_document": 38.0,
    "detecting_document_profile": 48.0,
    "cleanup_document": 58.0,
    "grayscale_document": 66.0,
    "visual_cleanup": 74.0,
    "denoise_document": 82.0,
    "enhance_document": 90.0,
    "scoring_ocr_candidates": 94.0,
}

OCR_CANDIDATE_ORDER = [
    "clean",
    "otsu_threshold",
    "adaptive_threshold",
    "dark_text",
    "digit_focus",
]

SUPPORTED_IMAGE_SUFFIXES = {
    ".png",
    ".jpg",
    ".jpeg",
    ".bmp",
    ".tif",
    ".tiff",
    ".webp",
}

sessions_lock = Lock()
sessions: dict[str, dict[str, Any]] = {}


def load_app_version() -> str:
    env_version = str(os.environ.get("APP_VERSION", "") or "").strip()
    if env_version:
        return env_version
    try:
        file_version = VERSION_FILE.read_text(encoding="utf-8").strip()
    except OSError:
        file_version = ""
    return file_version or "1.0.0"


APP_VERSION = load_app_version()


class WebhookConfigPayload(BaseModel):
    url: str = ""
    method: str = DEFAULT_WEBHOOK_METHOD
    body: str = DEFAULT_WEBHOOK_BODY


class StartProcessingPayload(BaseModel):
    webhook: WebhookConfigPayload | None = None


class GoogleLoginSettingsPayload(BaseModel):
    enabled: bool = False
    clientId: str = ""
    clientSecret: str = ""
    javaScriptOrigin: str = ""
    redirectUri: str = ""
    loginUrl: str = ""
    successUrl: str = ""
    adminEmailList: str = ""


class LoginPayload(BaseModel):
    email: str
    name: str = ""
    source: str = "email"
    password: str = ""
    googleAccessToken: str = ""

app = FastAPI(
    title="PDF OCR Preprocessor",
    version=APP_VERSION,
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
app.mount("/asset", StaticFiles(directory=ASSET_DIR), name="asset")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def datetime_from_timestamp(timestamp: float) -> str:
    return datetime.fromtimestamp(timestamp, tz=timezone.utc).isoformat()


def humanize_uploaded_filename(filename: str) -> str:
    cleaned = re.sub(r"^\d+-", "", filename)
    suffix = Path(cleaned).suffix
    stem = Path(cleaned).stem.replace("_", " ")
    return f"{stem}{suffix}" if suffix else stem


def default_webhook_config() -> dict[str, str]:
    return {
        "url": N8N_WEBHOOK_URL.strip(),
        "method": DEFAULT_WEBHOOK_METHOD,
        "body": DEFAULT_WEBHOOK_BODY,
    }


def default_google_login_settings() -> dict[str, Any]:
    enabled_env = str(os.environ.get("GOOGLE_LOGIN_ENABLED", "") or "").strip().lower()
    origin = str(os.environ.get("GOOGLE_JAVASCRIPT_ORIGIN", "") or "").strip() or DEFAULT_PUBLIC_WEB_ORIGIN
    redirect_uri = str(os.environ.get("GOOGLE_REDIRECT_URI", "") or "").strip() or f"{DEFAULT_PUBLIC_WEB_ORIGIN}/login/oauth2/code/google"
    login_url = str(os.environ.get("GOOGLE_LOGIN_URL", "") or "").strip() or f"{DEFAULT_PUBLIC_WEB_ORIGIN}/#login-google"
    success_url = str(os.environ.get("GOOGLE_LOGIN_SUCCESS_URL", "") or "").strip() or f"{DEFAULT_PUBLIC_WEB_ORIGIN}/#dashboard"
    return {
        "enabled": enabled_env in {"1", "true", "yes", "on"},
        "clientId": str(os.environ.get("GOOGLE_CLIENT_ID", "") or "").strip(),
        "clientSecret": str(os.environ.get("GOOGLE_CLIENT_SECRET", "") or ""),
        "javaScriptOrigin": origin,
        "redirectUri": redirect_uri,
        "loginUrl": login_url,
        "successUrl": success_url,
        "adminEmailList": str(os.environ.get("GOOGLE_ADMIN_EMAIL_LIST", "") or "").replace("\r\n", "\n"),
    }


def normalize_google_login_settings(data: dict[str, Any] | None = None) -> dict[str, Any]:
    defaults = default_google_login_settings()
    data = data or {}
    return {
        "enabled": bool(data.get("enabled", defaults["enabled"])),
        "clientId": str(data.get("clientId", defaults["clientId"]) or "").strip(),
        "clientSecret": str(data.get("clientSecret", defaults["clientSecret"]) or ""),
        "javaScriptOrigin": str(data.get("javaScriptOrigin", defaults["javaScriptOrigin"]) or "").strip(),
        "redirectUri": str(data.get("redirectUri", defaults["redirectUri"]) or "").strip(),
        "loginUrl": str(data.get("loginUrl", defaults["loginUrl"]) or "").strip(),
        "successUrl": str(data.get("successUrl", defaults["successUrl"]) or "").strip(),
        "adminEmailList": str(data.get("adminEmailList", defaults["adminEmailList"]) or "").replace("\r\n", "\n"),
    }


def load_google_verified_users() -> dict[str, dict[str, Any]]:
    if not GOOGLE_VERIFIED_USERS_FILE.exists():
        return {}
    try:
        payload = json.loads(GOOGLE_VERIFIED_USERS_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return {}
    if not isinstance(payload, dict):
        return {}

    normalized: dict[str, dict[str, Any]] = {}
    for raw_email, raw_meta in payload.items():
        email = str(raw_email or "").strip().lower()
        if not email:
            continue
        meta = raw_meta if isinstance(raw_meta, dict) else {}
        normalized[email] = {
            "name": str(meta.get("name", "") or "").strip(),
            "verifiedAt": str(meta.get("verifiedAt", "") or "").strip(),
        }
    return normalized


def save_google_verified_users(users: dict[str, dict[str, Any]]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    GOOGLE_VERIFIED_USERS_FILE.write_text(
        json.dumps(users, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def mark_google_user_verified(email: str, name: str = "") -> None:
    normalized_email = str(email or "").strip().lower()
    if not normalized_email:
        return
    users = load_google_verified_users()
    users[normalized_email] = {
        "name": str(name or "").strip(),
        "verifiedAt": now_iso(),
    }
    save_google_verified_users(users)


def is_google_verified_user(email: str) -> bool:
    normalized_email = str(email or "").strip().lower()
    if not normalized_email:
        return False
    return normalized_email in load_google_verified_users()


def public_google_login_settings(data: dict[str, Any] | None = None) -> dict[str, Any]:
    normalized = normalize_google_login_settings(data)
    return {
        "enabled": bool(normalized.get("enabled", False)),
        "clientId": str(normalized.get("clientId", "") or "").strip(),
        "javaScriptOrigin": str(normalized.get("javaScriptOrigin", "") or "").strip(),
        "redirectUri": str(normalized.get("redirectUri", "") or "").strip(),
        "loginUrl": str(normalized.get("loginUrl", "") or "").strip(),
        "successUrl": str(normalized.get("successUrl", "") or "").strip(),
    }


def load_google_login_settings() -> dict[str, Any]:
    if not GOOGLE_LOGIN_SETTINGS_FILE.exists():
        return default_google_login_settings()
    try:
        raw = json.loads(GOOGLE_LOGIN_SETTINGS_FILE.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return default_google_login_settings()
    if not isinstance(raw, dict):
        return default_google_login_settings()
    return normalize_google_login_settings(raw)


def persist_google_login_settings(settings: dict[str, Any]) -> dict[str, Any]:
    normalized = normalize_google_login_settings(settings)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    GOOGLE_LOGIN_SETTINGS_FILE.write_text(
        json.dumps(normalized, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return normalized


def sign_cookie_payload(payload: dict[str, Any]) -> str:
    body = json.dumps(payload, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    signature = hmac.new(APP_SECRET.encode("utf-8"), body, hashlib.sha256).digest()
    return (
        base64.urlsafe_b64encode(body).decode("ascii").rstrip("=")
        + "."
        + base64.urlsafe_b64encode(signature).decode("ascii").rstrip("=")
    )


def decode_cookie_component(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def unsign_cookie_payload(token: str | None) -> dict[str, Any] | None:
    if not token or "." not in token:
        return None
    encoded_body, encoded_signature = token.split(".", 1)
    try:
        body = decode_cookie_component(encoded_body)
        signature = decode_cookie_component(encoded_signature)
    except Exception:
        return None
    expected = hmac.new(APP_SECRET.encode("utf-8"), body, hashlib.sha256).digest()
    if not hmac.compare_digest(signature, expected):
        return None
    try:
        payload = json.loads(body.decode("utf-8"))
    except json.JSONDecodeError:
        return None
    return payload if isinstance(payload, dict) else None


def set_signed_cookie(
    response: Response,
    name: str,
    payload: dict[str, Any],
    *,
    max_age: int | None = None,
) -> None:
    response.set_cookie(
        key=name,
        value=sign_cookie_payload(payload),
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=max_age,
        path="/",
    )


def clear_signed_cookie(response: Response, name: str) -> None:
    response.delete_cookie(key=name, path="/")


def get_authenticated_user(request: Request) -> dict[str, Any] | None:
    payload = unsign_cookie_payload(request.cookies.get(AUTH_COOKIE_NAME))
    if not payload:
        return None
    email = str(payload.get("email", "") or "").strip().lower()
    if not email:
        return None
    name = str(payload.get("name", "") or "").strip()
    role = str(payload.get("role", "user") or "user").strip().lower()
    if role not in {"admin", "user"}:
        role = "user"
    return {
        "email": email,
        "name": name,
        "role": role,
    }


def get_google_identity(request: Request) -> dict[str, Any] | None:
    payload = unsign_cookie_payload(request.cookies.get(GOOGLE_IDENTITY_COOKIE_NAME))
    if not payload:
        return None
    email = str(payload.get("email", "") or "").strip().lower()
    if not email:
        return None
    name = str(payload.get("name", "") or "").strip()
    return {
        "email": email,
        "name": name,
    }


def get_guest_id(request: Request) -> str | None:
    payload = unsign_cookie_payload(request.cookies.get(GUEST_COOKIE_NAME))
    guest_id = str((payload or {}).get("guestId", "") or "").strip()
    return guest_id or None


def require_admin_user(request: Request) -> dict[str, Any]:
    user = get_authenticated_user(request)
    if not user or str(user.get("role", "")).strip().lower() != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")
    return user


def ensure_guest_id(request: Request, response: Response) -> str:
    guest_id = get_guest_id(request)
    if guest_id:
        return guest_id
    guest_id = uuid.uuid4().hex
    set_signed_cookie(response, GUEST_COOKIE_NAME, {"guestId": guest_id})
    return guest_id


def clear_guest_cookie(response: Response) -> None:
    clear_signed_cookie(response, GUEST_COOKIE_NAME)


def get_admin_email_list() -> list[str]:
    raw_value = str(load_google_login_settings().get("adminEmailList", "") or "")
    configured = [
        value.strip().lower()
        for value in raw_value.splitlines()
        if value.strip()
    ]
    return sorted(set(configured).union(SPECIAL_ADMIN_EMAILS))


def get_user_role_by_email(email: str) -> str:
    normalized_email = str(email or "").strip().lower()
    if not normalized_email:
        return "user"
    return "admin" if normalized_email in get_admin_email_list() else "user"


def build_user_payload(email: str, name: str = "") -> dict[str, Any]:
    normalized_email = str(email or "").strip().lower()
    display_name = str(name or "").strip() or normalized_email.split("@")[0]
    return {
        "email": normalized_email,
        "name": display_name,
        "role": get_user_role_by_email(normalized_email),
    }


def fetch_google_userinfo(access_token: str) -> dict[str, Any]:
    normalized_token = str(access_token or "").strip()
    if not normalized_token:
        raise HTTPException(status_code=400, detail="Google access token is required.")
    request = urllib.request.Request(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        headers={"Authorization": f"Bearer {normalized_token}"},
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise HTTPException(status_code=401, detail="Google access token is invalid.") from exc
    except (urllib.error.URLError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=502, detail="Unable to verify Google account.") from exc
    if not isinstance(payload, dict):
        raise HTTPException(status_code=502, detail="Unable to verify Google account.")
    email = str(payload.get("email", "") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Google account did not provide an email address.")
    return {
        "email": email,
        "name": str(payload.get("name", "") or "").strip(),
    }


def normalize_webhook_method(value: str | None) -> str:
    method = str(value or DEFAULT_WEBHOOK_METHOD).strip().upper()
    if method not in WEBHOOK_ALLOWED_METHODS:
        raise HTTPException(
            status_code=400,
            detail=f"Webhook method must be one of: {', '.join(sorted(WEBHOOK_ALLOWED_METHODS))}.",
        )
    return method


def normalize_webhook_config(config: dict[str, Any] | None = None) -> dict[str, str]:
    defaults = default_webhook_config()
    config = config or {}
    return {
        "url": str(config.get("url", defaults["url"]) or "").strip(),
        "method": normalize_webhook_method(config.get("method", defaults["method"])),
        "body": str(config.get("body", defaults["body"]) or "").strip(),
    }


def webhook_config_enabled(config: dict[str, Any] | None) -> bool:
    return bool(str((config or {}).get("url", "") or "").strip())


def template_lookup(context: dict[str, Any], key: str) -> Any:
    current: Any = context
    for part in key.split("."):
        if isinstance(current, dict) and part in current:
            current = current[part]
            continue
        return ""
    return current


def stringify_template_value(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value)


def render_template_string(template: str, context: dict[str, Any]) -> Any:
    full_match = TEMPLATE_FULL_PATTERN.match(template)
    if full_match:
        return template_lookup(context, full_match.group(1))

    return TEMPLATE_TOKEN_PATTERN.sub(
        lambda match: stringify_template_value(template_lookup(context, match.group(1))),
        template,
    )


def render_template_payload(payload: Any, context: dict[str, Any]) -> Any:
    if isinstance(payload, dict):
        return {str(key): render_template_payload(value, context) for key, value in payload.items()}
    if isinstance(payload, list):
        return [render_template_payload(value, context) for value in payload]
    if isinstance(payload, str):
        return render_template_string(payload, context)
    return payload


def build_webhook_template_context(
    metadata: dict[str, Any],
    file_record: dict[str, Any],
    processed_filename: str,
    ocr_meta: dict[str, Any],
) -> dict[str, Any]:
    return {
        **metadata,
        "metadata": metadata,
        "metadata_json": json.dumps(metadata, ensure_ascii=False),
        "page": metadata.get("page", {}),
        "file": {
            "id": file_record.get("id", ""),
            "name": file_record.get("name", ""),
            "storedName": file_record.get("storedName", ""),
            "pages": file_record.get("pages", 0),
            "status": file_record.get("status", ""),
            "progress": file_record.get("progress", 0),
        },
        "processedFilename": processed_filename,
        "ocr": ocr_meta,
    }


def resolve_webhook_body_fields(
    body_template: str,
    context: dict[str, Any],
) -> dict[str, Any]:
    if not str(body_template or "").strip():
        return {}

    try:
        payload = json.loads(body_template)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Webhook body must be valid JSON: {exc.msg}.",
        ) from exc

    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=400,
            detail="Webhook body must be a JSON object.",
        )

    rendered = render_template_payload(payload, context)
    if not isinstance(rendered, dict):
        raise HTTPException(
            status_code=400,
            detail="Webhook body must render to a JSON object.",
        )
    return rendered


def phase_progress_value(phase: str, candidate: str = "") -> float:
    base_progress = PHASE_PROGRESS.get(phase, 0.0)
    if phase != "scoring_ocr_candidates":
        return base_progress

    candidate_count = max(len(OCR_CANDIDATE_ORDER), 1)
    try:
        candidate_index = OCR_CANDIDATE_ORDER.index(candidate)
    except ValueError:
        candidate_index = 0

    return round(base_progress + (candidate_index / candidate_count) * 5.0, 1)


def build_page_items(page_count: int) -> list[dict[str, Any]]:
    return [
        {
            "id": uuid.uuid4().hex[:12],
            "pageNumber": page_number,
            "status": "waiting",
            "progress": 0.0,
            "detailPhase": "Waiting",
            "originalUrl": "",
            "processedUrl": "",
            "downloadUrl": "",
            "webhookResponseJson": None,
            "webhookResponseRaw": "",
            "webhookHttpStatus": None,
            "ocrConfidence": 0.0,
            "ocrCandidate": "",
            "ocrScore": 0.0,
            "documentProfile": "",
            "deskewAngle": 0.0,
            "backgroundSaturation": 0.0,
            "error": "",
        }
        for page_number in range(1, page_count + 1)
    ]


def is_supported_image_suffix(suffix: str) -> bool:
    return suffix.lower() in SUPPORTED_IMAGE_SUFFIXES


def is_supported_upload_path(file_path: Path) -> bool:
    suffix = file_path.suffix.lower()
    return suffix == ".pdf" or is_supported_image_suffix(suffix)


async def store_uploaded_pdf(
    destination_dir: Path,
    upload: UploadFile,
    sequence_number: int,
) -> tuple[dict[str, Any], int]:
    original_name = Path(upload.filename or f"upload-{sequence_number}.pdf").name
    suffix = Path(original_name).suffix.lower()
    if suffix != ".pdf":
        raise HTTPException(status_code=400, detail=f"{original_name} is not a PDF file.")

    stored_name = f"{sequence_number:02d}-{ocr.ascii_safe_stem(Path(original_name).stem)}.pdf"
    destination = destination_dir / stored_name
    file_bytes = await upload.read()
    destination.write_bytes(file_bytes)
    await upload.close()

    try:
        document = fitz.open(destination)
        page_count = len(document)
        document.close()
    except Exception as exc:
        destination.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail=f"Unable to read {original_name} as PDF: {exc}",
        ) from exc

    return {
        "id": uuid.uuid4().hex[:12],
        "name": original_name,
        "storedName": stored_name,
        "sourceType": "pdf",
        "size": len(file_bytes),
        "pages": page_count,
        "status": "waiting",
        "progress": 0,
        "sourcePath": str(destination),
        "pageItems": build_page_items(page_count),
    }, page_count


async def store_uploaded_image(
    destination_dir: Path,
    upload: UploadFile,
    sequence_number: int,
) -> tuple[dict[str, Any], int]:
    original_name = Path(upload.filename or f"upload-{sequence_number}.png").name
    suffix = Path(original_name).suffix.lower()
    if not is_supported_image_suffix(suffix):
        raise HTTPException(status_code=400, detail=f"{original_name} is not a supported image file.")

    stored_name = f"{sequence_number:02d}-{ocr.ascii_safe_stem(Path(original_name).stem)}{suffix}"
    destination = destination_dir / stored_name
    file_bytes = await upload.read()
    destination.write_bytes(file_bytes)
    await upload.close()

    try:
        load_image_file(destination)
    except Exception as exc:
        destination.unlink(missing_ok=True)
        raise HTTPException(
            status_code=400,
            detail=f"Unable to read {original_name} as image: {exc}",
        ) from exc

    return {
        "id": uuid.uuid4().hex[:12],
        "name": original_name,
        "storedName": stored_name,
        "sourceType": "image",
        "size": len(file_bytes),
        "pages": 1,
        "status": "waiting",
        "progress": 0,
        "sourcePath": str(destination),
        "pageItems": build_page_items(1),
    }, 1


async def store_uploaded_document(
    destination_dir: Path,
    upload: UploadFile,
    sequence_number: int,
) -> tuple[dict[str, Any], int]:
    original_name = Path(upload.filename or f"upload-{sequence_number}").name
    suffix = Path(original_name).suffix.lower()
    if suffix == ".pdf":
        return await store_uploaded_pdf(destination_dir, upload, sequence_number)
    if is_supported_image_suffix(suffix):
        return await store_uploaded_image(destination_dir, upload, sequence_number)
    raise HTTPException(
        status_code=400,
        detail=f"{original_name} is not a supported file. Upload PDF, PNG, JPG, JPEG, BMP, TIFF, or WEBP.",
    )


def session_paths(session_id: str) -> dict[str, Path]:
    root = SESSIONS_DIR / session_id
    return {
        "root": root,
        "uploads": root / "uploads",
        "original": root / "original",
        "processed": root / "processed",
        "downloads": root / "downloads",
        "metadata": root / "session.json",
    }


def ensure_session_dirs(session_id: str) -> dict[str, Path]:
    paths = session_paths(session_id)
    for key, path in paths.items():
        if key == "metadata":
            continue
        path.mkdir(parents=True, exist_ok=True)
    return paths


def serialize_session_for_disk(session: dict[str, Any]) -> dict[str, Any]:
    snapshot = deepcopy(session)
    for file_record in snapshot.get("files", []):
        file_record.pop("sourcePath", None)
        for page_item in file_record.get("pageItems", []):
            page_item.pop("lastPhase", None)
    return snapshot


def persist_session_snapshot(session_snapshot: dict[str, Any]) -> None:
    session_id = session_snapshot.get("sessionId")
    if not session_id:
        return
    if not bool(session_snapshot.get("persistent", False)):
        return

    paths = ensure_session_dirs(session_id)
    payload = serialize_session_for_disk(session_snapshot)
    paths["metadata"].write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def load_session_metadata(session_id: str) -> dict[str, Any] | None:
    metadata_path = session_paths(session_id)["metadata"]
    if not metadata_path.exists():
        return None

    try:
        return json.loads(metadata_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None


def session_is_owned_by(session: dict[str, Any], user: dict[str, Any] | None, guest_id: str | None) -> bool:
    owner_email = str(session.get("ownerEmail", "") or "").strip().lower()
    owner_guest_id = str(session.get("ownerGuestId", "") or "").strip()
    if owner_email:
        return bool(user and owner_email == user.get("email", "").strip().lower())
    if owner_guest_id:
        return bool(guest_id and owner_guest_id == guest_id)
    return False


def require_session_access(request: Request, session_id: str) -> dict[str, Any]:
    auth_user = get_authenticated_user(request)
    guest_id = get_guest_id(request)
    with sessions_lock:
        session = sessions.get(session_id)
        if session is not None:
            if not session_is_owned_by(session, auth_user, guest_id):
                raise HTTPException(status_code=404, detail="Session not found.")
            return session

    metadata = load_session_metadata(session_id)
    if metadata is not None:
        if not session_is_owned_by(metadata, auth_user, guest_id):
            raise HTTPException(status_code=404, detail="Session not found.")
        return metadata

    raise HTTPException(status_code=404, detail="Session not found.")


def cleanup_session_artifacts(session_id: str) -> None:
    shutil.rmtree(session_paths(session_id)["root"], ignore_errors=True)


def cleanup_guest_sessions_for_guest(guest_id: str | None) -> int:
    if not guest_id:
        return 0
    deleted_ids: list[str] = []
    with sessions_lock:
        for session_id, session in list(sessions.items()):
            if str(session.get("ownerGuestId", "") or "").strip() != guest_id:
                continue
            deleted_ids.append(session_id)
            sessions.pop(session_id, None)
    for session_id in deleted_ids:
        cleanup_session_artifacts(session_id)
    return len(deleted_ids)


def delete_owned_history(
    user: dict[str, Any] | None,
    guest_id: str | None,
) -> int:
    deleted_count = 0
    owned_session_ids: list[str] = []
    owned_guest_roots: list[Path] = []

    with sessions_lock:
        active_processing = [
            session_id
            for session_id, session in sessions.items()
            if session.get("status") == "processing" and session_is_owned_by(session, user, guest_id)
        ]
        if active_processing:
            raise HTTPException(status_code=409, detail="Cannot clear history while processing is running.")

        for session_id, session in list(sessions.items()):
            if not session_is_owned_by(session, user, guest_id):
                continue
            owned_session_ids.append(session_id)
            if not bool(session.get("persistent", False)):
                owned_guest_roots.append(session_paths(session_id)["root"])
            sessions.pop(session_id, None)

    for session_id in owned_session_ids:
        metadata = load_session_metadata(session_id)
        if metadata is not None:
            cleanup_session_artifacts(session_id)
            deleted_count += 1

    for root in owned_guest_roots:
        if root.exists():
            shutil.rmtree(root, ignore_errors=True)
            deleted_count += 1

    if user and SESSIONS_DIR.exists():
        owner_email = str(user.get("email", "") or "").strip().lower()
        for path in list(SESSIONS_DIR.iterdir()):
            if not path.is_dir():
                continue
            metadata = load_session_metadata(path.name) or {}
            if str(metadata.get("ownerEmail", "") or "").strip().lower() != owner_email:
                continue
            if path.exists():
                shutil.rmtree(path, ignore_errors=True)
                deleted_count += 1

    return deleted_count


def find_file_record(session: dict[str, Any], file_id: str) -> dict[str, Any] | None:
    for file_record in session["files"]:
        if file_record["id"] == file_id:
            return file_record
    return None


def append_log(session_id: str, message: str, level: str = "info") -> None:
    session_snapshot: dict[str, Any] | None = None
    with sessions_lock:
        session = sessions.get(session_id)
        if session is None:
            return

        session["logs"].append(
            {
                "timestamp": now_iso(),
                "level": level,
                "message": message,
            }
        )
        session["logs"] = session["logs"][-250:]
        session_snapshot = deepcopy(session)

    if session_snapshot is not None:
        persist_session_snapshot(session_snapshot)


def reset_file_queue_state(file_records: list[dict[str, Any]]) -> None:
    for file_record in file_records:
        file_record["status"] = "waiting"
        file_record["progress"] = 0
        for page_item in file_record["pageItems"]:
            page_item.update(
                {
                    "status": "waiting",
                    "progress": 0.0,
                    "detailPhase": "Waiting",
                    "originalUrl": "",
                    "processedUrl": "",
                    "downloadUrl": "",
                    "webhookResponseJson": None,
                    "webhookResponseRaw": "",
                    "webhookHttpStatus": None,
                    "ocrConfidence": 0.0,
                    "ocrCandidate": "",
                    "ocrScore": 0.0,
                    "documentProfile": "",
                    "deskewAngle": 0.0,
                    "backgroundSaturation": 0.0,
                    "error": "",
                    "lastPhase": "",
                }
            )


def reset_single_file_state(file_record: dict[str, Any]) -> None:
    reset_file_queue_state([file_record])


def file_needs_processing(file_record: dict[str, Any]) -> bool:
    return any(page_item["status"] in {"waiting", "failed"} for page_item in file_record["pageItems"])


def recalculate_progress(session: dict[str, Any]) -> None:
    total_pages = 0
    completed_pages = 0
    failed_pages = 0

    for file_record in session["files"]:
        page_items = file_record["pageItems"]
        page_count = len(page_items)
        total_pages += page_count
        completed = sum(1 for item in page_items if item["status"] == "completed")
        failed = sum(1 for item in page_items if item["status"] == "failed")
        completed_pages += completed
        failed_pages += failed
        page_units = 0.0
        for item in page_items:
            if item["status"] in {"completed", "failed"}:
                page_units += 1.0
            elif item["status"] == "processing":
                page_units += min(max(float(item.get("progress", 0.0)), 0.0), 99.9) / 100.0

        file_record["progress"] = round((page_units / page_count) * 100, 1) if page_count else 0.0

        if page_count == 0:
            file_record["status"] = "waiting"
        elif any(item["status"] == "processing" for item in page_items):
            file_record["status"] = "processing"
        elif failed == page_count:
            file_record["status"] = "failed"
        elif completed == page_count:
            file_record["status"] = "completed"
        elif completed > 0 or failed > 0:
            file_record["status"] = "processing"
        else:
            file_record["status"] = "waiting"

    session["totalPages"] = total_pages
    session["completedPages"] = completed_pages
    session["failedPages"] = failed_pages


def sanitize_session(session: dict[str, Any]) -> dict[str, Any]:
    public = deepcopy(session)
    public.pop("ownerEmail", None)
    public.pop("ownerName", None)
    public.pop("ownerRole", None)
    public.pop("ownerGuestId", None)
    public.pop("persistent", None)

    for file_record in public["files"]:
        file_record.pop("sourcePath", None)
        for page_item in file_record["pageItems"]:
            page_item.pop("lastPhase", None)

    return public


def build_webhook_metadata(session: dict[str, Any]) -> dict[str, Any]:
    return {
        "sessionId": session["sessionId"],
        "createdAt": session["createdAt"],
        "status": session["status"],
        "totalPages": session["totalPages"],
        "completedPages": session["completedPages"],
        "failedPages": session["failedPages"],
        "options": session.get("options"),
        "files": [
            {
                "name": file_record["name"],
                "pages": file_record["pages"],
                "status": file_record["status"],
                "progress": file_record["progress"],
            }
            for file_record in session["files"]
        ],
    }


def build_page_webhook_metadata(
    session: dict[str, Any],
    file_record: dict[str, Any],
    page_number: int,
    processed_filename: str,
    ocr_meta: dict[str, Any],
) -> dict[str, Any]:
    metadata = build_webhook_metadata(session)
    metadata["page"] = {
        "sourceFileName": file_record["name"],
        "pageNumber": page_number,
        "processedFilename": processed_filename,
        "ocrConfidence": ocr_meta.get("ocrConfidence", 0.0),
        "ocrCandidate": ocr_meta.get("ocrCandidate", ""),
        "ocrScore": ocr_meta.get("ocrScore", 0.0),
        "documentProfile": ocr_meta.get("documentProfile", ""),
        "deskewAngle": ocr_meta.get("deskewAngle", 0.0),
        "backgroundSaturation": ocr_meta.get("backgroundSaturation", 0.0),
    }
    return metadata


def get_session_or_404(session_id: str) -> dict[str, Any]:
    with sessions_lock:
        session = sessions.get(session_id)
        if session is None:
            raise HTTPException(status_code=404, detail="Session not found.")
        return sanitize_session(session)


def update_page_state(
    session_id: str,
    file_id: str,
    page_number: int,
    **changes: Any,
) -> None:
    session_snapshot: dict[str, Any] | None = None
    with sessions_lock:
        session = sessions.get(session_id)
        if session is None:
            return

        for file_record in session["files"]:
            if file_record["id"] != file_id:
                continue

            for page_item in file_record["pageItems"]:
                if page_item["pageNumber"] == page_number:
                    page_item.update(changes)
                    break

            break

        recalculate_progress(session)
        session_snapshot = deepcopy(session)

    if session_snapshot is not None:
        persist_session_snapshot(session_snapshot)


def handle_progress_event(session_id: str, file_id: str, filename: str, payload: dict) -> None:
    page_number = int(payload.get("pageNumber", 0))
    phase = payload.get("phase", "")
    phase_label = PHASE_LABELS.get(phase, phase.replace("_", " "))
    candidate = payload.get("candidate")
    progress_value = phase_progress_value(phase, candidate)

    session_snapshot: dict[str, Any] | None = None
    with sessions_lock:
        session = sessions.get(session_id)
        if session is None:
            return

        page_item: dict[str, Any] | None = None
        for file_record in session["files"]:
            if file_record["id"] != file_id:
                continue
            for item in file_record["pageItems"]:
                if item["pageNumber"] == page_number:
                    page_item = item
                    break
            break

        if page_item is None:
            return

        if page_item.get("lastPhase") == phase:
            return

        page_item["lastPhase"] = phase
        page_item["detailPhase"] = phase_label
        page_item["progress"] = progress_value
        page_item["status"] = "processing"
        recalculate_progress(session)
        session_snapshot = deepcopy(session)

    if session_snapshot is not None:
        persist_session_snapshot(session_snapshot)

    message = f"{filename} page {page_number}: {phase_label}"
    if candidate:
        message += f" ({candidate})"
    append_log(session_id, message)


def create_zip_archive(session_id: str) -> str | None:
    paths = ensure_session_dirs(session_id)
    processed_dir = paths["processed"]
    if not processed_dir.exists():
        return None

    zip_name = f"{session_id}-processed-images.zip"
    zip_path = paths["downloads"] / zip_name

    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for file_path in sorted(processed_dir.iterdir()):
            if file_path.is_file():
                archive.write(file_path, arcname=file_path.name)

    return f"/api/download/{session_id}/zip"


def build_history_item_from_session_snapshot(session: dict[str, Any]) -> dict[str, Any]:
    total_size = sum(int(file_record.get("size", 0)) for file_record in session["files"])
    updated_at = session.get("createdAt", now_iso())
    if session.get("logs"):
        updated_at = session["logs"][-1].get("timestamp", updated_at)
    history_pages: list[dict[str, Any]] = []

    for file_record in session["files"]:
        for page_item in file_record.get("pageItems", []):
            history_pages.append(
                {
                    "id": f"{session['sessionId']}-{file_record.get('id', 'file')}-{page_item.get('pageNumber', 0)}",
                    "pageNumber": page_item.get("pageNumber", 0),
                    "status": page_item.get("status", "waiting"),
                    "detailPhase": page_item.get("detailPhase", "Waiting"),
                    "originalUrl": page_item.get("originalUrl", ""),
                    "processedUrl": page_item.get("processedUrl", ""),
                    "webhookResponseJson": page_item.get("webhookResponseJson"),
                    "webhookResponseRaw": page_item.get("webhookResponseRaw", ""),
                    "webhookHttpStatus": page_item.get("webhookHttpStatus"),
                    "ocrConfidence": page_item.get("ocrConfidence", 0.0),
                    "ocrCandidate": page_item.get("ocrCandidate", ""),
                    "documentProfile": page_item.get("documentProfile", ""),
                    "deskewAngle": page_item.get("deskewAngle", 0.0),
                    "fileName": file_record.get("name", "Document"),
                }
            )

    return {
        "sessionId": session["sessionId"],
        "createdAt": session.get("createdAt", updated_at),
        "updatedAt": updated_at,
        "status": session.get("status", "uploaded"),
        "fileCount": len(session["files"]),
        "totalPages": session.get("totalPages", 0),
        "completedPages": session.get("completedPages", 0),
        "failedPages": session.get("failedPages", 0),
        "processedPages": session.get("completedPages", 0),
        "totalSize": total_size,
        "fileNames": [file_record.get("name", "") for file_record in session["files"]],
        "existsOnDisk": session_paths(session["sessionId"])["root"].exists(),
        "pages": history_pages,
    }


def build_history_item_from_disk(session_id: str) -> dict[str, Any] | None:
    paths = session_paths(session_id)
    root = paths["root"]
    if not root.exists() or not root.is_dir():
        return None

    metadata_snapshot = load_session_metadata(session_id)
    if metadata_snapshot is not None:
        history_item = build_history_item_from_session_snapshot(metadata_snapshot)
        history_item["existsOnDisk"] = True
        return history_item

    uploads_dir = paths["uploads"]
    processed_dir = paths["processed"]
    upload_files = (
        sorted(path for path in uploads_dir.iterdir() if path.is_file() and is_supported_upload_path(path))
        if uploads_dir.exists()
        else []
    )
    processed_files = [path for path in processed_dir.iterdir() if path.is_file()] if processed_dir.exists() else []
    original_dir = paths["original"]
    original_files = [path for path in original_dir.iterdir() if path.is_file()] if original_dir.exists() else []

    total_pages = 0
    total_size = 0
    file_names: list[str] = []
    created_candidates: list[float] = []

    for upload_path in upload_files:
        total_size += upload_path.stat().st_size
        file_names.append(humanize_uploaded_filename(upload_path.name))
        created_candidates.append(upload_path.stat().st_mtime)
        if upload_path.suffix.lower() == ".pdf":
            try:
                document = fitz.open(upload_path)
                total_pages += len(document)
                document.close()
            except Exception:
                continue
        else:
            total_pages += 1

    root_stat = root.stat()
    created_at = datetime_from_timestamp(min(created_candidates)) if created_candidates else datetime_from_timestamp(root_stat.st_mtime)
    updated_at = datetime_from_timestamp(root_stat.st_mtime)
    processed_pages = len(processed_files)

    if processed_pages <= 0:
        status = "uploaded"
    elif total_pages > 0 and processed_pages >= total_pages:
        status = "completed"
    else:
        status = "processing"

    history_pages: list[dict[str, Any]] = []
    for upload_path in upload_files:
        stored_stem = upload_path.stem
        display_name = humanize_uploaded_filename(upload_path.name)
        page_total = 0
        if upload_path.suffix.lower() == ".pdf":
            try:
                document = fitz.open(upload_path)
                page_total = len(document)
                document.close()
            except Exception:
                page_total = 0
        else:
            page_total = 1

        for page_number in range(1, page_total + 1):
            base_name = f"{stored_stem}-page-{page_number:03d}"
            original_match = next(original_dir.glob(f"{base_name}-original.*"), None) if original_dir.exists() else None
            processed_match = next(processed_dir.glob(f"{base_name}-ocr.*"), None) if processed_dir.exists() else None
            if processed_match is not None:
                status = "completed"
                detail_phase = "Completed"
            elif original_match is not None:
                status = "uploaded"
                detail_phase = "Uploaded"
            else:
                status = "waiting"
                detail_phase = "Waiting"

            history_pages.append(
                {
                    "id": f"{session_id}-{stored_stem}-{page_number}",
                    "pageNumber": page_number,
                    "status": status,
                    "detailPhase": detail_phase,
                    "originalUrl": f"/api/files/{session_id}/original/{original_match.name}" if original_match is not None else "",
                    "processedUrl": f"/api/files/{session_id}/processed/{processed_match.name}" if processed_match is not None else "",
                    "webhookResponseJson": None,
                    "webhookResponseRaw": "",
                    "webhookHttpStatus": None,
                    "ocrConfidence": 0.0,
                    "ocrCandidate": "",
                    "documentProfile": "",
                    "deskewAngle": 0.0,
                    "fileName": display_name,
                }
            )

    return {
        "sessionId": session_id,
        "createdAt": created_at,
        "updatedAt": updated_at,
        "status": status,
        "fileCount": len(upload_files),
        "totalPages": total_pages,
        "completedPages": processed_pages,
        "failedPages": 0,
        "processedPages": processed_pages,
        "totalSize": total_size,
        "fileNames": file_names,
        "existsOnDisk": True,
        "pages": history_pages,
    }


def list_history_items(user: dict[str, Any] | None, guest_id: str | None) -> list[dict[str, Any]]:
    with sessions_lock:
        session_snapshots = {
            session_id: deepcopy(session)
            for session_id, session in sessions.items()
            if session_is_owned_by(session, user, guest_id)
        }

    history_map: dict[str, dict[str, Any]] = {}
    for session_id, snapshot in session_snapshots.items():
        history_map[session_id] = build_history_item_from_session_snapshot(snapshot)

    if user and SESSIONS_DIR.exists():
        for directory in SESSIONS_DIR.iterdir():
            if not directory.is_dir():
                continue
            if directory.name in history_map:
                history_map[directory.name]["existsOnDisk"] = True
                continue

            history_item = build_history_item_from_disk(directory.name)
            if history_item is not None and str((load_session_metadata(directory.name) or {}).get("ownerEmail", "") or "").strip().lower() == user.get("email", "").strip().lower():
                history_map[directory.name] = history_item

    return sorted(
        history_map.values(),
        key=lambda item: item.get("updatedAt") or item.get("createdAt") or "",
        reverse=True,
    )


def parse_webhook_response_payload(response_text: str) -> Any:
    if not response_text:
        return None

    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        return None


def send_file_to_webhook(
    webhook_config: dict[str, Any],
    file_path: Path,
    metadata: dict[str, Any],
    file_record: dict[str, Any],
    processed_filename: str,
    ocr_meta: dict[str, Any],
) -> tuple[int, str]:
    boundary = f"----WebDocToBoundary{uuid.uuid4().hex}"
    file_name = file_path.name
    mime_type = mimetypes.guess_type(file_name)[0] or "application/octet-stream"
    template_context = build_webhook_template_context(
        metadata,
        file_record,
        processed_filename,
        ocr_meta,
    )
    body_fields = resolve_webhook_body_fields(
        str(webhook_config.get("body", "") or ""),
        template_context,
    )

    body = bytearray()

    def add_text_field(name: str, value: str) -> None:
        body.extend(f"--{boundary}\r\n".encode("ascii"))
        body.extend(
            f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode("ascii")
        )
        body.extend(value.encode("utf-8"))
        body.extend(b"\r\n")

    for field_name, field_value in body_fields.items():
        add_text_field(field_name, stringify_template_value(field_value))

    body.extend(f"--{boundary}\r\n".encode("ascii"))
    body.extend(
        (
            f'Content-Disposition: form-data; name="file"; filename="{file_name}"\r\n'
            f"Content-Type: {mime_type}\r\n\r\n"
        ).encode("utf-8")
    )
    body.extend(file_path.read_bytes())
    body.extend(b"\r\n")
    body.extend(f"--{boundary}--\r\n".encode("ascii"))

    request = urllib.request.Request(
        str(webhook_config.get("url", "") or ""),
        data=bytes(body),
        method=str(webhook_config.get("method", DEFAULT_WEBHOOK_METHOD) or DEFAULT_WEBHOOK_METHOD),
        headers={
            "Content-Type": f"multipart/form-data; boundary={boundary}",
            "Content-Length": str(len(body)),
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = response.read(100_000).decode("utf-8", "ignore")
            return response.status, payload
    except urllib.error.HTTPError as exc:
        payload = exc.read(100_000).decode("utf-8", "ignore")
        return exc.code, payload


def process_page_image_for_session(
    *,
    session_id: str,
    file_record: dict[str, Any],
    page_number: int,
    page_count: int,
    rgb: Any,
    base_name: str,
    original_path: Path,
    processed_path: Path,
    original_filename: str,
    processed_filename: str,
    options: ProcessingOptions,
) -> None:
    update_page_state(
        session_id,
        file_record["id"],
        page_number,
        status="processing",
        progress=phase_progress_value("rendering_pdf"),
        detailPhase="Rendering page image",
    )
    append_log(session_id, f"{file_record['name']} page {page_number}: rendering page image")

    save_image(rgb, original_path, options.output_format)
    update_page_state(
        session_id,
        file_record["id"],
        page_number,
        originalUrl=f"/api/files/{session_id}/original/{original_filename}",
    )

    processed_image, meta = preprocess_page_image(
        rgb,
        page_number,
        page_count,
        processed_filename,
        options,
        progress_callback=lambda payload, sid=session_id, fid=file_record["id"], fn=file_record["name"]: handle_progress_event(
            sid,
            fid,
            fn,
            payload,
        ),
    )
    save_image(processed_image, processed_path, options.output_format)

    update_page_state(
        session_id,
        file_record["id"],
        page_number,
        status="completed",
        progress=100.0,
        detailPhase="Completed",
        processedUrl=f"/api/files/{session_id}/processed/{processed_filename}",
        downloadUrl=f"/api/files/{session_id}/processed/{processed_filename}",
        ocrConfidence=meta.get("ocrConfidence", 0.0),
        ocrCandidate=meta.get("ocrCandidate", ""),
        ocrScore=meta.get("ocrScore", 0.0),
        documentProfile=meta.get("documentProfile", ""),
        deskewAngle=meta.get("deskewAngle", 0.0),
        backgroundSaturation=meta.get("backgroundSaturation", 0.0),
    )
    append_log(
        session_id,
        f"{file_record['name']} page {page_number}: preprocessing completed",
    )

    with sessions_lock:
        live_session = deepcopy(sessions.get(session_id, {}))

    webhook_config = normalize_webhook_config(live_session.get("webhookConfig"))
    if webhook_config_enabled(webhook_config):
        append_log(
            session_id,
            f"{file_record['name']} page {page_number}: sending image to webhook",
        )
        try:
            metadata = build_page_webhook_metadata(
                live_session,
                file_record,
                page_number,
                processed_filename,
                meta,
            )
            status_code, response_preview = send_file_to_webhook(
                webhook_config,
                processed_path,
                metadata,
                file_record,
                processed_filename,
                meta,
            )
            is_success = 200 <= status_code < 300
            response_json = parse_webhook_response_payload(response_preview)
            append_log(
                session_id,
                f"{file_record['name']} page {page_number}: webhook HTTP {status_code}",
                level="info" if is_success else "error",
            )
            if response_preview:
                append_log(
                    session_id,
                    f"{file_record['name']} page {page_number}: webhook response preview: {response_preview[:240]}",
                    level="info" if is_success else "error",
                )

            with sessions_lock:
                session = sessions.get(session_id)
                if session is not None:
                    if is_success:
                        session["webhookSentCount"] = session.get("webhookSentCount", 0) + 1
                    else:
                        session["webhookFailedCount"] = session.get("webhookFailedCount", 0) + 1
                    session["webhookLastFile"] = processed_filename
                    session["webhookHttpStatus"] = status_code
                    for live_file in session["files"]:
                        if live_file["id"] != file_record["id"]:
                            continue
                        for live_page in live_file["pageItems"]:
                            if live_page["pageNumber"] != page_number:
                                continue
                            live_page["webhookHttpStatus"] = status_code
                            live_page["webhookResponseRaw"] = response_preview
                            live_page["webhookResponseJson"] = response_json
                            break
                        break
                    session_snapshot = deepcopy(session)
                else:
                    session_snapshot = None
            if session_snapshot is not None:
                persist_session_snapshot(session_snapshot)
        except Exception as exc:
            append_log(
                session_id,
                f"{file_record['name']} page {page_number}: failed to send image to webhook - {exc}",
                level="error",
            )
            with sessions_lock:
                session = sessions.get(session_id)
                if session is not None:
                    session["webhookFailedCount"] = session.get("webhookFailedCount", 0) + 1
                    session["webhookLastFile"] = processed_filename
                    session["webhookError"] = str(exc)
                    for live_file in session["files"]:
                        if live_file["id"] != file_record["id"]:
                            continue
                        for live_page in live_file["pageItems"]:
                            if live_page["pageNumber"] != page_number:
                                continue
                            live_page["webhookHttpStatus"] = None
                            live_page["webhookResponseRaw"] = str(exc)
                            live_page["webhookResponseJson"] = None
                            break
                        break
                    session_snapshot = deepcopy(session)
                else:
                    session_snapshot = None
            if session_snapshot is not None:
                persist_session_snapshot(session_snapshot)


def process_session_job(session_id: str, options: ProcessingOptions) -> None:
    paths = ensure_session_dirs(session_id)
    ext = output_extension(options.output_format)

    for key in ("original", "processed", "downloads"):
        paths[key].mkdir(parents=True, exist_ok=True)
    shutil.rmtree(paths["downloads"], ignore_errors=True)
    paths["downloads"].mkdir(parents=True, exist_ok=True)

    append_log(session_id, "Processing started.")

    with sessions_lock:
        session = sessions.get(session_id)
        if session is None:
            return
        webhook_config = normalize_webhook_config(session.get("webhookConfig"))
        session["status"] = "processing"
        session["options"] = {
            "dpi": options.dpi,
            "outputFormat": options.output_format,
            "generateZip": options.generate_zip,
            "processor": "ocr_preprocess.py",
        }
        files_to_process = [file_record for file_record in session["files"] if file_needs_processing(file_record)]
        for file_record in files_to_process:
            reset_single_file_state(file_record)
        session["webhookStatus"] = "sending" if webhook_config_enabled(webhook_config) else "disabled"
        session["webhookSentCount"] = 0
        session["webhookFailedCount"] = 0
        session["webhookLastFile"] = ""
        recalculate_progress(session)

    with sessions_lock:
        file_records = deepcopy(
            [file_record for file_record in sessions.get(session_id, {}).get("files", []) if file_needs_processing(file_record)]
        )

    had_failures = False

    for file_record in file_records:
        append_log(session_id, f"Started processing {file_record['name']}.")

        source_stem = ocr.ascii_safe_stem(Path(file_record["storedName"]).stem)
        if file_record.get("sourceType") == "image":
            page_number = 1
            base_name = f"{source_stem}-page-{page_number:03d}"
            original_filename = f"{base_name}-original.{ext}"
            processed_filename = f"{base_name}-ocr.{ext}"
            original_path = paths["original"] / original_filename
            processed_path = paths["processed"] / processed_filename

            try:
                rgb = load_image_file(Path(file_record["sourcePath"]))
                process_page_image_for_session(
                    session_id=session_id,
                    file_record=file_record,
                    page_number=page_number,
                    page_count=1,
                    rgb=rgb,
                    base_name=base_name,
                    original_path=original_path,
                    processed_path=processed_path,
                    original_filename=original_filename,
                    processed_filename=processed_filename,
                    options=options,
                )
            except Exception as exc:
                had_failures = True
                update_page_state(
                    session_id,
                    file_record["id"],
                    page_number,
                    status="failed",
                    progress=100.0,
                    detailPhase="Failed",
                    error=str(exc),
                )
                append_log(
                    session_id,
                    f"{file_record['name']} page {page_number}: failed - {exc}",
                    level="error",
                )
            continue

        try:
            document = fitz.open(file_record["sourcePath"])
        except Exception as exc:
            had_failures = True
            append_log(session_id, f"Failed to open {file_record['name']}: {exc}", level="error")
            with sessions_lock:
                session = sessions.get(session_id)
                if session is not None:
                    for live_file in session["files"]:
                        if live_file["id"] == file_record["id"]:
                            live_file["status"] = "failed"
                            break
            continue

        for page_index, page in enumerate(document):
            page_number = page_index + 1
            base_name = f"{source_stem}-page-{page_number:03d}"
            original_filename = f"{base_name}-original.{ext}"
            processed_filename = f"{base_name}-ocr.{ext}"
            original_path = paths["original"] / original_filename
            processed_path = paths["processed"] / processed_filename

            try:
                rgb = rasterize_pdf_page(page, options.dpi)
                process_page_image_for_session(
                    session_id=session_id,
                    file_record=file_record,
                    page_number=page_number,
                    page_count=len(document),
                    rgb=rgb,
                    base_name=base_name,
                    original_path=original_path,
                    processed_path=processed_path,
                    original_filename=original_filename,
                    processed_filename=processed_filename,
                    options=options,
                )
            except Exception as exc:
                had_failures = True
                update_page_state(
                    session_id,
                    file_record["id"],
                    page_number,
                    status="failed",
                    progress=100.0,
                    detailPhase="Failed",
                    error=str(exc),
                )
                append_log(
                    session_id,
                    f"{file_record['name']} page {page_number}: failed - {exc}",
                    level="error",
                )

        document.close()

    zip_url = ""
    if options.generate_zip:
        zip_url = create_zip_archive(session_id) or ""
        zip_path = session_paths(session_id)["downloads"] / f"{session_id}-processed-images.zip"
        if zip_path.exists():
            append_log(session_id, "ZIP file generated.")

    sent_count = 0
    failed_count = 0
    session_snapshot: dict[str, Any] | None = None
    with sessions_lock:
        session = sessions.get(session_id)
        if session is None:
            return
        recalculate_progress(session)
        session["status"] = "failed" if had_failures and session["completedPages"] == 0 else "completed"
        session["zipUrl"] = zip_url if options.generate_zip else ""
        session["zipReady"] = bool(zip_url) and options.generate_zip
        if webhook_config_enabled(session.get("webhookConfig")):
            sent_count = session.get("webhookSentCount", 0)
            failed_count = session.get("webhookFailedCount", 0)
            session["webhookStatus"] = "failed" if failed_count > 0 else "completed"
        session_snapshot = deepcopy(session)

    if session_snapshot is not None:
        persist_session_snapshot(session_snapshot)

    if sent_count:
        append_log(session_id, f"Sent {sent_count} processed image(s) to webhook.")
    if failed_count:
        append_log(
            session_id,
            f"Failed to send {failed_count} processed image(s) to webhook.",
            level="error",
        )

    if had_failures:
        append_log(session_id, "Processing completed with some failed pages.", level="error")
    else:
        append_log(session_id, "Processing completed successfully.")


@app.on_event("startup")
def startup_event() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    SESSIONS_DIR.mkdir(parents=True, exist_ok=True)
    for directory in list(SESSIONS_DIR.iterdir()):
        if not directory.is_dir():
            continue
        metadata = load_session_metadata(directory.name)
        if metadata is None:
            shutil.rmtree(directory, ignore_errors=True)


@app.get("/")
def read_index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/oauth2/authorization/google")
def compat_google_login_entry() -> RedirectResponse:
    return RedirectResponse(url="/#login-google", status_code=307)


@app.get("/login/oauth2/code/google")
def compat_google_login_callback() -> RedirectResponse:
    return RedirectResponse(url="/#dashboard", status_code=307)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "version": APP_VERSION}


@app.get("/api/version")
def get_app_version() -> dict[str, str]:
    return {"version": APP_VERSION}


@app.get("/api/auth/me")
def get_current_user(request: Request) -> dict[str, Any]:
    user = get_authenticated_user(request)
    return {"user": user}


@app.post("/api/auth/login")
def login_user(request: Request, payload: LoginPayload, response: Response) -> dict[str, Any]:
    cleanup_guest_sessions_for_guest(get_guest_id(request))
    normalized_source = str(payload.source or "email").strip().lower()
    normalized_email = str(payload.email or "").strip().lower()
    if normalized_source == "google":
        google_profile = fetch_google_userinfo(payload.googleAccessToken)
        user = build_user_payload(google_profile["email"], google_profile["name"])
        mark_google_user_verified(user["email"], user["name"])
    else:
        if normalized_email not in SPECIAL_ADMIN_EMAILS and not is_google_verified_user(normalized_email):
            trusted_identity = get_google_identity(request)
            trusted_email = str((trusted_identity or {}).get("email", "") or "").strip().lower()
            if trusted_email == normalized_email:
                mark_google_user_verified(
                    normalized_email,
                    str((trusted_identity or {}).get("name", "") or "").strip(),
                )
            else:
                raise HTTPException(
                    status_code=403,
                    detail="This email has never signed in with Google on this system. Please continue with Google first.",
                )
        user = build_user_payload(payload.email, payload.name)
    set_signed_cookie(response, AUTH_COOKIE_NAME, user, max_age=AUTH_COOKIE_MAX_AGE)
    if normalized_source == "google":
        set_signed_cookie(
            response,
            GOOGLE_IDENTITY_COOKIE_NAME,
            {"email": user["email"], "name": user["name"]},
            max_age=AUTH_COOKIE_MAX_AGE,
        )
    clear_guest_cookie(response)
    return {"user": user}


@app.post("/api/auth/logout")
def logout_user(request: Request, response: Response) -> dict[str, Any]:
    clear_signed_cookie(response, AUTH_COOKIE_NAME)
    deleted_count = cleanup_guest_sessions_for_guest(get_guest_id(request))
    clear_guest_cookie(response)
    return {"ok": True, "deletedGuestSessions": deleted_count}


@app.post("/api/auth/guest-exit")
def guest_exit(request: Request, response: Response) -> dict[str, Any]:
    deleted_count = cleanup_guest_sessions_for_guest(get_guest_id(request))
    clear_guest_cookie(response)
    return {"ok": True, "deletedGuestSessions": deleted_count}


@app.get("/api/settings/google-login")
def get_google_login_settings(request: Request) -> dict[str, Any]:
    require_admin_user(request)
    return load_google_login_settings()


@app.get("/api/public/google-login")
def get_public_google_login_settings() -> dict[str, Any]:
    return public_google_login_settings(load_google_login_settings())


@app.put("/api/settings/google-login")
def update_google_login_settings(request: Request, payload: GoogleLoginSettingsPayload) -> dict[str, Any]:
    require_admin_user(request)
    return persist_google_login_settings(payload.model_dump())


@app.post("/api/upload")
async def upload_documents(
    request: Request,
    response: Response,
    files: list[UploadFile] = File(...),
) -> dict[str, Any]:
    if not files:
        raise HTTPException(status_code=400, detail="Please upload at least one PDF or image file.")

    session_id = uuid.uuid4().hex[:12]
    paths = ensure_session_dirs(session_id)

    file_records: list[dict[str, Any]] = []
    total_pages = 0

    for index, upload in enumerate(files, start=1):
        file_record, page_count = await store_uploaded_document(paths["uploads"], upload, index)
        total_pages += page_count
        file_records.append(file_record)

    webhook_config = default_webhook_config()
    auth_user = get_authenticated_user(request)
    guest_id = None if auth_user else ensure_guest_id(request, response)
    session = {
        "sessionId": session_id,
        "createdAt": now_iso(),
        "ownerEmail": auth_user["email"] if auth_user else "",
        "ownerName": auth_user["name"] if auth_user else "",
        "ownerRole": auth_user["role"] if auth_user else "user",
        "ownerGuestId": guest_id or "",
        "persistent": bool(auth_user),
        "status": "uploaded",
        "totalPages": total_pages,
        "completedPages": 0,
        "failedPages": 0,
        "zipReady": False,
        "zipUrl": "",
        "webhookStatus": "pending" if webhook_config_enabled(webhook_config) else "disabled",
        "webhookUrl": webhook_config["url"],
        "webhookConfig": webhook_config,
        "webhookSentCount": 0,
        "webhookFailedCount": 0,
        "webhookLastFile": "",
        "webhookHttpStatus": None,
        "webhookError": "",
        "options": None,
        "files": file_records,
        "logs": [
            {
                "timestamp": now_iso(),
                "level": "info",
                "message": f"Uploaded {len(file_records)} file(s) successfully.",
            }
        ],
    }

    with sessions_lock:
        sessions[session_id] = session

    if session["persistent"]:
        persist_session_snapshot(session)
    return sanitize_session(session)


@app.post("/api/upload/{session_id}")
async def append_documents(
    request: Request,
    session_id: str,
    files: list[UploadFile] = File(...),
) -> dict[str, Any]:
    if not files:
        raise HTTPException(status_code=400, detail="Please upload at least one PDF or image file.")

    require_session_access(request, session_id)
    paths = ensure_session_dirs(session_id)

    with sessions_lock:
        session = sessions.get(session_id)
        if session is None:
            raise HTTPException(status_code=404, detail="Session not found.")
        if session["status"] == "processing":
            raise HTTPException(status_code=409, detail="Cannot add files while processing is running.")
        existing_file_count = len(session["files"])

    new_records: list[dict[str, Any]] = []

    for offset, upload in enumerate(files, start=1):
        file_record, page_count = await store_uploaded_document(
            paths["uploads"],
            upload,
            existing_file_count + offset,
        )
        new_records.append(file_record)

    with sessions_lock:
        session = sessions.get(session_id)
        if session is None:
            raise HTTPException(status_code=404, detail="Session not found.")

        session["files"].extend(new_records)
        webhook_config = normalize_webhook_config(session.get("webhookConfig"))
        session["status"] = "uploaded"
        session["zipReady"] = False
        session["zipUrl"] = ""
        session["webhookStatus"] = "pending" if webhook_config_enabled(webhook_config) else "disabled"
        session["webhookSentCount"] = 0
        session["webhookFailedCount"] = 0
        session["webhookLastFile"] = ""
        session["webhookHttpStatus"] = None
        session["webhookError"] = ""
        recalculate_progress(session)

    persist_session_snapshot(session)
    append_log(
        session_id,
        f"Added {len(new_records)} more file(s) to the queue.",
    )
    return get_session_or_404(session_id)


@app.post("/api/process/{session_id}")
def start_processing(request: Request, session_id: str, payload: StartProcessingPayload | None = None) -> dict[str, Any]:
    options = ProcessingOptions()
    session_snapshot: dict[str, Any] | None = None
    session_access = require_session_access(request, session_id)
    is_admin = bool(str(session_access.get("ownerRole", "") or "").strip().lower() == "admin")
    with sessions_lock:
        session = sessions.get(session_id)
        if session is None:
            raise HTTPException(status_code=404, detail="Session not found.")
        if session["status"] == "processing":
            raise HTTPException(status_code=409, detail="This session is already processing.")
        if not any(file_needs_processing(file_record) for file_record in session["files"]):
            raise HTTPException(status_code=409, detail="No pending files to process.")

        webhook_config = normalize_webhook_config(
            payload.webhook.model_dump()
            if is_admin and payload and payload.webhook is not None
            else session.get("webhookConfig")
        )
        if webhook_config.get("body"):
            try:
                parsed_body = json.loads(webhook_config["body"])
            except json.JSONDecodeError as exc:
                raise HTTPException(
                    status_code=400,
                    detail=f"Webhook body must be valid JSON: {exc.msg}.",
                ) from exc
            if not isinstance(parsed_body, dict):
                raise HTTPException(status_code=400, detail="Webhook body must be a JSON object.")

        session["webhookConfig"] = webhook_config
        session["webhookUrl"] = webhook_config["url"]
        session["status"] = "processing"
        session["zipReady"] = False
        session["zipUrl"] = ""
        session["webhookStatus"] = "pending" if webhook_config_enabled(webhook_config) else "disabled"
        session["webhookSentCount"] = 0
        session["webhookFailedCount"] = 0
        session["webhookLastFile"] = ""
        session["webhookHttpStatus"] = None
        session["webhookError"] = ""
        session_snapshot = deepcopy(session)

    if session_snapshot is not None:
        persist_session_snapshot(session_snapshot)

    worker = Thread(target=process_session_job, args=(session_id, options), daemon=True)
    worker.start()
    return get_session_or_404(session_id)


@app.get("/api/jobs/{session_id}")
def get_job_status(request: Request, session_id: str) -> dict[str, Any]:
    session = require_session_access(request, session_id)
    return sanitize_session(session)


@app.get("/api/history")
def get_history(request: Request) -> dict[str, Any]:
    return {"items": list_history_items(get_authenticated_user(request), get_guest_id(request))}


@app.delete("/api/history")
def delete_all_history(request: Request) -> dict[str, Any]:
    auth_user = get_authenticated_user(request)
    guest_id = None if auth_user else get_guest_id(request)
    if auth_user is None and not guest_id:
        return {"deletedCount": 0}
    deleted_count = delete_owned_history(auth_user, guest_id)
    return {"deletedCount": deleted_count}


@app.delete("/api/history/{session_id}")
def delete_history_item(request: Request, session_id: str) -> dict[str, Any]:
    session_root = session_paths(session_id)["root"]
    auth_user = get_authenticated_user(request)

    with sessions_lock:
        session = sessions.get(session_id)
        if session is not None and not session_is_owned_by(session, auth_user, get_guest_id(request)):
            raise HTTPException(status_code=404, detail="History item not found.")
        if session is not None and session.get("status") == "processing":
            raise HTTPException(status_code=409, detail="Cannot delete history while this session is processing.")
        sessions.pop(session_id, None)

    if not session_root.exists():
        raise HTTPException(status_code=404, detail="History item not found.")
    metadata = load_session_metadata(session_id) or {}
    if auth_user is not None:
        if str(metadata.get("ownerEmail", "") or "").strip().lower() != auth_user["email"]:
            raise HTTPException(status_code=404, detail="History item not found.")
    elif metadata:
        raise HTTPException(status_code=404, detail="History item not found.")

    shutil.rmtree(session_root, ignore_errors=True)
    return {"deleted": session_id}


@app.delete("/api/files/{session_id}/{file_id}")
def delete_queued_file(request: Request, session_id: str, file_id: str) -> dict[str, Any]:
    session_snapshot: dict[str, Any] | None = None
    require_session_access(request, session_id)
    with sessions_lock:
        session = sessions.get(session_id)
        if session is None:
            raise HTTPException(status_code=404, detail="Session not found.")
        if session["status"] == "processing":
            raise HTTPException(status_code=409, detail="Cannot remove files while processing is running.")

        file_record = find_file_record(session, file_id)
        if file_record is None:
            raise HTTPException(status_code=404, detail="File not found in this session.")

        source_path = Path(file_record["sourcePath"])
        session["files"] = [item for item in session["files"] if item["id"] != file_id]
        session["status"] = "uploaded"
        session["zipReady"] = False
        session["zipUrl"] = ""
        recalculate_progress(session)
        session_snapshot = deepcopy(session)

    source_path.unlink(missing_ok=True)
    if session_snapshot is not None:
        persist_session_snapshot(session_snapshot)
    append_log(session_id, f"Removed {file_record['name']} from the queue.")
    return get_session_or_404(session_id)


@app.get("/api/files/{session_id}/{kind}/{filename}")
def get_generated_file(request: Request, session_id: str, kind: str, filename: str) -> FileResponse:
    require_session_access(request, session_id)
    if kind not in {"original", "processed"}:
        raise HTTPException(status_code=404, detail="Unknown file type.")

    file_path = session_paths(session_id)[kind] / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found.")

    return FileResponse(file_path)


@app.get("/api/download/{session_id}/zip")
def download_zip(request: Request, session_id: str) -> FileResponse:
    session = require_session_access(request, session_id)

    zip_name = f"{session_id}-processed-images.zip"
    zip_path = session_paths(session_id)["downloads"] / zip_name
    if not zip_path.exists():
        raise HTTPException(status_code=404, detail="ZIP file not ready.")

    return FileResponse(zip_path, media_type="application/zip", filename=zip_name)
