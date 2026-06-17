from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field


def to_camel(value: str) -> str:
    parts = value.split("_")
    return parts[0] + "".join(part.capitalize() for part in parts[1:])


class ApiModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


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


PrivacyMode = Literal["local_only"]
ModelProfile = Literal["low_spec", "balanced", "power"]
SyncMode = Literal["manual", "low_frequency"]
OnboardingStep = Literal["welcome", "privacy", "local_ai", "vault", "complete"]
VaultStatus = Literal["not_selected", "ready", "missing", "error"]
MemoryType = Literal[
    "chat",
    "note",
    "connector_summary",
    "file_summary",
    "git_summary",
    "daily_summary",
    "project_summary",
    "decision",
    "action_item",
]


class AppSettings(ApiModel):
    privacy_mode: PrivacyMode = "local_only"
    model_profile: ModelProfile = "low_spec"
    sync_mode: SyncMode = "manual"
    vault_path: str | None = None
    onboarding_completed: bool = False
    updated_at: str


class SettingsPatch(ApiModel):
    privacy_mode: PrivacyMode | None = None
    model_profile: ModelProfile | None = None
    sync_mode: SyncMode | None = None


class OnboardingState(ApiModel):
    completed: bool = False
    completed_at: str | None = None
    current_step: OnboardingStep = "welcome"
    selected_vault_path: str | None = None
    selected_privacy_mode: PrivacyMode = "local_only"
    selected_model_profile: ModelProfile = "low_spec"
    vault_status: VaultStatus = "not_selected"
    vault_error: str | None = None
    vault_folders: list[str] = []


class VaultSelectRequest(ApiModel):
    path: str


class VaultSelectResponse(ApiModel):
    state: OnboardingState
    settings: AppSettings
    vault_path: str
    created_folders: list[str]


class OnboardingCompleteRequest(ApiModel):
    privacy_mode: PrivacyMode = "local_only"
    model_profile: ModelProfile = "low_spec"
    vault_path: str | None = None


class OnboardingCompleteResponse(ApiModel):
    state: OnboardingState
    settings: AppSettings


class MemoryItem(ApiModel):
    id: str
    type: MemoryType
    title: str
    summary: str
    content_markdown: str
    markdown_path: str | None = None
    source_type: str
    source_id: str | None = None
    source_uri: str | None = None
    importance: int = 3
    tags: list[str] = []
    created_at: str
    updated_at: str
    deleted_at: str | None = None


class MemoryCreateRequest(ApiModel):
    type: MemoryType = "note"
    title: str
    summary: str
    content_markdown: str | None = None
    source_type: str = "manual"
    source_id: str | None = None
    source_uri: str | None = None
    importance: int = 3
    tags: list[str] = []


class MemoryUpdateRequest(ApiModel):
    title: str | None = None
    summary: str | None = None
    content_markdown: str | None = None
    importance: int | None = None
    tags: list[str] | None = None


class MemoryListResponse(ApiModel):
    items: list[MemoryItem]
    total: int
    query: str | None = None


class MemoryDeleteResponse(ApiModel):
    deleted: bool
    id: str


class MemoryReindexResponse(ApiModel):
    reindexed: int
    missing_markdown: int


class MemoryExportResponse(ApiModel):
    exported_at: str
    items: list[MemoryItem]
