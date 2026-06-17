from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .api import health_router, lifecycle_router, status_router, websocket_router
from .runtime import RuntimeState


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    runtime: RuntimeState = app.state.runtime
    runtime.mark_running("startup_complete")
    heartbeat_task = asyncio.create_task(publish_heartbeats(runtime))
    await runtime.event_bus.publish(
        runtime.event(
            "backend.lifecycle.changed",
            {"lifecycle": runtime.lifecycle, "reason": "startup_complete"},
        )
    )

    try:
        yield
    finally:
        runtime.mark_stopping("lifespan_shutdown")
        await runtime.event_bus.publish(
            runtime.event(
                "backend.lifecycle.changed",
                {"lifecycle": runtime.lifecycle, "reason": "lifespan_shutdown"},
            )
        )
        heartbeat_task.cancel()
        try:
            await heartbeat_task
        except asyncio.CancelledError:
            pass


async def publish_heartbeats(runtime: RuntimeState) -> None:
    while True:
        await asyncio.sleep(runtime.settings.heartbeat_seconds)
        await runtime.event_bus.publish(
            runtime.event(
                "backend.heartbeat",
                {
                    "lifecycle": runtime.lifecycle,
                    "uptimeSeconds": runtime.uptime_seconds,
                },
            )
        )


def create_app(runtime: RuntimeState | None = None) -> FastAPI:
    from .settings import CoreSettings

    runtime = runtime or RuntimeState(CoreSettings.from_env())
    app = FastAPI(
        title="DE'YANA Core",
        version=__version__,
        lifespan=lifespan,
        docs_url=None,
        redoc_url=None,
    )
    app.state.runtime = runtime

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://127.0.0.1:1420",
            "http://localhost:1420",
            "tauri://localhost",
        ],
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    app.include_router(health_router)
    app.include_router(status_router)
    app.include_router(lifecycle_router)
    app.include_router(websocket_router)
    return app
