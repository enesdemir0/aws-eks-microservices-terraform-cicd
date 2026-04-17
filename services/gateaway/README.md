# Gateway Service

The entry point for the AI Image Processing Pipeline. This FastAPI service sits between the frontend and all internal microservices. It authenticates every request by proxying to the Auth Service, validates and stores uploaded images, and pushes processing tasks to a Redis queue for downstream workers to consume.

---

## Architecture Position

```
Frontend / Client
       |
       v
 Gateway Service  (this service — FastAPI, port 8000)
    |        |
    v        v
Auth      Redis Queue
Service   (image_tasks)
(Node.js)      |
               v
         Image Worker
         (future service)
               |
               v
         Local Disk / S3
```

---

## What This Service Does

| Concern | What Happens |
|---|---|
| **Authentication** | Every protected route extracts a JWT from the `jwt` cookie or `Authorization: Bearer` header, then calls `/api/auth/me` on the Auth Service to verify it. No JWT logic runs locally. |
| **Image Upload** | `POST /api/gateway/upload` accepts a multipart file, validates extension and Content-Type, saves it asynchronously in 64 KB chunks, and rejects files over the configured size limit. |
| **Task Queuing** | After a successful save, a JSON task object is pushed to a Redis list (`image_tasks`). Downstream workers `BLPOP` from this list. |
| **Structured Logging** | Every log line is emitted as a JSON object with `timestamp`, `level`, `logger`, `message`, and an `extra` block — ready for CloudWatch, Loki, or any log aggregator. |
| **Error Consistency** | All errors — validation failures, upstream timeouts, unexpected crashes — return the same shape: `{"status": "error", "message": "..."}`. |

---

## Directory Structure

```
services/gateway/
├── src/
│   ├── config/
│   │   └── settings.py          # Pydantic BaseSettings — all config lives here
│   ├── middleware/
│   │   └── logging.py           # Logs method, path, status code, duration_ms per request
│   ├── utils/
│   │   └── logger.py            # JSON formatter + setup_logging() + get_logger()
│   ├── services/
│   │   ├── auth_service.py      # get_current_user() FastAPI dependency
│   │   ├── storage_service.py   # File validation + async chunked write
│   │   └── queue_service.py     # Redis rpush + get_redis() dependency
│   ├── routes/
│   │   ├── health.py            # GET /health
│   │   └── upload.py            # POST /api/gateway/upload
│   └── main.py                  # App factory, lifespan, global exception handlers
├── .env                         # Local secrets (never committed)
├── .env.example                 # Template — commit this, not .env
├── requirements.txt
└── README.md
```

---

## API Endpoints

### `GET /health`
Public. Returns service liveness status.

```json
{ "status": "healthy", "service": "gateway" }
```

---

### `POST /api/gateway/upload`
Protected. Requires a valid JWT.

**Auth:** Cookie `jwt=<token>` **or** header `Authorization: Bearer <token>`

**Body:** `multipart/form-data` with a single field named `file`.

**Success `200`:**
```json
{
  "status": "success",
  "task_id": "a3f1c9e2b7d04a6f8c2e1d0b5f3a7e9c",
  "image_path": "uploads/a3f1c9e2b7d04a6f8c2e1d0b5f3a7e9c.jpg",
  "user_id": "42"
}
```

**Error responses all follow this shape:**
```json
{ "status": "error", "message": "Reason here" }
```

| Status | Cause |
|---|---|
| `401` | No token provided, or Auth Service rejected it |
| `413` | File exceeds `MAX_FILE_SIZE_MB` |
| `415` | File extension or Content-Type not in the allowed list |
| `503` | Auth Service is unreachable (network error) |
| `504` | Auth Service did not respond within `AUTH_SERVICE_TIMEOUT` seconds |

---

## Redis Task Payload

When an image is saved successfully, the following JSON object is pushed to the right end of the `image_tasks` list (`RPUSH`). Workers should use `BLPOP image_tasks 0` to consume tasks in order.

```json
{
  "task_id": "a3f1c9e2b7d04a6f8c2e1d0b5f3a7e9c",
  "image_path": "uploads/a3f1c9e2b7d04a6f8c2e1d0b5f3a7e9c.jpg",
  "user_id": "42",
  "timestamp": "2026-04-17T10:23:45.123456+00:00"
}
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in the values. The service will also read these from real environment variables (e.g., Kubernetes Secrets), which always take precedence over `.env`.

```bash
cp .env.example .env
```

### Full Variable Reference

```dotenv
# ── Application ──────────────────────────────────────────────────────────────

