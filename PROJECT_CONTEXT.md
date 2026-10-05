# NEXUS — Technical Context and Handoff

> **Audience:** a developer, reviewer, or LLM taking over NEXUS. Read this before changing authentication, schema, authorization, deployment, or business workflows.
>
> **Last refreshed:** 2026-09-29. Verify current code and migrations before claiming a feature works.

## 1. Product and current position

**NEXUS** is a college event-management platform: **One platform. Every club. Every event. Zero paperwork.**

It replaces WhatsApp coordination, paper approval letters, spreadsheets, and informal venue booking with one system for event submission, approvals, discovery, registrations, media, and reporting.

The project has a `v0.0.1` release baseline and is now a functional MVP. It is suitable for local development and controlled demos. It is **not yet a fully operated production service**: deployment, monitoring, backup ownership, staff identity/audit design, and security hardening still need work.

### Product boundaries

In scope:

- Internal college event request, booking, approval, discovery, and registration workflows.
- Public viewing of approved current and past events.
- Coordinator-owned club identity for v1.
- Letter generation after approval.

Out of scope for v1:

- Payments/ticketing.
- Native mobile application.
- Cryptographic signatures. A configured signatory name/title/signature image is a visual institutional signature, not a legal cryptographic one.
- Multi-college federation. The data model currently represents one college installation.

## 2. Current architecture

```text
React / Vite browser application
       │  HttpOnly session cookie + CSRF header + X-Nexus-Visitor ID
       ▼
FastAPI application
  ├── authentication and role checks
  ├── business rules / event workflow
  ├── SQLAlchemy + Alembic
  ├── Cloudinary server-side uploads
  ├── Resend password-reset email
  ├── ReportLab permission-letter generation
  └── request analytics + in-app notifications
       │
       ▼
Supabase PostgreSQL

External services:
Cloudinary = media files     Resend = password-recovery email
```

### Source layout

```text
NEXUS/
├── frontend/                         React + Vite client
│   ├── src/pages/                    landing, auth, dashboards, event details, profile, archive
│   ├── src/services/api.js           Axios API client, JWT + visitor header interceptors
│   ├── src/services/auth.js          local sign-out helper
│   └── src/__tests__/                frontend smoke test(s)
├── backend/
│   ├── app/main.py                   FastAPI app, CORS, analytics middleware, /health
│   ├── app/dependencies.py           DB session, JWT user loading, role enforcement
│   ├── app/models/                   SQLAlchemy models
│   ├── app/routes/                   HTTP routes and workflow logic
│   ├── app/schemas/                  Pydantic request validation
│   ├── app/utils/                    JWT, password, media, email, PDF, analytics helpers
│   ├── alembic/                      migration environment and version scripts
│   └── tests/                        backend API tests
├── docker-compose.yml                backend + nginx-served frontend locally
├── AGENTS.md                         short product instruction context
├── README.md                         normal contributor/user documentation
└── PROJECT_CONTEXT.md                this technical handoff
```

## 3. Technology choices

| Concern | Current choice | Notes |
| --- | --- | --- |
| Client | React 19, Vite, React Router, Axios | `VITE_API_URL` selects API target. |
| Server | FastAPI / Python | Serves JSON plus generated PDF download. |
| Persistence | PostgreSQL via SQLAlchemy | Supabase Postgres is currently used remotely. |
| Schema changes | Alembic | New schema work must be migrations; do not add startup `ALTER TABLE` logic. |
| Authentication | Signed JWT cookie sessions | Browser JWT is `HttpOnly`; explicit Bearer tokens remain supported for API clients/docs. |
| Passwords | Passlib bcrypt | Never reversible/decryptable. |
| Media | Cloudinary | Uploads pass through FastAPI; browser never sees Cloudinary API secret. |
| Transactional email | Resend HTTPS API | Used for password reset and new-event review alerts. |
| PDFs | ReportLab | Creates approved-event permission letters in memory. |
| Frontend server in containers | Nginx | SPA fallback and `/api/` reverse proxy. |

## 4. Roles and permissions

