from __future__ import annotations

from fastapi.testclient import TestClient

from deyana_core.app import create_app


def test_health_endpoint_reports_running_core() -> None:
    with TestClient(create_app()) as client:
        response = client.get("/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["service"] == "deyana-core"
    assert body["lifecycle"] == "running"
    assert body["uptimeSeconds"] >= 0