# Display name shown in FastAPI's auto-generated docs (/docs)
APP_NAME=AI_Gateway

# Runtime environment. Used for logging context. Does not change behaviour.
# Values: development | staging | production
NODE_ENV=development

# Port uvicorn listens on (used in run commands and Docker EXPOSE)
PORT=8000

# Minimum log level emitted. Lower levels are silenced.
# Values: DEBUG | INFO | WARNING | ERROR | CRITICAL
LOG_LEVEL=INFO


# ── Auth Service ─────────────────────────────────────────────────────────────

# Base URL of the Node.js Auth Service.
# In Docker Compose: http://auth-service:3000
# In EKS: http://auth-service.default.svc.cluster.local:3000
AUTH_SERVICE_URL=http://localhost:3000

# How long (seconds) the Gateway waits for the Auth Service to respond.
# If the Auth Service exceeds this, the Gateway returns 504 to the client.
# Keep this low (3–5 s) to avoid blocking the upload request for too long.
AUTH_SERVICE_TIMEOUT=5.0


# ── Storage ──────────────────────────────────────────────────────────────────

# Where to write uploaded files.
# Values: local | s3
# "s3" is reserved for future implementation. Currently only "local" is active.
STORAGE_TYPE=local

# Directory path for saved images when STORAGE_TYPE=local.
# Relative paths are resolved from the working directory where uvicorn runs.
# In Docker, map this to a volume: -v /host/uploads:/app/uploads
UPLOAD_DIR=uploads

# Maximum allowed upload size in megabytes.
# Files exceeding this limit are rejected mid-stream (no full buffering in memory).
MAX_FILE_SIZE_MB=10

# Comma-separated list of permitted file extensions (case-insensitive).
# The service also checks the HTTP Content-Type header — both must be valid.
ALLOWED_EXTENSIONS=jpg,jpeg,png,webp

# S3 bucket name. Only required when STORAGE_TYPE=s3.
# Leave unset for local development.
AWS_S3_BUCKET=


# ── Redis ─────────────────────────────────────────────────────────────────────

# Connection URL for the Redis instance.
# Format: redis://[:password@]host[:port][/db]
# In Docker Compose: redis://redis:6379/0
# With a password:   redis://:mysecretpassword@redis:6379/0
# In EKS with TLS:   rediss://redis.default.svc.cluster.local:6380/0
REDIS_URL=redis://localhost:6379/0

# Name of the Redis list used as the task queue.
# Workers must consume from this exact name.
# Change only if you are running multiple isolated pipelines on the same Redis.
REDIS_QUEUE_NAME=image_tasks
```

---

## `.env.example`

Commit this file. Never commit `.env`.

```dotenv
APP_NAME=AI_Gateway
NODE_ENV=development
PORT=8000
LOG_LEVEL=INFO

AUTH_SERVICE_URL=http://localhost:3000
AUTH_SERVICE_TIMEOUT=5.0

STORAGE_TYPE=local
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=10
ALLOWED_EXTENSIONS=jpg,jpeg,png,webp
AWS_S3_BUCKET=

REDIS_URL=redis://localhost:6379/0
REDIS_QUEUE_NAME=image_tasks
```

---

## Local Development

```bash
# 1. Create and activate a virtual environment
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Copy and edit the environment file
cp .env.example .env

# 4. Start the service
uvicorn src.main:app --reload --port 8000
```

The interactive API docs are available at `http://localhost:8000/docs`.

---

## Running Tests

```bash
pytest -v
```

Tests use `httpx.AsyncClient` against the FastAPI `TestClient` and mock the Auth Service and Redis dependencies — no real network calls or Redis instance required.

---

## Refactor Change Log

This section records what changed from the initial skeleton and the reasoning behind each decision.

### Settings (`src/config/settings.py`)

**Before:** Minimal fields, no timeout, no file size limit, no log level control.

**After:** Added `LOG_LEVEL`, `AUTH_SERVICE_TIMEOUT`, `MAX_FILE_SIZE_MB`, `ALLOWED_EXTENSIONS`, `REDIS_QUEUE_NAME`. Added an `allowed_extensions_set` property so the raw comma-string is parsed exactly once at startup, not on every request.

---