| Role | Intended and implemented scope |
| --- | --- |
| `student` | Register/login, view public approved events and past archive, register for approved events, view own registrations/profile/notifications. |
| `coordinator` | Create event requests, see availability, manage only events where `created_by` is their ID, view attendees, update club identity, upload/delete permitted event media and gallery photos, download own approved letters. |
| `approver` | View pending requests and non-public event details, approve/reject pending events, configure the official letter template. |
| `admin` | All administrative user/venue functions, review actions, event management visibility, analytics, and letter-template management. |

**Important rule:** the backend is authoritative. Frontend routing and hidden buttons are convenience only; backend dependencies must enforce access.

## 5. Main workflows

### Event lifecycle

```text
Coordinator/admin creates event → pending
       ├─ approver/admin approves → approved → public and registrable
       │                               └─ immutable letter template snapshot stored
       └─ approver/admin rejects → rejected → hidden from public

Coordinator edit of an event → pending again
```

- Coordinators cannot set status or attendee count directly.
- `GET /events` returns approved events; landing and upcoming views filter that data to today or later. The separate public `/events/past` archive returns approved events before today.
- `/events/past` exposes only approved events whose date is before today.
- Pending/rejected details are only visible to their creator, approver, or admin; unauthorized callers receive `404`, not an existence leak.

### Registrations

```text
Student → POST /events/{id}/register
        → lock event row
        → check approved / capacity / duplicate
        → create registration
        → update count and notifications
```

The database unique constraint and event row lock protect against duplicate registrations and last-seat races in PostgreSQL.

### Media and gallery workflow

- Event cover images, gallery photos, club logos, and letter-template assets are uploaded to Cloudinary through backend routes.
- The server keeps Cloudinary public IDs so replacements/deletions can remove the correct asset.
- Gallery endpoints only expose approved past-event photos publicly; upload/delete authorization is restricted to the appropriate coordinator or admin.
- `PUBLIC_API_URL` is used where the backend needs to construct public URLs.

### Permission-letter workflow

- Admin/approver configures the single college letter template: college name/logo, optional global club logo, signatory name/title/signature image, reference prefix, and body text.
- A coordinator can set their club name and logo in their profile. In v1, the coordinator account represents a club.
- At approval time, NEXUS snapshots template/club values into `events.permission_letter_snapshot` so later template edits do not change old approved letters.
- The event owner can download `GET /events/{id}/permission-letter` only after approval.
- Current design supports a **global template signature**, not a distinct signature per approver account. Individual approver signature profiles remain future work.

## 6. Database model

Model definitions are in `backend/app/models/`. Migrations currently run from `20260831_0001_initial_schema.py` through `20260928_0010_add_coordinator_club_identity.py`.

| Table | Main data / constraints |
| --- | --- |
| `users` | `full_name`, unique `email`, `password_hash`, `role`, `class_name`, `phone`, `is_active`, `token_version`, `club_name`, `club_logo_url`, `club_logo_public_id`. |
| `venues` | unique `name`, `capacity`. |
| `events` | title, description, category, venue name, date/time strings, status, rejection/reviewer information, free-text organizer, `created_by`, attendee/capacity counts, image URL/public ID, permission-letter snapshot, club logo URL. |
| `registrations` | `event_id`, `student_id`; unique pair constraint prevents duplicates. |
| `event_gallery_images` | event ID, media URL/filename, Cloudinary public ID, upload time. |
| `notifications` | user ID, title/message/link, read state, creation time. |
| `analytics_events` | timestamp, endpoint/method/status/duration, hashed visitor ID, error flag. No raw IP or email is stored for analytics. |
| `password_reset_tokens` | user ID, SHA-256 token digest, expiry, one-time `used_at`. Raw token exists only in email/browser URL. |
| `letter_templates` | the single college-level template and its Cloudinary asset URLs/public IDs. |

### Important model debt

- `Event.date`, `start_time`, `end_time`, and `reviewed_at` are strings, not timezone-aware temporal columns.
- `Event.venue` and `Event.organizer` are strings, not foreign keys.
- `backend/app/models/club.py` exists but is empty. There is no `clubs` table; one coordinator account is treated as one club identity for v1.
- `attendees` is maintained as a stored count alongside registrations. Treat registration rows as the source of truth if repairing data.

