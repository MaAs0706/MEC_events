# NEXUS: Complete Project Context and Handoff

> **Purpose:** This file is the authoritative handoff context for a new developer or LLM working on NEXUS. Read it fully before making product, schema, security, or deployment changes. Do not assume a feature is complete merely because it appears in the UI.

## 1. Product Definition

**NEXUS** is a college event-management platform.

**Tagline:** One platform. Every club. Every event. Zero paperwork.

The platform replaces fragmented event management over WhatsApp, paper permission letters, and manual venue coordination. It provides a central system for event creation, venue availability, approvals, student discovery, and registrations.

### Product Goal

Create a reliable internal college platform where:

- Clubs submit event requests and reserve conflict-free venues.
- Approvers digitally approve or reject requests.
- Students discover approved upcoming events and register.
- Coordinators track registrations and, later, publish post-event galleries and download permission letters.

### Current Release Position

- Released baseline: **v0.0.1**.
- Current maturity: **core MVP / development release**, not production-ready.
- The central event lifecycle is implemented, but production operations, testing, media uploads, email, notifications, and PDF permission letters are still incomplete.

## 2. Product Scope

### In Scope

- Authentication and role-based access control.
- Event request and approval workflow.
- Venue availability and conflict detection.
- Student discovery and registration.
- Admin user and venue management.
- Coordinator attendee visibility.
- Planned public past-event archive and photo galleries.

### Explicitly Out of Scope for V1

- Mobile application.
- Payment or ticketing system.
- Cryptographic/physical digital signatures.

For permission letters, the approver's name and approval date are sufficient for V1.

## 3. User Roles and Intended Capabilities

| Role | Current capabilities | Important future capabilities |
| --- | --- | --- |
| Student | Register, log in, browse approved upcoming events, view own registrations | Password reset, notifications, persistent profile settings |
| Coordinator | Create events, inspect venue availability, see only own managed events, view attendees | Permission-letter download, gallery uploads, notifications, editing workflow |
| Approver | See pending requests, approve/reject with a reason, view internal event details | Persistent rejected history, notifications, approval audit display |
| Admin | Manage users, roles, venues, and event details; approve/reject events | Account deactivation, richer reports, production operations |

## 4. Technology Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, React Router, Axios, Framer Motion, Lucide icons |
| Backend | FastAPI, Python |
| ORM | SQLAlchemy |
| Database | PostgreSQL; migration target is Supabase Postgres |
| Auth | JWT bearer tokens |
| Password hashing | Passlib + bcrypt |
| Schema migrations | Alembic (recently added) |
| Planned media storage | Cloudinary |
| Planned PDF generation | ReportLab or equivalent |
| Planned transactional email | Resend or similar provider |

## 5. Repository Layout

```text
NEXUS/
├── frontend/                 # React/Vite application
│   └── src/
│       ├── pages/            # Landing, auth, role dashboards, details, profile
│       ├── services/api.js   # Axios client and JWT request interceptor
│       └── services/auth.js  # Sign-out helper
├── backend/
│   ├── app/
│   │   ├── models/           # User, Event, Registration, Venue
│   │   ├── routes/           # auth, events, users, venues
│   │   ├── schemas/          # Pydantic request schemas
│   │   ├── dependencies.py   # DB, JWT and role dependencies
│   │   └── main.py           # FastAPI application and CORS
│   ├── alembic/              # Alembic migration environment
│   ├── alembic.ini
│   ├── migrations/           # Legacy SQL; do not extend this for new changes
│   └── requirements.txt
├── README.md                 # Public project documentation
├── AGENTS.md                 # Short product context
└── PROJECT_CONTEXT.md        # This detailed handoff document
```

## 6. Current Domain Model

### `users`

Current columns:

- `id`
- `full_name`
- `email` (unique)
- `password_hash`
- `role` (`student`, `coordinator`, `approver`, `admin`)

### `venues`

Current columns:

- `id`
- `name` (unique)
- `capacity`

Default seeded venues:

- Main Auditorium — 500
- Seminar Hall — 120
- Tech Lab — 80
- Sports Complex — 800