### Structured Logging (`src/utils/logger.py`)

**Before:** `logging.basicConfig(level=logging.INFO)` — plain text, unstructured.

**After:** A `_JSONFormatter` emits every log as a single JSON line with `timestamp` (UTC ISO-8601), `level`, `logger`, `message`, and any `extra` fields passed at the call site. This format is directly parseable by CloudWatch Logs Insights, Grafana Loki, and Datadog without any log parsing rules.

`setup_logging()` is called once inside the FastAPI `lifespan` — after the process starts, before any requests arrive. Noisy libraries (`httpx`, `uvicorn.access`) are quieted to `WARNING`.

---

### Request Logging Middleware (`src/middleware/logging.py`)

**Before:** No per-request logging.

**After:** `RequestLoggingMiddleware` wraps every request and emits one log line after the response is sent, containing `method`, `path`, `status_code`, and `duration_ms`. This gives you a full access log in the same JSON format as application logs, so you can correlate them in one query.

---

### Auth Dependency (`src/services/auth_service.py`)

**Before:** `src/utils/auth_verify.py` — no timeout, single generic `HTTPException` for all upstream failures, no distinction between timeout / network error / bad response.

**After:**
- `_extract_token()` checks Cookie first, then `Authorization: Bearer` — same logic, extracted into a named function for clarity.
- `httpx.AsyncClient` is constructed with `timeout=settings.AUTH_SERVICE_TIMEOUT` on every call. An `httpx.TimeoutException` returns `504`; an `httpx.RequestError` (DNS failure, refused connection) returns `503`. These are different failure modes and clients deserve different signals.
- A `401` from the Auth Service is forwarded as `401`. Any other non-200 is `502` (the upstream is broken, not the client).
- Malformed JSON from the Auth Service is caught and returns `502` instead of crashing with an unhandled `KeyError`.

---

### Storage Service (`src/services/storage_service.py`)

**Before:** No file saving was implemented — the route only logged the filename.

**After:**
- **Dual validation:** extension checked against `ALLOWED_EXTENSIONS` setting AND `Content-Type` header checked against a hardcoded allowlist. An attacker cannot bypass the check by renaming a `.php` file to `.jpg` — the Content-Type must also match.
- **UUID filename:** the original filename is discarded. The saved file is named `<uuid4_hex>.<ext>`. This prevents path traversal attacks and filename collisions.
- **Chunked async write:** `aiofiles.open` reads the upload in 64 KB chunks. The byte counter is incremented before writing each chunk — if it crosses `MAX_FILE_SIZE_MB`, the partial file is deleted and a `413` is returned. The full file is never buffered in memory.

---

### Queue Service (`src/services/queue_service.py`)

**Before:** No Redis integration.

**After:** `push_image_task()` serialises the task as JSON and calls `RPUSH` on the configured queue name. `get_redis()` is a FastAPI dependency that returns `request.app.state.redis` — the single connection pool created at startup. No connection is opened or closed per request.

---

### Route Layer (`src/routes/`)

**Before:** All routes defined directly in `main.py`.

**After:** Routes split into `health.py` and `upload.py` using `APIRouter`. `main.py` only wires things together — it has no business logic. The upload route composes the three service functions (`save_upload`, `push_image_task`, `get_current_user`) and returns a clean response.

---

### App Factory (`src/main.py`)

**Before:** Module-level side effects (creating directories, calling `logging.basicConfig`) ran on import, which breaks testing.

**After:**
- All startup logic moved into the `lifespan` async context manager. The Redis client is created on startup and stored in `app.state.redis`; it is cleanly closed on shutdown. No global mutable state outside the app object.
- Two `exception_handler` registrations ensure every possible error — including unhandled `Exception` — returns `{"status": "error", "message": "..."}`. The generic handler logs the full traceback server-side but returns a safe message to the client.

---

### Dependencies (`requirements.txt`)

| Package | Change | Reason |
|---|---|---|
| `requests` | Removed | Synchronous; replaced by `httpx` |
| `python-dotenv` | Removed | `pydantic-settings` handles `.env` natively |
| `redis[asyncio]` | Added | Async Redis client (`redis.asyncio`) |
| `aiofiles` | Added | Non-blocking file I/O for chunked writes |
| `uvicorn[standard]` | Updated | Includes `uvloop` and `httptools` for production performance |
| `pytest-asyncio` | Added | Required for `async def` test functions |