## 7. API surface

OpenAPI is always the source of truth at `/docs` when the backend is running. This is the working route map.

| Group | Routes |
| --- | --- |
| Health | `GET /`, `GET /health` |
| Auth/profile | `POST /auth/register`, `POST /auth/login`, `GET/PATCH /auth/me`, `PATCH /auth/me/club`, `POST /auth/me/club/logo`, `GET /auth/me/registrations`, `POST /auth/forgot-password`, `POST /auth/reset-password` |
| Events | `POST/GET /events`, `GET /events/past`, `GET /events/pending`, `GET /events/manage`, `GET /events/availability`, `GET/PUT/PATCH /events/{id}`, `PATCH /events/{id}/approve`, `PATCH /events/{id}/reject` |
| Event registrations/media | `POST /events/{id}/register`, `GET /events/{id}/registration-status`, `GET /events/{id}/attendees`, `GET /events/{id}/gallery`, `POST/DELETE /events/{id}/gallery...`, `POST/DELETE /events/{id}/image`, `GET /events/{id}/permission-letter` |
| Users | `GET/POST /users`, `PATCH /users/{id}/role`, `PATCH /users/{id}/status`, `DELETE /users/{id}` |
| Venues | `GET/POST /venues`, `PUT/DELETE /venues/{id}` |
| Notifications | `GET /notifications`, `PATCH /notifications/{id}/read`, `PATCH /notifications/read-all` |
| Analytics | `GET /analytics/admin-summary`, `GET /analytics/audit-logs` (admin only) |
| Letter template | `GET/PATCH /letter-template`, `POST /letter-template/assets/{asset}` |

## 8. Frontend behaviour and design notes

Routes live in `frontend/src/App.jsx`:

- Public: landing `/`, past archive `/events/past`, and approved event details `/events/:id`.
- Auth: `/login`, `/forgot-password`, `/reset-password`.
- Dashboards: `/dashboard/student`, `/dashboard/coordinator`, `/dashboard/approver`, `/dashboard/admin`.
- Profile: `/profile`.

The landing page has a deliberate door-opening NEXUS introduction. The post-door state is kept in session storage; clicking the NEXUS brand resets that entrance. Non-hero pages use the gold NEXUS outline watermark asset (`frontend/public/nexus-outline.svg`).

`frontend/src/services/api.js`:

- Reads `VITE_API_URL`, falling back to `http://127.0.0.1:8000`.
- Uses `withCredentials` so the browser sends the `HttpOnly` session cookie; it never reads the JWT.
- Fetches a non-sensitive CSRF value from `/auth/csrf` and sends it as `X-CSRF-Token` on state-changing requests.
- Adds a random browser `X-Nexus-Visitor` ID used only as a one-way analytics input on the server.
- Clears local session data and routes to `/login` after non-login `401` responses.

### Frontend limitations to remember

- Session metadata (name/role/email) is kept in `sessionStorage` only for display and navigation. It is not an authorization source; the backend reloads the user for every protected request.
- The current cookie session is a single JWT with a configured expiry, rather than an access-token/refresh-token rotation design. Consider rotation and device/session revocation for a larger deployment.
- Route components are not protected by a central React route guard. The backend authorizes requests correctly, but UI redirects/empty states should be improved.
- In-app notifications are polling/fetch based, not real-time push/WebSockets.
- New event requests also send a best-effort email to every active approver and admin. Email delivery is intentionally asynchronous and never blocks event creation; Resend delivery logs are the source of truth when an email is missing.
- Search/filter UI should be verified feature-by-feature before stating it is comprehensive; do not infer backend search exists unless a route is added.

## 9. Security controls already in place

### Authentication and account safety

- Passwords are bcrypt hashes; they cannot and must not be decrypted.
- Public registration always creates a `student`, preventing role escalation through sign-up.
- Pydantic password policy requires at least 8 characters, a letter, and a digit.
- Login rate limits are applied per account and IP (currently in-memory: five account failures or ten IP failures per 15 minutes).
- `is_active=False` users are rejected at login and protected routes.
- JWT contains and validates a token version. Password reset increments `token_version`, invalidating previously issued tokens.
- Browser JWTs are issued as `HttpOnly` cookies. JavaScript does not receive the token, and state-changing cookie-session requests require a matching CSRF cookie/header pair.
- Password reset returns a generic response to avoid account enumeration, stores only a hash of a single-use expiring token, and uses rate limits.

