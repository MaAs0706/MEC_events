"""Tests for request input validation on event endpoints.

These assert that malformed or out-of-range input is rejected instead of
being silently stored. Each test follows Arrange / Act / Assert.

Fixtures like `client`, `coordinator`, `login_as`, and `sample_venue` are
injected by pytest — you never import fixtures, you just name them as
parameters of the test function. See tests/conftest.py for their defs.
"""
import pytest


# ---------------------------------------------------------------------------
# Base payload
# ---------------------------------------------------------------------------

VALID_EVENT = {
    "title": "Hackathon",
    "description": "Build something in 24 hours",
    "category": "Tech",
    "venue": "Main Auditorium",     # must match the sample_venue fixture
    "date": "2027-01-15",
    "start_time": "09:00",
    "end_time": "18:00",
    "organizer": "CS Club",
    "capacity": 50,
}


# ---------------------------------------------------------------------------
# Date and time format validation
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "overrides",
    [
        {"date": "15/01/2027"},   # dd/mm/yyyy instead of yyyy-mm-dd
        {"date": "2027-1-15"},    # missing zero padding
        {"date": "2027-13-15"},   # month 13 does not exist
        {"date": "not-a-date"},   # garbage
    ],
)
def test_create_rejects_invalid_dates(
    client, coordinator, login_as, overrides
):
    payload = dict(VALID_EVENT)
    payload.update(overrides)

    login_as(coordinator)
    response = client.post("/events", json=payload)

    assert response.status_code == 422


@pytest.mark.parametrize(
    "overrides",
    [
        {"start_time": "9:00"},   # not zero-padded
        {"end_time": "18:5"},     # minutes not padded
        {"end_time": "25:00"},    # hour 25 does not exist
        {"start_time": "09:60"},  # minute 60 does not exist
    ],
)
def test_create_rejects_invalid_times(
    client, coordinator, login_as, overrides
):
    payload = dict(VALID_EVENT)
    payload.update(overrides)

    login_as(coordinator)
    response = client.post("/events", json=payload)

    assert response.status_code == 422


def test_create_accepts_valid_event(
    client, coordinator, sample_venue, login_as
):
    login_as(coordinator)
    response = client.post("/events", json=VALID_EVENT)

    assert response.status_code == 200


# ---------------------------------------------------------------------------
# Text length validation
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "field,value",
    [
        ("title", ""),                      # too short
        ("title", "x" * 151),               # too long
        ("description", ""),                # too short
        ("category", "x" * 51),             # too long
        ("organizer", ""),                  # too short
        ("venue", ""),                      # too short
    ],
)
def test_create_rejects_bad_text_lengths(
    client, coordinator, login_as, field, value
):
    payload = dict(VALID_EVENT)
    payload[field] = value

    login_as(coordinator)
    response = client.post("/events", json=payload)

    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Capacity validation
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("capacity", [0, -5, 100000])
def test_create_rejects_out_of_range_capacity(
    client, coordinator, login_as, capacity
):
    payload = dict(VALID_EVENT)
    payload["capacity"] = capacity

    login_as(coordinator)
    response = client.post("/events", json=payload)

    assert response.status_code == 422


def test_update_rejects_invalid_date(
    client, coordinator, sample_venue, login_as
):
    login_as(coordinator)
    created = client.post("/events", json=VALID_EVENT)
    event_id = created.json()["id"]

    response = client.patch(
        f"/events/{event_id}", json={"date": "not-a-date"}
    )

    assert response.status_code == 422


# ---------------------------------------------------------------------------
# Rejection reason validation
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("reason", ["", "x" * 501])
def test_reject_requires_valid_reason(
    client, approver, coordinator, sample_venue, login_as, reason
):
    login_as(coordinator)
    created = client.post("/events", json=VALID_EVENT)
    event_id = created.json()["id"]

    login_as(approver)
    response = client.patch(
        f"/events/{event_id}/reject", json={"rejection_reason": reason}
    )

    assert response.status_code == 422