### `events`

Current columns:

- `id`
- `title`
- `description`
- `category`
- `venue` (currently a string, not a venue foreign key)
- `date` (currently a string)
- `start_time` (currently a string)
- `end_time` (currently a string)
- `status` (`pending`, `approved`, `rejected`)
- `rejection_reason`
- `reviewed_by` (user foreign key)
- `reviewed_at` (currently a string)
- `organizer` (currently free text)
- `created_by` (user foreign key)
- `attendees`
- `capacity`
- `image` (currently a URL string for event cover image)

### `registrations`

Current columns:

- `id`
- `event_id` (event foreign key)
- `student_id` (user foreign key)

Constraint:

- A unique constraint on `(event_id, student_id)` prevents duplicate registrations.

### Planned Models

- `event_photos` / event gallery photos.
- Password-reset tokens.
- Notifications.
- Clubs and coordinator-to-club membership.
- Profile fields and notification preferences.
- Audit/history records for approvals and important administrative actions.

## 7. Implemented Backend API

### Authentication

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Creates a student account only. Password is hashed. |
| POST | `/auth/login` | Public | Returns JWT access token, role, and full name. |
| GET | `/auth/me` | Authenticated | Returns current user basics. |
| GET | `/auth/me/registrations` | Authenticated | Returns events the current user registered for. |

### Events

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| POST | `/events` | Coordinator/admin | Creates a pending event; `created_by` is always the authenticated user. |
| GET | `/events` | Public | Returns approved events only. |
| GET | `/events/pending` | Approver/admin | Returns all pending events. |
| GET | `/events/manage` | Coordinator/admin | Coordinators receive their own events; admins receive all. |
| GET | `/events/availability?date=YYYY-MM-DD` | Coordinator/admin | Returns venue loads and pending/approved bookings for planning. |
| GET | `/events/{id}` | Conditional | Approved events are public. Pending/rejected events are visible only to their creator coordinator, approvers, or admins. |
| PUT | `/events/{id}` | Owner coordinator/admin | Full update; event returns to pending. |
| PATCH | `/events/{id}` | Owner coordinator/admin | Partial update; event returns to pending. |
| PATCH | `/events/{id}/approve` | Approver/admin | Approves pending events only. |
| PATCH | `/events/{id}/reject` | Approver/admin | Rejects pending events only; reason required. |
| POST | `/events/{id}/register` | Student | Approved events only; protects duplicate and capacity. |
| GET | `/events/{id}/registration-status` | Student | Returns current student's registration state. |
| GET | `/events/{id}/attendees` | Owner coordinator/admin | Returns attendee names/emails. |

### Users

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| GET | `/users` | Admin | Lists users. |
| POST | `/users` | Admin | Creates coordinator, approver, admin, or student accounts. |
| PATCH | `/users/{id}/role` | Admin | Changes role with self-role and final-admin protection. |
| DELETE | `/users/{id}` | Admin | Deletes only accounts without event/registration history. |

### Venues

| Method | Endpoint | Access | Notes |
| --- | --- | --- | --- |
| GET | `/venues` | Public currently | Lists venues. |
| POST | `/venues` | Admin | Creates venue. |
| PUT | `/venues/{id}` | Admin | Cannot rename a used venue or reduce capacity below an event capacity. |
| DELETE | `/venues/{id}` | Admin | Cannot delete a venue used by events. |

## 8. Implemented Frontend

### Public/Landing Experience

- Door-opening NEXUS hero interaction, stored in session storage so browser back navigation returns after the animation.
- Clicking the NEXUS logo resets the gate animation.
- Golden college-building watermark on non-hero pages and post-gate landing content.
- Landing page fetches approved events from the backend.
- Featured and upcoming landing events are filtered to today or later.
- Landing metrics use backend event data.

### Dashboards

- Student dashboard fetches approved events, supports filtering/search/date filtering, real registrations, and RSVP status.
- Coordinator dashboard includes current-date calendar navigation, venue availability display, event creation, own-event list, and attendee inspection.
- Approver dashboard fetches pending/approved events and supports approval/rejection.
- Admin dashboard manages users, roles, venues, pending events, and approved events.
- Event details supports student registration and approver/admin review actions.
- Sign out is available across role dashboards and profile pages.

