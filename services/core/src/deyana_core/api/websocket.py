from __future__ import annotations

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["events"])


@router.websocket("/ws")
async def websocket_events(websocket: WebSocket) -> None:
    await websocket.accept()
    runtime = websocket.app.state.runtime

    await websocket.send_json(
        runtime.event(
            "app.ready",
            {
                "service": "deyana-core",
                "version": runtime.version,
                "lifecycle": "running",
                "bootId": runtime.boot_id,
            },
        ).model_dump(mode="json")
    )

    async with runtime.event_bus.subscribe() as queue:
        try:
            while True:
                event = await queue.get()
                await websocket.send_json(event.model_dump(mode="json"))
        except WebSocketDisconnect:
            return
