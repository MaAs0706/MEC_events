# NEXUS Project Context

## Product

NEXUS is a college event management platform.

Tagline: One platform. Every club. Every event. Zero paperwork.

NEXUS is an internal platform where clubs book dates and venues, get digital approvals, and students discover and register for events in one place.

## Problem

College event management is currently fragmented:

- Clubs fight over dates on WhatsApp with no visibility into conflicts.
- Students miss events because announcements drown in group messages.
- Approval requires printing letters, chasing signatures, and waiting days.
- There is no single source of truth for venues, dates, or registrations.

## Solution

NEXUS provides one shared system for:

- Club event requests.
- Venue and date availability.
- Digital approval workflows.
- Student event discovery.
- Event registration.
- Permission letter generation.

## User Roles

NEXUS has four distinct user types, each with a dedicated dashboard.

### Club Coordinator

- Views a shared calendar and picks conflict-free dates.
- Selects an available venue for the chosen date.
- Fills in event details and submits for approval.
- Gets notified on approval or rejection, including rejection remarks.
- Downloads an auto-generated permission letter after approval.
- Tracks registered students and live registration count.

### Student

- Browses upcoming event cards sorted by date.
- Views full event details: name, description, date, time, venue, club, and contact.
- Registers for events with one click.
- Gets a registration confirmation.

### Approver

Approvers include HOD, Dean, and Principal users.

- Gets notified when a new event request is submitted.
- Sees all pending requests on their dashboard, grouped by club.
- Reviews full event details.
- Approves or rejects with a remark.
- Approval auto-generates a permission letter PDF and notifies the coordinator.

### Admin

- Manages venues and venue capacities.
- Manages club accounts and coordinator access.
- Manages approver accounts.
- Includes Placement Cell management in the platform scope.

## Core Features

| Feature | Description |
| --- | --- |
| Shared Calendar | Visual calendar with conflict detection for the same venue and same date. |
| Venue Booking | Check availability and reserve venues per event. |
| Approval Workflow | Digital approval chain with email or in-app notifications. |
| Permission Letter | Auto-generated PDF on approval, downloadable by coordinator. |
| Event Discovery | Student-facing event feed with full details. |
| One-Click Registration | Students register instantly and coordinators see live counts. |
| Live Attendance Tracking | Real-time registration counter for coordinators. |

## User Flows

### Club Coordinator: Submitting an Event

Login -> View calendar -> Pick available date -> Select venue -> Fill event details -> Submit -> Wait for approval.

If approved: download permission letter and track registrations.

If rejected: view remarks and resubmit.

### Student: Registering for an Event

Login -> Browse event feed -> Click event card -> View full details -> Register with one click -> Receive confirmation.

### Approver: Reviewing a Request

Receive notification -> Open pending requests dashboard -> Review event details -> Approve or reject with remark -> System generates permission letter and notifies coordinator.

### Admin: Platform Management

Login -> Manage venues -> Manage club accounts and coordinator access -> Manage approver accounts.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React |
| Backend | FastAPI |
| Database | PostgreSQL or MySQL |
| Authentication | JWT tokens |
| PDF Generation | ReportLab or equivalent |

## V1 Out of Scope

The following are not part of v1:

- Mobile app.
- Payment or ticketing system.
- Physical or cryptographic digital signatures.

For v1 permission letters, approver name and date on the letter are sufficient.

## Current Architecture Direction

Authentication -> Authorization -> Event Management -> Approval Workflow -> Event Registration -> Notifications.

