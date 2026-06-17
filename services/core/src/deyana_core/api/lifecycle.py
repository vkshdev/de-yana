from __future__ import annotations

import asyncio

from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter(tags=["lifecycle"])


class ShutdownResponse(BaseModel):
    accepted: bool
    lifecycle: str


@router.post("/shutdown", response_model=ShutdownResponse)
async def shutdown(request: Request) -> ShutdownResponse:
    runtime = request.app.state.runtime
    runtime.mark_stopping("shutdown_requested")
    await runtime.event_bus.publish(
        runtime.event(
            "backend.lifecycle.changed",
            {"lifecycle": runtime.lifecycle, "reason": "shutdown_requested"},
        )
    )

    server = getattr(request.app.state, "server", None)
    if server is not None:
        asyncio.get_running_loop().call_later(0.1, setattr, server, "should_exit", True)

    return ShutdownResponse(accepted=True, lifecycle=runtime.lifecycle)