### Current UI Limitations / Static or Partial UX

- Landing-page search input does not search or navigate.
- Forgot-password link points to `#forgot`; no reset flow exists.
- Permission-letter download buttons are decorative; PDF generation is not implemented.
- Profile edits only update local React state; no profile-update API or schema exists.
- Notification settings only update local React state and reset on refresh.
- Approver rejected-event list exists only in current client state; it is lost on refresh because there is no rejected-events/history API.
- Approver detail panel can show review actions for events that are no longer pending; handlers then do nothing because they only search the pending list. Fix this UI condition.
- Recent activity, achievements, account activation state, and notifications are presentation-only.
- Frontend routes are not protected by a React route-guard; backend endpoint authorization remains the actual security boundary.

## 9. Security and Integrity Work Already Completed

### Authentication and Authorization

- Passwords are stored as bcrypt hashes, not plaintext.
- JWTs are decoded and the user is reloaded from the database.
- Role checks are enforced on backend endpoints through `require_role(...)`.
- Signup always assigns `student`; roles cannot be selected by public registration.

### Event Privacy

The following privacy issue was fixed:

- Previously, anyone could request `/events/{id}` and read pending/rejected event details.
- Now approved event details are public, but pending/rejected events return `404` unless the requester is the event's coordinator, an approver, or an admin.
- Returning `404` avoids confirming that a hidden event ID exists.
- Venue availability is coordinator/admin-only, so pending event titles and times are not leaked publicly.

### Registration and Resource Integrity

- Registration uses a database row lock (`SELECT ... FOR UPDATE`) on the event row before checking capacity and creating a registration. This prevents concurrent final-seat overbooking in PostgreSQL.
- Duplicate registrations are blocked both by application logic and a database unique constraint.
- Event create/update validates that the venue exists, capacity is at least one, capacity does not exceed venue capacity, and capacity does not drop below current registrations.
- Event update preserves `attendees`; it no longer resets it to zero while registrations remain.
- Venue deletion is blocked if any event uses the venue.
- Venue rename is blocked if the venue is in use.
- Venue capacity cannot be lowered below the configured capacity of events using it.
- Admins cannot change their own role, remove the final admin, or delete accounts with event/review/registration history.

## 10. Known Security, Reliability, and Design Gaps

These are real outstanding issues and should be considered before production deployment.

### High Priority

1. **No automated tests.** There are no repository-owned backend or frontend tests. Add API tests for visibility, role checks, capacity, duplicate registration, locking behavior, deletion blocks, and migration behavior.
2. **Loose input validation.** Event date/time fields are strings. Add typed/validated date and time values, positive integer capacity constraints, text length limits, image URL validation, and rejection-reason limits.
3. **No password policy or rate limiting.** Add password-strength rules, login throttling/rate limiting, and abuse protection before public exposure.
4. **No account deactivation.** Deletion is blocked for historical users, but there is no `is_active`/archived state to disable accounts safely.
5. **No automatic JWT-expiry handling in the frontend.** API 401 responses should clear stale tokens and redirect to login.
6. **No production CORS configuration.** CORS is currently a fixed list of local Vite origins in `backend/app/main.py`.
7. **Frontend API URL is hardcoded.** `frontend/src/services/api.js` uses `http://127.0.0.1:8000`; replace it with `VITE_API_URL`.

### Medium Priority

1. **`venue` is a string rather than a foreign key.** This makes venue integrity and renames more complicated. Consider `venue_id` migration in a future schema version.
2. **`organizer` is free text.** A clubs model and coordinator-to-club relationship are needed for trustworthy club ownership.
3. **No audit history.** `reviewed_by`/`reviewed_at` store only the latest review. Add an audit table if multi-stage or historical approvals are required.
4. **No event cancellation workflow.** Define cancellation, student notification, and registration consequences.
5. **Event edits with registrations need a business rule.** Attendees are now preserved safely, but major edits (date/venue/time) may require coordinator/admin confirmation and student notifications.
6. **Admin destructive actions lack a confirmation dialog in the frontend.** Backend guards exist, but the UI should ask for confirmation before removal.
7. **Image URL trust.** Existing cover-image URLs are arbitrary strings. Future uploads should use controlled Cloudinary URLs and file validation.

