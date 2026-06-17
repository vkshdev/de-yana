from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    service: Literal["deyana-core"] = "deyana-core"
    version: str
    lifecycle: Literal["running", "stopping"]
    uptime_seconds: float = Field(serialization_alias="uptimeSeconds")
    timestamp: str

    model_config = ConfigDict(populate_by_name=True)


class DependencyStatus(BaseModel):
    name: str
    status: Literal["available", "missing", "not_configured", "deferred"]
    detail: str


class StatusResponse(BaseModel):
    service: Literal["deyana-core"] = "deyana-core"
    version: str
    lifecycle: Literal["running", "stopping"]
    boot_id: str = Field(serialization_alias="bootId")
    pid: int
    uptime_seconds: float = Field(serialization_alias="uptimeSeconds")
    host: str
    port: int
    dependencies: list[DependencyStatus]
    feature_flags: dict[str, bool] = Field(serialization_alias="featureFlags")
    timestamp: str

    model_config = ConfigDict(populate_by_name=True)


class CoreEvent(BaseModel):
    id: str
    type: str
    timestamp: str
    payload: dict[str, Any]
