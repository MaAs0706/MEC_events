# NEXUS

> **One platform. Every club. Every event. Zero paperwork.**

NEXUS is a college event-management platform. It gives clubs, students, approvers, and administrators one shared place to plan events, manage venue availability, obtain approvals, register attendees, and publish event memories.

## What NEXUS does

- Coordinators submit event requests and see venue availability before booking.
- Approvers and admins approve or reject requests digitally.
- Students discover approved events, register in one click, and receive in-app confirmations.
- Coordinators track registrations, view attendee lists, upload event galleries, and download approved-event permission letters.
- Admins manage people, roles, venues, letter branding, and platform analytics.

## Roles

| Role | What they can do |
| --- | --- |
| Student | Browse current and past approved events, register, see registered events, manage their profile and notifications. |
| Coordinator | Create and resubmit events, check availability, manage only their own events, view attendees, add a club identity/logo, upload post-event gallery photos, and download approval letters. |
| Approver | Review pending events, approve or reject with a reason, receive notifications, and configure the official letter template. |
| Admin | Manage users, roles, account status, venues, letter-template branding, platform analytics, and event reviews. |

## Current status

NEXUS is an active MVP with the main product workflow working end-to-end:

```text
Coordinator creates request
        ↓
Venue/date availability is checked
        ↓
Event is pending review
        ↓
Approver or admin approves / rejects
        ↓
Approved event becomes public
        ↓
Students register
        ↓
Coordinator tracks attendees and can publish photos after the event
```

Implemented highlights:

- JWT authentication, secure password hashing, role-based access control, account activation controls, and password recovery through Resend.
- Private pending/rejected event details; public users can access only approved events.
- Capacity-safe registrations with duplicate-registration protection.
- Venue management and daily availability/load visualization.
- Cloudinary-backed cover-image, gallery-image, club-logo, and letter-template asset uploads.
- In-app notifications for requests, reviews, and registrations.
- PDF permission letters generated after approval, using the configured college template and the submitting club’s identity.
- Admin request analytics that do not retain raw IP addresses.
- Responsive dashboard layouts, Docker files, health check, Alembic migrations, backend tests, and a frontend smoke test.

For the complete developer handoff—including database model, API, security decisions, deployment state, and remaining work—read [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).

## Technology

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, React Router, Axios, Framer Motion |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL, currently Supabase Postgres |
| Authentication | JWT bearer tokens, Passlib/bcrypt |
| Media | Cloudinary |
| Email | Resend |
| PDFs | ReportLab |
| Migrations | Alembic |
| Containers | Docker and Docker Compose |

## Quick start

### Prerequisites

- Python 3.12+ (the Docker image uses Python 3.12)
- Node.js 22+ (the Docker image uses Node 22)
- A PostgreSQL database, locally or from Supabase

### 1. Set up the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Fill in the required values in `backend/.env`. At minimum, local development needs `DATABASE_URL` and `SECRET_KEY`.

Apply the schema:

```bash
./.venv/bin/alembic upgrade head
```

Start the API from the **`backend` directory**:

```bash
uvicorn app.main:app --reload
```

The backend runs at `http://127.0.0.1:8000` and its interactive API documentation is at `http://127.0.0.1:8000/docs`.

> If `ModuleNotFoundError: No module named 'app'` appears, Uvicorn was likely started from `backend/app`. Return to `backend` and use the command above.

### 2. Set up the frontend

In another terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

For local development, set this in `frontend/.env.local`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Open `http://localhost:5173`.

### 3. Create the first admin

Public sign-up intentionally creates **student** accounts only. Create the initial admin safely with a bcrypt hash:

```bash
cd backend
source .venv/bin/activate
python -c "from getpass import getpass; from app.utils.security import hash_password; print(hash_password(getpass('New admin password: ')))"
```

Insert that generated hash into PostgreSQL using an admin database tool or SQL console. Never store a plain-text password in the database. Once an admin exists, use the Admin dashboard to create staff accounts.

## Environment variables

Copy [backend/.env.example](backend/.env.example) and keep the real `.env` file private.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL/Supabase connection string. |
| `SECRET_KEY` | Long, random JWT signing secret. Never reuse a development secret in production. |
| `ALGORITHM` | JWT algorithm; currently `HS256`. |
| `CORS_ORIGINS` | Comma-separated browser origins allowed to call the backend. |
| `PUBLIC_API_URL` | Public backend URL used when returning media URLs. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Server-side media storage credentials. |
| `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `FRONTEND_URL` | Password-recovery email configuration. |
| `VITE_API_URL` | Frontend-only API base URL. This is safe to expose because it is just a URL. |

Never commit `.env`, `.env.local`, Supabase passwords, Cloudinary secrets, JWT secrets, Resend keys, or password-reset links.

## Testing and checks

Backend tests run against an isolated in-memory SQLite database; they never use the configured Supabase database.

```bash
cd backend
./.venv/bin/pytest
```

Frontend checks:

```bash
cd frontend
npm run test -- --run
npm run build
```

Run these before opening a pull request.

## Docker

For a local containerized production-like setup:

```bash
cp backend/.env.example backend/.env
# Fill backend/.env with real values first.
docker compose up --build
```

The frontend is served at `http://localhost`; Nginx forwards `/api/*` to the FastAPI container. The health endpoint is `GET /health`.

## Deployment overview

For a non-college public preview, a practical setup is:

```text
Cloudflare Pages or Vercel  →  React frontend
Render / Cloud Run          →  FastAPI backend container
Supabase                    →  PostgreSQL
Cloudinary                  →  images
Resend                      →  password reset email
```

For the college’s Kubernetes environment, deploy the existing backend and frontend images as separate workloads, keep secrets in Kubernetes Secrets, run Alembic as a one-time migration job, and place HTTPS/ingress in front of the services. Cloudflare Tunnel is a good option if the college does not want to expose a public server IP.

Before a real launch, ensure the production CORS origins, domain, HTTPS, backups, monitoring, and error reporting are configured. The detailed checklist is in [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md).

## Contributing

Contributions are welcome. Please keep each pull request focused on one clear improvement.

1. Fork the repository and create a branch.
2. Set up the backend and frontend locally.
3. Check existing issues or open one before starting a larger feature.
4. Make the change with tests where practical.
5. Run the checks above.
6. Open a pull request explaining what changed, how it was tested, and screenshots for UI changes.

Good contribution areas include accessibility, test coverage, API error UX, audit history, staff signature management, club/multi-coordinator modeling, cancellation flows, and production monitoring.

## License

No license has been selected yet. Do not assume third parties may reuse or redistribute the project until a license is added.
