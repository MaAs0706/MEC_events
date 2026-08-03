# NEXUS

### College Event Management Platform

> One platform. Every club. Every event. Zero paperwork.

NEXUS is a full-stack college event management platform where club coordinators submit event requests, approvers review them digitally, students discover and register for approved events, and admins manage the platform.

---

## What problem does NEXUS solve?

College event management is often scattered across WhatsApp messages, printed approval letters, spreadsheets, and informal venue discussions.

NEXUS brings the process into one shared system:

- Clubs can check venue/date availability before submitting an event.
- Events go through a digital approval workflow.
- Students see only approved upcoming events.
- Students can register for events in one click.
- Coordinators can track registrations and attendees.
- Admins can manage users, roles, venues, and event visibility.

---

## User roles

### Student

- Browse approved upcoming events.
- Search and filter events.
- View event details.
- Register/RSVP for events.
- See joined events and upcoming schedule.

### Club Coordinator

- View a shared venue calendar.
- Move between months and pick dates.
- See venue availability and booking load.
- Create event requests.
- Events are automatically submitted as `pending`.
- Manage only their own events.
- View attendee lists for their events.

### Approver

- View pending event requests.
- Open event details.
- Approve or reject events.
- Add rejection remarks.

### Admin

- Manage users and roles.
- Create student/coordinator/approver/admin accounts.
- Manage venues and capacities.
- View pending and approved events.
- Approve or reject pending events.

---

## Current feature status

### Implemented

- JWT authentication.
- Password hashing with bcrypt/passlib.
- Role-based authorization.
- Student registration and login.
- Admin-created platform accounts.
- Event creation by coordinator/admin.
- Event ownership through `created_by`.
- Coordinator event management.
- Shared calendar with month navigation.
- Venue availability endpoint.
- Approval/rejection workflow.
- Student-facing approved event feed.
- Student event registration.
- Duplicate registration prevention.
- Capacity enforcement.
- Coordinator attendee view.
- Admin user management.
- Admin venue management.
- Admin event overview.
- CORS configuration for local frontend ports.
- Dark themed React UI with role dashboards.

### Planned / not finished yet

- Permission letter PDF generation.
- Notifications.
- Forgot password email flow.
- Cloudinary signed image uploads.
- Real Alembic migrations.
- Production deployment configuration.
- PostgreSQL backups.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React + Vite |
| Backend | FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Validation | Pydantic |
| Authentication | JWT |
| Password Hashing | Passlib + bcrypt |
| Styling | CSS |

---

## Project structure

```text
NEXUS/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── utils/
│   │   ├── database.py
│   │   ├── dependencies.py
│   │   └── main.py
│   ├── migrations/
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
└── README.md
```

---

## Backend setup

Go to the backend folder:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/nexus
JWT_SECRET_KEY=replace-with-a-long-random-secret
```

Run the backend:

```bash
uvicorn app.main:app --reload
```

Backend runs at:

```text
http://127.0.0.1:8000
```

API docs:

```text
http://127.0.0.1:8000/docs
```

---

## Frontend setup

Go to the frontend folder:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

Build for production:

```bash
npm run build
```

---

## Important API endpoints

### Authentication

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Register student account |
| `POST` | `/auth/login` | Login and receive JWT |
| `GET` | `/auth/me` | Get current logged-in user |
| `GET` | `/auth/me/registrations` | Get current user's registered events |

### Events

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/events` | Create event request |
| `GET` | `/events` | Get approved events |
| `GET` | `/events/pending` | Get pending events |
| `GET` | `/events/manage` | Get coordinator/admin managed events |
| `GET` | `/events/availability` | Get venue availability for a date |
| `GET` | `/events/{event_id}` | Get event details |
| `PUT` | `/events/{event_id}` | Replace event |
| `PATCH` | `/events/{event_id}` | Partially update event |
| `PATCH` | `/events/{event_id}/approve` | Approve pending event |
| `PATCH` | `/events/{event_id}/reject` | Reject pending event |
| `POST` | `/events/{event_id}/register` | Student registers for event |
| `GET` | `/events/{event_id}/registration-status` | Check if student registered |
| `GET` | `/events/{event_id}/attendees` | Coordinator/admin attendee list |

### Venues

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/venues` | List venues |
| `POST` | `/venues` | Create venue |
| `PUT` | `/venues/{venue_id}` | Update venue |
| `DELETE` | `/venues/{venue_id}` | Delete venue |

### Users

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/users` | Admin lists users |
| `POST` | `/users` | Admin creates user |
| `PATCH` | `/users/{user_id}/role` | Admin updates role |
| `DELETE` | `/users/{user_id}` | Admin deletes user |

---

## Main workflows

### Coordinator creates an event

```text
Login as coordinator
→ Open calendar
→ Choose month/date
→ Select venue
→ Check availability
→ Fill event details
→ Submit event
→ Event status becomes pending
```

### Admin or approver reviews event

```text
Login as approver/admin
→ Open pending reviews
→ View event details
→ Approve or reject
→ If approved, students can see it
→ If rejected, students cannot see it
```

### Student registers for event

```text
Login as student
→ Browse upcoming approved events
→ Open event details or click RSVP
→ Register
→ Registration count updates
→ Coordinator can see attendee list
```

---

## First admin account

Public registration creates student accounts only.

To use the admin dashboard, create one admin user directly in PostgreSQL or through a temporary script.

Important: the password must be stored as a bcrypt hash, not plain text.

Example hash generation:

```bash
cd backend
python3 -c "from app.utils.security import hash_password; print(hash_password('admin123'))"
```

Then insert the user into PostgreSQL:

```sql
INSERT INTO users (full_name, email, password_hash, role)
VALUES (
  'Admin User',
  'admin@nexus.local',
  'PASTE_BCRYPT_HASH_HERE',
  'admin'
);
```

---

## Current development notes

- The frontend currently calls the backend at `http://127.0.0.1:8000`.
- The backend reads `DATABASE_URL` from `.env`.
- Local CORS is configured for Vite development ports.
- Some development schema update SQL still exists and should be replaced with Alembic migrations before production.

---

## Production-readiness checklist

Before hosting NEXUS publicly or on a college server:

- Move all secrets to `.env`.
- Use a strong `JWT_SECRET_KEY`.
- Move frontend API base URL to a Vite environment variable.
- Replace startup `ALTER TABLE` logic with Alembic migrations.
- Restrict CORS to the real frontend domain.
- Use HTTPS.
- Use a production database such as Supabase Postgres or server-hosted PostgreSQL.
- Add database backups.
- Add signed Cloudinary uploads for event images.
- Add forgot password email flow.
- Add permission letter PDF generation.
- Add logging and error monitoring.

---

## Possible deployment options

### Simple cloud deployment

```text
Frontend: Vercel / Netlify
Backend: Render / Railway / Fly.io
Database: Supabase / Neon / Railway PostgreSQL
```

### College server deployment

```text
Browser
  ↓
https://nexus.college.edu
  ↓
Nginx
  ├── React frontend
  └── /api → FastAPI backend
          ↓
      PostgreSQL / Supabase
```

---

## V1 out of scope

- Mobile app.
- Payment/ticketing system.
- Physical or cryptographic digital signatures.

For v1 permission letters, approver name and date are enough.