### Production Infrastructure Gaps

- HTTPS and reverse proxy (for example Nginx) not configured.
- No Docker/deployment scripts.
- No PostgreSQL/Supabase backup and restore procedure documented.
- No monitoring, structured logging, error reporting, health endpoint, or alerting.
- No secrets-management strategy beyond local `.env`.
- No CI pipeline for build, lint, tests, or migrations.

## 11. Database Migrations and Supabase Status

### What Changed

Alembic was added to replace unsafe runtime schema mutation.

- `backend/alembic/` is the migration environment.
- `backend/alembic/versions/20260831_0001_initial_schema.py` creates the initial users, venues, events, and registrations tables plus default venues.
- `backend/app/main.py` no longer runs `Base.metadata.create_all()` or startup `ALTER TABLE` statements.
- Do not add future schema changes in `backend/migrations/001_dev_schema_updates.sql`; write a new Alembic revision instead.

### Current Supabase State (as of 2026-09-01)

- A Supabase project has been created.
- A direct connection URL was configured and a basic `SELECT 1` test was reported as successful initially.
- Alembic later could not resolve the direct database hostname from the current network.
- The recommended next action is to use the Supabase **Session Pooler** connection URL (normally port 5432), update local `DATABASE_URL`, URL-encode special characters in the database password, and run `SELECT 1` again.
- The initial NEXUS Alembic migration has **not yet been successfully applied to Supabase**. Do not assume Supabase currently has NEXUS tables.
- A connection URL appeared in a local error trace during setup. Rotate the Supabase database password, update local `.env`, and keep the new connection string private.

### Migration Commands

Run from `backend/` after `DATABASE_URL` is confirmed:

```bash
./.venv/bin/alembic current
./.venv/bin/alembic upgrade head
./.venv/bin/alembic current
```

Expected result after a successful migration:

- `alembic_version` table exists.
- Revision `20260831_0001` is current.
- `users`, `venues`, `events`, and `registrations` exist.

### Local Data Migration (Not Yet Done)

If existing local data needs to move to Supabase:

1. Keep the local database untouched until Supabase is verified.
2. Back up the local database with `pg_dump`.
3. Apply the schema migration to the empty Supabase project.
4. Import data carefully, preserving IDs and relationships.
5. Verify users, password hashes, venues, events, and registrations.
6. Test the full application against Supabase.

Do not copy database credentials into the frontend or commit `.env` files.

## 12. Planned Public Past Events and Event Gallery Feature

This is the next requested product feature, but it is **not implemented yet**.

### Requirements

- Past approved events should be publicly visible without login.
- Add a dedicated `/events/past` page linked from the landing page.
- A past event is normally an approved event whose date/time has ended.
- Each past event should have a public gallery on its details page.
- Only the event's creating coordinator or an admin can upload/delete gallery photos.
- Uploads are allowed only after the event has ended.
- Pending/rejected event galleries must never be public.

### Recommended Design

Use Cloudinary for files; do not store image bytes in PostgreSQL.

Create an `event_photos` table with at least:

- `id`
- `event_id` (foreign key)
- `image_url` / Cloudinary `secure_url`
- `cloudinary_public_id` (for deletion)
- `caption` (optional)
- `uploaded_by` (user foreign key)
- `created_at`

Recommended API:

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/events/past` | Public, approved ended events only |
| GET | `/events/{id}/photos` | Public only when event is approved and ended |
| POST | `/events/{id}/photos` | Event owner coordinator/admin; multipart upload; ended events only |
| DELETE | `/events/{id}/photos/{photo_id}` | Event owner coordinator/admin |

### Cloudinary Requirements

Before implementing a real upload button, configure these backend-only environment variables:

```env
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Never send the API secret to React. The backend must validate file type and size, verify event ownership/status/end time, upload to Cloudinary, then save the returned URL/ID to PostgreSQL.