### Authorization and privacy

- `get_current_user` decodes the token then reloads the user from the database.
- Role checks use `require_role(...)` on protected operations.
- Private event requests are not public through direct ID access.
- Venue availability is staff-only because it can reveal non-public bookings.
- Coordinator `/events/manage` results are scoped by `created_by`; admin sees all.
- Users cannot modify their own role or remove the final admin; deletion is blocked if history would be orphaned.

### Data integrity

- Registration uses a PostgreSQL row lock and a database unique constraint.
- Event validation checks venue existence, capacity bounds, and conflict/time rules.
- Coordinator updates resubmit for review and cannot manipulate status/attendee count.
- Used venues cannot be deleted/renamed unsafely; capacity cannot be lowered below dependent event capacity.
- Cloudinary API secret remains server-side. Media routes validate image content and authorization before upload.
- Uploads are throttled per authenticated user, limited to 5 MB, and validated against image signatures rather than trusting filename alone.
- Audit logs record security-relevant profile/club, event, registration, media, user, venue, and letter-template actions without storing secrets.

### Privacy-conscious analytics

- API analytics stores a SHA-256-derived visitor identifier rather than raw IP addresses, email addresses, or user IDs.
- `/analytics/admin-summary` is admin-only.

## 10. Security and reliability gaps before a real launch

Treat these as a launch checklist, not optional polish.

### Highest priority

1. **Provision Redis and set `REQUIRE_REDIS=true`.** The code supports Redis-backed rate limits, but local in-memory fallback remains until a Redis URL is configured.
2. **Establish production monitoring.** Capture errors (for example Sentry), structured logs, uptime checks, and alerts. The internal analytics table and audit log are not error monitoring.
3. **Define backups and restore drills.** Supabase backups are not enough until the owner, retention, restoration procedure, and test cadence are documented.
4. **Use a real verified college domain for Resend.** Sandbox senders may have recipient restrictions and should not be considered a public-production mail setup.
5. **Pin and update dependencies deliberately; run vulnerability scanning in CI.**
6. **Move from a single session JWT to access/refresh rotation if device-level revocation or long-lived sessions become required.**

### Important design/security work

- Add audit records for approval/rejection, role/status changes, venue changes, and letter-template edits.
- Design event cancellation/rescheduling with required student notifications and safe registration consequences.
- Use timezone-aware timestamp columns and a college timezone policy.
- Replace free-text venue/organizer with relational `venue_id` and `club_id` as part of a carefully migrated schema.
- Build proper `clubs` and coordinator-membership tables to support multiple coordinators per club.
- Add a per-approver signature/profile model if an individual signatory must appear on each letter.
- Add image scanning/moderation, stronger size/dimension checks, and retention/deletion policies for media before opening uploads broadly.
- Add pagination/rate limits to public list/gallery/notification endpoints as data grows.
- Define retention and user-consent policy for analytics and uploaded student/event images.
- Run production with HTTPS only, strict CORS for exact frontend origins, and no wildcard secrets/configuration.

## 11. Testing and verification

Current automated coverage includes backend pytest files for authentication, events/privacy/registrations, validation, analytics, and letter templates, plus a frontend Landing Page test. The suite previously passed with **57 backend tests**; run it again after changes rather than relying on that historical number.

```bash
cd backend
./.venv/bin/pytest

cd ../frontend
npm run test -- --run
npm run build
```

Test architecture:

- Backend uses an isolated in-memory SQLite database with FastAPI dependency overrides.
- Production race protection uses PostgreSQL row locks, which SQLite does not fully simulate. Add PostgreSQL integration tests before relying on concurrency guarantees at scale.

Recommended next tests:

