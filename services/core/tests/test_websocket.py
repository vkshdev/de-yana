from __future__ import annotations

from fastapi.testclient import TestClient

from deyana_core.app import create_app


def test_websocket_emits_app_ready_event() -> None:
    with TestClient(create_app()) as client:
        with client.websocket_connect("/ws") as websocket:
            event = websocket.receive_json()

    assert event["type"] == "app.ready"
    assert event["payload"]["service"] == "deyana-core"
    assert event["payload"]["lifecycle"] == "running"