## 13. Other Planned Features

### Permission Letter PDF

- Generate a PDF after approval.
- Include event, venue, date/time, organizer, approver, and approval date.
- Save file metadata/location and allow only the owner coordinator/admin to download it.
- Use ReportLab or equivalent.

### Forgot Password

- `POST /auth/forgot-password`: always return a generic success message.
- Create a random token, store only its hash, expiry, and used timestamp.
- Email reset link through Resend or similar provider.
- `POST /auth/reset-password`: validate unused token, set bcrypt password hash, mark token used.
- Add rate limits and token expiry.

### Notifications

- Persist notifications in the database.
- Notify coordinators when events are approved/rejected.
- Notify approvers about new pending requests.
- Notify students of material event changes/cancellation.
- Add email delivery only after in-app notifications are reliable.

### Profile and Account Settings

- Add profile columns or a profile table.
- Add authenticated profile read/update endpoints.
- Persist notification preferences.
- Add `is_active` to deactivate rather than delete historical accounts.

### Clubs

- Create clubs table.
- Link coordinators to clubs.
- Replace free-text event organizer with club relationship.
- Support admin management of clubs and coordinator access.

## 14. Recommended Implementation Order

1. Finish Supabase Session Pooler connection, rotate exposed database password, and apply initial Alembic migration.
2. Add backend test infrastructure and tests for all existing security/integrity rules.
3. Tighten Pydantic validation and add frontend 401 handling/route guards.
4. Add production configuration: `VITE_API_URL`, environment-driven CORS, secrets, health checks, logging, backup plan.
5. Implement public past-event archive and Cloudinary event galleries.
6. Implement permission-letter PDF generation.
7. Implement persistent profiles/settings and forgot-password email flow.
8. Implement notifications and clubs.
9. Add Docker/Nginx/HTTPS/CI and deploy.

## 15. Development Commands

### Backend

Run from `backend/`:

```bash
./.venv/bin/uvicorn app.main:app --reload
./.venv/bin/python -m compileall app
./.venv/bin/alembic upgrade head
```

Do **not** run `uvicorn main:app` from inside `backend/app`; imports use the package path `app.*` and require the backend directory as the working directory.

### Frontend

Run from `frontend/`:

```bash
npm run dev -- --force
npm run build
npm run lint
```

The production frontend build has passed recently. Lint has known unused-import errors and a React Hook dependency warning that should be cleaned up before CI is introduced.

### Database Shell

From `backend/`:

```bash
set -a
source .env
set +a
psql "$DATABASE_URL"
```

Useful PostgreSQL commands:

```sql
\dt
\d users
\d events
SELECT id, full_name, email, role FROM users ORDER BY id;
SELECT id, title, status, date, venue, attendees, capacity FROM events ORDER BY id;
\q
```

## 16. Sensitive Data Rules

- Never commit `.env`, `.env.local`, database URLs, API keys, Cloudinary secrets, JWT secrets, or password-reset tokens.
- Never place backend secrets in React/Vite environment variables unless they are explicitly safe public values (for example `VITE_API_URL`).
- Password hashes cannot be decrypted. Reset a forgotten password by generating a new bcrypt hash and updating the user record, or by implementing the reset-token flow.
- Rotate secrets if they appear in terminal output, issue descriptions, screenshots, chat messages, or git commits.

## 17. Definition of Done for Production Readiness

NEXUS should not be described as production-ready until all of the following are true:

- Database is hosted, migrated, backed up, and restore-tested.
- No schema-changing startup SQL remains.
- Tests cover critical authentication, authorization, booking, registration, and deletion rules.
- Secrets are environment-managed and rotated if exposed.
- Frontend API URL and CORS are environment-specific.
- HTTPS is enabled behind a production reverse proxy.
- Error logging/monitoring and health checks exist.
- User-facing incomplete buttons are either implemented or removed.
- Permission letters, password reset, and media uploads have their intended authorization and storage rules.

