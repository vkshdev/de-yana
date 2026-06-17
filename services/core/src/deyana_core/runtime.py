from __future__ import annotations

import os
import platform
import uuid
from datetime import UTC, datetime

from . import __version__
from .event_bus import EventBus
from .memory import MemoryStore
from .models import CoreEvent, DependencyStatus, HealthResponse, StatusResponse
from .runtime_time import utc_timestamp
from .settings import CoreSettings
from .storage import CoreStore


class RuntimeState:
    def __init__(self, settings: CoreSettings) -> None:
        self.settings = settings
        self.version = __version__
        self.boot_id = str(uuid.uuid4())
        self.started_at = datetime.now(UTC)
        self.lifecycle = "running"
        self.event_bus = EventBus()
        self.store = CoreStore(settings.data_dir)
        self.memory_store = MemoryStore(settings.data_dir, self.store)
        self.memory_store.initialize()

    @property
    def uptime_seconds(self) -> float:
        return round((datetime.now(UTC) - self.started_at).total_seconds(), 3)

    def mark_running(self, _reason: str) -> None:
        self.lifecycle = "running"

    def mark_stopping(self, _reason: str) -> None:
        self.lifecycle = "stopping"

    def health(self) -> HealthResponse:
        return HealthResponse(
            version=self.version,
            lifecycle=self.lifecycle,
            uptime_seconds=self.uptime_seconds,
            timestamp=self.timestamp(),
        )

    def status(self) -> StatusResponse:
        return StatusResponse(
            version=self.version,
            lifecycle=self.lifecycle,
            boot_id=self.boot_id,
            pid=os.getpid(),
            uptime_seconds=self.uptime_seconds,
            host=self.settings.host,
            port=self.settings.port,
            dependencies=[
                DependencyStatus(
                    name="python",
                    status="available",
                    detail=platform.python_version(),
                ),
                DependencyStatus(
                    name="sqlite",
                    status="deferred",
                    detail="Phase 4 owns structured memory storage.",
                ),
                DependencyStatus(
                    name="ollama",
                    status="deferred",
                    detail="Phase 5 owns local model routing.",
                ),
            ],
            feature_flags={
                "websocketEvents": True,
                "localLogging": True,
                "settings": True,
                "onboarding": True,
                "vaultSetup": True,
                "memory": True,
                "models": False,
                "connectors": False,
                "voice": False,
            },
            timestamp=self.timestamp(),
        )

    def event(self, event_type: str, payload: dict[str, object]) -> CoreEvent:
        return CoreEvent(
            id=str(uuid.uuid4()),
            type=event_type,
            timestamp=self.timestamp(),
            payload=payload,
        )

    @staticmethod
    def timestamp() -> str:
        return utc_timestamp()