- Token version invalidation after password reset.
- Media upload authorization and deletion ownership.
- Permission-letter snapshot immutability.
- Public/private event detail and gallery privacy.
- Venue conflict edge cases and time validation.
- Full browser flows using Playwright/Cypress.
- Alembic upgrade from an empty database and from prior production revisions.

## 12. Local development operations

### Backend

Run from `backend`, not `backend/app`:

```bash
source .venv/bin/activate
./.venv/bin/alembic upgrade head
uvicorn app.main:app --reload
```

If `ModuleNotFoundError: No module named 'app'` occurs, it usually means Uvicorn was started from `backend/app`. Go back to `backend` and run the supported command.

### Frontend

```bash
cd frontend
npm run dev
```

If Vite reports CSS/JS module MIME errors, it normally means a source import resolves to the HTML fallback (a missing/incorrect file path) or Vite needs to be restarted after a file rename. Do not “fix” this by changing MIME headers; locate the broken import/network request.

### Supabase

- `DATABASE_URL` belongs only in backend `.env`.
- Use the Supabase Session Pooler connection string for environments where the direct hostname is not reachable (common on some local IPv4/DNS networks).
- The backend limits its SQLAlchemy pool to three steady and two overflow connections by default. Restart the backend after changing this setting so stale pools are released.
- URL-encode special characters in the database password when placing it in a connection URL.
- After a schema change: create/review Alembic migration, then run `./.venv/bin/alembic upgrade head` against the intended database.

## 13. Container and deployment state

Already present:

- `backend/Dockerfile`: Python 3.12 FastAPI image on port 8000.
- `frontend/Dockerfile`: Node 22 Vite build, then Nginx static serving.
- `frontend/nginx.conf`: SPA fallback and `/api/` proxy to backend.
- `docker-compose.yml`: local two-service composition.
- `GET /health`: checks the API and database `SELECT 1`.

### Safe deployment shapes

**Preview/demo now**

```text
Cloudflare Pages or Vercel → frontend
Render or Cloud Run        → backend Docker image
Supabase                   → database
Cloudinary / Resend        → external services
```

With separately hosted frontend and backend, set `VITE_API_URL` to the exact public backend URL and `CORS_ORIGINS`/`FRONTEND_URL` to the exact frontend origin.

**College Kubernetes later**

```text
Ingress / Cloudflare
   ├── frontend deployment + service
   └── backend deployment + service
          └── Supabase or managed Postgres
```

Use Kubernetes Secrets for credentials, ConfigMaps for non-secret configuration, a one-time Alembic migration Job, `/health` probes, resource limits, centralized logs, HTTPS, and a documented database backup/restore plan. Cloudflare Tunnel can expose services without opening inbound server ports.

Do not run Alembic automatically in every API replica at startup. Use a controlled one-time migration step.

## 14. Work roadmap

Prioritize in this order unless product needs change:

1. Production operations: deploy preview, then add monitoring, backups, domain/HTTPS, exact CORS, secrets management, and CI.
2. Security hardening: shared rate limiting, cookie-based auth/CSRF strategy, audit logs, upload policy.
3. Data model: clubs/multiple coordinators, relational venue IDs, real datetime/timezone fields.
4. Workflow completeness: cancellation/reschedule, approval history, staff-specific signature ownership, emailed event notifications.
5. Experience: live/realtime notifications, event search/pagination, attendance QR/check-in, richer accessibility and browser E2E tests.
6. Future expansion: multi-college tenancy only after every record is explicitly scoped by organization and authorization is redesigned for it.

## 15. Rules for future contributors / LLMs

- Inspect the actual route, schema, model, migration, and tests before changing a business rule.
- Do not add hardcoded event data or placeholder arrays as a fallback for production features.
- Do not commit `.env`, secrets, Cloudinary credentials, database URLs, tokens, or reset links.
- New persistent schema changes require Alembic migrations; never use runtime schema mutation as a substitute.
- Preserve authorization rules on the backend even if a frontend page hides a button.
- Do not make unrequested destructive schema/database changes. Back up production data before migrations.
- Check `git status` before editing: a dirty worktree may contain user changes that must be preserved.
- Update this document and README whenever a feature changes materially, especially role scope, environment setup, database schema, deployment requirements, or security posture.
