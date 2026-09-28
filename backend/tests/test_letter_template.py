import json

from app.models.event import Event
from app.models.letter_template import LetterTemplate


def make_event(db, coordinator):
    event = Event(
        title="Robotics Meet", description="A robotics event", category="Tech",
        venue="Main Auditorium", date="2027-01-15", start_time="10:00",
        end_time="12:00", status="pending", organizer="MEC Robotics Club",
        created_by=coordinator.id, attendees=0, capacity=100,
    )
    db.add(event); db.commit(); db.refresh(event)
    return event


def test_admin_can_configure_official_letter_template(client, admin, login_as):
    login_as(admin)
    response = client.patch("/letter-template", json={
        "college_name": "Govt. Model Engineering College, Kochi",
        "signatory_name": "The Principal",
        "signatory_title": "Principal",
        "reference_prefix": "MEC/NEXUS",
    })

    assert response.status_code == 200
    assert response.json()["reference_prefix"] == "MEC/NEXUS"


def test_approval_captures_template_snapshot(client, db, admin, coordinator, login_as):
    event = make_event(db, coordinator)
    db.add(LetterTemplate(
        college_name="MEC", signatory_name="The Principal",
        signatory_title="Principal", reference_prefix="MEC",
    ))
    db.commit()

    login_as(admin)
    response = client.patch(f"/events/{event.id}/approve")

    assert response.status_code == 200
    db.refresh(event)
    snapshot = json.loads(event.permission_letter_snapshot)
    assert snapshot["college_name"] == "MEC"
    assert snapshot["signatory_name"] == "The Principal"


def test_coordinator_club_name_is_used_when_creating_event(
        client, db, coordinator, login_as, sample_venue):
    coordinator.club_name = "MEC MUNSoc"
    coordinator.club_logo_url = "https://example.test/munsoc.png"
    db.commit()
    login_as(coordinator)

    response = client.post("/events", json={
        "title": "Model United Nations", "description": "Conference",
        "category": "Academic", "venue": "Main Auditorium",
        "date": "2027-01-20", "start_time": "10:00", "end_time": "12:00",
        "organizer": "A typed value that must not override the club", "capacity": 50,
    })

    assert response.status_code == 200
    event = db.query(Event).filter(Event.id == response.json()["id"]).one()
    assert event.organizer == "MEC MUNSoc"
    assert event.club_logo_url == "https://example.test/munsoc.png"
