"""Example tests for the events API.

Run:  ./.venv/bin/pytest tests/test_events.py  (from backend/)

Each test follows the Arrange -> Act -> Assert pattern:
  1. Arrange — set up data (users, venues, events in the test DB).
  2. Act     — make an HTTP request through the test client.
  3. Assert  — check the response (status code, returned JSON).
"""


def create_event(db, title="Tech Fest", venue="Main Auditorium",
                 status="pending", date="2026-09-15", start_time="10:00",
                 end_time="05:00", capacity=100, created_by=1,
                 image=None):
    """Small helper that inserts an Event row directly into the test DB."""
    from app.models.event import Event

    event = Event(
        title=title,
        description="A campus event",
        category="Tech",
        venue=venue,
        date=date,
        start_time=start_time,
        end_time=end_time,
        status=status,
        organizer="NEXUS Club",
        created_by=created_by,
        attendees=0,
        capacity=capacity,
        image=image
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


# ---------------------------------------------------------------------------
# PUBLIC BEHAVIOR
# ---------------------------------------------------------------------------

def test_public_users_only_see_approved_events(client, db, sample_venue):
    """The public /events list must only return approved events.

    A student (or anyone not logged in) should never see pending events that
    are still awaiting approval.
    """
    # Arrange: create one approved event and one pending event.
    create_event(db, title="Approved Event", status="approved")
    create_event(db, title="Pending Event", status="pending")

    # Act: request the public event list (no login needed).
    response = client.get("/events")

    # Assert: 200 OK, and only the approved event is returned.
    assert response.status_code == 200
    events = response.json()
    assert len(events) == 1
    assert events[0]["title"] == "Approved Event"


def test_public_past_events_only_include_completed_approved_events(
        client, db, coordinator, sample_venue):
    """The archive must not expose upcoming or unapproved event requests."""
    from datetime import date, timedelta

    past_date = (date.today() - timedelta(days=1)).isoformat()
    future_date = (date.today() + timedelta(days=1)).isoformat()
    create_event(
        db, title="Past Approved", status="approved", date=past_date,
        created_by=coordinator.id,
    )
    create_event(
        db, title="Upcoming Approved", status="approved", date=future_date,
        created_by=coordinator.id,
    )
    create_event(
        db, title="Past Pending", status="pending", date=past_date,
        created_by=coordinator.id,
    )

    response = client.get("/events/past")

    assert response.status_code == 200
    assert [event["title"] for event in response.json()] == ["Past Approved"]


# ---------------------------------------------------------------------------
# AUTHENTICATED / ROLE-BASED BEHAVIOR
# ---------------------------------------------------------------------------

def test_student_cannot_create_events(client, db, student, login_as,
                                      sample_venue):
    """Only coordinators and admins may create events.

    Even when a student is properly signed in, the backend must reject the
    request with 403 (Forbidden) because of the role check in require_role().
    """
    # Arrange: pretend the student is the signed-in user.
    login_as(student)

    payload = {
        "title": "Student Run Event",
        "description": "Should be rejected",
        "category": "Tech",
        "venue": sample_venue.name,
        "date": "2026-09-20",
        "start_time": "10:00",
        "end_time": "12:00",
        "organizer": "Some Club",
        "capacity": 50
    }

    # Act
    response = client.post("/events", json=payload)

    # Assert: 403, not 200.
    assert response.status_code == 403


def test_coordinator_can_create_event(client, db, coordinator, login_as,
                                      sample_venue):
    """A coordinator should be able to submit a new event request."""
    # Arrange
    login_as(coordinator)

    payload = {
        "title": "Hackathon",
        "description": "Build something cool",
        "category": "Tech",
        "venue": sample_venue.name,
        "date": "2026-09-25",
        "start_time": "09:00",
        "end_time": "12:00",
        "organizer": "Coding Club",
        "capacity": 60
    }

    # Act
    response = client.post("/events", json=payload)

    # Assert: 200 OK and the created event is pending (must be reviewed).
    assert response.status_code == 200
    created = response.json()
    assert created["title"] == "Hackathon"
    assert created["status"] == "pending"


def test_coordinator_can_add_a_gallery_photo_after_event(
        client, db, coordinator, login_as, sample_venue, monkeypatch):
    """Only an owner may upload a valid image after their event is complete."""
    from datetime import date, timedelta

    event = create_event(
        db, title="Completed", status="approved",
        date=(date.today() - timedelta(days=1)).isoformat(),
        created_by=coordinator.id,
    )
    login_as(coordinator)
    monkeypatch.setattr(
        "app.routes.events.upload_image",
        lambda contents, folder: {
            "url": "https://res.cloudinary.com/nexus/image/upload/gallery-photo.png",
            "public_id": "nexus/events/gallery/gallery-photo",
        },
    )
    monkeypatch.setattr("app.routes.events.delete_image", lambda public_id: None)

    from io import BytesIO
    from PIL import Image

    image_bytes = BytesIO()
    Image.new("RGB", (1, 1), "white").save(image_bytes, format="PNG")

    response = client.post(
        f"/events/{event.id}/gallery",
        files={
            "file": (
                "photo.png",
                image_bytes.getvalue(),
                "image/png",
            )
        },
    )

    assert response.status_code == 200
    assert response.json()["image"].startswith("https://res.cloudinary.com/")

    gallery = client.get(f"/events/{event.id}/gallery")
    assert gallery.status_code == 200
    assert len(gallery.json()) == 1

    cleanup = client.delete(
        f"/events/{event.id}/gallery/{gallery.json()[0]['id']}"
    )
    assert cleanup.status_code == 200


# ---------------------------------------------------------------------------
# APPROVER WORKFLOW
# ---------------------------------------------------------------------------

def test_approver_can_approve_event(client, db, coordinator, approver,
                                    login_as, sample_venue):
    """An approver approving an event changes its status to approved."""
    # Arrange: coordinate submits an event, approver then reviews it.
    coordinator_event = create_event(
        db,
        title="Workshop",
        status="pending",
        created_by=coordinator.id
    )

    login_as(approver)

    # Act
    response = client.patch(
        f"/events/{coordinator_event.id}/approve"
    )

    # Assert
    assert response.status_code == 200
    assert response.json()["status"] == "approved"


def test_coordinator_can_download_an_approved_event_letter(
        client, db, coordinator, approver, login_as, sample_venue):
    """An approved event's owner receives a real PDF permission letter."""
    event = create_event(
        db, title="Approved Workshop", status="approved",
        created_by=coordinator.id,
    )
    event.reviewed_by = approver.id
    db.commit()
    login_as(coordinator)

    response = client.get(f"/events/{event.id}/permission-letter")

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("application/pdf")
    assert response.content.startswith(b"%PDF")


def test_permission_letter_is_hidden_before_approval(
        client, db, coordinator, login_as, sample_venue):
    event = create_event(db, title="Not Approved", created_by=coordinator.id)
    login_as(coordinator)

    response = client.get(f"/events/{event.id}/permission-letter")

    assert response.status_code == 400


def test_approver_cannot_approve_twice(client, db, coordinator, approver,
                                       login_as, sample_venue):
    """Approving an already-approved event must fail with 400."""
    # Arrange
    event = create_event(db, title="One Time", status="approved",
                         created_by=coordinator.id)
    login_as(approver)

    # Act: try approving an event that is already approved.
    response = client.patch(f"/events/{event.id}/approve")

    # Assert: only pending events may be approved.
    assert response.status_code == 400
    assert "Only pending events" in response.json()["detail"]


def test_coordinator_cannot_approve_other_events(client, db, coordinator,
                                                 approver, login_as,
                                                 sample_venue):
    """Coordinators must never be able to approve events.

    Only approvers and admins have that power.
    """
    # Arrange: someone else's event, reviewed by someone who is not allowed.
    other = create_event(db, title="Not Yours", status="pending",
                         created_by=approver.id)
    login_as(coordinator)

    # Act
    response = client.patch(f"/events/{other.id}/approve")

    # Assert: coordinator is not in [approver, admin], so 403.
    assert response.status_code == 403


# ---------------------------------------------------------------------------
# REGISTRATION
# ---------------------------------------------------------------------------

def test_student_can_register_for_approved_event(client, db, coordinator,
                                                 student, login_as,
                                                 sample_venue):
    """A student can register for an approved event."""
    # Arrange: approved event + signed-in student.
    event = create_event(db, title="Concert", status="approved",
                         created_by=coordinator.id)
    login_as(student)

    # Act
    response = client.post(f"/events/{event.id}/register")

    # Assert: registered, and the attendee count went up by one.
    assert response.status_code == 200
    assert response.json()["event"]["attendees"] == 1


def test_student_cannot_register_twice(client, db, coordinator, student,
                                       login_as, sample_venue):
    """Duplicate registration must be blocked."""
    # Arrange: approved event + a student who registers once.
    event = create_event(db, title="Solo", status="approved",
                         created_by=coordinator.id)
    login_as(student)
    client.post(f"/events/{event.id}/register")

    # Act: register a second time.
    response = client.post(f"/events/{event.id}/register")

    # Assert: "already registered".
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


def test_coordinator_can_view_only_their_event_attendees(
        client, db, coordinator, student, login_as, sample_venue):
    """The attendee list exposes useful registration details to its owner."""
    from app.models.registration import Registration

    event = create_event(
        db, title="Open House", status="approved", created_by=coordinator.id
    )
    student.class_name = "CSE · 3rd year"
    student.phone = "9876543210"
    db.add(Registration(event_id=event.id, student_id=student.id))
    event.attendees = 1
    db.commit()

    login_as(coordinator)
    response = client.get(f"/events/{event.id}/attendees")

    assert response.status_code == 200
    assert response.json() == [{
        "id": student.id,
        "full_name": student.full_name,
        "email": student.email,
        "class_name": "CSE · 3rd year",
        "phone": "9876543210",
    }]


def test_registration_rejected_when_capacity_full(client, db, coordinator,
                                                  student, login_as,
                                                  sample_venue):
    """Once capacity is reached, further registrations are rejected."""
    # Arrange: event with capacity 1, one student already attends.
    event = create_event(db, title="Full House", status="approved",
                         created_by=coordinator.id, capacity=1)
    event.attendees = 1
    db.commit()

    # A second student tries to register.
    from app.models.user import User

    second = User(
        full_name="Second Student",
        email="second_student@test.com",
        password_hash="x",
        role="student"
    )
    db.add(second)
    db.commit()
    db.refresh(second)

    login_as(second)

    # Act
    response = client.post(f"/events/{event.id}/register")

    # Assert: capacity full.
    assert response.status_code == 400
    assert "full" in response.json()["detail"]
