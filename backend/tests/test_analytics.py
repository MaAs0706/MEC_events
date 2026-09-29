from datetime import datetime, timezone

from app.models.analytics_event import AnalyticsEvent


def test_admin_can_view_real_analytics(client, db, admin, login_as):
    db.add_all(
        [
            AnalyticsEvent(
                occurred_at=datetime.now(timezone.utc),
                path="/events",
                method="GET",
                status_code=200,
                duration_ms=14,
                visitor_hash="visitor-one",
                is_error=False,
            ),
            AnalyticsEvent(
                occurred_at=datetime.now(timezone.utc),
                path="/events/99",
                method="GET",
                status_code=500,
                duration_ms=20,
                visitor_hash="visitor-two",
                is_error=True,
            ),
        ]
    )
    db.commit()
    login_as(admin)

    response = client.get("/analytics/admin-summary")

    assert response.status_code == 200
    data = response.json()
    assert data["traffic"]["today_requests"] == 2
    assert data["traffic"]["today_visitors"] == 2
    assert data["reliability"]["errors_last_14_days"] == 1
    assert data["reliability"]["top_errors"] == [
        {"path": "/events/99", "status_code": 500, "count": 1}
    ]

    week_response = client.get("/analytics/admin-summary?days=7")
    assert week_response.status_code == 200
    assert week_response.json()["period_days"] == 7
    assert len(week_response.json()["traffic"]["daily"]) == 7


def test_non_admin_cannot_view_analytics(client, student, login_as):
    login_as(student)

    response = client.get("/analytics/admin-summary")

    assert response.status_code == 403
